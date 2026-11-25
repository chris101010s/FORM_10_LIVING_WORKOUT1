#!/usr/bin/env bash
set -euo pipefail
FORM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$FORM_ROOT"
[[ "$(uname -s)" == Darwin ]] || { echo 'ERROR: Der signierte Build benötigt macOS und Xcode.' >&2; exit 1; }
[[ "${FORM_HEALTHKIT:-0}" == 1 && "${FORM_WIDGETS:-0}" != 1 ]] || { echo 'ERROR: Dieser Build verlangt FORM_HEALTHKIT=1 und FORM_WIDGETS=0.' >&2; exit 1; }
: "${FORM_TEAM_ID:?Apple Team-ID fehlt}"
: "${FORM_PROFILE_PATH:?Pfad zum installierten HealthKit-Provisioning-Profil fehlt}"
FORM_EXPORT_METHOD="${FORM_EXPORT_METHOD:-debugging}"
[[ "$FORM_EXPORT_METHOD" == debugging || "$FORM_EXPORT_METHOD" == release-testing ]] || { echo 'ERROR: Nur lokale Development-/Ad-hoc-Exporte werden unterstützt.' >&2; exit 1; }
FORM_WORKSPACE="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
[[ -n "$FORM_WORKSPACE" ]] || { echo 'ERROR: Workspace fehlt.' >&2; exit 1; }
FORM_SCHEME="$(basename "$FORM_WORKSPACE" .xcworkspace)"
FORM_PRIVATE="$(mktemp -d)"
trap 'rm -rf "$FORM_PRIVATE"' EXIT
security cms -D -i "$FORM_PROFILE_PATH" > "$FORM_PRIVATE/profile.plist"
export FORM_PRIVATE FORM_EXPORT_METHOD
python3 - <<'PY'
import os,plistlib,datetime
from pathlib import Path
base=Path(os.environ['FORM_PRIVATE']);profile=plistlib.loads((base/'profile.plist').read_bytes());ent=profile.get('Entitlements',{});team=os.environ['FORM_TEAM_ID']
if team not in profile.get('TeamIdentifier',[]):raise SystemExit('ERROR: Team-ID passt nicht zum Profil.')
identifier=ent.get('application-identifier','');suffix='.app.athleteos.personal'
if not identifier.endswith(suffix) or identifier[:-len(suffix)] not in profile.get('ApplicationIdentifierPrefix',[]):raise SystemExit('ERROR: Profil passt nicht zur bestehenden Bundle-ID.')
if not profile.get('ProvisionedDevices') or profile.get('ProvisionsAllDevices'):raise SystemExit('ERROR: Ein Profil für registrierte Testgeräte ist erforderlich.')
(base/'application-identifier.txt').write_text(identifier)
if ent.get('com.apple.developer.healthkit') is not True:raise SystemExit('ERROR: HealthKit ist im Profil nicht erlaubt.')
if profile['ExpirationDate'].replace(tzinfo=datetime.timezone.utc) <= datetime.datetime.now(datetime.timezone.utc):raise SystemExit('ERROR: Profil ist abgelaufen.')
method=os.environ['FORM_EXPORT_METHOD'];development=bool(ent.get('get-task-allow'))
if (method=='debugging') != development:raise SystemExit('ERROR: Exportmethode passt nicht zum Development-/Ad-hoc-Profil.')
(base/'uuid.txt').write_text(profile['UUID'])
opts={'method':method,'teamID':team,'signingStyle':'manual','provisioningProfiles':{'app.athleteos.personal':profile['UUID']},'stripSwiftSymbols':True,'compileBitcode':False,'manageAppVersionAndBuildNumber':False}
(base/'ExportOptions.plist').write_bytes(plistlib.dumps(opts))
PY
FORM_PROFILE_UUID="$(cat "$FORM_PRIVATE/uuid.txt")"
if [[ "$FORM_EXPORT_METHOD" == debugging ]]; then FORM_IDENTITY='Apple Development'; else FORM_IDENTITY='Apple Distribution'; fi
export FORM_PROFILE_UUID FORM_IDENTITY
ruby -r xcodeproj - <<'RUBY'
project_path=Dir['ios/*.xcodeproj'].first
abort('App-Projekt fehlt') unless project_path
project=Xcodeproj::Project.open(project_path)
abort('ERROR: Dieser HealthKit-Build unterstützt keine Widget-/Extension-Targets. Mit FORM_WIDGETS=0 neu generieren.') if project.targets.any? { |target| target.product_type.to_s.include?('extension') }
project.targets.select { |target| target.product_type == 'com.apple.product-type.application' }.each do |target|
  target.build_configurations.each do |configuration|
    configuration.build_settings['CODE_SIGN_STYLE']='Manual'
    configuration.build_settings['DEVELOPMENT_TEAM']=ENV.fetch('FORM_TEAM_ID')
    configuration.build_settings['PROVISIONING_PROFILE_SPECIFIER']=ENV.fetch('FORM_PROFILE_UUID')
    configuration.build_settings['CODE_SIGN_IDENTITY']=ENV.fetch('FORM_IDENTITY')
  end
end
project.save
RUBY
mkdir -p artifacts
rm -rf "$FORM_ROOT/artifacts/signed-build.xcresult"
xcodebuild -workspace "$FORM_WORKSPACE" -scheme "$FORM_SCHEME" -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$FORM_ROOT/artifacts/FORM_15_0_0_HealthKit.xcarchive" \
  -resultBundlePath "$FORM_ROOT/artifacts/signed-build.xcresult" \
  archive 2>&1 | tee "$FORM_ROOT/artifacts/xcodebuild-signed.log"
xcodebuild -exportArchive -archivePath "$FORM_ROOT/artifacts/FORM_15_0_0_HealthKit.xcarchive" \
  -exportPath "$FORM_PRIVATE/export" -exportOptionsPlist "$FORM_PRIVATE/ExportOptions.plist" \
  2>&1 | tee "$FORM_ROOT/artifacts/xcode-export.log"
FORM_EXPORTED="$(find "$FORM_PRIVATE/export" -maxdepth 1 -name '*.ipa' -print -quit)"
[[ -n "$FORM_EXPORTED" ]] || { echo 'ERROR: Signierte IPA wurde nicht erzeugt.' >&2; exit 1; }
FORM_IPA="$FORM_ROOT/artifacts/FORM_15_0_0_HealthKit_signed.ipa"
cp "$FORM_EXPORTED" "$FORM_IPA"
/usr/bin/unzip -tq "$FORM_IPA" | tee "$FORM_ROOT/artifacts/ipa-integrity.log"
/usr/bin/unzip -q "$FORM_IPA" -d "$FORM_PRIVATE/check"
FORM_APP="$(find "$FORM_PRIVATE/check/Payload" -maxdepth 1 -name '*.app' -print -quit)"
[[ -n "$FORM_APP" && -f "$FORM_APP/main.jsbundle" ]] || { echo 'ERROR: Signierte App oder JS-Bundle fehlt.' >&2; exit 1; }
[[ -z "$(find "$FORM_APP" -type d -name '*.appex' -print -quit)" ]] || { echo 'ERROR: Unerwartete Extension im HealthKit-App-Build.' >&2; exit 1; }
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$FORM_APP/Info.plist")" == 'app.athleteos.personal' ]] || { echo 'ERROR: Bundle-ID stimmt nicht.' >&2; exit 1; }
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$FORM_APP/Info.plist")" == '15.0.0' ]] || { echo 'ERROR: Release-Version stimmt nicht.' >&2; exit 1; }
[[ "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleVersion' "$FORM_APP/Info.plist")" == '150002' ]] || { echo 'ERROR: Buildnummer stimmt nicht.' >&2; exit 1; }
node scripts/verify-ios-presentation.cjs "$FORM_APP"
codesign --verify --deep --strict "$FORM_APP"
codesign -d --entitlements :- "$FORM_APP" > "$FORM_PRIVATE/signed-entitlements.plist" 2>/dev/null
python3 - <<'PY'
import os,plistlib
from pathlib import Path
ent=plistlib.loads((Path(os.environ['FORM_PRIVATE'])/'signed-entitlements.plist').read_bytes())
if ent.get('com.apple.developer.healthkit') is not True:raise SystemExit('ERROR: Signatur enthält keine HealthKit-Berechtigung.')
if ent.get('com.apple.security.application-groups') or ent.get('aps-environment'):raise SystemExit('ERROR: Unerwartete Widget-/Push-Berechtigung im HealthKit-App-Build.')
expected=(Path(os.environ['FORM_PRIVATE'])/'application-identifier.txt').read_text()
if ent.get('application-identifier')!=expected:raise SystemExit('ERROR: Effektive App-Identität stimmt nicht.')
PY
node scripts/release-manifest.cjs healthkit-signed "$FORM_IPA"
echo 'Erstellt und codesign-verifiziert: artifacts/FORM_15_0_0_HealthKit_signed.ipa. Geräte-/YAZIO-Test steht separat aus.'
