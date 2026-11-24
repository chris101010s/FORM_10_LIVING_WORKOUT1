#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
WS="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
if [[ -z "$WS" ]]; then echo 'ERROR: ios Workspace fehlt.' >&2; exit 1; fi
SCHEME="$(basename "$WS" .xcworkspace)"
mkdir -p artifacts
# Ein echter iphoneos-Device-Build, NICHT iOS-Simulator; React Native bündelt JS im Release-Build.
xcodebuild -workspace "$WS" -scheme "$SCHEME" \
  -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath "$ROOT/artifacts/DerivedData" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY='' \
  build 2>&1 | tee "$ROOT/artifacts/xcodebuild.log"
APP="$(find "$ROOT/artifacts/DerivedData/Build/Products/Release-iphoneos" -maxdepth 1 -name '*.app' -print -quit)"
if [[ -z "$APP" ]]; then echo 'ERROR: iPhone .app nicht gefunden.' >&2; exit 1; fi
[[ -f "$APP/Info.plist" ]] || { echo 'ERROR: Info.plist fehlt.' >&2; exit 1; }
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP/Info.plist")" == "app.athleteos.personal" ]] || { echo 'ERROR: Bundle-ID stimmt nicht.' >&2; exit 1; }
[[ -f "$APP/main.jsbundle" ]] || { echo 'ERROR: Release JavaScript bundle fehlt.' >&2; exit 1; }
rm -rf "$ROOT/artifacts/Payload"
mkdir -p "$ROOT/artifacts/Payload"
cp -R "$APP" "$ROOT/artifacts/Payload/"
rm -f "$ROOT/artifacts/ATHLETE_OS_unsigned.ipa"
(cd "$ROOT/artifacts" && /usr/bin/zip -q -r ATHLETE_OS_unsigned.ipa Payload)
[[ -s "$ROOT/artifacts/ATHLETE_OS_unsigned.ipa" ]] || { echo 'ERROR: IPA leer.' >&2; exit 1; }
echo 'FERTIG: artifacts/ATHLETE_OS_unsigned.ipa (nicht signiert)'
/usr/bin/unzip -tq "$ROOT/artifacts/ATHLETE_OS_unsigned.ipa"
node - <<'JS'
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const app=require('./app.json').expo;
const assets={exercises:require('./src/catalog/exercises.generated.json').length,photos:(fs.readFileSync('src/catalog/photos.generated.ts','utf8').match(/require\('\.\.\/\.\.\/assets\/exercises\//g)||[]).length,fonts:(fs.readFileSync('src/components/fonts.generated.ts','utf8').match(/require\('\.\.\/\.\.\/assets\/fonts\//g)||[]).length};
const manifest={assets,customTabs:process.env.EXPO_PUBLIC_FORM_CUSTOM_TABS==='1',testStatus:"passed-in-workflow",version:app.version,bundleIdentifier:app.ios.bundleIdentifier,commit:process.env.GITHUB_SHA||null,builtAt:new Date().toISOString(),xcode:cp.execFileSync('xcodebuild',['-version'],{encoding:'utf8'}).trim(),sha256:crypto.createHash('sha256').update(fs.readFileSync('artifacts/ATHLETE_OS_unsigned.ipa')).digest('hex')};
fs.writeFileSync('artifacts/release-manifest.json',JSON.stringify(manifest,null,2));
JS
