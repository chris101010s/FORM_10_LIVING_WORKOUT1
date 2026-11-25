#!/usr/bin/env python3
"""Bounded, real-process evidence for simulator-smoke.sh; never simulates a pass."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import sys
import time


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def capture(command, output, timeout=15):
    with output.open('w') as stream:
        try:
            return subprocess.run(command, stdout=stream, stderr=subprocess.STDOUT,
                                  timeout=timeout, check=False).returncode
        except (OSError, subprocess.TimeoutExpired) as error:
            stream.write('\nDiagnostic command failed: ' + str(error) + '\n')
            return -1


def observe(pid, executable):
    result = subprocess.run(['/bin/ps', '-ww', '-p', str(pid), '-o', 'pid=',
                             '-o', 'state=', '-o', 'comm='],
                            capture_output=True, text=True, timeout=5, check=False)
    fields = result.stdout.strip().split(None, 2)
    observation = {'at': utc_now(), 'requestedPid': pid, 'psExitCode': result.returncode,
                   'ps': result.stdout.strip(), 'error': result.stderr.strip()}
    if result.returncode or len(fields) != 3:
        raise RuntimeError(f'Gestarteter App-Prozess PID {pid} ist beendet oder nicht mehr beobachtbar. {observation}')
    actual_pid, state, command = fields
    if int(actual_pid) != pid or 'Z' in state or 'X' in state:
        raise RuntimeError(f'App-PID {pid} ist nicht lebendig: {observation}')
    if os.path.realpath(command) != os.path.realpath(executable):
        raise RuntimeError(f'PID {pid} gehört nicht mehr zur installierten App: {observation}')
    return observation


def monitor(args):
    artifacts = Path(args.artifacts)
    evidence = {'status': 'observing', 'pid': args.pid, 'executable': args.executable,
                'requestedSeconds': args.seconds, 'startedAt': utc_now(), 'observations': []}
    status_file = artifacts / 'simulator-process-status.json'
    started = time.monotonic()
    try:
        while True:
            observation = observe(args.pid, args.executable)
            evidence['observations'].append(observation)
            write_json(status_file, evidence)
            remaining = args.seconds - (time.monotonic() - started)
            if remaining <= 0:
                break
            time.sleep(min(1, remaining))
        screenshot = artifacts / 'FORM_15_0_0_release-start-smoke.png'
        result = capture(['xcrun', 'simctl', 'io', args.device, 'screenshot', str(screenshot)],
                         artifacts / 'simulator-screenshot.log')
        if result or not screenshot.is_file() or not screenshot.stat().st_size:
            raise RuntimeError('Simulator-Screenshot fehlgeschlagen; simulator-screenshot.log prüfen.')
        # A crash while taking the screenshot must not become a passing smoke test.
        evidence['observations'].append(observe(args.pid, args.executable))
        evidence.update(status='process-survived-startup-window', finishedAt=utc_now(),
                        observedSeconds=round(time.monotonic() - started, 3), screenshot=screenshot.name)
    except (OSError, ValueError, RuntimeError, subprocess.TimeoutExpired) as error:
        evidence.update(status='failed', finishedAt=utc_now(),
                        observedSeconds=round(time.monotonic() - started, 3), diagnosis=str(error))
        write_json(status_file, evidence)
        print('ERROR: ' + str(error), file=sys.stderr)
        return 1
    write_json(status_file, evidence)
    return 0


def collect(args):
    artifacts = Path(args.artifacts)
    diagnostics = {}
    executable_name = Path(args.executable).name if args.executable else ''
    predicate = ('process == ' + json.dumps(executable_name) + ' OR eventMessage CONTAINS '
                 + json.dumps(args.bundle) + ' OR process == "ReportCrash"')
    if args.device:
        diagnostics['unifiedLogSnapshotExitCode'] = capture(
            ['xcrun', 'simctl', 'spawn', args.device, 'log', 'show', '--style', 'compact',
             '--last', '5m', '--info', '--debug', '--predicate', predicate],
            artifacts / 'simulator-unified-snapshot.log')
        diagnostics['launchServicesExitCode'] = capture(
            ['xcrun', 'simctl', 'spawn', args.device, 'launchctl', 'list'],
            artifacts / 'simulator-launch-services.log', timeout=10)
        if args.exit_code:
            diagnostics['failureScreenshotExitCode'] = capture(
                ['xcrun', 'simctl', 'io', args.device, 'screenshot',
                 str(artifacts / 'FORM_15_0_0_release-start-failure.png')],
                artifacts / 'simulator-failure-screenshot.log', timeout=10)
    # Crash reports can arrive after the process has already disappeared.
    if args.exit_code and args.pid:
        time.sleep(2)
    report_dir = artifacts / 'simulator-crashes'
    if report_dir.exists():
        shutil.rmtree(report_dir)
    report_dir.mkdir()
    roots = [Path.home() / 'Library/Logs/DiagnosticReports']
    if args.device:
        device = Path.home() / 'Library/Developer/CoreSimulator/Devices' / args.device / 'data'
        roots += [device / 'Library/Logs/CrashReporter', device / 'Library/Logs/DiagnosticReports']
    reports, errors = [], []
    with (artifacts / 'simulator-crash-reports.log').open('w') as combined:
        for index, root in enumerate(roots):
            if not root.is_dir():
                continue
            for source in root.rglob('*'):
                try:
                    if source.suffix not in ('.ips', '.crash', '.diag') or not source.is_file():
                        continue
                    if source.stat().st_mtime < args.since - 2:
                        continue
                    # Only this app's recent reports; preserve their original bytes.
                    raw = source.read_bytes()
                    if not ((executable_name and source.name.startswith(executable_name + '_'))
                            or args.bundle.encode() in raw):
                        continue
                    destination = report_dir / (str(index) + '-' + source.name)
                    destination.write_bytes(raw)
                    reports.append({'file': str(destination.relative_to(artifacts)), 'bytes': len(raw)})
                    combined.write('\n--- ' + destination.name + ' ---\n')
                    combined.write(raw.decode('utf8', errors='replace'))
                    combined.write('\n')
                except OSError as error:
                    errors.append(str(error))
        if not reports:
            combined.write('No matching recent app crash report found. This alone is not proof of a successful launch.\n')
        for error in errors:
            combined.write('Collection error: ' + error + '\n')
    process_file = artifacts / 'simulator-process-status.json'
    process = json.loads(process_file.read_text()) if process_file.exists() else None
    database_file = artifacts / 'simulator-database-status.json'
    database_status = json.loads(database_file.read_text()) if database_file.exists() else None
    passed = (args.exit_code == 0 and process and process.get('status') == 'process-survived-startup-window'
              and database_status and database_status.get('status') == 'verified')
    status = {'status': 'startup-and-repository-verified' if passed else 'failed',
              'configuration': 'Release', 'bundleIdentifier': args.bundle,
              'device': args.device or None, 'pid': args.pid or None, 'stage': args.stage,
              'exitCode': args.exit_code, 'at': utc_now(), 'requestedSeconds': args.seconds,
              'diagnosis': args.diagnosis or (process or {}).get('diagnosis') or (database_status or {}).get('diagnosis'),
              'observedSeconds': (process or {}).get('observedSeconds'),
              'diagnostics': diagnostics, 'repository': database_status, 'crashReports': reports, 'crashCollectionErrors': errors,
              'scope': 'Release simulator process identity/liveness during a bounded startup window and screenshot. '
                       'Read-only schema9 and synthetic legacy IDs/counts/drafts are checked separately. Screenshot needs visual review; no UI-readiness, personal-data migration, HealthKit, '
                       'physical iPhone, signing, or complete workout-flow proof.'}
    write_json(artifacts / 'simulator-status.json', status)
    print(json.dumps(status, ensure_ascii=False))
    return 0 if args.exit_code or passed else 1


def database(args):
    output = Path(args.artifacts) / 'simulator-database-status.json'
    evidence = {'status': 'checking', 'scenario': args.scenario, 'at': utc_now(), 'readOnly': True}
    try:
        file = Path(args.database)
        if not file.is_file():
            raise RuntimeError('App hat keine FORM-Datenbank erzeugt; lebende PID reicht nicht für einen Repository-Start.')
        with sqlite3.connect(file.resolve().as_uri() + '?mode=ro', uri=True) as connection:
            integrity = [row[0] for row in connection.execute('PRAGMA integrity_check')]
            if integrity != ['ok'] or list(connection.execute('PRAGMA foreign_key_check')):
                raise RuntimeError('SQLite-Integrität oder Fremdschlüsselprüfung fehlgeschlagen.')
            version = connection.execute('SELECT version FROM form_meta WHERE id=1').fetchone()
            if version != (9,):
                raise RuntimeError('Repository nicht bis Schema9 gestartet/migriert: ' + repr(version))
            evidence['databaseSchema'] = 9
            if args.scenario != 'fresh':
                manifest = json.loads(Path(args.fixture_manifest).read_text())
                fixture = next(case for case in manifest['cases'] if case['name'] == args.scenario.removeprefix('v10-'))
                expected = fixture['expectedAfterMigration']
                workout_ids = [row[0] for row in connection.execute("SELECT id FROM form_session WHERE scope='history' ORDER BY ordinal")]
                weight_ids = [row[0] for row in connection.execute("SELECT id FROM form_entity WHERE collection='weights' ORDER BY ordinal")]
                live = list(connection.execute("SELECT id,payload FROM form_session WHERE scope='live'"))
                live_ids = [row[0] for row in live]
                if workout_ids != expected['workoutIds'] or weight_ids != expected['weightIds'] or live_ids != ([expected['liveId']] if expected['liveId'] else []):
                    raise RuntimeError('Alte Workout-/Gewicht-/Live-IDs wurden beim Start verändert.')
                counts = {'workouts':len(workout_ids),'weights':len(weight_ids),'liveSessions':len(live),
                          'historySets':connection.execute("SELECT count(*) FROM form_set WHERE scope='history'").fetchone()[0],
                          'liveSets':connection.execute("SELECT count(*) FROM form_set WHERE scope='live'").fetchone()[0]}
                if counts != fixture['counts']:
                    raise RuntimeError('Historien-/Gewichts-/Satzanzahlen wurden beim Start verändert.')
                if live:
                    payload = json.loads(live[0][1])
                    if payload.get('name') != expected['liveName'] or payload.get('drafts') != expected['liveDrafts']:
                        raise RuntimeError('Legacy-Live-Name oder offene Eingaben wurden verändert.')
                evidence.update(counts=counts, workoutIds=workout_ids, weightIds=weight_ids, liveIds=live_ids)
        evidence.update(status='verified', finishedAt=utc_now())
    except (OSError, ValueError, RuntimeError, sqlite3.Error, StopIteration) as error:
        evidence.update(status='failed', diagnosis=str(error), finishedAt=utc_now())
        write_json(output, evidence)
        print('ERROR: ' + str(error), file=sys.stderr)
        return 1
    write_json(output, evidence)
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('monitor', 'collect', 'database'))
    parser.add_argument('--artifacts', required=True)
    parser.add_argument('--device', default='')
    parser.add_argument('--pid', type=int, default=0)
    parser.add_argument('--executable', default='')
    parser.add_argument('--seconds', type=int, default=20)
    parser.add_argument('--bundle', default='app.athleteos.personal')
    parser.add_argument('--since', type=float, default=0)
    parser.add_argument('--stage', default='unknown')
    parser.add_argument('--exit-code', type=int, default=1)
    parser.add_argument('--diagnosis', default='')
    parser.add_argument('--database')
    parser.add_argument('--scenario', choices=('fresh', 'v10-home', 'v10-live'))
    parser.add_argument('--fixture-manifest')
    args = parser.parse_args()
    if args.action == 'database':
        return database(args)
    return monitor(args) if args.action == 'monitor' else collect(args)


if __name__ == '__main__':
    sys.exit(main())
