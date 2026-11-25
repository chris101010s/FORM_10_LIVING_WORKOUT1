#!/usr/bin/env python3
"""Optional native video evidence; independent from every startup acceptance gate."""
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import signal
import struct
import subprocess
import sys
import time

START_LIMIT = 30
RECORD_LIMIT = 240
STOP_LIMIT = 35
STATUS = 'simulator-video-status.json'
STOP = 'simulator-video.stop'
VIDEO = 'FORM_native_home.mp4'
TERMINAL = {'recorded', 'failed'}


def now():
    return datetime.now(timezone.utc).isoformat()


def write_status(folder, value):
    temporary = folder / (STATUS + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(folder / STATUS)


def read_status(folder):
    try:
        return json.loads((folder / STATUS).read_text())
    except (OSError, ValueError):
        return {}


def complete_mp4(file):
    """Container completeness only; visual playback remains a separate review."""
    if not file.is_file():
        return False
    total, atoms = file.stat().st_size, set()
    with file.open('rb') as stream:
        while stream.tell() + 8 <= total:
            start = stream.tell()
            size, kind = struct.unpack('>I4s', stream.read(8))
            header = 8
            if size == 1:
                if stream.tell() + 8 > total:
                    return False
                size = struct.unpack('>Q', stream.read(8))[0]
                header = 16
            elif size == 0:
                size = total - start
            if size < header or start + size > total:
                return False
            if size > header:
                atoms.add(kind)
            stream.seek(start + size)
        return stream.tell() == total and {b'ftyp', b'moov', b'mdat'} <= atoms


def stop_process(process):
    """Flush with SIGINT, then escalate; every wait has a deadline."""
    escalated = False
    for sig, seconds in ((signal.SIGINT, 20), (signal.SIGTERM, 3), (signal.SIGKILL, 3)):
        if process.poll() is not None:
            return process.returncode, escalated
        try:
            os.killpg(process.pid, sig)
        except ProcessLookupError:
            pass
        try:
            return process.wait(timeout=seconds), escalated
        except subprocess.TimeoutExpired:
            escalated = True
    return process.poll(), True


def record(device, folder):
    folder.mkdir(parents=True, exist_ok=True)
    output = folder / VIDEO
    report = {'status': 'starting', 'helperPid': os.getpid(), 'device': device,
              'codec': 'h264', 'file': VIDEO, 'startedAt': now(),
              'startTimeoutSeconds': START_LIMIT, 'maxRecordingSeconds': RECORD_LIMIT,
              'scope': 'Native simulator screen recording only; footage requires visual review. '
                       'No app-start, motion-quality, interaction, or physical-device proof.'}
    stop_requested = False
    def request_stop(_signal, _frame):
        nonlocal stop_requested
        stop_requested = True
    signal.signal(signal.SIGINT, request_stop)
    signal.signal(signal.SIGTERM, request_stop)
    process, ready, reason, escalated = None, False, 'error', False
    started = time.monotonic()
    owner = os.getppid()
    write_status(folder, report)
    try:
        if output.exists() or (folder / STOP).exists():
            raise RuntimeError('Refusing to reuse existing recording output/control file.')
        with (folder / 'simulator-video.log').open('w') as log:
            # Apple WWDC20 /10647 documents recordVideo --codec h264 and Ctrl-C.
            process = subprocess.Popen(['xcrun', 'simctl', 'io', device, 'recordVideo',
                                        '--codec', 'h264', str(output)],
                                       stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
            report['recorderPid'] = process.pid
            write_status(folder, report)
            while True:
                if stop_requested or (folder / STOP).exists():
                    reason = 'stop-request'
                    break
                if os.getppid() != owner:
                    reason = 'owner-exited'
                    break
                if process.poll() is not None:
                    raise RuntimeError('Native recorder exited before requested stop.')
                elapsed = time.monotonic() - started
                if not ready and 'Recording started' in (folder / 'simulator-video.log').read_text(errors='replace'):
                    ready = True
                    report.update(status='recording', readyAt=now())
                    write_status(folder, report)
                if not ready and elapsed >= START_LIMIT:
                    raise RuntimeError('Native recorder did not confirm its first frame within 30s.')
                if elapsed >= RECORD_LIMIT:
                    reason = 'duration-limit'
                    break
                time.sleep(0.2)
    except (OSError, RuntimeError) as error:
        report['diagnosis'] = str(error)
    finally:
        code = None
        if process is not None:
            code, escalated = stop_process(process)
        complete = complete_mp4(output)
        passed = ready and reason == 'stop-request' and not escalated and code in (0, -signal.SIGINT, 130) and complete
        report.update(status='recorded' if passed else 'failed', finishedAt=now(),
                      elapsedSeconds=round(time.monotonic() - started, 3), stopReason=reason,
                      recorderExitCode=code, forcedTermination=escalated,
                      containerComplete=complete, bytes=output.stat().st_size if output.is_file() else 0)
        if not passed and 'diagnosis' not in report:
            report['diagnosis'] = 'Recording was not confirmed, did not finish cleanly, or has an incomplete MP4 container.'
        write_status(folder, report)
        print(json.dumps(report, ensure_ascii=False), flush=True)
    return 0 if passed else 1


def await_ready(folder):
    deadline = time.monotonic() + START_LIMIT + 2
    while time.monotonic() < deadline:
        status = read_status(folder)
        if status.get('status') == 'recording':
            return 0
        if status.get('status') in TERMINAL:
            return 1
        time.sleep(0.2)
    return 1


def finish(folder, helper_pid):
    (folder / STOP).touch()
    deadline = time.monotonic() + STOP_LIMIT
    while time.monotonic() < deadline:
        status = read_status(folder)
        if status.get('status') in TERMINAL:
            return 0 if status['status'] == 'recorded' else 1
        time.sleep(0.2)
    # Last-resort cleanup is confined to this helper and its recorded child group.
    status = read_status(folder)
    if status.get('helperPid') == helper_pid:
        recorder = status.get('recorderPid')
        if isinstance(recorder, int) and recorder > 1:
            try:
                if os.getpgid(recorder) == recorder:
                    os.killpg(recorder, signal.SIGKILL)
            except ProcessLookupError:
                pass
        try:
            os.kill(helper_pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    status.update(status='failed', finishedAt=now(), diagnosis='Video helper exceeded bounded stop deadline; forced cleanup attempted.')
    write_status(folder, status)
    return 1


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else ''
    if action == 'record' and len(sys.argv) == 4:
        return record(sys.argv[2], Path(sys.argv[3]))
    if action == 'ready' and len(sys.argv) == 3:
        return await_ready(Path(sys.argv[2]))
    if action == 'finish' and len(sys.argv) == 4:
        return finish(Path(sys.argv[2]), int(sys.argv[3]))
    print('Usage: simulator-video.py record <device> <directory> | ready <directory> | finish <directory> <helper-pid>', file=sys.stderr)
    return 64


if __name__ == '__main__':
    sys.exit(main())
