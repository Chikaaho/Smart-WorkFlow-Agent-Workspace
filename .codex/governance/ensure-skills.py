#!/usr/bin/env python3
"""Compatibility entry for the shared workspace skill prerequisite installer."""
import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).resolve().parents[2] / "governance/skills/ensure-skills.py"), run_name="__main__")
