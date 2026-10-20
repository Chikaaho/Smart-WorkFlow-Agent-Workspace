#!/usr/bin/env python3
"""Check workspace skill dependencies and install missing packages from declared sources."""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import shutil
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import zipfile
from pathlib import Path, PurePosixPath


MANIFEST = Path(__file__).with_name("required-skills.json")
MAX_ARCHIVE_BYTES = 8 * 1024 * 1024
MAX_UNPACKED_BYTES = 32 * 1024 * 1024


def skill_readable(directory: Path, name: str) -> bool:
    try:
        body = (directory / "SKILL.md").read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return False
    frontmatter = re.match(r"\A---\s*\n(.*?)\n---(?:\s*\n|$)", body, re.DOTALL)
    if not frontmatter:
        return False
    declared = re.search(r"^name:\s*['\"]?([\w-]+)['\"]?\s*$", frontmatter[1], re.MULTILINE)
    return bool(declared and declared[1] == name and body[frontmatter.end():].strip())


def skill_roots(explicit: Path | None) -> list[Path]:
    if explicit is not None:
        return [explicit.expanduser().resolve()]
    home = Path.home()
    workspace = MANIFEST.parents[2]
    candidates = [
        home / ".agents" / "skills",
        Path(os.environ.get("CODEX_HOME", str(home / ".codex"))) / "skills",
        Path(os.environ.get("CLAUDE_CONFIG_DIR", str(home / ".claude"))) / "skills",
        workspace / ".agents" / "skills",
        workspace / ".claude" / "skills",
    ]
    if os.environ.get("AGENT_SKILLS_DIR"):
        candidates.insert(0, Path(os.environ["AGENT_SKILLS_DIR"]))
    return list(dict.fromkeys(path.expanduser().resolve() for path in candidates))


def find_skill(skill: dict, roots: list[Path]) -> Path | None:
    for root in roots:
        for directory_name in [skill["name"], *skill["aliases"]]:
            directory = root / directory_name
            if skill_readable(directory, skill["name"]):
                return directory
    return None


def download(skill: dict) -> bytes:
    repository = skill["repository"]
    if not re.fullmatch(r"[\w.-]+/[\w.-]+", repository):
        raise ValueError("Invalid skill repository in manifest")
    ref = urllib.parse.quote(skill["ref"], safe="")
    url = f"https://codeload.github.com/{repository}/zip/{ref}"
    started = time.monotonic()
    chunks = []
    total = 0
    request = urllib.request.Request(url, headers={"User-Agent": "Agent-Coding-Engine"})
    with urllib.request.urlopen(request, timeout=15) as response:
        while True:
            chunk = response.read(64 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_ARCHIVE_BYTES or time.monotonic() - started > 30:
                raise ValueError("Skill download exceeded its size or time limit")
            chunks.append(chunk)
    return b"".join(chunks)


def install_skill(skill: dict, root: Path) -> Path:
    destination = root / skill["name"]
    if destination.exists() or destination.is_symlink():
        raise ValueError(f"Existing invalid package requires repair: {destination}")
    archive_bytes = download(skill)
    root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".engine-skill-", dir=root) as temporary:
        package = Path(temporary) / "package"
        package.mkdir()
        source_path = PurePosixPath(skill["path"])
        if source_path.is_absolute() or ".." in source_path.parts:
            raise ValueError("Invalid skill package path in manifest")
        with zipfile.ZipFile(io.BytesIO(archive_bytes)) as archive:
            entries = archive.infolist()
            if sum(entry.file_size for entry in entries) > MAX_UNPACKED_BYTES:
                raise ValueError("Skill archive exceeds unpacked size limit")
            top_levels = {PurePosixPath(entry.filename).parts[0] for entry in entries if entry.filename}
            if len(top_levels) != 1:
                raise ValueError("Skill archive must contain one repository root")
            for entry in entries:
                path = PurePosixPath(entry.filename)
                if path.is_absolute() or ".." in path.parts or "\\" in entry.filename:
                    raise ValueError("Unsafe path in skill archive")
                repository_path = path.parts[1:]
                if repository_path[:len(source_path.parts)] != source_path.parts:
                    continue
                relative = Path(*repository_path[len(source_path.parts):])
                if not relative.parts:
                    continue
                target = package / relative
                if entry.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                else:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    with archive.open(entry) as source, target.open("wb") as output:
                        shutil.copyfileobj(source, output)
        if not skill_readable(package, skill["name"]):
            raise ValueError("Downloaded package has no readable matching SKILL.md")
        # Recheck before publishing: never replace a package created by another task.
        if destination.exists() or destination.is_symlink():
            raise ValueError(f"Skill destination appeared during installation: {destination}")
        package.rename(destination)
    return destination


def ensure(check_only: bool = False, directory: Path | None = None) -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    roots = skill_roots(directory)
    failed = False
    for skill in manifest["skills"]:
        result = {"skill": skill["name"]}
        existing = find_skill(skill, roots)
        if existing is not None:
            result.update(status="READY", path=str(existing / "SKILL.md"))
        elif check_only:
            result.update(status="MISSING")
            failed = True
        else:
            print(json.dumps({"skill": skill["name"], "status": "INSTALLING"}), flush=True)
            try:
                installed = install_skill(skill, roots[0])
                result.update(status="INSTALLED", path=str(installed / "SKILL.md"))
            except (OSError, ValueError, zipfile.BadZipFile) as error:
                result.update(status="ERROR", detail=str(error))
                failed = True
        print(json.dumps(result, ensure_ascii=False), flush=True)
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report missing skills without installing")
    parser.add_argument("--skills-dir", type=Path, help="Use only this skills directory")
    args = parser.parse_args()
    return ensure(args.check, args.skills_dir)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError) as error:
        print(json.dumps({"status": "ERROR", "detail": str(error)}, ensure_ascii=False))
        sys.exit(1)
