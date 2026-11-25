#!/usr/bin/env bash
set -euo pipefail
FORM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$FORM_ROOT"
[[ "$(uname -s)" == Darwin ]] || { echo 'ERROR: Ein echter iPhone-Build benötigt macOS und Xcode.' >&2; exit 1; }
[[ "${FORM_HEALTHKIT:-0}" != 1 && "${FORM_WIDGETS:-0}" != 1 ]] || { echo 'ERROR: Der Standard-Build erlaubt keine HealthKit-/Widget-Entitlements.' >&2; exit 1; }
FORM_WORKSPACE="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
[[ -n "$FORM_WORKSPACE" ]] || { echo 'ERROR: ios Workspace fehlt. Expo Prebuild und pod install ausführen.' >&2; exit 1; }
FORM_SCHEME="$(basename "$FORM_WORKSPACE" .xcworkspace)"
mkdir -p artifacts
python3 - <<'PY'
from pathlib import Path
import plistlib
for path in Path('ios').rglob('*.entitlements'):
    values=plistlib.loads(path.read_bytes())
    if any(key.startswith('com.apple.developer.healthkit') for key in values) or values.get('com.apple.security.application-groups') or values.get('aps-environment'):
        raise SystemExit('ERROR: Optionales Entitlement im Standardprojekt: '+str(path))
PY
rm -rf "$FORM_ROOT/artifacts/device-build.xcresult"
xcodebuild -workspace "$FORM_WORKSPACE" -scheme "$FORM_SCHEME" \
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath "$FORM_ROOT/artifacts/DerivedData" \
  -resultBundlePath "$FORM_ROOT/artifacts/device-build.xcresult" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY='' \
  build 2>&1 | tee "$FORM_ROOT/artifacts/xcodebuild.log"
FORM_APP="$(find "$FORM_ROOT/artifacts/DerivedData/Build/Products/Release-iphoneos" -maxdepth 1 -name '*.app' -print -quit)"
[[ -n "$FORM_APP" && -f "$FORM_APP/Info.plist" ]] || { echo 'ERROR: iPhone App fehlt.' >&2; exit 1; }
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$FORM_APP/Info.plist")" == 'app.athleteos.personal' ]] || { echo 'ERROR: Bundle-ID stimmt nicht.' >&2; exit 1; }
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$FORM_APP/Info.plist")" == '15.0.0' ]] || { echo 'ERROR: Release-Version stimmt nicht.' >&2; exit 1; }
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$FORM_APP/Info.plist")" == '150001' ]] || { echo 'ERROR: Buildnummer stimmt nicht.' >&2; exit 1; }
node scripts/verify-ios-presentation.cjs "$FORM_APP"
[[ -f "$FORM_APP/main.jsbundle" ]] || { echo 'ERROR: Release JavaScript bundle fehlt.' >&2; exit 1; }
[[ -z "$(find "$FORM_APP" -type d -name '*.appex' -print -quit)" ]] || { echo 'ERROR: Unerwartete Extension im Standard-Build.' >&2; exit 1; }
FORM_STAGE="$(mktemp -d "$FORM_ROOT/artifacts/package.XXXXXX")"
trap 'rm -rf "$FORM_STAGE"' EXIT
mkdir -p "$FORM_STAGE/Payload"
cp -R "$FORM_APP" "$FORM_STAGE/Payload/"
FORM_IPA="$FORM_ROOT/artifacts/FORM_15_0_0_unsigned.ipa"
rm -f "$FORM_IPA"
(cd "$FORM_STAGE" && /usr/bin/zip -q -r "$FORM_IPA" Payload)
[[ -s "$FORM_IPA" ]] || { echo 'ERROR: IPA leer.' >&2; exit 1; }
/usr/bin/unzip -tq "$FORM_IPA" | tee "$FORM_ROOT/artifacts/ipa-integrity.log"
node scripts/release-manifest.cjs unsigned "$FORM_IPA"
echo 'Erstellt: artifacts/FORM_15_0_0_unsigned.ipa (noch nicht signiert/installiert).'
