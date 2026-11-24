import ExpoModulesCore
import HealthKit
import Foundation

public final class FormHealthModule: Module {
  private let store = HKHealthStore()
  private var enabled: Bool { Bundle.main.object(forInfoDictionaryKey: "FORMHealthKitEnabled") as? Bool == true && HKHealthStore.isHealthDataAvailable() }
  private let specs: [(String, HKQuantityTypeIdentifier, HKUnit, HKStatisticsOptions)] = [
    ("steps", .stepCount, .count(), .cumulativeSum),
    ("walkKm", .distanceWalkingRunning, .meterUnit(with: .kilo), .cumulativeSum),
    ("restingPulse", .restingHeartRate, HKUnit.count().unitDivided(by: .minute()), .discreteAverage),
    ("heartRate", .heartRate, HKUnit.count().unitDivided(by: .minute()), .discreteAverage),
    ("activeKcal", .activeEnergyBurned, .kilocalorie(), .cumulativeSum)
  ]
  public func definition() -> ModuleDefinition {
    Name("FormHealth")
    AsyncFunction("sealBackup") { (text: String, password: String) -> String in try FormBackupCrypto.seal(text, password) }
    AsyncFunction("openBackup") { (text: String, password: String) -> String in try FormBackupCrypto.open(text, password) }
    Function("available") { self.enabled }
    Function("widgetsEnabled") { Bundle.main.object(forInfoDictionaryKey: "FORMWidgetsEnabled") as? Bool == true }
    AsyncFunction("authorize") { (promise: Promise) in
      guard self.enabled else { promise.reject("HEALTH_UNAVAILABLE", "HealthKit ist in diesem Build nicht aktiviert."); return }
      var types = Set<HKObjectType>(self.specs.compactMap { HKQuantityType.quantityType(forIdentifier: $0.1) })
      if let type = HKQuantityType.quantityType(forIdentifier: .bodyMass) { types.insert(type) }
      if let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(type) }
      self.store.requestAuthorization(toShare: [], read: types) { ok, error in
        if let error = error { promise.reject("HEALTH_PERMISSION", error.localizedDescription) } else { promise.resolve(ok) }
      }
    }
    AsyncFunction("readDay") { (fromMs: Double, toMs: Double, promise: Promise) in
      guard self.enabled, fromMs.isFinite, toMs.isFinite, toMs > fromMs, toMs - fromMs < 100_000_000 else { promise.reject("HEALTH_RANGE", "HealthKit nicht verfügbar oder Zeitraum ungültig."); return }
      let from = Date(timeIntervalSince1970: fromMs / 1000), to = Date(timeIntervalSince1970: toMs / 1000)
      let predicate = HKQuery.predicateForSamples(withStart: from, end: to, options: [.strictStartDate])
      let group = DispatchGroup()
      // All mutations and final resolution are serialized on the main queue.
      var values: [String: Double] = [:]
      var failures: [String] = []
      for (key, identifier, unit, option) in self.specs {
        guard let type = HKQuantityType.quantityType(forIdentifier: identifier) else { continue }
        group.enter()
        self.store.execute(HKStatisticsQuery(quantityType: type, quantitySamplePredicate: predicate, options: option) { _, stats, error in
          let quantity = option == .cumulativeSum ? stats?.sumQuantity() : stats?.averageQuantity()
          DispatchQueue.main.async {
            if let quantity = quantity { let value = quantity.doubleValue(for: unit); if value.isFinite { values[key] = value } }
            if error != nil { failures.append(key) }
            group.leave()
          }
        })
      }
      if let type = HKQuantityType.quantityType(forIdentifier: .bodyMass) {
        group.enter()
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        self.store.execute(HKSampleQuery(sampleType: type, predicate: predicate, limit: 1, sortDescriptors: [sort]) { _, samples, error in
          let value = (samples?.first as? HKQuantitySample)?.quantity.doubleValue(for: .gramUnit(with: .kilo))
          DispatchQueue.main.async { if let value = value, value.isFinite { values["weight"] = value }; if error != nil { failures.append("weight") }; group.leave() }
        })
      }
      if let type = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis) {
        group.enter()
        let overlap = HKQuery.predicateForSamples(withStart: from, end: to, options: [])
        self.store.execute(HKSampleQuery(sampleType: type, predicate: overlap, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, error in
          let asleep = Set([HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue, HKCategoryValueSleepAnalysis.asleepCore.rawValue, HKCategoryValueSleepAnalysis.asleepDeep.rawValue, HKCategoryValueSleepAnalysis.asleepREM.rawValue])
          let intervals = (samples as? [HKCategorySample] ?? []).filter { asleep.contains($0.value) }.map { (max($0.startDate, from), min($0.endDate, to)) }.filter { $0.1 > $0.0 }.sorted { $0.0 < $1.0 }
          var merged: [(Date,Date)] = []
          for interval in intervals { if let last = merged.last, interval.0 <= last.1 { merged[merged.count-1] = (last.0,max(last.1,interval.1)) } else { merged.append(interval) } }
          let hours = merged.reduce(0.0) { $0 + $1.1.timeIntervalSince($1.0) } / 3600
          DispatchQueue.main.async { if !intervals.isEmpty { values["sleepHours"] = hours }; if error != nil { failures.append("sleepHours") }; group.leave() }
        })
      }
      group.notify(queue: .main) { promise.resolve(["values": values, "unavailable": failures]) }
    }
  }
}
