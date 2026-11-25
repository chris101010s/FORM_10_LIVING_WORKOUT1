#!/usr/bin/env bash
set -euo pipefail
FORM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$FORM_ROOT"
FORM_ARTIFACTS="$FORM_ROOT/artifacts"
FORM_SIM_ARCH="$(uname -m)"
FORM_APP=''
mkdir -p "$FORM_ARTIFACTS"
form_build_finish() {
  FORM_BUILD_EXIT=$?
  trap - EXIT
  python3 - "$FORM_ARTIFACTS/simulator-build-status.json" "$FORM_BUILD_EXIT" "$FORM_SIM_ARCH" "$FORM_APP" <<'PY'
from datetime import datetime,timezone
import json,sys
from pathlib import Path
Path(sys.argv[1]).write_text(json.dumps({'status':'built' if int(sys.argv[2])==0 else 'failed','exitCode':int(sys.argv[2]),'configuration':'Release','sdk':'iphonesimulator','hostArchitecture':sys.argv[3],'app':sys.argv[4] or None,'at':datetime.now(timezone.utc).isoformat()},indent=2)+'\n')
PY
  exit "$FORM_BUILD_EXIT"
}
trap form_build_finish EXIT
case "$FORM_SIM_ARCH" in
  arm64|x86_64) ;;
  *) echo "ERROR: Nicht unterstützte CI-Hostarchitektur: $FORM_SIM_ARCH" >&2; exit 1 ;;
esac
FORM_WORKSPACE="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
[[ -n "$FORM_WORKSPACE" ]] || { echo 'ERROR: Workspace fehlt.' >&2; exit 1; }
FORM_SCHEME="$(basename "$FORM_WORKSPACE" .xcworkspace)"
echo "Simulator Release architecture: $FORM_SIM_ARCH" | tee "$FORM_ARTIFACTS/simulator-architecture.log"
rm -rf "$FORM_ARTIFACTS/simulator-build.xcresult"
xcodebuild -workspace "$FORM_WORKSPACE" -scheme "$FORM_SCHEME" -configuration Release -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath "$FORM_ARTIFACTS/SimulatorDerivedData" \
  -resultBundlePath "$FORM_ARTIFACTS/simulator-build.xcresult" CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES "ARCHS=$FORM_SIM_ARCH" build \
  2>&1 | tee "$FORM_ARTIFACTS/simulator-build.log"
FORM_APP="$(find "$FORM_ARTIFACTS/SimulatorDerivedData/Build/Products/Release-iphonesimulator" -maxdepth 1 -name '*.app' -print -quit)"
[[ -n "$FORM_APP" && -f "$FORM_APP/Info.plist" ]] || { echo 'ERROR: Gebaute Simulator-App fehlt.' >&2; exit 1; }
echo "PASS: Release-Simulator-App gebaut ($FORM_SIM_ARCH): $FORM_APP"
