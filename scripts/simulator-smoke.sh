#!/usr/bin/env bash
set -euo pipefail
FORM_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$FORM_ROOT"
FORM_SKIP_BUILD='false'
[[ "$#" -le 1 ]] || { echo 'Usage: bash scripts/simulator-smoke.sh [--skip-build]' >&2; exit 64; }
case "${1:-}" in
  ''|run) ;;
  --skip-build) FORM_SKIP_BUILD='true' ;;
  *) echo 'Usage: bash scripts/simulator-smoke.sh [--skip-build]' >&2; exit 64 ;;
esac
FORM_ARTIFACTS="$FORM_ROOT/artifacts"
FORM_SMOKE_ROOT="$FORM_ARTIFACTS/simulator-smoke"
FORM_FIXTURES="$FORM_SMOKE_ROOT/fixtures"
FORM_BUNDLE='app.athleteos.personal'
FORM_WAIT_SECONDS="${FORM_SMOKE_WAIT_SECONDS:-20}"
FORM_RECORD_VIDEO="${FORM_SMOKE_RECORD_VIDEO:-1}"
FORM_STAGE='setup'
FORM_DEVICE=''
FORM_DIAGNOSIS=''
FORM_VERIFIED='false'
mkdir -p "$FORM_SMOKE_ROOT"

form_fail() { FORM_DIAGNOSIS="$1"; echo "ERROR: $FORM_DIAGNOSIS" >&2; exit 1; }
# Python supplies real command timeouts; simctl has no invented timeout flags.
form_timed() {
  python3 - "$@" <<'PY_TIMEOUT'
from datetime import datetime,timezone
import json,os
from pathlib import Path
import subprocess,sys,time
seconds=int(sys.argv[1])
started_at=datetime.now(timezone.utc).isoformat()
started=time.monotonic()
exit_code=1
timed_out=False
try:
    result=subprocess.run(sys.argv[2:],timeout=seconds,check=False)
    exit_code=result.returncode if result.returncode>=0 else 128-result.returncode
except subprocess.TimeoutExpired:
    exit_code=124
    timed_out=True
    print('ERROR: Timeout nach '+str(seconds)+'s: '+' '.join(sys.argv[2:]),file=sys.stderr)
except OSError as error:
    exit_code=127
    print('ERROR: '+str(error),file=sys.stderr)
finally:
    status_file=os.environ.get('FORM_TIMED_STATUS_FILE')
    if status_file:
        report={'status':'timeout' if timed_out else ('succeeded' if exit_code==0 else 'failed'),
                'operation':os.environ.get('FORM_TIMED_OPERATION'),
                'startedAt':started_at,'finishedAt':datetime.now(timezone.utc).isoformat(),
                'elapsedSeconds':round(time.monotonic()-started,3),'timeoutSeconds':seconds,
                'exitCode':exit_code,'timedOut':timed_out}
        Path(status_file).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print('TIMING: '+json.dumps(report,ensure_ascii=False),file=sys.stderr,flush=True)
raise SystemExit(exit_code)
PY_TIMEOUT
}
form_finish() {
  FORM_EXIT_CODE=$?
  trap - EXIT
  set +e
  if [[ "$FORM_EXIT_CODE" -eq 0 && "$FORM_VERIFIED" != 'true' ]]; then
    FORM_EXIT_CODE=1
    FORM_DIAGNOSIS='Der Startcheck endete ohne drei bestätigte Szenarien.'
  fi
  # Only the simulator created by this invocation is ever shut down/deleted.
  if [[ -n "$FORM_DEVICE" ]]; then
    form_timed 60 xcrun simctl shutdown "$FORM_DEVICE" > "$FORM_ARTIFACTS/simulator-cleanup.log" 2>&1
    form_timed 60 xcrun simctl delete "$FORM_DEVICE" >> "$FORM_ARTIFACTS/simulator-cleanup.log" 2>&1
  fi
  python3 - "$FORM_SMOKE_ROOT" "$FORM_ARTIFACTS/simulator-status.json" "$FORM_EXIT_CODE" "$FORM_STAGE" "$FORM_DIAGNOSIS" <<'PY'
from datetime import datetime,timezone
import json,sys
from pathlib import Path
root,output=Path(sys.argv[1]),Path(sys.argv[2])
scenarios=[]
for name in ('fresh','v10-home','v10-live'):
    file=root/name/'simulator-status.json'
    value=json.loads(file.read_text()) if file.is_file() else {'status':'not-run'}
    scenarios.append({'scenario':name,**value})
passed=int(sys.argv[3])==0 and all(s['status']=='startup-and-repository-verified' for s in scenarios)
report={'status':'three-scenarios-passed' if passed else 'failed','exitCode':int(sys.argv[3]),'stage':sys.argv[4],'diagnosis':sys.argv[5] or None,'at':datetime.now(timezone.utc).isoformat(),'scenarios':scenarios,'scope':'Release simulator startup, same-PID/executable observation, screenshots, and read-only schema9/data checks. Screenshots require visual review. No physical iPhone, signing, or complete workout-flow proof.'}
output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('Simulator smoke:',report['status'])
PY
  if [[ "$FORM_EXIT_CODE" -ne 0 ]]; then
    echo "ERROR: ${FORM_DIAGNOSIS:-Startcheck in Phase $FORM_STAGE fehlgeschlagen.}" >&2
    echo 'Diagnose: artifacts/simulator-status.json und artifacts/simulator-smoke/<scenario>/ (App-Ausgaben, Systemlogs, Prozessstatus, DB-Prüfung, Screenshots, Crashreports).' >&2
  fi
  exit "$FORM_EXIT_CODE"
}
trap form_finish EXIT
[[ "$FORM_WAIT_SECONDS" =~ ^[0-9]+$ ]] && (( FORM_WAIT_SECONDS >= 10 && FORM_WAIT_SECONDS <= 120 )) || form_fail 'FORM_SMOKE_WAIT_SECONDS muss zwischen 10 und 120 Sekunden liegen.'
if [[ "$FORM_SKIP_BUILD" != 'true' ]]; then
  FORM_STAGE='release-build'
  bash "$FORM_ROOT/scripts/build-ios-simulator.sh"
fi
FORM_STAGE='built-app-readback'
FORM_APP="$(python3 - "$FORM_ARTIFACTS/simulator-build-status.json" "$(uname -m)" <<'PY_BUILD'
import json,sys
from pathlib import Path
file=Path(sys.argv[1])
if not file.is_file():
    raise SystemExit('Simulator-Buildstatus fehlt. Zuerst bash scripts/build-ios-simulator.sh ausführen.')
status=json.loads(file.read_text())
app=Path(status.get('app') or '')
if status.get('status')!='built' or status.get('hostArchitecture')!=sys.argv[2] or not (app/'Info.plist').is_file():
    raise SystemExit('Kein bestätigter Release-Simulator-Build für diesen Host vorhanden.')
print(app)
PY_BUILD
)"
FORM_EXECUTABLE_NAME="$(python3 - "$FORM_APP/Info.plist" "$FORM_BUNDLE" <<'PY'
import plistlib,sys
with open(sys.argv[1],'rb') as source:
    info=plistlib.load(source)
if info.get('CFBundleIdentifier') != sys.argv[2]:
    raise SystemExit('Die gebaute Simulator-App hat eine unerwartete Bundle-ID.')
name=info.get('CFBundleExecutable')
if not isinstance(name,str) or not name or '/' in name or '\\' in name or name in ('.','..'):
    raise SystemExit('CFBundleExecutable fehlt oder ist ungültig.')
print(name)
PY
)"
FORM_STAGE='synthetic-fixtures'
node scripts/create-startup-v10-fixture.cjs "$FORM_FIXTURES" > "$FORM_ARTIFACTS/simulator-fixtures.log"
FORM_STAGE='dedicated-simulator'
echo 'PHASE: Eigenen Testsimulator erstellen und booten (Bootstatus maximal 300s).'
form_timed 60 xcrun simctl list devices available --json > "$FORM_ARTIFACTS/simulator-devices.json"
form_timed 60 xcrun simctl list devicetypes --json > "$FORM_ARTIFACTS/simulator-device-types.json"
FORM_DEVICE_TYPE_AND_RUNTIME="$(python3 "$FORM_ROOT/scripts/select-ios-simulator.py" "$FORM_ARTIFACTS/simulator-devices.json" "$FORM_ARTIFACTS/simulator-device-types.json")"
read -r FORM_DEVICE_TYPE FORM_RUNTIME <<< "$FORM_DEVICE_TYPE_AND_RUNTIME"
FORM_DEVICE="$(form_timed 60 xcrun simctl create "FORM Startup Smoke ${GITHUB_RUN_ID:-local}-$$" "$FORM_DEVICE_TYPE" "$FORM_RUNTIME")"
[[ "$FORM_DEVICE" =~ ^[A-Fa-f0-9-]{36}$ ]] || form_fail 'Neuer Testsimulator lieferte keine eindeutige UDID.'
python3 - "$FORM_ARTIFACTS/simulator-environment-status.json" "$FORM_DEVICE" "$FORM_DEVICE_TYPE" "$FORM_RUNTIME" "$FORM_ARTIFACTS/simulator-device-types.json" "$FORM_ARTIFACTS/simulator-build-status.json" <<'PY_ENVIRONMENT'
from datetime import datetime,timezone
import json,sys
from pathlib import Path
types=json.loads(Path(sys.argv[5]).read_text())['devicetypes']
device_type=next((item for item in types if item['identifier']==sys.argv[3]),{})
build=json.loads(Path(sys.argv[6]).read_text())
report={'status':'simulator-created','at':datetime.now(timezone.utc).isoformat(),
        'udid':sys.argv[2],'deviceTypeIdentifier':sys.argv[3],'deviceTypeName':device_type.get('name'),
        'runtimeIdentifier':sys.argv[4],'hostArchitecture':build.get('hostArchitecture'),
        'configuration':build.get('configuration'),'sdk':build.get('sdk'),
        'scope':'Selected environment recorded before boot; no boot, installation, or app-start result.'}
Path(sys.argv[1]).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
PY_ENVIRONMENT
form_timed 120 xcrun simctl boot "$FORM_DEVICE" > "$FORM_ARTIFACTS/simulator-boot-request.log" 2>&1
form_timed 300 xcrun simctl bootstatus "$FORM_DEVICE" -b 2>&1 | tee "$FORM_ARTIFACTS/simulator-boot.log"
FORM_PREDICATE="$(python3 - "$FORM_EXECUTABLE_NAME" "$FORM_BUNDLE" <<'PY'
import json,sys
print('process == '+json.dumps(sys.argv[1])+' OR eventMessage CONTAINS '+json.dumps(sys.argv[2])+' OR process == "ReportCrash"')
PY
)"
FORM_ANY_FAILURE=0
for FORM_SCENARIO in fresh v10-home v10-live; do
  FORM_STAGE="$FORM_SCENARIO"
  echo "PHASE: $FORM_SCENARIO — neue Installation, Launch, Prozess- und Datenprüfung."
  # Each scenario has its own trap; a failed launch does not hide the other cases.
  set +e
  (
    set -euo pipefail
    FORM_CASE_ARTIFACTS="$FORM_SMOKE_ROOT/$FORM_SCENARIO"
    FORM_LOG_PID=''; FORM_APP_PID=''; FORM_EXECUTABLE=''; FORM_DIAGNOSIS=''; FORM_VIDEO_PID=''
    FORM_STARTED="$(date +%s)"
    mkdir -p "$FORM_CASE_ARTIFACTS"
    form_video_finish() {
      if [[ -n "$FORM_VIDEO_PID" ]]; then
        if ! python3 "$FORM_ROOT/scripts/simulator-video.py" finish "$FORM_CASE_ARTIFACTS" "$FORM_VIDEO_PID"; then
          echo 'WARNING: Optionale native Videoevidenz fehlgeschlagen; simulator-video-status.json/log prüfen. App-Prüfungen bleiben unverändert.' >&2
        fi
        if ! kill -0 "$FORM_VIDEO_PID" 2>/dev/null; then wait "$FORM_VIDEO_PID" 2>/dev/null || true; fi
        FORM_VIDEO_PID=''
      fi
    }
    form_scenario_finish() {
      FORM_CASE_EXIT=$?
      trap - EXIT
      set +e
      form_video_finish
      if [[ -n "$FORM_LOG_PID" ]]; then
        kill "$FORM_LOG_PID" 2>/dev/null
        for FORM_LOG_GRACE in 1 2 3; do
          kill -0 "$FORM_LOG_PID" 2>/dev/null || break
          sleep 1
        done
        if kill -0 "$FORM_LOG_PID" 2>/dev/null; then
          kill -KILL "$FORM_LOG_PID" 2>/dev/null
        fi
        # Never block the collector on a stream still awaiting termination.
        if ! kill -0 "$FORM_LOG_PID" 2>/dev/null; then
          wait "$FORM_LOG_PID" 2>/dev/null
        else
          echo 'WARNING: Logstream nach SIGKILL noch aktiv; kein blockierendes wait, Diagnose folgt.' >&2
        fi
      fi
      python3 "$FORM_ROOT/scripts/simulator-smoke-diagnostics.py" collect \
        --artifacts "$FORM_CASE_ARTIFACTS" --device "$FORM_DEVICE" --bundle "$FORM_BUNDLE" \
        --executable "$FORM_EXECUTABLE" --pid "${FORM_APP_PID:-0}" --since "$FORM_STARTED" \
        --seconds "$FORM_WAIT_SECONDS" --stage "$FORM_STAGE" --exit-code "$FORM_CASE_EXIT" --diagnosis "$FORM_DIAGNOSIS"
      FORM_COLLECT_EXIT=$?
      [[ "$FORM_COLLECT_EXIT" -eq 0 ]] || FORM_CASE_EXIT=1
      exit "$FORM_CASE_EXIT"
    }
    trap form_scenario_finish EXIT
    if [[ "$FORM_SCENARIO" != 'fresh' ]]; then
      form_timed 30 xcrun simctl terminate "$FORM_DEVICE" "$FORM_BUNDLE" > "$FORM_CASE_ARTIFACTS/simulator-prior-terminate.log" 2>&1 || true
      form_timed 120 xcrun simctl uninstall "$FORM_DEVICE" "$FORM_BUNDLE" > "$FORM_CASE_ARTIFACTS/simulator-prior-uninstall.log" 2>&1
    fi
    FORM_STAGE='install'
    # The first install also waits for a newly created simulator's cold services.
    # Give that one command more time; never retry a launch or hide a failed case.
    FORM_INSTALL_SECONDS=120
    [[ "$FORM_SCENARIO" != 'fresh' ]] || FORM_INSTALL_SECONDS=360
    echo "INSTALL: $FORM_SCENARIO, einmalig bis zu ${FORM_INSTALL_SECONDS}s."
    set +e
    FORM_TIMED_STATUS_FILE="$FORM_CASE_ARTIFACTS/simulator-install-status.json" \
      FORM_TIMED_OPERATION="$FORM_SCENARIO-install" \
      form_timed "$FORM_INSTALL_SECONDS" xcrun simctl install "$FORM_DEVICE" "$FORM_APP" \
      2>&1 | tee "$FORM_CASE_ARTIFACTS/simulator-install.log"
    FORM_INSTALL_EXIT=$?
    set -e
    if [[ "$FORM_INSTALL_EXIT" -ne 0 ]]; then
      FORM_DIAGNOSIS="Installation für $FORM_SCENARIO fehlgeschlagen (Exit $FORM_INSTALL_EXIT, Zeitbudget ${FORM_INSTALL_SECONDS}s); kein App-Start."
      echo "ERROR: $FORM_DIAGNOSIS" >&2
      exit "$FORM_INSTALL_EXIT"
    fi
    FORM_CONTAINER_SECONDS=30
    [[ "$FORM_SCENARIO" != 'fresh' ]] || FORM_CONTAINER_SECONDS=180
    for FORM_CONTAINER_KIND in app data; do
      FORM_STAGE="$FORM_CONTAINER_KIND-container"
      echo "CONTAINER: $FORM_SCENARIO/$FORM_CONTAINER_KIND, bis zu ${FORM_CONTAINER_SECONDS}s."
      set +e
      FORM_CONTAINER_PATH="$(FORM_TIMED_STATUS_FILE="$FORM_CASE_ARTIFACTS/simulator-$FORM_CONTAINER_KIND-container-status.json" \
        FORM_TIMED_OPERATION="$FORM_SCENARIO-$FORM_CONTAINER_KIND-container" \
        form_timed "$FORM_CONTAINER_SECONDS" xcrun simctl get_app_container "$FORM_DEVICE" "$FORM_BUNDLE" "$FORM_CONTAINER_KIND" \
        2> "$FORM_CASE_ARTIFACTS/simulator-$FORM_CONTAINER_KIND-container.stderr.log")"
      FORM_CONTAINER_EXIT=$?
      set -e
      cat "$FORM_CASE_ARTIFACTS/simulator-$FORM_CONTAINER_KIND-container.stderr.log" >&2
      printf '%s\n' "$FORM_CONTAINER_PATH" > "$FORM_CASE_ARTIFACTS/simulator-$FORM_CONTAINER_KIND-container.stdout.log"
      if [[ "$FORM_CONTAINER_EXIT" -ne 0 ]]; then
        FORM_DIAGNOSIS="Container-Abfrage ($FORM_CONTAINER_KIND) für $FORM_SCENARIO fehlgeschlagen (Exit $FORM_CONTAINER_EXIT, Zeitbudget ${FORM_CONTAINER_SECONDS}s); kein App-Start."
        echo "ERROR: $FORM_DIAGNOSIS" >&2
        exit "$FORM_CONTAINER_EXIT"
      fi
      [[ "$FORM_CONTAINER_PATH" == /* && "$FORM_CONTAINER_PATH" != *$'\n'* && -d "$FORM_CONTAINER_PATH" ]] || form_fail "Ungültiger Pfad aus $FORM_CONTAINER_KIND-container; kein App-Start."
      if [[ "$FORM_CONTAINER_KIND" == 'app' ]]; then FORM_INSTALLED_APP="$FORM_CONTAINER_PATH"; else FORM_DATA="$FORM_CONTAINER_PATH"; fi
    done
    FORM_EXECUTABLE="$FORM_INSTALLED_APP/$FORM_EXECUTABLE_NAME"
    [[ -x "$FORM_EXECUTABLE" ]] || form_fail 'Installierte App hat keine ausführbare Startdatei.'
    FORM_DATABASE="$FORM_DATA/Documents/SQLite/form-v84-clean.db"
    [[ ! -e "$FORM_DATABASE" ]] || form_fail 'Der eigene neue Testcontainer enthält unerwartet bereits eine Datenbank.'
    if [[ "$FORM_SCENARIO" != 'fresh' ]]; then
      FORM_CASE="${FORM_SCENARIO#v10-}"
      mkdir -p "$(dirname "$FORM_DATABASE")"
      cp "$FORM_FIXTURES/$FORM_CASE/form-v84-clean.db" "$FORM_DATABASE"
      cmp -s "$FORM_FIXTURES/$FORM_CASE/form-v84-clean.db" "$FORM_DATABASE" || form_fail 'Fixture-Kopie ist nicht bytegleich.'
    fi
    FORM_STARTED="$(date +%s)"
    xcrun simctl spawn "$FORM_DEVICE" log stream --style compact --level debug --predicate "$FORM_PREDICATE" \
      > "$FORM_CASE_ARTIFACTS/simulator-unified.log" 2> "$FORM_CASE_ARTIFACTS/simulator-unified-stream.stderr.log" &
    FORM_LOG_PID=$!
    if [[ "$FORM_SCENARIO" == 'v10-home' && "$FORM_RECORD_VIDEO" == '1' ]]; then
      python3 "$FORM_ROOT/scripts/simulator-video.py" record "$FORM_DEVICE" "$FORM_CASE_ARTIFACTS" \
        > "$FORM_CASE_ARTIFACTS/simulator-video-helper.log" 2>&1 &
      FORM_VIDEO_PID=$!
      if ! python3 "$FORM_ROOT/scripts/simulator-video.py" ready "$FORM_CASE_ARTIFACTS"; then
        echo 'WARNING: Native Videoaufnahme nicht startbereit; eigene Videodiagnose, keine Änderung der App-Prüfungen.' >&2
        form_video_finish
      fi
    fi
    FORM_STAGE='launch'
    # No debugger or console attachment: observe an ordinary Release start.
    set +e
    form_timed 120 xcrun simctl launch --terminate-running-process \
      --stdout="$FORM_CASE_ARTIFACTS/simulator-app.stdout.log" --stderr="$FORM_CASE_ARTIFACTS/simulator-app.stderr.log" \
      "$FORM_DEVICE" "$FORM_BUNDLE" > "$FORM_CASE_ARTIFACTS/simulator-launch.stdout.log" 2> "$FORM_CASE_ARTIFACTS/simulator-launch.stderr.log"
    FORM_LAUNCH_EXIT=$?
    set -e
    cat "$FORM_CASE_ARTIFACTS/simulator-launch.stdout.log" "$FORM_CASE_ARTIFACTS/simulator-launch.stderr.log" | tee "$FORM_CASE_ARTIFACTS/simulator-launch.log"
    [[ "$FORM_LAUNCH_EXIT" -eq 0 ]] || form_fail "simctl konnte die Release-App nicht starten (Exit $FORM_LAUNCH_EXIT)."
    FORM_APP_PID="$(python3 - "$FORM_CASE_ARTIFACTS/simulator-launch.log" "$FORM_BUNDLE" <<'PY'
import re,sys
from pathlib import Path
matches=re.findall(r'^'+re.escape(sys.argv[2])+r':\s*([1-9][0-9]*)\s*$',Path(sys.argv[1]).read_text(),re.MULTILINE)
if len(set(matches)) != 1:
    raise SystemExit('Keine eindeutige App-PID in simctl launch; ein erfolgreicher Startbefehl genügt nicht.')
print(matches[0])
PY
)"
    FORM_STAGE='observe-process'
    python3 scripts/simulator-smoke-diagnostics.py monitor --artifacts "$FORM_CASE_ARTIFACTS" \
      --device "$FORM_DEVICE" --pid "$FORM_APP_PID" --executable "$FORM_EXECUTABLE" --seconds "$FORM_WAIT_SECONDS"
    form_video_finish
    FORM_STAGE='repository-readback'
    form_timed 30 xcrun simctl terminate "$FORM_DEVICE" "$FORM_BUNDLE" > "$FORM_CASE_ARTIFACTS/simulator-terminate.log" 2>&1
    python3 scripts/simulator-smoke-diagnostics.py database --artifacts "$FORM_CASE_ARTIFACTS" \
      --database "$FORM_DATABASE" --scenario "$FORM_SCENARIO" --fixture-manifest "$FORM_FIXTURES/manifest.json"
    FORM_STAGE='completed'
    echo "PASS: $FORM_SCENARIO — Release-PID über ${FORM_WAIT_SECONDS}s bestätigt, Screenshot erfasst, SQLite-Schema9 und Szenariodaten gelesen."
  )
  FORM_CASE_EXIT=$?
  set -e
  if [[ "$FORM_CASE_EXIT" -ne 0 ]]; then
    FORM_ANY_FAILURE=1
    echo "ERROR: Szenario $FORM_SCENARIO fehlgeschlagen (Exit $FORM_CASE_EXIT); nächste isolierte Testinstallation folgt." >&2
  fi
done
[[ "$FORM_ANY_FAILURE" -eq 0 ]] || form_fail 'Mindestens ein Simulator-Startszenario ist fehlgeschlagen; keine IPA-Freigabe.'
FORM_STAGE='completed'
FORM_VERIFIED='true'
echo 'PASS: Fresh, FORM10-Home und FORM10-Live bestanden den Prozess-/Repository-Startcheck. Alle Screenshots benötigen noch visuelle Prüfung.'
