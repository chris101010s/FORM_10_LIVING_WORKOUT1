import Foundation
import ActivityKit

/// Capabilities are observed from the built app and the OS, independently of HealthKit.
enum FormPresentationBridge {
  static func widgetSupport() -> [String: Any] {
    let configured = Bundle.main.object(forInfoDictionaryKey: "FORMWidgetsEnabled") as? Bool == true
    let extensions = Bundle.main.builtInPlugInsURL.flatMap { try? FileManager.default.contentsOfDirectory(at: $0, includingPropertiesForKeys: nil) } ?? []
    let embedded = extensions.contains { Bundle(url: $0)?.bundleIdentifier == "app.athleteos.personal.widgets" }
    let groupAccessible = configured && FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.app.athleteos.personal") != nil
    let available = configured && embedded && groupAccessible
    let activities = available && Bundle.main.object(forInfoDictionaryKey: "NSSupportsLiveActivities") as? Bool == true && ActivityAuthorizationInfo().areActivitiesEnabled
    return ["configured": configured, "extensionEmbedded": embedded, "groupAccessible": groupAccessible, "available": available, "activitiesAllowed": activities]
  }

  /// No caller-supplied paths. This directory stays outside user-visible Documents.
  static func preparePrivateStorage() throws -> [String: Any] {
    let manager = FileManager.default
    var directory = try manager.url(for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true).appendingPathComponent("FORMPrivate", isDirectory: true)
    try manager.createDirectory(at: directory, withIntermediateDirectories: true, attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication])
    try manager.setAttributes([.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication], ofItemAtPath: directory.path)
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try directory.setResourceValues(values)
    let excluded = try directory.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup == true
    let observed = try manager.attributesOfItem(atPath: directory.path)[.protectionKey] as? String
    let protected = [FileProtectionType.complete.rawValue, FileProtectionType.completeUnlessOpen.rawValue, FileProtectionType.completeUntilFirstUserAuthentication.rawValue].contains(observed ?? "")
    return ["uri": directory.absoluteString, "excludedFromBackup": excluded, "protected": protected, "protection": observed ?? "unknown"]
  }
}
