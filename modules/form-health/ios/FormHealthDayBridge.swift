import ExpoModulesCore
import HealthKit
import Foundation

/// Raw day samples allow FORM to show and select a real provider/device before aggregation.
enum FormHealthDayBridge {
  private static func timestamp(_ date: Date) -> String { ISO8601DateFormatter().string(from: date) }
  private static func source(_ sample: HKSample) -> [String: String] {
    let revision = sample.sourceRevision
    var value = ["name": revision.source.name, "bundleIdentifier": revision.source.bundleIdentifier]
    if let version = revision.version, !version.isEmpty { value["version"] = version }
    if let product = revision.productType, !product.isEmpty { value["productType"] = product }
    if let name = sample.device?.name, !name.isEmpty { value["deviceName"] = name }
    if let id = sample.device?.localIdentifier, !id.isEmpty { value["deviceId"] = id }
    return value
  }
  static func read(store: HKHealthStore, fromMs: Double, toMs: Double, promise: Promise) {
    guard fromMs.isFinite, toMs.isFinite, toMs > fromMs, toMs - fromMs <= 26 * 3_600_000 else { promise.reject("HEALTH_RANGE", "Wähle einen lokalen Kalendertag."); return }
    let from = Date(timeIntervalSince1970: fromMs / 1000), to = Date(timeIntervalSince1970: toMs / 1000)
    let range = HKQuery.predicateForSamples(withStart: from, end: to, options: [.strictStartDate])
    let specs: [(String, HKQuantityTypeIdentifier, HKUnit, String)] = [
      ("steps", .stepCount, .count(), "count"), ("walkKm", .distanceWalkingRunning, .meterUnit(with: .kilo), "km"),
      ("restingPulse", .restingHeartRate, HKUnit.count().unitDivided(by: .minute()), "bpm"),
      ("heartRate", .heartRate, HKUnit.count().unitDivided(by: .minute()), "bpm"),
      ("activeKcal", .activeEnergyBurned, .kilocalorie(), "kcal"), ("weight", .bodyMass, .gramUnit(with: .kilo), "kg")
    ]
    let group = DispatchGroup()
    var records: [[String: Any]] = [], unavailable: [String] = []
    for (key, identifier, unit, symbol) in specs {
      guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { unavailable.append(key); continue }
      let predicate: NSPredicate = key == "weight" ? NSCompoundPredicate(andPredicateWithSubpredicates: [range, NSCompoundPredicate(notPredicateWithSubpredicate: HKQuery.predicateForObjects(from: HKSource.default()))]) : range
      group.enter()
      store.execute(HKSampleQuery(sampleType: type, predicate: predicate, limit: 25001, sortDescriptors: nil) { _, samples, error in
        let values: [[String: Any]] = (samples as? [HKQuantitySample] ?? []).filter { $0.startDate >= from && $0.startDate < to }.compactMap { sample in
          let number = sample.quantity.doubleValue(for: unit)
          guard number.isFinite, number >= 0 else { return nil }
          return ["uuid": sample.uuid.uuidString, "metric": key, "value": number, "unit": symbol, "startedAt": timestamp(sample.startDate), "endedAt": timestamp(sample.endDate), "source": source(sample)]
        }
        DispatchQueue.main.async { if error == nil && (samples?.count ?? 0) < 25001 { records.append(contentsOf: values) } else { unavailable.append(key) }; group.leave() }
      })
    }
    if let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
      group.enter()
      store.execute(HKSampleQuery(sampleType: type, predicate: HKQuery.predicateForSamples(withStart: from, end: to, options: []), limit: 25001, sortDescriptors: nil) { _, samples, error in
        let asleep = Set([HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue, HKCategoryValueSleepAnalysis.asleepCore.rawValue, HKCategoryValueSleepAnalysis.asleepDeep.rawValue, HKCategoryValueSleepAnalysis.asleepREM.rawValue])
        let values: [[String: Any]] = (samples as? [HKCategorySample] ?? []).filter { asleep.contains($0.value) && $0.startDate < to && $0.endDate > from }.map { sample in
          ["uuid": sample.uuid.uuidString, "metric": "sleepHours", "value": min(sample.endDate,to).timeIntervalSince(max(sample.startDate,from))/3600, "unit": "h", "startedAt": timestamp(sample.startDate), "endedAt": timestamp(sample.endDate), "source": source(sample)]
        }
        DispatchQueue.main.async { if error == nil && (samples?.count ?? 0) < 25001 { records.append(contentsOf: values) } else { unavailable.append("sleepHours") }; group.leave() }
      })
    } else { unavailable.append("sleepHours") }
    group.notify(queue: .main) { promise.resolve(["from": timestamp(from), "to": timestamp(to), "timeZone": TimeZone.current.identifier, "queriedAt": timestamp(Date()), "samples": records, "unavailable": unavailable]) }
  }
}
