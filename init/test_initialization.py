"""Isolated initialization protocol tests; fixture probes are not host evidence."""
import contextlib
import copy
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

import admin
import check

HERE = Path(__file__).resolve().parent


class InitializationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        (self.root/'init/adapters').mkdir(parents=True)
        (self.root/'governance/skills').mkdir(parents=True)
        for name in ('update.json', 'harness-list.json'):
            shutil.copy2(HERE/name, self.root/'init'/name)
        for name in ('ensure-skills.py', 'required-skills.json'):
            shutil.copy2(HERE.parent/'governance/skills'/name, self.root/'governance/skills'/name)
        (self.root/'.gitignore').write_text('init/result.json\ninit/local-profile.json\n')
        self.skills = self.root/'fixture-skills'
        for name in ('humanizer-zh', 'no-negative-echo'):
            path = self.skills/name
            path.mkdir(parents=True)
            (path/'SKILL.md').write_text('---\nname: '+name+'\n---\nFixture skill instruction\n')
        self.env = patch.dict(os.environ, {'AGENT_SKILLS_DIR': str(self.skills)})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.identity = patch.object(check, 'machine_id', return_value='machine-A')
        self.identity.start()
        self.addCleanup(self.identity.stop)
        self.git('init', '-q')
        # This is an isolated component fixture, never installed or recorded as
        # a real Harness. Production profiles must use actual host observations.
        adapter = self.root/'init/adapters/fixture.py'
        adapter.write_text('import json,sys\nprint(json.dumps({"case":sys.argv[1],"observed":True}))\n')
        self.profile = {'version': '1.0.0', 'harnesses': [{
            'id': 'codex', 'strategy': 'adapted', 'environment_assessment': 'isolated component fixture',
            'adapters': ['init/adapters/fixture.py'],
            'checks': [{'kind': kind, 'argv': [sys.executable, 'init/adapters/fixture.py', kind],
                        'expect_json': {'case': kind, 'observed': True}}
                       for kind in check.manifest(self.root)['required_checks']]}]}

    def git(self, *args):
        return subprocess.run(['git', '-c', 'core.hooksPath=', *args], cwd=self.root,
                              capture_output=True, text=True, encoding='utf-8', errors='replace',
                              timeout=5, check=True)

    def complete(self, profile=None):
        path = self.root/'init/local-profile.json'
        admin.save(path, profile or self.profile)
        with contextlib.redirect_stdout(io.StringIO()):
            return admin.complete(self.root, path)

    def test_fresh_machine_check_is_read_only_and_not_initialized(self):
        self.assertEqual(check.status(self.root, 'codex')['status'], 'NOT_INITIALIZED')
        self.assertFalse((self.root/'init/result.json').exists())
        self.assertFalse(check.state_file(self.root).exists())

    def test_cli_requires_actual_harness_and_reports_read_only_result(self):
        for args, expected in [([], 2), (['--harness', 'codex'], 2)]:
            run = subprocess.run([sys.executable, '-X', 'utf8', str(HERE/'check.py'), '--root', str(self.root), *args],
                                 capture_output=True, timeout=5)
            self.assertEqual(run.returncode, expected)
            if args:
                self.assertEqual(json.loads(run.stdout)['status'], 'NOT_INITIALIZED')
        self.assertFalse((self.root/'init/result.json').exists())

    def test_real_profile_probes_then_successful_result_and_pointer(self):
        result = self.complete()
        self.assertEqual(result['status'], 'READY')
        state = check.load(check.state_file(self.root))
        self.assertEqual(state['version'], '1.0.0')
        self.assertTrue(state['initialized'])
        self.assertTrue(state['harnesses']['codex']['specialized'])
        self.assertFalse(state['harnesses']['codex']['demo_direct_use'])
        self.assertEqual(len(state['harnesses']['codex']['checks']), 5)
        pointer = check.load(self.root/'init/result.json')
        self.assertEqual(Path(pointer['result_file']), check.state_file(self.root))
        self.assertIn('humanizer-zh', result['skills'])

    def test_update_version_mismatch_requires_administrator(self):
        self.complete()
        update = check.manifest(self.root)
        update['version'] = '1.1.0'
        admin.save(self.root/'init/update.json', update)
        result = check.status(self.root, 'codex')
        self.assertEqual(result['status'], 'UPDATE_REQUIRED')
        self.assertEqual((result['version'], result['required_version']), ('1.0.0', '1.1.0'))

    def test_result_ahead_of_checkout_is_also_mismatch(self):
        self.complete()
        path = check.state_file(self.root)
        state = check.load(path)
        state['version'] = '2.0.0'
        admin.save(path, state)
        self.assertEqual(check.status(self.root)['status'], 'UPDATE_REQUIRED')

    def test_other_machine_cannot_inherit_copied_pointer(self):
        self.complete()
        self.assertEqual(check.status(self.root, identity='machine-B')['status'], 'NOT_INITIALIZED')

    def test_other_harness_not_covered_by_codex_result(self):
        self.complete()
        self.assertEqual(check.status(self.root, 'zcode')['status'], 'HARNESS_NOT_INITIALIZED')

    def test_missing_adapter_or_skill_invalidates_readiness(self):
        self.complete()
        path = self.root/'init/adapters/fixture.py'
        original = path.read_text()
        path.unlink()
        self.assertEqual(check.status(self.root)['status'], 'INVALID_RESULT')
        path.write_text(original)
        state_path = check.state_file(self.root)
        state = check.load(state_path)
        state['skill_roots'] = [str(self.skills)]
        admin.save(state_path, state)
        (self.skills/'humanizer-zh/SKILL.md').unlink()
        self.assertEqual(check.status(self.root)['status'], 'INVALID_RESULT')

    def test_bad_result_json_and_pointer_are_not_ready(self):
        self.complete()
        pointer = check.load(self.root/'init/result.json')
        pointer['result_file'] = str(self.root/'unrelated-private-file')
        admin.save(self.root/'init/result.json', pointer)
        self.assertEqual(check.status(self.root)['status'], 'INVALID_RESULT')

    def test_failed_probe_does_not_write_success(self):
        broken = copy.deepcopy(self.profile)
        broken['harnesses'][0]['checks'][-1]['expect_json'] = {'observed': False}
        with self.assertRaisesRegex(ValueError, 'dispatch'):
            self.complete(broken)
        self.assertFalse(check.state_file(self.root).exists())

    def test_failed_update_keeps_old_result_version(self):
        self.complete()
        update = check.manifest(self.root)
        update['version'] = '1.1.0'
        admin.save(self.root/'init/update.json', update)
        broken = copy.deepcopy(self.profile)
        broken['version'] = '1.1.0'
        broken['harnesses'][0]['checks'][0]['expect_json'] = {'observed': False}
        with self.assertRaises(ValueError):
            self.complete(broken)
        self.assertEqual(check.status(self.root)['status'], 'UPDATE_REQUIRED')
        self.assertEqual(check.load(check.state_file(self.root))['version'], '1.0.0')

    def test_missing_dispatch_and_unregistered_harness_rejected(self):
        broken = copy.deepcopy(self.profile)
        broken['harnesses'][0]['checks'] = broken['harnesses'][0]['checks'][:-1]
        with self.assertRaisesRegex(ValueError, 'dispatch'):
            self.complete(broken)
        broken = copy.deepcopy(self.profile)
        broken['harnesses'][0]['id'] = 'custom'
        with self.assertRaisesRegex(ValueError, 'concrete Harness'):
            self.complete(broken)

    def test_template_paths_do_not_count_as_installed(self):
        profile = check.load(HERE/'local-profile.example.json')
        with self.assertRaisesRegex(ValueError, 'missing'):
            self.complete(profile)

    def test_no_inline_shell_or_business_command_probes(self):
        for argv in ([sys.executable, '-c', 'pass', 'init/adapters/fixture.py'],
                     ['cmd', '/c', 'init/adapters/fixture.py'], ['npm', 'test']):
            with self.assertRaises(ValueError):
                admin.probe(argv, self.root)

    def test_json_expectations_are_type_safe(self):
        self.assertFalse(admin.matches({'ok': 1}, {'ok': True}))
        self.assertTrue(admin.matches({'ok': True, 'extra': 'metadata'}, {'ok': True}))

    def test_pointer_failure_cannot_publish_success(self):
        original = admin.save
        def fail_pointer(path, value):
            if path.name == 'result.json':
                raise OSError('fixture write denied')
            original(path, value)
        with patch.object(admin, 'save', side_effect=fail_pointer):
            with self.assertRaises(OSError):
                self.complete()
        self.assertFalse(check.state_file(self.root).exists())

    def test_final_readback_failure_does_not_leave_initialized_true(self):
        with patch.object(check, 'status', return_value={'status': 'INVALID_RESULT'}):
            with self.assertRaisesRegex(ValueError, 'readback'):
                self.complete()
        self.assertFalse(check.load(check.state_file(self.root))['initialized'])

    def test_version_change_guard_reads_staged_version(self):
        self.git('add', 'init/update.json', '.gitignore')
        self.git('-c', 'user.name=Init Fixture', '-c', 'user.email=init@example.invalid', 'commit', '-qm', 'base')
        (self.root/'init/feature.py').write_text('# global feature\n')
        self.git('add', 'init/feature.py')
        self.assertFalse(admin.version_change(self.root))
        update = check.manifest(self.root)
        update['version'] = '1.1.0'
        admin.save(self.root/'init/update.json', update)
        self.assertFalse(admin.version_change(self.root))
        self.git('add', 'init/update.json')
        self.assertTrue(admin.version_change(self.root))

    def test_initial_version_introduction_handles_utf8_manifest_and_localized_git_error(self):
        update = check.manifest(self.root)
        update['summary'] = '中文全局初始化说明'
        admin.save(self.root/'init/update.json', update)
        self.git('add', 'init/update.json')
        self.assertTrue(admin.version_change(self.root))

    def test_invalid_staged_version_cannot_use_valid_worktree_manifest(self):
        valid = check.manifest(self.root)
        invalid = dict(valid, version='not-a-version')
        admin.save(self.root/'init/update.json', invalid)
        self.git('add', 'init/update.json')
        admin.save(self.root/'init/update.json', valid)
        self.assertFalse(admin.version_change(self.root))

    def test_bump_keeps_local_result_unchanged(self):
        self.complete()
        with patch.object(sys, 'argv', ['admin.py', '--root', str(self.root), '--role', 'admin',
                                      'bump', '--part', 'minor', '--summary', 'new shared capability']):
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(admin.main(), 0)
        self.assertEqual(check.manifest(self.root)['version'], '1.1.0')
        self.assertEqual(check.load(check.state_file(self.root))['version'], '1.0.0')

    def test_administrator_write_role_is_required(self):
        with patch.object(sys, 'argv', ['admin.py', '--root', str(self.root), 'begin']):
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(admin.main(), 1)
        self.assertFalse(check.state_file(self.root).exists())

    def test_detection_unknown_does_not_claim_not_installed(self):
        with patch.object(shutil, 'which', return_value=None):
            rows = admin.discover(self.root)
        self.assertTrue(all(r['detection'] == 'not_on_path_or_unknown' for r in rows))

    def test_linked_worktree_shares_machine_result(self):
        self.complete()
        self.git('add', 'init/update.json', 'init/harness-list.json', 'governance', '.gitignore')
        self.git('-c', 'user.name=Init Fixture', '-c', 'user.email=init@example.invalid', 'commit', '-qm', 'fixture')
        linked = self.root/'linked'
        self.git('worktree', 'add', '--detach', '-q', str(linked))
        self.assertFalse((linked/'init/result.json').exists())
        self.assertEqual(check.state_file(linked), check.state_file(self.root))
        self.assertEqual(check.status(linked, 'codex')['status'], 'READY')

    def test_local_result_is_ignored(self):
        self.complete()
        ignored = self.git('check-ignore', 'init/result.json', 'init/local-profile.json').stdout
        self.assertIn('init/result.json', ignored)
        self.assertIn('init/local-profile.json', ignored)


if __name__ == '__main__':
    unittest.main(verbosity=2)
