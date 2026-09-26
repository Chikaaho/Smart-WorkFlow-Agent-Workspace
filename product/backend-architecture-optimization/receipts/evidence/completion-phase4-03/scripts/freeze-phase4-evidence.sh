#!/usr/bin/env bash
# Phase 4 G6 · 行为输入与证据哈希包（可复算 + 回读校验）
#
# 产物：
#   behavior-input.sha256  —— 行为输入冻结（本次改动的后端源码/测试/迁移/证据脚本）
#   evidence.sha256        —— 证据包自哈希（raw 日志、TSV、扫描输出、本脚本）
#   *.check                —— sha256sum -c 回读结果
#
# 用法：bash freeze-phase4-evidence.sh [server-repo-root]
set -uo pipefail

SERVER_ROOT="${1:-/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server}"
WORKSPACE_ROOT="$(cd "$SERVER_ROOT/.." && pwd)"
EVIDENCE_DIR="$WORKSPACE_ROOT/product/backend-architecture-optimization/receipts/evidence/completion-phase4-03"
EVIDENCE_REL="product/backend-architecture-optimization/receipts/evidence/completion-phase4-03"
SERVER_NAME="$(basename "$SERVER_ROOT")"

cd "$EVIDENCE_DIR" || exit 2

# ---------- 1. 行为输入 ----------
: > behavior-input.sha256

# 1.1 后端工作树中本次改动的受跟踪文件（真实来源 = Git 工作树差异）
( cd "$SERVER_ROOT" && git status --porcelain \
  | grep -vE '^\?\? ' \
  | awk '{print $2}' \
  | grep -E '\.(java|sql|xml)$' \
  | sort ) | while read -r rel; do
  printf '%s  %s\n' "$(shasum -a 256 "$SERVER_ROOT/$rel" | awk '{print $1}')" "$SERVER_NAME/$rel" >> behavior-input.sha256
done

# 1.2 本次新增（未跟踪）的测试与迁移资产
( cd "$SERVER_ROOT" && git status --porcelain \
  | grep -E '^\?\? ' \
  | awk '{print $2}' \
  | grep -E '\.(java|sql)$' \
  | grep -vE '/target/|__pycache__' \
  | sort ) | while read -r rel; do
  printf '%s  %s\n' "$(shasum -a 256 "$SERVER_ROOT/$rel" | awk '{print $1}')" "$SERVER_NAME/$rel" >> behavior-input.sha256
done

# 1.3 证据脚本自身（矩阵复算、证据采集、环境装载）
for script in scripts/p4-publish-matrix.sh scripts/p4-runtime-env.sh \
              scripts/freeze-phase4-evidence.sh scripts/run-phase4-03-evidence.sh; do
  if [[ ! -f "$script" ]]; then
    echo "ASSERT-FAIL 行为输入清单缺少脚本: $script" >&2
    exit 4
  fi
  printf '%s  %s\n' "$(shasum -a 256 "$script" | awk '{print $1}')" "$EVIDENCE_REL/$script" >> behavior-input.sha256
done

sort -k2 -o behavior-input.sha256 behavior-input.sha256

# ---------- 2. 证据包自哈希 ----------
find . -type f \
  ! -name 'evidence.sha256' ! -name 'evidence.check' \
  ! -name 'behavior-input.sha256' ! -name 'behavior-input.check' \
  -print | sed 's|^\./||' | sort | while read -r file; do
  printf '%s  %s\n' "$(shasum -a 256 "$file" | awk '{print $1}')" "$file"
done > evidence.sha256

# ---------- 3. 回读校验（工作区相对路径；证据清单在证据目录内自校验） ----------
( cd "$WORKSPACE_ROOT" && shasum -a 256 -c "$EVIDENCE_REL/behavior-input.sha256" ) > behavior-input.check 2>&1
input_code=$?
shasum -a 256 -c evidence.sha256 > evidence.check 2>&1
evidence_code=$?

echo "[hash] behavior-input entries=$(wc -l < behavior-input.sha256 | tr -d ' ') check_exit=$input_code"
echo "[hash] evidence entries=$(wc -l < evidence.sha256 | tr -d ' ') check_exit=$evidence_code"
grep -c ": OK$" behavior-input.check | sed 's/^/[hash] behavior-input OK=/'
grep -c ": OK$" evidence.check | sed 's/^/[hash] evidence OK=/'
exit $((input_code + evidence_code))
