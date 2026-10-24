"""Finite role/identity regression using native Codex transcript shapes."""
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('codex_session_role', Path(__file__).with_name('codex-session-role.py'))
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class NativeRoleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.path = self.root / 'rollout.jsonl'
        self.payload = {'session_id': 'native-session', 'cwd': str(self.root), 'transcript_path': str(self.path)}
        self.env = patch.dict(os.environ, {'AGENT_CODING_ENGINE_ACTIVE_ROLE': ''})
        self.env.start()
        self.addCleanup(self.env.stop)

    def write(self, *prompts, session='native-session', cwd=None):
        records = [{'type': 'session_meta', 'payload': {'id': session, 'cwd': str(cwd or self.root)}}]
        records.extend({'type': 'response_item', 'payload': {'type': 'message', 'role': role,
                       'content': [{'type': 'input_text' if role == 'user' else 'output_text', 'text': text}]}}
                       for role, text in prompts)
        self.path.write_text('\n'.join(json.dumps(r, ensure_ascii=False) for r in records) + '\n', encoding='utf-8')

    def resolve(self):
        return module.resolve_role(self.payload, str(self.root))

    def test_native_executor_without_custom_role(self):
        self.write(('user', '你是执行,拉取最新git信息,然后继续任务'))
        self.assertEqual(self.resolve(), {'active_role': 'executor', 'source': 'host_user_prompt'})

    def test_latest_explicit_role_persists(self):
        self.write(('user', '你是执行，继续任务'), ('user', '继续，你是管理员，检查 hook'), ('user', '继续'))
        self.assertEqual(self.resolve()['active_role'], 'admin')

    def test_planner(self):
        self.write(('user', '以规划身份恢复任务'))
        self.assertEqual(self.resolve()['active_role'], 'planner')

    def test_role_word_does_not_bind(self):
        self.write(('user', '检查执行角色的 hook'))
        self.assertEqual(self.resolve()['active_role'], '')

    def test_assistant_and_terminal_cannot_bind(self):
        self.write(('assistant', '你是执行'), ('user', '现场：ENGINE_TERMINAL {"role":"executor"}'))
        self.assertEqual(self.resolve()['active_role'], '')

    def test_instruction_and_quoted_text_cannot_bind(self):
        self.write(('user', '# AGENTS.md instructions\n你是执行'),
                   ('user', '<environment_context>\n你是执行\n</environment_context>'),
                   ('user', '> 你是执行\n```text\n你是执行\n```\n现场：“你是执行”'))
        self.assertEqual(self.resolve()['active_role'], '')

    def test_ambiguous_declaration_is_closed(self):
        self.write(('user', '你是执行，你是管理员'))
        with self.assertRaisesRegex(module.RoleObservationError, 'AMBIGUOUS'):
            self.resolve()

    def test_foreign_session_is_closed(self):
        self.write(('user', '你是执行'), session='other-session')
        with self.assertRaisesRegex(module.RoleObservationError, 'SESSION_MISMATCH'):
            self.resolve()

    def test_foreign_transcript_workspace_is_closed(self):
        self.write(('user', '你是执行'), cwd=self.root.parent)
        with self.assertRaisesRegex(module.RoleObservationError, 'WORKSPACE_MISMATCH'):
            self.resolve()

    def test_foreign_payload_workspace_is_closed(self):
        self.write(('user', '你是执行'))
        self.payload['cwd'] = str(self.root.parent)
        with self.assertRaisesRegex(module.RoleObservationError, 'WORKSPACE_MISMATCH'):
            self.resolve()

    def test_subdirectory_workspace(self):
        self.write(('user', '执行，继续任务'))
        self.payload['cwd'] = str(self.root / 'nested')
        self.assertEqual(self.resolve()['active_role'], 'executor')

    def test_missing_identity_is_closed(self):
        self.write(('user', '你是执行'))
        del self.payload['session_id']
        with self.assertRaisesRegex(module.RoleObservationError, 'SESSION_MISSING'):
            self.resolve()

    def test_missing_metadata_is_closed(self):
        self.path.write_text('{}\n', encoding='utf-8')
        with self.assertRaisesRegex(module.RoleObservationError, 'SESSION_MISSING'):
            self.resolve()

    def test_launch_binding(self):
        self.payload['active_role'] = 'executor'
        self.assertEqual(self.resolve()['source'], 'explicit_binding')

    def test_unbound_compatibility(self):
        self.payload.pop('transcript_path')
        self.assertEqual(self.resolve()['active_role'], '')


if __name__ == '__main__':
    unittest.main()
