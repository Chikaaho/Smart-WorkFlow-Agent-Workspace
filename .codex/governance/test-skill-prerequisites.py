#!/usr/bin/env python3
"""Compatibility entry for shared workspace skill prerequisite tests."""
import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).resolve().parents[2] / "governance/skills/test-prerequisites.py"), run_name="__main__")
