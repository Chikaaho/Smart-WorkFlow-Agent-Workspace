#!/bin/sh
# D2b-asset v5 验证：按命名步骤提取 Create GitHub Release run 块；失败真实传播。
# 用法: run-release-v5.sh <server|web> <fresh|rerun> <S1> <S2>
set -eu

REPO="$1"; SCENARIO="$2"; S1="$3"; S2="$4"
SIMROOT="/tmp/d2b-v5"; WORKDIR="${SIMROOT}/${REPO}-${SCENARIO}"
LOG="${SIMROOT}/${REPO}-${SCENARIO}.log"
rm -rf "$WORKDIR"; mkdir -p "$WORKDIR"
cd "$WORKDIR"

if [ "$REPO" = "server" ]; then
  WF=/usr/local/projects/Smart-WorkFlow/product/p59-ch-apaas-project-update/receipts/evidence-04/d2b-asset-server-workflow-6ab9ae5.yml
  SRCREPO=/tmp/p59-server-main
  SRCCOMMIT=6ab9ae50080b2ae884eefaa728ae021702661ece
  ASSET_SRC="sw-bootstrap/target/bootstrap.jar"
  ASSET_ARG="sw-bootstrap/target/bootstrap.jar#bootstrap.jar"
else
  WF=/usr/local/projects/Smart-WorkFlow/product/p59-ch-apaas-project-update/receipts/evidence-04/d2b-asset-web-workflow-f9dca42.yml
  SRCREPO=/tmp/p59-web-main
  SRCCOMMIT=f9dca42317e33fd31254ed38d6c28f34473d40e5
  ASSET_SRC="dist-${S1}.zip"
  ASSET_ARG="dist-${S1}.zip"
fi
WF_SHA256=$(shasum -a 256 "$WF" | awk '{print $1}')
WF_BLOB=$(git -C "$SRCREPO" rev-parse "$SRCCOMMIT:.github/workflows/build-release.yml")

{
echo "== D2b-asset v5 完整发布段验证（命名步骤抽取、失败传播）=="
echo "== workflow 副本: $WF =="
echo "== 源提交=${SRCCOMMIT} 源blob=${WF_BLOB} 文件sha256=${WF_SHA256} =="
echo "== 场景=${SCENARIO} S1=${S1} S2=${S2} =="

# ---- 命名步骤抽取（python 步骤级解析） ----
python3 - "$WF" > release-step.sh << 'PYEOF'
import sys, re
lines = open(sys.argv[1]).read().split('\n')
# 定位 "- name: Create GitHub Release"
start = None
for i, l in enumerate(lines):
    if re.match(r'^\s+- name: Create GitHub Release\s*$', l):
        start = i
        break
assert start is not None, "Create GitHub Release step not found"
# 在该步骤内找 run: |，取其后的内容行（缩进大于 run 行缩进）直到缩进回升或 EOF
run_idx = None
for i in range(start, len(lines)):
    if re.match(r'^\s+run: \|\s*$', lines[i]):
        run_idx = i
        break
assert run_idx is not None, "run: | not found in step"
run_indent = len(lines[run_idx]) - len(lines[run_idx].lstrip())
body = []
for l in lines[run_idx+1:]:
    if not l.strip():
        body.append('')
        continue
    ind = len(l) - len(l.lstrip())
    if ind <= run_indent:
        break
    body.append(l[ind:])
text = '\n'.join(body).rstrip('\n') + '\n'
# 仅替换 Actions 上下文表达式（值映射，命令结构不变）
text = text.replace("${{ steps.locate.outputs.version }}", "1.0.0-SNAPSHOT")
text = text.replace("${{ steps.locate.outputs.jar }}", "sw-bootstrap/target/bootstrap.jar")
text = text.replace("${{ steps.locate.outputs.jar_name }}", "bootstrap.jar")
text = text.replace("${{ steps.package.outputs.version }}", "0.0.0")
sys.stdout.write(text)
PYEOF
echo "== 抽取段: $(grep -c '' release-step.sh) 物理行 =="
echo "== 抽取段末行: [$(tail -1 release-step.sh)] =="
shasum -a 256 release-step.sh
cp release-step.sh "${SIMROOT}/${REPO}-release-step-v5.sh"

# ---- 远端初始化：main=S2 ----
git init --bare -q origin.git
git clone -q origin.git work 2>/dev/null
cd work
git config user.email sim@sim.sim; git config user.name sim
git fetch -q "$SRCREPO" "$S1" "$S2"
git branch -f main "$S2"
git push -q origin main
echo "== 远端 main HEAD=$(git ls-remote origin refs/heads/main | awk '{print $1}')"

if [ "$SCENARIO" = "rerun" ]; then
  git tag "build-${S1}" "$S1"; git push -q origin "refs/tags/build-${S1}"
  echo "预置: tag build-${S1} -> ${S1}（同提交重跑）"
fi

# ---- 替身 git ----
mkdir -p "${WORKDIR}/bin"
cat > "${WORKDIR}/bin/git" << GITEOF
#!/bin/sh
if [ "\$1" = "ls-remote" ] && [ "\$2" = "--tags" ]; then
  echo "GIT_LSREMOTE_CALLED \$3 \$4" >> "${WORKDIR}/calls.log"
  /usr/bin/git ls-remote --tags "\$3" "\$4"
  exit \$?
fi
/usr/bin/git "\$@"
GITEOF
chmod +x "${WORKDIR}/bin/git"

# ---- 替身 gh：显式状态处理；真实错误返回失败 ----
cat > "${WORKDIR}/bin/gh" << 'GHEOF'
#!/bin/sh
SUB="$1"; CMD="$2"; shift 2 2>/dev/null || shift
echo "GH_CALL ${CMD} $*" >> "${WORKDIR}/calls.log"
case "$CMD" in
  view)
    TAG="$1"
    if [ -n "$(/usr/bin/git ls-remote --tags origin "refs/tags/${TAG}" 2>/dev/null)" ]; then
      echo "GH_VIEW release_exists ${TAG}" >> "${WORKDIR}/calls.log"; exit 0
    else
      echo "GH_VIEW release_absent ${TAG}" >> "${WORKDIR}/calls.log"; exit 1
    fi
    ;;
  delete)
    echo "GH_DELETE release_only $1 (tag 保留)" >> "${WORKDIR}/calls.log"; exit 0
    ;;
  create)
    TAG="$1"; shift
    TARGET=""; ASSETS=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --target) TARGET="$2"; shift 2 ;;
        --title|--notes) shift 2 ;;
        *) ASSETS="${ASSETS} $1"; shift ;;
      esac
    done
    if [ -z "${ASSETS}" ]; then
      echo "GH_CREATE_FAIL no_assets tag=${TAG}" >> "${WORKDIR}/calls.log"; exit 1
    fi
    for a in ${ASSETS}; do
      path="${a%%#*}"
      if [ ! -f "${path}" ] || [ ! -s "${path}" ]; then
        echo "GH_CREATE_FAIL missing_or_empty ${path}" >> "${WORKDIR}/calls.log"; exit 1
      fi
    done
    # 显式处理已存在 tag：目标相同视为同提交重跑成功；目标不同则真实失败（不吞错）
    EXISTING=$(/usr/bin/git ls-remote --tags origin "refs/tags/${TAG}" 2>/dev/null | awk '{print $1}')
    if [ -n "${EXISTING}" ]; then
      if [ "${EXISTING}" != "${TARGET}" ]; then
        echo "GH_CREATE_FAIL tag_conflict tag=${TAG} existing=${EXISTING} target=${TARGET}" >> "${WORKDIR}/calls.log"
        exit 1
      fi
      echo "GH_CREATE_OK_same_tag tag=${TAG} target=${TARGET} assets=[${ASSETS}]" >> "${WORKDIR}/calls.log"
      exit 0
    fi
    if ! /usr/bin/git tag "${TAG}" "${TARGET}"; then
      echo "GH_CREATE_FAIL git_tag_error ${TAG}" >> "${WORKDIR}/calls.log"; exit 1
    fi
    if ! /usr/bin/git push -q origin "refs/tags/${TAG}"; then
      echo "GH_CREATE_FAIL git_push_error tag=${TAG}" >> "${WORKDIR}/calls.log"; exit 1
    fi
    echo "GH_CREATE_OK tag=${TAG} target=${TARGET} assets=[${ASSETS}] now=$(git rev-parse ${TAG})" >> "${WORKDIR}/calls.log"
    exit 0
    ;;
  *)
    echo "GH_UNKNOWN ${CMD}" >> "${WORKDIR}/calls.log"; exit 1
    ;;
esac
GHEOF
chmod +x "${WORKDIR}/bin/gh"

# ---- 非空隔离样本产物 ----
if [ "$REPO" = "server" ]; then
  mkdir -p sw-bootstrap/target
  printf 'v5-sample-jar-20260904\n' > sw-bootstrap/target/bootstrap.jar
else
  printf 'v5-sample-dist-zip-20260904\n' > "dist-${S1}.zip"
fi
echo "== 样本产物: ${ASSET_SRC}（$(wc -c < "${ASSET_SRC}") 字节，非空）=="

export PATH="${WORKDIR}/bin:$PATH"
export GITHUB_SHA="$S1"
export GITHUB_TOKEN="sim-token"
export WORKDIR
export ASSET_ARG

# 失败传播：set -e 已开启；发布段内错误导致非零退出时，此处直接用其状态退出
set +e
sh "${WORKDIR}/release-step.sh"
RC=$?
set -e
echo "== 发布段退出码: ${RC} =="
echo "== git/gh 调用序列 =="
cat "${WORKDIR}/calls.log" 2>/dev/null || echo "(无)"
echo "== 结束时远端 tags =="
/usr/bin/git ls-remote --tags origin 2>/dev/null || echo "(无 tags)"
} > "$LOG" 2>&1
echo "LOG=$LOG"
cat "$LOG"
[ "$RC" = "0" ] && exit 0 || exit "$RC"