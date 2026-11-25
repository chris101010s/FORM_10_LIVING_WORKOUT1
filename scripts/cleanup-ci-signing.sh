#!/usr/bin/env bash
set -euo pipefail
[[ "${GITHUB_ACTIONS:-false}" == true ]] || exit 0
if [[ -n "${RUNNER_TEMP:-}" ]]; then
  security delete-keychain "$RUNNER_TEMP/form15-signing/signing.keychain-db" >/dev/null 2>&1 || true
  rm -rf "$RUNNER_TEMP/form15-signing"
fi
rm -f "$HOME/Library/MobileDevice/Provisioning Profiles/form15-ci.mobileprovision"
