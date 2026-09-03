#!/bin/sh
set -u
root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
exec sh "$root_dir/.codex/governance/stop-gate.sh"
