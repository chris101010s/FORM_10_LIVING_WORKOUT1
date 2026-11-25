#!/usr/bin/env python3
"""Select an available standard iPhone/runtime pair for the Release smoke test."""
import json
from pathlib import Path
import re
import sys

GENERAL_IOS = re.compile(r'^com\.apple\.CoreSimulator\.SimRuntime\.iOS-(\d+(?:-\d+)*)$')
NUMBERED_IPHONE = re.compile(r'^iPhone\s+(\d+)(?:[a-z])?(?:\s|$)')
SPECIAL_IPHONE = re.compile(r'\b(?:Duo|Air)\b', re.IGNORECASE)


def select_pair(devices_data, types_data):
    types = types_data['devicetypes']
    by_id = {item['identifier']: item for item in types}
    candidates = []
    for runtime, devices in devices_data['devices'].items():
        match = GENERAL_IOS.fullmatch(runtime)
        if not match:
            # A device-specific runtime such as iOS-27-2-iPhone19-4 is not
            # evidence that a general iOS 27.2 runtime is available.
            continue
        version = tuple(int(part) for part in match[1].split('-'))
        version += (0,) * max(0, 3 - len(version))
        for device in devices:
            if device.get('isAvailable') is not True:
                continue
            type_id = device.get('deviceTypeIdentifier')
            if type_id is None:
                matches = [item for item in types if item['name'] == device.get('name')]
                type_id = matches[0]['identifier'] if len(matches) == 1 else None
            device_type = by_id.get(type_id)
            if not device_type:
                continue
            name = device_type['name']
            numbered = NUMBERED_IPHONE.match(name)
            if not numbered or SPECIAL_IPHONE.search(name):
                continue
            generation = int(numbered[1])
            # Newest general OS first, then newest numbered model; for the same
            # generation prefer the base model. Never invent a type/runtime pair.
            key = (version, generation, name == 'iPhone ' + str(generation), name, type_id)
            candidates.append((key, type_id, runtime))
    if not candidates:
        raise ValueError('Kein verfügbares nummeriertes Standard-iPhone mit allgemeiner iOS-Runtime gefunden; Duo/Air-Sonderumgebungen werden nicht als Standardtest verwendet.')
    _, type_id, runtime = max(candidates, key=lambda item: item[0])
    return type_id, runtime


def main():
    if len(sys.argv) != 3:
        print('Usage: python3 scripts/select-ios-simulator.py <devices.json> <device-types.json>', file=sys.stderr)
        return 64
    try:
        pair = select_pair(json.loads(Path(sys.argv[1]).read_text()),
                           json.loads(Path(sys.argv[2]).read_text()))
    except (OSError, ValueError, KeyError, TypeError) as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        return 1
    print(*pair)
    return 0


if __name__ == '__main__':
    sys.exit(main())
