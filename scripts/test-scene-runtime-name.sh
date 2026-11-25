#!/usr/bin/env bash
set -euo pipefail

# An isolated macOS runtime experiment, not an app or simulator launch test.
# Report both names without assuming which one Foundation accepts.
if [[ "$(uname -s)" != 'Darwin' ]] || ! command -v xcrun >/dev/null 2>&1; then
  echo 'BLOCKED: This experiment requires macOS with the Xcode Swift toolchain.' >&2
  exit 2
fi

FORM_SCENE_PROBE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/form-scene-name.XXXXXX")"
trap 'rm -rf "$FORM_SCENE_PROBE_DIR"' EXIT

cat > "$FORM_SCENE_PROBE_DIR/main.swift" <<'SWIFT'
import Foundation

@objc(SceneDelegate)
final class SceneDelegate: NSObject {}

let candidateNames = ["FORM1500.SceneDelegate", "SceneDelegate"]
func inspectNames() -> [[String: Any]] {
  candidateNames.map { name in
    let resolved = NSClassFromString(name)
    return [
      "requestedName": name,
      "resolved": resolved != nil,
      "resolvedRuntimeName": resolved.map { NSStringFromClass($0) as Any } ?? NSNull()
    ]
  }
}

let beforeExplicitTypeReference = inspectNames()
let runtimeName = NSStringFromClass(SceneDelegate.self)
let afterExplicitTypeReference = candidateNames.map { name -> [String: Any] in
  let resolved = NSClassFromString(name)
  return [
    "requestedName": name,
    "resolved": resolved != nil,
    "isExpectedClass": resolved.map { ObjectIdentifier($0) == ObjectIdentifier(SceneDelegate.self) } ?? false,
    "resolvedRuntimeName": resolved.map { NSStringFromClass($0) as Any } ?? NSNull()
  ]
}
let result: [String: Any] = [
  "experiment": "Explicit @objc class name and module-qualified Foundation lookup",
  "compiledModule": "FORM1500",
  "platform": ProcessInfo.processInfo.operatingSystemVersionString,
  "runtimeName": runtimeName,
  "swiftReflection": String(reflecting: SceneDelegate.self),
  "beforeExplicitTypeReference": beforeExplicitTypeReference,
  "afterExplicitTypeReference": afterExplicitTypeReference,
  "appLaunchVerified": false
]
let json = try JSONSerialization.data(withJSONObject: result, options: [.prettyPrinted, .sortedKeys])
print(String(decoding: json, as: UTF8.self))
SWIFT

xcrun --sdk macosx swiftc -module-name FORM1500 "$FORM_SCENE_PROBE_DIR/main.swift" -o "$FORM_SCENE_PROBE_DIR/probe"
"$FORM_SCENE_PROBE_DIR/probe"
