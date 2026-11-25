import ExpoModulesCore
import Foundation
import UIKit
import ActivityKit

/// Capabilities are observed from the built app and the OS, independently of HealthKit.
enum FormPresentationBridge {
  static let iconNames = ["paper": "FORMPaper", "blueprint": "FORMBlueprint", "retro": "FORMRetro"]
  private static var changingIcon = false

  static func widgetSupport() -> [String: Any] {
    let configured = Bundle.main.object(forInfoDictionaryKey: "FORMWidgetsEnabled") as? Bool == true
    let extensions = Bundle.main.builtInPlugInsURL.flatMap { try? FileManager.default.contentsOfDirectory(at: $0, includingPropertiesForKeys: nil) } ?? []
    let embedded = extensions.contains { Bundle(url: $0)?.bundleIdentifier == "app.athleteos.personal.widgets" }
    let groupAccessible = configured && FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.app.athleteos.personal") != nil
    let available = configured && embedded && groupAccessible
    let activities = available && Bundle.main.object(forInfoDictionaryKey: "NSSupportsLiveActivities") as? Bool == true && ActivityAuthorizationInfo().areActivitiesEnabled
    return ["configured": configured, "extensionEmbedded": embedded, "groupAccessible": groupAccessible, "available": available, "activitiesAllowed": activities]
  }

  /// Call on the main queue: UIApplication's state belongs to the UI thread.
  static func iconState() -> [String: Any] {
    let icons = Bundle.main.object(forInfoDictionaryKey: "CFBundleIcons") as? [String: Any] ?? [:]
    let alternates = icons["CFBundleAlternateIcons"] as? [String: Any] ?? [:]
    let variants = ["ink"] + iconNames.keys.sorted().filter { alternates[iconNames[$0]!] != nil }
    let current = UIApplication.shared.alternateIconName
    let selected = current == nil ? "ink" : iconNames.first(where: { $0.value == current })?.key ?? "unknown"
    return ["available": UIApplication.shared.supportsAlternateIcons && variants.count > 1, "selected": selected, "variants": variants]
  }

  static func changeIcon(_ key: String, promise: Promise) {
    guard !changingIcon else { promise.reject("ICON_BUSY", "Eine Symboländerung wird bereits vom System verarbeitet."); return }
    guard key == "ink" || iconNames[key] != nil else { promise.reject("ICON_UNKNOWN", "Dieses App-Symbol ist nicht vorgesehen."); return }
    let state = iconState()
    guard state["available"] as? Bool == true, (state["variants"] as? [String])?.contains(key) == true else { promise.reject("ICON_UNAVAILABLE", "Dieser Build oder das System erlaubt diese Symbolvariante nicht."); return }
    guard UIApplication.shared.applicationState == .active else { promise.reject("ICON_INACTIVE", "Öffne FORM, um das App-Symbol zu ändern."); return }
    let expected = key == "ink" ? nil : iconNames[key]
    if UIApplication.shared.alternateIconName == expected { promise.resolve(key); return }
    changingIcon = true
    UIApplication.shared.setAlternateIconName(expected) { error in
      DispatchQueue.main.async {
        defer { changingIcon = false }
        if let error = error { promise.reject("ICON_CHANGE", error.localizedDescription); return }
        guard UIApplication.shared.alternateIconName == expected else { promise.reject("ICON_RECEIPT", "Das System hat die Symboländerung noch nicht bestätigt."); return }
        promise.resolve(key)
      }
    }
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
