#!/usr/bin/env bash
set -euo pipefail
FORM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$FORM_ROOT"
FORM_WORKSPACE="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
[[ -n "$FORM_WORKSPACE" ]] || { echo 'ERROR: Workspace fehlt.' >&2; exit 1; }
FORM_SCHEME="$(basename "$FORM_WORKSPACE" .xcworkspace)"
mkdir -p artifacts
rm -rf artifacts/simulator-build.xcresult
xcodebuild -workspace "$FORM_WORKSPACE" -scheme "$FORM_SCHEME" -configuration Release -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath "$FORM_ROOT/artifacts/SimulatorDerivedData" \
  -resultBundlePath "$FORM_ROOT/artifacts/simulator-build.xcresult" CODE_SIGNING_ALLOWED=NO build \
  2>&1 | tee "$FORM_ROOT/artifacts/simulator-build.log"
FORM_APP="$(find artifacts/SimulatorDerivedData/Build/Products/Release-iphonesimulator -maxdepth 1 -name '*.app' -print -quit)"
[[ -n "$FORM_APP" ]] || { echo 'ERROR: Simulator-App fehlt.' >&2; exit 1; }
xcrun simctl list devices available --json > artifacts/simulator-devices.json
FORM_DEVICE="$(python3 - <<'PY'
import json
from pathlib import Path
items=[(runtime,d) for runtime,devices in json.loads(Path('artifacts/simulator-devices.json').read_text())['devices'].items() for d in devices if 'iOS' in runtime and d.get('isAvailable') and d['name'].startswith('iPhone')]
if not items:raise SystemExit('Kein iPhone-Simulator verfügbar.')
items.sort(key=lambda item:('SE' in item[1]['name'],item[0],item[1]['name']),reverse=True)
print(items[0][1]['udid'])
PY
)"
# Booting an already booted device reports an error; bootstatus verifies the actual state below.
xcrun simctl boot "$FORM_DEVICE" >/dev/null 2>&1 || true
xcrun simctl bootstatus "$FORM_DEVICE" -b
xcrun simctl install "$FORM_DEVICE" "$FORM_APP"
xcrun simctl launch "$FORM_DEVICE" app.athleteos.personal | tee artifacts/simulator-launch.log
sleep 4
xcrun simctl io "$FORM_DEVICE" screenshot artifacts/FORM_15_0_0_fresh-install-smoke.png
node -e "require('node:fs').writeFileSync('artifacts/simulator-status.json',JSON.stringify({status:'launch-command-completed',scope:'Fresh-install launch smoke; screenshot requires visual review. No upgrade, workout UI, HealthKit or device roundtrip proven.',at:new Date().toISOString()},null,2))"
