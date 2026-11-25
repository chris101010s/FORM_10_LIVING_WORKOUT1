import ExpoModulesCore
import HealthKit
import Foundation

/// Foreground, user-triggered HealthKit exchange. No private YAZIO endpoint is used.
final class FormNutritionBridge {
  private let store: HKHealthStore
  private let specs: [(key: String, identifier: HKQuantityTypeIdentifier, unit: HKUnit, symbol: String)] = [
    ("kcal", .dietaryEnergyConsumed, .kilocalorie(), "kcal"),
    ("protein", .dietaryProtein, .gram(), "g"),
    ("carbs", .dietaryCarbohydrates, .gram(), "g"),
    ("fat", .dietaryFatTotal, .gram(), "g"),
    ("waterMl", .dietaryWater, .literUnit(with: .milli), "ml")
  ]
  init(store: HKHealthStore) { self.store = store }
  private func timestamp(_ date: Date) -> String { ISO8601DateFormatter().string(from: date) }
  private func validKeys(_ keys: [String]) -> Bool { !keys.isEmpty && keys.count <= specs.count && Set(keys).count == keys.count && keys.allSatisfy { key in specs.contains { $0.key == key } } }

  func authorize(keys: [String], promise: Promise) {
    guard validKeys(keys) else { promise.reject("HEALTH_TYPES", "Wähle mindestens einen unterstützten Nährstofftyp."); return }
    let types = Set<HKObjectType>(specs.filter { keys.contains($0.key) }.compactMap { HKQuantityType.quantityType(forIdentifier: $0.identifier) })
    store.requestAuthorization(toShare: [], read: types) { completed, error in
      if let error = error { promise.reject("HEALTH_PERMISSION", error.localizedDescription) }
      else { promise.resolve(completed) } // Completed is NOT evidence of read permission.
    }
  }

  func read(fromMs: Double, toMs: Double, keys: [String], promise: Promise) {
    guard validKeys(keys), fromMs.isFinite, toMs.isFinite, toMs > fromMs, toMs - fromMs <= 32 * 86_400_000 else { promise.reject("HEALTH_RANGE", "Ungültiger Nährstoffzeitraum."); return }
    let from = Date(timeIntervalSince1970: fromMs / 1000), to = Date(timeIntervalSince1970: toMs / 1000)
    let predicate = HKQuery.predicateForSamples(withStart: from, end: to, options: [.strictStartDate])
    let group = DispatchGroup()
    var samples: [[String: Any]] = [], complete: [String] = []
    var unavailable = specs.filter { keys.contains($0.key) && HKQuantityType.quantityType(forIdentifier: $0.identifier) == nil }.map { $0.key }
    for spec in specs where keys.contains(spec.key) {
      guard let type = HKQuantityType.quantityType(forIdentifier: spec.identifier) else { continue }
      group.enter()
      // Reaching the cap is not a complete query. Preserve the cached type instead of reconciling a truncated list.
      store.execute(HKSampleQuery(sampleType: type, predicate: predicate, limit: 40001, sortDescriptors: nil) { _, results, error in
        let inside = (results as? [HKQuantitySample] ?? []).filter { $0.startDate >= from && $0.startDate < to }
        let records: [[String: Any]] = inside.compactMap { sample in
          let value = sample.quantity.doubleValue(for: spec.unit)
          guard value.isFinite, value >= 0 else { return nil }
          let revision = sample.sourceRevision
          var source: [String: String] = ["name": revision.source.name, "bundleIdentifier": revision.source.bundleIdentifier]
          if let version = revision.version, !version.isEmpty { source["version"] = version }
          if let product = revision.productType, !product.isEmpty { source["productType"] = product }
          return ["uuid": sample.uuid.uuidString, "metric": spec.key, "value": value, "unit": spec.symbol,
                  "startedAt": self.timestamp(sample.startDate), "endedAt": self.timestamp(sample.endDate),
                  "source": source, "isOwnExport": revision.source.bundleIdentifier == HKSource.default().bundleIdentifier]
        }
        // Serialize results and promise resolution; successful empty queries also reconcile deleted samples.
        DispatchQueue.main.async {
          if error == nil && (results?.count ?? 0) < 40001 && records.count == inside.count { complete.append(spec.key); samples.append(contentsOf: records) }
          else { unavailable.append(spec.key) }
          group.leave()
        }
      })
    }
    group.notify(queue: .main) {
      promise.resolve(["from": self.timestamp(from), "to": self.timestamp(to), "timeZone": TimeZone.current.identifier,
                       "queriedAt": self.timestamp(Date()), "samples": samples, "completeMetrics": complete, "unavailable": unavailable])
    }
  }

  private func type(for kind: String) -> HKSampleType? {
    if kind == "weight" { return HKQuantityType.quantityType(forIdentifier: .bodyMass) }
    if kind == "workout" { return HKObjectType.workoutType() }
    return nil
  }
  func authorizeExport(kind: String, promise: Promise) {
    guard let type = type(for: kind) else { promise.reject("HEALTH_TYPE", "Dieser Exporttyp wird nicht unterstützt."); return }
    store.requestAuthorization(toShare: [type], read: []) { completed, error in
      if let error = error { promise.reject("HEALTH_PERMISSION", error.localizedDescription) }
      else { promise.resolve(completed && self.store.authorizationStatus(for: type) == .sharingAuthorized) }
    }
  }
  private func validExport(entryId: String, version: Int, fingerprint: String) -> Bool {
    !entryId.isEmpty && entryId.count <= 200 && !entryId.hasPrefix("apple-health:") && version > 0 && version <= 1_000_000_000 && !fingerprint.isEmpty && fingerprint.count < 2000
  }
  private func metadata(_ identifier: String, _ version: Int, _ fingerprint: String) -> [String: Any] {
    [HKMetadataKeySyncIdentifier: identifier, HKMetadataKeySyncVersion: version, "FORMPayloadFingerprint": fingerprint, "FORMOrigin": "user-confirmed"]
  }
  private func findOwned(type: HKSampleType, identifier: String, completion: @escaping (HKSample?, Error?) -> Void) {
    let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [
      HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeySyncIdentifier, allowedValues: [identifier]),
      HKQuery.predicateForObjects(from: HKSource.default())
    ])
    store.execute(HKSampleQuery(sampleType: type, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
      let latest = samples?.max { (( $0.metadata?[HKMetadataKeySyncVersion] as? NSNumber)?.intValue ?? 0) < (($1.metadata?[HKMetadataKeySyncVersion] as? NSNumber)?.intValue ?? 0) }
      completion(latest, error)
    })
  }
  private func resolve(_ sample: HKSample, identifier: String, version: Int, promise: Promise) {
    promise.resolve(["uuid": sample.uuid.uuidString, "syncIdentifier": identifier, "syncVersion": version])
  }
  private func saveOwned(sample: HKSample, identifier: String, version: Int, fingerprint: String, promise: Promise) {
    guard store.authorizationStatus(for: sample.sampleType) == .sharingAuthorized else { promise.reject("HEALTH_WRITE_DENIED", "Schreibzugriff ist für diesen Datentyp nicht freigegeben."); return }
    findOwned(type: sample.sampleType, identifier: identifier) { previous, error in
      if let error = error { promise.reject("HEALTH_LOOKUP", error.localizedDescription); return }
      if let previous = previous {
        let previousVersion = (previous.metadata?[HKMetadataKeySyncVersion] as? NSNumber)?.intValue ?? 0
        if previousVersion > version { promise.reject("HEALTH_STALE_EXPORT", "In Apple Health liegt bereits eine neuere FORM-Version dieses Eintrags."); return }
        if previousVersion == version {
          guard previous.metadata?["FORMPayloadFingerprint"] as? String == fingerprint else { promise.reject("HEALTH_EXPORT_CONFLICT", "Eintrag und gespeicherter Exportauftrag unterscheiden sich."); return }
          self.resolve(previous, identifier: identifier, version: version, promise: promise); return
        }
      }
      // HealthKit's sync metadata makes retries idempotent and replaces only this source's older version.
      self.store.save(sample) { saved, error in
        guard saved, error == nil else { promise.reject("HEALTH_WRITE", error?.localizedDescription ?? "Apple Health hat den Eintrag nicht bestätigt."); return }
        self.findOwned(type: sample.sampleType, identifier: identifier) { stored, error in
          guard error == nil, let stored = stored,
                (stored.metadata?[HKMetadataKeySyncVersion] as? NSNumber)?.intValue == version,
                stored.metadata?["FORMPayloadFingerprint"] as? String == fingerprint else {
            promise.reject("HEALTH_RECEIPT", error?.localizedDescription ?? "Der Export wurde geschrieben, konnte aber noch nicht bestätigt werden. Erneut versuchen ist sicher."); return
          }
          self.resolve(stored, identifier: identifier, version: version, promise: promise)
        }
      }
    }
  }
  func writeWeight(entryId: String, kg: Double, atMs: Double, version: Int, fingerprint: String, promise: Promise) {
    guard validExport(entryId: entryId, version: version, fingerprint: fingerprint), kg.isFinite, kg >= 20, kg <= 350, atMs.isFinite,
          let type = HKQuantityType.quantityType(forIdentifier: .bodyMass) else { promise.reject("HEALTH_INPUT", "Gewichtsexport ungültig."); return }
    let date = Date(timeIntervalSince1970: atMs / 1000), identifier = "FORM:weight:\(entryId)"
    let sample = HKQuantitySample(type: type, quantity: HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: kg), start: date, end: date, metadata: metadata(identifier, version, fingerprint))
    saveOwned(sample: sample, identifier: identifier, version: version, fingerprint: fingerprint, promise: promise)
  }
  func writeWorkout(entryId: String, fromMs: Double, toMs: Double, duration: Double, version: Int, fingerprint: String, promise: Promise) {
    guard validExport(entryId: entryId, version: version, fingerprint: fingerprint), fromMs.isFinite, toMs.isFinite,
          toMs > fromMs, toMs - fromMs <= 7 * 86_400_000, duration.isFinite, duration > 0, duration <= (toMs - fromMs) / 1000 else { promise.reject("HEALTH_INPUT", "Trainingsexport ungültig."); return }
    let identifier = "FORM:workout:\(entryId)"
    // Historical FORM sessions contain total paused time, not individual pause intervals.
    // This supported initializer preserves their exact active duration without fabricating pause events or calories.
    let workout = HKWorkout(activityType: .traditionalStrengthTraining,
                            start: Date(timeIntervalSince1970: fromMs / 1000), end: Date(timeIntervalSince1970: toMs / 1000),
                            duration: duration, totalEnergyBurned: nil, totalDistance: nil, metadata: metadata(identifier, version, fingerprint))
    saveOwned(sample: workout, identifier: identifier, version: version, fingerprint: fingerprint, promise: promise)
  }

  func deleteExport(kind: String, entryId: String, version: Int, fingerprint: String, expectedUUID: String, promise: Promise) {
    guard validExport(entryId: entryId, version: version, fingerprint: fingerprint), let type = type(for: kind) else { promise.reject("HEALTH_INPUT", "Ungültiger FORM-Löschauftrag."); return }
    guard store.authorizationStatus(for: type) == .sharingAuthorized else { promise.reject("HEALTH_WRITE_DENIED", "Für das Löschen eigener Exporte ist die Schreibfreigabe erforderlich."); return }
    let identifier = "FORM:\(kind):\(entryId)"
    let predicate = NSCompoundPredicate(andPredicateWithSubpredicates: [HKQuery.predicateForObjects(from: HKSource.default()), HKQuery.predicateForObjects(withMetadataKey: HKMetadataKeySyncIdentifier, allowedValues: [identifier])])
    store.execute(HKSampleQuery(sampleType: type, predicate: predicate, limit: 1001, sortDescriptors: nil) { _, objects, error in
      if let error = error { promise.reject("HEALTH_LOOKUP", error.localizedDescription); return }
      let samples = objects ?? []
      guard samples.count <= 1000 else { promise.reject("HEALTH_DELETE_LIMIT", "Zu viele Objekte für einen einzelnen sicheren Löschauftrag."); return }
      for sample in samples {
        let actualVersion = (sample.metadata?[HKMetadataKeySyncVersion] as? NSNumber)?.intValue ?? 0
        guard actualVersion > 0 && actualVersion <= version else { promise.reject("HEALTH_STALE_EXPORT", "Eine neuere oder unbekannte FORM-Version wurde nicht gelöscht."); return }
        if actualVersion == version && (sample.metadata?["FORMPayloadFingerprint"] as? String != fingerprint || (!expectedUUID.isEmpty && sample.uuid.uuidString != expectedUUID)) {
          promise.reject("HEALTH_EXPORT_CONFLICT", "Der gespeicherte Export unterscheidet sich vom Löschauftrag."); return
        }
      }
      let uuids = samples.map { $0.uuid.uuidString }
      if samples.isEmpty { promise.resolve(["syncIdentifier": identifier, "syncVersion": version, "deletedUUIDs": [String](), "alreadyAbsent": true]); return }
      self.store.delete(samples) { deleted, error in
        guard deleted, error == nil else { promise.reject("HEALTH_DELETE", error?.localizedDescription ?? "Apple Health hat die Löschung nicht bestätigt."); return }
        promise.resolve(["syncIdentifier": identifier, "syncVersion": version, "deletedUUIDs": uuids, "alreadyAbsent": false])
      }
    })
  }
}
