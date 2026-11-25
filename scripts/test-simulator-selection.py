#!/usr/bin/env python3
"""Controlled selection regression; does not claim any simulator/app execution."""
import copy
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest

sys.dont_write_bytecode = True
HELPER = Path(__file__).with_name('select-ios-simulator.py')
spec = importlib.util.spec_from_file_location('simulator_selection', HELPER)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
select_pair = module.select_pair
RUNTIME = 'com.apple.CoreSimulator.SimRuntime.iOS-'
TYPE = 'com.apple.CoreSimulator.SimDeviceType.'


def device(name, available=True):
    return {'name': name, 'deviceTypeIdentifier': TYPE + name.replace(' ', '-'), 'isAvailable': available}


def fixture():
    names = ['iPhone Duo', 'iPhone Air', 'iPhone 17', 'iPhone 17 Pro', 'iPhone 16', 'iPhone 16e']
    types = {'devicetypes': [{'name': name, 'identifier': TYPE + name.replace(' ', '-')} for name in names]}
    devices = {'devices': {
        RUNTIME + '27-2-iPhone19-4': [device('iPhone Duo')],
        RUNTIME + '27-1': [device('iPhone 17 Pro'), device('iPhone Air'), device('iPhone 17')],
        RUNTIME + '26-5': [device('iPhone 16')],
    }}
    return devices, types


class SelectionRegression(unittest.TestCase):
    def test_old_sort_reproduces_run8_duo_selection(self):
        devices, _ = fixture()
        items = [(runtime, value) for runtime, group in devices['devices'].items() for value in group
                 if 'iOS' in runtime and value.get('isAvailable') and value['name'].startswith('iPhone')]
        items.sort(key=lambda item: (tuple(int(n) for n in re.findall(r'\d+', item[0])),
                                     'SE' not in item[1]['name'], item[1]['name']), reverse=True)
        self.assertEqual(items[0][0], RUNTIME + '27-2-iPhone19-4')
        self.assertEqual(items[0][1]['name'], 'iPhone Duo')

    def test_standard_pair_beats_newer_device_specific_runtime(self):
        self.assertEqual(select_pair(*fixture()), (TYPE + 'iPhone-17', RUNTIME + '27-1'))

    def test_general_os_version_sorted_numerically(self):
        devices, types = fixture()
        devices['devices'][RUNTIME + '27-9'] = [device('iPhone 17')]
        devices['devices'][RUNTIME + '27-10'] = [device('iPhone 16')]
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-16', RUNTIME + '27-10'))

    def test_newest_general_runtime_keeps_its_actual_available_type(self):
        devices, types = fixture()
        devices['devices'][RUNTIME + '27-2'] = [device('iPhone 16')]
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-16', RUNTIME + '27-2'))

    def test_unavailable_newer_pair_is_not_selected(self):
        devices, types = fixture()
        devices['devices'][RUNTIME + '28-0'] = [device('iPhone 17', False)]
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-17', RUNTIME + '27-1'))

    def test_air_on_general_runtime_does_not_replace_numbered_iphone(self):
        devices, types = fixture()
        devices['devices'][RUNTIME + '28-0'] = [device('iPhone Air')]
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-17', RUNTIME + '27-1'))

    def test_canonical_type_controls_selection_not_renamed_device(self):
        devices, types = fixture()
        devices['devices'][RUNTIME + '28-0'] = [{**device('iPhone Duo'), 'name': 'iPhone 99'}]
        devices['devices'][RUNTIME + '27-1'][2]['name'] = 'My CI phone'
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-17', RUNTIME + '27-1'))

    def test_missing_identifier_uses_unique_existing_type_name(self):
        devices, types = fixture()
        del devices['devices'][RUNTIME + '27-1'][2]['deviceTypeIdentifier']
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-17', RUNTIME + '27-1'))

    def test_unknown_identifier_is_not_guessed_from_label(self):
        devices, types = fixture()
        devices['devices'][RUNTIME + '28-0'] = [{**device('iPhone 17'), 'deviceTypeIdentifier': 'missing-type'}]
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-17', RUNTIME + '27-1'))

    def test_numbered_e_model_is_a_standard_candidate(self):
        devices, types = fixture()
        devices['devices'] = {RUNTIME + '27-1': [device('iPhone 16e')]}
        self.assertEqual(select_pair(devices, types), (TYPE + 'iPhone-16e', RUNTIME + '27-1'))

    def test_only_special_runtime_fails_instead_of_inventing_standard_pair(self):
        devices, types = fixture()
        devices['devices'] = {RUNTIME + '27-2-iPhone19-4': [device('iPhone Duo'), device('iPhone 17')]}
        with self.assertRaisesRegex(ValueError, 'Standard-iPhone'):
            select_pair(devices, types)

    def test_inputs_unchanged(self):
        inputs = fixture()
        before = copy.deepcopy(inputs)
        select_pair(*inputs)
        self.assertEqual(inputs, before)

    def test_cli_emits_only_existing_pair_and_fails_when_none_available(self):
        devices, types = fixture()
        with tempfile.TemporaryDirectory(prefix='form-simulator-selection-') as temporary:
            root = Path(temporary)
            device_file, type_file = root / 'devices.json', root / 'types.json'
            device_file.write_text(json.dumps(devices))
            type_file.write_text(json.dumps(types))
            command = [sys.executable, str(HELPER), str(device_file), str(type_file)]
            result = subprocess.run(command, capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(result.stdout.strip(), TYPE + 'iPhone-17 ' + RUNTIME + '27-1')
            device_file.write_text(json.dumps({'devices': {}}))
            result = subprocess.run(command, capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 1)
            self.assertEqual(result.stdout, '')
            self.assertIn('Standard-iPhone', result.stderr)


if __name__ == '__main__':
    unittest.main(verbosity=2)
