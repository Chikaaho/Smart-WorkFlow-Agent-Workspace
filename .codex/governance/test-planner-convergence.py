#!/usr/bin/env python3
"""Finite governance regressions; never start application services or tests."""
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import shutil
from datetime import datetime, timezone

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('convergence', HERE / 'planner-convergence.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
role_spec = importlib.util.spec_from_file_location('roles', HERE / 'codex-session-role.py')
roles = importlib.util.module_from_spec(role_spec)
role_spec.loader.exec_module(roles)


class ConvergenceTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name).resolve()
        self.receipts = self.root / 'product/demo/receipts'
        self.receipts.mkdir(parents=True)
        (self.receipts / 'executor.md').write_text('runtime sidebar width=240px', encoding='utf-8')
        self.document = {
            'schema': gate.SCHEMA, 'feature': 'demo', 'revision': 1,
            'previous_revision': 0, 'decision': 'CONTINUE',
            'source_receipt': 'product/demo/receipts/executor.md',
            'items': [{'origin_id': 'A03-sidebar', 'subject': '/catalog sidebar',
                       'criterion': 'width236px tolerance1px', 'status': 'REWORK', 'failed_rounds': 1,
                       'evidence': ['product/demo/receipts/executor.md'],
                       'diagnosis': {'location': '/catalog left sidebar', 'observed': 'width240px',
                                     'expected': 'width236px', 'cause': 'expanded width still uses old token',
                                     'next_action': 'set expanded sidebar width to236px; keep row geometry'},
                       'scope': {'targets': ['sidebar', 'sidebar footer'],
                                 'allowed_actions': ['adjust width', 'adjust footer'],
                                 'forbidden_actions': ['change records'],
                                 'constraints': {'expanded_width': '236px'}},
                       'acceptance': ['runtime expanded width236px and collapsed navigation usable']}]}

    def tearDown(self):
        self.temporary.cleanup()

    def validate(self, doc=None, old=None):
        gate.validate(doc or self.document, old, self.root, 'demo')

    def retry(self):
        doc = copy.deepcopy(self.document)
        doc.update(revision=2, previous_revision=1)
        item = doc['items'][0]
        item['failed_rounds'] = 2
        item['planner_self_audit'] = 'Verified original frame, correct consumer and old result; footer not implicated'
        item['scope']['targets'] = ['sidebar']
        return doc

    def rejected(self, doc, reason, old=None):
        with self.assertRaisesRegex(gate.Rejected, reason):
            self.validate(doc, old)

    def test_initial_concrete_dispatch(self):
        self.validate()

    def test_third_and_later_rounds_allowed_when_tightened(self):
        old = self.retry()
        doc = copy.deepcopy(old)
        doc.update(revision=3, previous_revision=2)
        doc['items'][0]['failed_rounds'] = 3
        doc['items'][0]['scope']['allowed_actions'] = ['adjust width']
        self.validate(doc, old)

    def test_generic_rejection_or_missing_diagnosis_rejected(self):
        for value in (None, {}, {'location': '继续修复'}):
            doc = copy.deepcopy(self.document)
            doc['items'][0]['diagnosis'] = value
            self.rejected(doc, '不能只写不通过|缺具体')

    def test_wording_only_retry_rejected(self):
        doc = self.retry()
        doc['items'][0]['scope'] = copy.deepcopy(self.document['items'][0]['scope'])
        doc['items'][0]['diagnosis']['cause'] += ' (rewritten prose)'
        self.rejected(doc, '未实际收紧', self.document)

    def test_planner_action_bridge_cannot_reset_scope(self):
        bridge = copy.deepcopy(self.document)
        bridge.update(revision=2, previous_revision=1)
        bridge['items'][0].update(status='PLANNER_ACTION', next_action='核对原参考中侧栏宽度属性')
        self.validate(bridge, self.document)
        doc = copy.deepcopy(self.document)
        doc.update(revision=3, previous_revision=2)
        self.rejected(doc, '未实际收紧', bridge)
        del bridge['items'][0]['scope']
        self.rejected(bridge, '保留最后收口范围', self.document)

    def test_planner_action_rejects_vague_tail_and_requires_bounded_completion(self):
        doc = copy.deepcopy(self.document)
        item = doc['items'][0]
        item.update(status='PLANNER_ACTION', failed_rounds=0,
                    subject='其他控件状态、1366、帮助和联合链',
                    criterion='完成其余未覆盖范围',
                    next_action='由规划处理')
        item.pop('diagnosis')
        item['scope']['targets'] = ['其他控件状态', '1366', '帮助和联合链']
        self.rejected(doc, '笼统尾项|范围标签')

        item.update(subject='1366 工作台配置弹窗关闭后的焦点返回',
                    criterion='已有证据能证明焦点返回时关闭该项，否则形成具体缺口',
                    next_action='读取已有1366保存截图与焦点结果，形成逐项裁决或具体Owner待决')
        item['scope']['targets'] = ['1366工作台配置弹窗关闭后的焦点返回']
        item['scope']['allowed_actions'] = ['读取既有1366证据', '形成逐项规划裁决']
        item['scope']['forbidden_actions'] = ['让Executor重跑1366', '以未覆盖范围代替具体结论']
        item['acceptance'] = ['已给出逐项裁决：证据充分则关闭，存在反证则列出原对象、实际结果和预期']
        del item['scope']['constraints']
        self.validate(doc)

        item.pop('acceptance')
        self.rejected(doc, '完成条件')

    def test_retry_adds_measurable_constraint(self):
        doc = self.retry()
        doc['items'][0]['scope'] = copy.deepcopy(self.document['items'][0]['scope'])
        doc['items'][0]['scope']['constraints']['footer_height'] = '48px'
        self.validate(doc, self.document)

    def test_scope_cannot_expand(self):
        for field, value in [('targets', 'whole application'), ('allowed_actions', 'change pagination')]:
            doc = self.retry()
            doc['items'][0]['scope'][field].append(value)
            self.rejected(doc, '不得扩大', self.document)

    def test_constraints_cannot_be_removed_or_relaxed(self):
        doc = self.retry()
        doc['items'][0]['scope']['constraints']['expanded_width'] = '240px'
        self.rejected(doc, '放松原约束', self.document)

    def test_changed_filename_or_id_does_not_reset(self):
        doc = self.retry()
        doc['items'][0]['origin_id'] = 'new-id'
        self.rejected(doc, '换编号不能重置', self.document)

    def test_omitted_items_and_decreased_rounds_rejected(self):
        doc = self.retry()
        doc['items'][0]['failed_rounds'] = 0
        self.rejected(doc, '失败历史不能重置', self.document)
        doc = self.retry()
        doc['items'].append(copy.deepcopy(doc['items'][0]))
        self.rejected(doc, '重复origin_id', self.document)

    def test_passed_item_cannot_reopen_without_specific_invalidation(self):
        old = copy.deepcopy(self.document)
        old['items'][0]['status'] = 'RESOLVED'
        doc = self.retry()
        self.rejected(doc, '不得重开', old)
        doc['items'][0]['invalidation'] = {'kind': 'IMPLEMENTATION_CHANGED',
                                         'reason': 'shared sidebar changed after snapshot',
                                         'evidence': ['executor change receipt']}
        self.validate(doc, old)

    def test_self_audit_required_after_repeated_failure(self):
        doc = self.retry()
        del doc['items'][0]['planner_self_audit']
        self.rejected(doc, '自检', self.document)

    def test_finish_rejected_with_business_or_ui_gap(self):
        doc = copy.deepcopy(self.document)
        doc['decision'] = 'FINISH'
        self.rejected(doc, '不能提前结束')
        doc['items'][0].update(status='MINOR', reason='remaining antialiasing anomaly',
                               impact={'business': False, 'usability': False, 'ui_fidelity': True})
        self.rejected(doc, 'UI还原度')

    def test_small_anomaly_must_prove_all_three_impact_dimensions(self):
        doc = copy.deepcopy(self.document)
        doc.update(decision='FINISH')
        doc['items'][0].update(status='MINOR', reason='receipt punctuation only, underlying result is unchanged',
                              impact={'business': False, 'usability': False, 'ui_fidelity': False})
        self.validate(doc)
        del doc['items'][0]['impact']['business']
        self.rejected(doc, '业务')

    def test_prior_material_impact_cannot_be_relabelled_minor(self):
        old = copy.deepcopy(self.document)
        old['items'][0]['impact'] = {'ui_fidelity': True}
        doc = self.retry()
        doc['items'][0].update(status='MINOR', reason='still same actual picture',
                              impact={'business': False, 'usability': False, 'ui_fidelity': False})
        doc['items'][0]['scope'] = copy.deepcopy(old['items'][0]['scope'])
        self.rejected(doc, '旧证据', old)

    def test_malformed_or_missing_ledger_and_path_escape(self):
        path = self.receipts / 'planning-execution-prompt-01.md'
        for content in ('not passed, keep fixing', '```planner-convergence\n{\n```\n'):
            path.write_text(content, encoding='utf-8')
            with self.assertRaises(gate.Rejected):
                gate.read_document(path)
        doc = copy.deepcopy(self.document)
        doc['source_receipt'] = '../foreign.md'
        self.rejected(doc, '工作区')

    def test_atomic_history_shared_by_worktrees_and_idempotent(self):
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True, timeout=5)
        path = self.receipts / 'planning-execution-prompt-01.md'
        def write(doc):
            path.write_text('```planner-convergence\n' + json.dumps(doc) + '\n```\n', encoding='utf-8')
        write(self.document)
        gate.accept(self.root, path)
        gate.accept(self.root, path)
        state = self.root / '.git/planner-convergence/demo.json'
        self.assertEqual(len(json.loads(state.read_text())['history']), 1)
        doc = self.retry()
        write(doc)
        gate.accept(self.root, path)
        write(self.document)
        with self.assertRaisesRegex(gate.Rejected, '继承'):
            gate.accept(self.root, path)
        self.assertFalse(state.with_suffix('.lock').exists())

    def test_linked_worktree_inherits_history_and_cannot_restart_revision_one(self):
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True, timeout=5)
        subprocess.run(['git', '-c', 'user.name=Governance Test', '-c', 'user.email=governance@example.invalid',
                        'commit', '--allow-empty', '-qm', 'governance fixture'], cwd=self.root, check=True, timeout=5)
        path = self.receipts / 'planning-execution-prompt-01.md'
        path.write_text('```planner-convergence\n'+json.dumps(self.document)+'\n```\n')
        gate.accept(self.root, path)
        linked = self.root / 'linked'
        subprocess.run(['git', 'worktree', 'add', '--detach', '-q', str(linked)], cwd=self.root, check=True, timeout=5)
        other = linked / 'product/demo/receipts'
        other.mkdir(parents=True)
        (other/'executor.md').write_text('same authorized object')
        renamed = other/'planning-execution-prompt-renamed.md'
        changed = copy.deepcopy(self.document)
        changed['items'][0]['diagnosis']['cause'] = 'changed words cannot reset revision'
        renamed.write_text('```planner-convergence\n'+json.dumps(changed)+'\n```\n')
        self.assertEqual(gate.common_directory(linked), gate.common_directory(self.root))
        with self.assertRaisesRegex(gate.Rejected, '继承'):
            gate.accept(linked, renamed)

    def test_old_prompt_read_only_is_not_a_new_dispatch(self):
        path = self.receipts / 'planning-execution-prompt-old.md'
        path.write_text('legacy prompt before this turn')
        os.utime(path, (1, 1))
        started = datetime.now(timezone.utc).isoformat()
        transcript = self.root/'session.jsonl'
        records = [
            {'type': 'session_meta', 'payload': {'id': 'own', 'cwd': str(self.root)}},
            {'timestamp': started, 'type': 'response_item', 'payload': {
                'type': 'message', 'role': 'user', 'content': [{'type': 'input_text', 'text': '你是规划，解释旧记录'}]}},
            {'type': 'response_item', 'payload': {'type': 'function_call', 'arguments': 'Read product/demo/receipts/planning-execution-prompt-old.md'}}]
        transcript.write_text('\n'.join(json.dumps(r) for r in records)+'\n')
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True, timeout=5)
        paths, role = gate.observe({'session_id': 'own', 'cwd': str(self.root), 'transcript_path': str(transcript),
                                   'last_assistant_message': '见product/demo/receipts/planning-execution-prompt-old.md'}, self.root)
        self.assertEqual((paths, role), ([], 'planner'))

    def test_renamed_dispatch_heading_still_requires_concrete_ledger(self):
        path = self.receipts/'next.md'
        path.write_text('# 新执行任务\n不通过，继续修复')
        self.assertTrue(gate.is_dispatch(path))
        paths, _ = gate.observe({'active_role': 'planner', 'last_assistant_message': '见product/demo/receipts/next.md'}, self.root)
        self.assertEqual(paths, [path])
        with self.assertRaisesRegex(gate.Rejected, '账本'):
            gate.read_document(path)
        unrelated = self.receipts/'large-execution-result.md'
        unrelated.write_text('# 执行结果\n' + 'x' * (1024 * 1024 + 1))
        self.assertFalse(gate.is_dispatch(unrelated))

    def test_actual_native_stop_transports(self):
        # Exercise the real tracked adapter scripts in an isolated root. No
        # production terminal contract, business service or user state is used.
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True, timeout=5)
        governance = self.root/'.codex/governance'
        hooks = self.root/'.codex/hooks'
        governance.mkdir(parents=True)
        hooks.mkdir()
        for name in ('planner-convergence.py', 'codex-session-role.py', 'windows-validator-runtime.ps1'):
            shutil.copy2(HERE/name, governance/name)
        for name in ('codex-stop-adapter.ps1', 'codex-stop-adapter.sh'):
            shutil.copy2(HERE.parent/'hooks'/name, hooks/name)
        ps = Path(os.environ['SystemRoot'])/'System32/WindowsPowerShell/v1.0/powershell.exe'
        git = Path(shutil.which('git')).resolve()
        sh = git.parent.parent/'bin/sh.exe'
        self.assertTrue(sh.is_file(), str(sh))
        clean = {k:v for k,v in os.environ.items() if not k.startswith('AGENT_CODING_ENGINE_')}
        clean['AGENT_CODING_ENGINE_PYTHON'] = sys.executable
        clean['AGENT_CODING_ENGINE_JQ'] = str(Path(os.environ['USERPROFILE'])/'.cache/agent-coding-engine/jq-1.8.2/jq.exe')
        self.assertTrue(Path(clean['AGENT_CODING_ENGINE_JQ']).is_file())
        path = self.receipts/'planning-execution-prompt-01.md'
        path.write_text('```planner-convergence\n'+json.dumps(self.document)+'\n```\n')
        commands = [
            [str(ps), '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', str(hooks/'codex-stop-adapter.ps1')],
            [str(sh), str(hooks/'codex-stop-adapter.sh')]]
        cases = [('admin', '检查完成', False), ('planner', '普通问题说明', False),
                 ('planner', '不通过，请执行继续修复', True),
                 ('planner', '已更新product/demo/receipts/planning-execution-prompt-01.md', False)]
        for command in commands:
            for role, message, blocked in cases:
                payload = {'active_role': role, 'last_assistant_message': message}
                result = subprocess.run(command, input=json.dumps(payload).encode(), capture_output=True,
                                        cwd=self.root, env=clean, timeout=20)
                self.assertEqual(result.returncode, 0, (command, result.stderr))
                self.assertFalse(result.stderr.strip(), result.stderr)
                if blocked:
                    output = json.loads(result.stdout.decode('utf-8-sig'))
                    self.assertEqual(output['decision'], 'block')
                    self.assertIn('收口', output['reason'])
                else:
                    self.assertFalse(result.stdout.strip(), result.stdout)
            # Wording-only second dispatch must be rejected by both hosts.
            doc = self.retry()
            doc['items'][0]['scope'] = self.document['items'][0]['scope']
            path.write_text('```planner-convergence\n'+json.dumps(doc)+'\n```\n')
            result = subprocess.run(command, input=json.dumps({'active_role': 'planner', 'last_assistant_message':
                                    '已更新product/demo/receipts/planning-execution-prompt-01.md'}).encode(),
                                    capture_output=True, cwd=self.root, env=clean, timeout=20)
            self.assertEqual(json.loads(result.stdout.decode('utf-8-sig'))['decision'], 'block')
            path.write_text('```planner-convergence\n'+json.dumps(self.document)+'\n```\n')
            transcript = self.root/'native.jsonl'
            transcript.write_text('\n'.join(json.dumps(r) for r in [
                {'type': 'session_meta', 'payload': {'id': 'native', 'cwd': str(self.root)}},
                {'type': 'response_item', 'payload': {'type': 'message', 'role': 'user',
                 'content': [{'type': 'input_text', 'text': '你是执行'}]}},
                {'type': 'response_item', 'payload': {'type': 'message', 'role': 'user',
                 'content': [{'type': 'input_text', 'text': '切换为规划，继续任务'}]}}
            ])+'\n')
            payload = {'session_id': 'native', 'cwd': str(self.root), 'transcript_path': str(transcript),
                       'last_assistant_message': '不通过，请执行继续修复'}
            result = subprocess.run(command, input=json.dumps(payload).encode(), capture_output=True,
                                    cwd=self.root, env=clean, timeout=20)
            self.assertEqual(json.loads(result.stdout.decode('utf-8-sig'))['decision'], 'block')

    def test_role_switch_and_quoted_instruction(self):
        self.assertEqual(roles.declared_role('切换管理员,检查hook'), 'admin')
        self.assertEqual(roles.declared_role('切换为规划，继续原任务'), 'planner')
        self.assertIsNone(roles.declared_role('> 你是执行'))
        self.assertIsNone(roles.declared_role('# AGENTS.md instructions\n你是执行'))

    def test_admin_and_plain_planner_chat_do_not_require_ledger(self):
        self.assertEqual(gate.observe({'active_role': 'admin'}, self.root), ([], 'admin'))
        self.assertEqual(gate.observe({'active_role': 'planner', 'last_assistant_message': '当前状态如此'}, self.root), ([], 'planner'))
        with self.assertRaisesRegex(gate.Rejected, '对话打回'):
            gate.observe({'active_role': 'planner', 'last_assistant_message': '不通过，请执行继续修复'}, self.root)
        self.assertEqual(gate.observe({'active_role': 'planner', 'last_assistant_message': '尚未验收通过，本次任务未结束。'}, self.root), ([], 'planner'))

    def test_finish_claim_cannot_skip_or_contradict_machine_ledger(self):
        with self.assertRaisesRegex(gate.Rejected, 'FINISH'):
            gate.observe({'active_role': 'planner', 'last_assistant_message': '本次任务已完成。'}, self.root)
        path = self.receipts/'planning-execution-prompt-01.md'
        path.write_text('```planner-convergence\n'+json.dumps(self.document)+'\n```\n')
        with self.assertRaisesRegex(gate.Rejected, 'FINISH'):
            gate.observe({'active_role': 'planner', 'last_assistant_message':
                          '本次任务已完成。见product/demo/receipts/planning-execution-prompt-01.md'}, self.root)

    def test_foreign_session_does_not_supply_identity(self):
        path = self.root / 'session.jsonl'
        path.write_text(json.dumps({'type': 'session_meta', 'payload': {'id': 'foreign', 'cwd': str(self.root)}})+'\n')
        with self.assertRaisesRegex(ValueError, 'SESSION_MISMATCH'):
            gate.observe({'session_id': 'own', 'cwd': str(self.root), 'transcript_path': str(path)}, self.root)


if __name__ == '__main__':
    unittest.main(verbosity=2)
