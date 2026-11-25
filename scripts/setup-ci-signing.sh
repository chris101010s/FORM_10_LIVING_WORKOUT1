#!/usr/bin/env bash
set -euo pipefail
[[ "${GITHUB_ACTIONS:-false}" == true ]] || { echo 'Nur für den kurzlebigen GitHub-Runner vorgesehen.' >&2; exit 1; }
: "${RUNNER_TEMP:?}"
: "${FORM_CERTIFICATE_P12_BASE64:?Zertifikat-Secret fehlt}"
: "${FORM_CERTIFICATE_PASSWORD:?Zertifikat-Passwort fehlt}"
: "${FORM_PROFILE_BASE64:?Provisioning-Profil fehlt}"
: "${FORM_KEYCHAIN_PASSWORD:?Temporäres Keychain-Passwort fehlt}"
FORM_SIGNING_DIR="$RUNNER_TEMP/form15-signing"
mkdir -p "$FORM_SIGNING_DIR"
chmod 700 "$FORM_SIGNING_DIR"
export FORM_SIGNING_DIR
python3 - <<'PY'
import base64,os
from pathlib import Path
folder=Path(os.environ['FORM_SIGNING_DIR'])
for env,name in [('FORM_CERTIFICATE_P12_BASE64','certificate.p12'),('FORM_PROFILE_BASE64','profile.mobileprovision')]:
    target=folder/name;target.write_bytes(base64.b64decode(''.join(os.environ[env].split()),validate=True));target.chmod(0o600)
PY
FORM_KEYCHAIN="$FORM_SIGNING_DIR/signing.keychain-db"
security create-keychain -p "$FORM_KEYCHAIN_PASSWORD" "$FORM_KEYCHAIN"
security set-keychain-settings -lut 21600 "$FORM_KEYCHAIN"
security unlock-keychain -p "$FORM_KEYCHAIN_PASSWORD" "$FORM_KEYCHAIN"
security import "$FORM_SIGNING_DIR/certificate.p12" -P "$FORM_CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k "$FORM_KEYCHAIN" >/dev/null
security set-key-partition-list -S apple-tool:,apple: -k "$FORM_KEYCHAIN_PASSWORD" "$FORM_KEYCHAIN" >/dev/null
security list-keychains -d user -s "$FORM_KEYCHAIN"
mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
cp "$FORM_SIGNING_DIR/profile.mobileprovision" "$HOME/Library/MobileDevice/Provisioning Profiles/form15-ci.mobileprovision"
printf 'FORM_PROFILE_PATH=%s\n' "$FORM_SIGNING_DIR/profile.mobileprovision" >> "$GITHUB_ENV"
echo 'Signiermaterial im temporären Runner eingerichtet.'
