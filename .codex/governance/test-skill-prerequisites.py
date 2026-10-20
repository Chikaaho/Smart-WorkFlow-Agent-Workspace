#!/usr/bin/env python3
"""Behavior checks for workspace skill discovery, installation and failure cleanup."""

import contextlib
import importlib.util
import io
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch


GOV = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("ensure_skills", GOV / "ensure-skills.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SKILLS = json.loads(module.MANIFEST.read_text())["skills"]


def skill_text(name):
    return f"---\nname: {name}\n---\n\nInstructions for {name}.\n"


def archive_bytes(name, extra=None):
    output = io.BytesIO()
    prefix = "source-main/no-negative-echo" if name == "no-negative-echo" else "source-main"
    with zipfile.ZipFile(output, "w") as archive:
        archive.writestr(f"{prefix}/SKILL.md", skill_text(name))
        archive.writestr(f"{prefix}/references/help.md", "Supporting instructions.\n")
        for path, value in (extra or {}).items():
            archive.writestr(path, value)
    return output.getvalue()


class PrerequisiteTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="engine-skill-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name) / "skills"

    def write_skill(self, name, directory_name=None):
        directory = self.root / (directory_name or name)
        directory.mkdir(parents=True)
        (directory / "SKILL.md").write_text(skill_text(name))
        return directory

    def run_ensure(self, check=False):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            result = module.ensure(check, self.root)
        return result, [json.loads(line) for line in output.getvalue().splitlines()]

    def test_missing_check_is_read_only_and_reports_both_dependencies(self):
        result, records = self.run_ensure(True)
        self.assertEqual(result, 1)
        self.assertEqual([row["status"] for row in records], ["MISSING", "MISSING"])
        self.assertFalse(self.root.exists())

    def test_installed_skills_are_reused_without_network_or_modification(self):
        for skill in SKILLS:
            self.write_skill(skill["name"])
        before = {path: path.stat().st_mtime_ns for path in self.root.rglob("*")}
        with patch.object(module, "download", side_effect=AssertionError("Unexpected network")):
            result, records = self.run_ensure()
        self.assertEqual(result, 0)
        self.assertTrue(all(row["status"] == "READY" for row in records))
        self.assertEqual(before, {path: path.stat().st_mtime_ns for path in self.root.rglob("*")})

    def test_repository_name_alias_resolves_to_canonical_skill(self):
        directory = self.write_skill("humanizer-zh", "humanizer-zh-cn")
        self.assertEqual(module.find_skill(SKILLS[0], [self.root]), directory)

    def test_fresh_install_copies_supporting_files_and_is_reusable(self):
        with patch.object(module, "download", side_effect=lambda skill: archive_bytes(skill["name"])):
            result, records = self.run_ensure()
        self.assertEqual(result, 0)
        self.assertEqual(sum(row["status"] == "INSTALLED" for row in records), 2)
        for skill in SKILLS:
            self.assertTrue((self.root / skill["name"] / "references/help.md").is_file())
        self.assertFalse(list(self.root.glob(".engine-skill-*")))
        with patch.object(module, "download", side_effect=AssertionError("Unexpected network")):
            self.assertEqual(self.run_ensure()[0], 0)

    def test_invalid_existing_package_is_preserved(self):
        directory = self.write_skill("unrelated", "humanizer-zh")
        before = (directory / "SKILL.md").read_text()
        with patch.object(module, "download", side_effect=AssertionError("Unexpected download")):
            with self.assertRaisesRegex(ValueError, "requires repair"):
                module.install_skill(SKILLS[0], self.root)
        self.assertEqual((directory / "SKILL.md").read_text(), before)

    def test_network_failure_reports_error_and_continues_checking_other_skill(self):
        self.write_skill("no-negative-echo")
        with patch.object(module, "download", side_effect=OSError("Network unavailable")):
            result, records = self.run_ensure()
        self.assertEqual(result, 1)
        self.assertEqual([row["status"] for row in records], ["INSTALLING", "ERROR", "READY"])
        self.assertFalse((self.root / "humanizer-zh").exists())

    def test_invalid_download_leaves_no_partial_install_or_temporary_directory(self):
        with patch.object(module, "download", return_value=archive_bytes("unrelated")):
            with self.assertRaisesRegex(ValueError, "matching SKILL.md"):
                module.install_skill(SKILLS[0], self.root)
        self.assertEqual(list(self.root.iterdir()), [])

    def test_archive_cannot_write_outside_temporary_package(self):
        data = archive_bytes("humanizer-zh", {"source-main/../../outside.txt": "invalid"})
        with patch.object(module, "download", return_value=data):
            with self.assertRaisesRegex(ValueError, "Unsafe path"):
                module.install_skill(SKILLS[0], self.root)
        self.assertFalse((self.root.parent / "outside.txt").exists())
        self.assertEqual(list(self.root.iterdir()), [])

    def test_incomplete_or_wrong_skill_is_not_ready(self):
        directory = self.write_skill("unrelated", "humanizer-zh")
        self.assertIsNone(module.find_skill(SKILLS[0], [self.root]))
        (directory / "SKILL.md").write_text("---\nname: humanizer-zh\n---\n")
        self.assertIsNone(module.find_skill(SKILLS[0], [self.root]))

    def test_explicit_directory_does_not_reuse_machine_installations(self):
        self.assertEqual(module.skill_roots(self.root), [self.root.resolve()])

    def test_nested_skill_installs_only_its_declared_package(self):
        data = archive_bytes("no-negative-echo", {"source-main/README.md": "Repository overview"})
        with patch.object(module, "download", return_value=data):
            directory = module.install_skill(SKILLS[1], self.root)
        self.assertTrue(module.skill_readable(directory, "no-negative-echo"))
        self.assertFalse((directory / "README.md").exists())


if __name__ == "__main__":
    unittest.main(verbosity=2)
