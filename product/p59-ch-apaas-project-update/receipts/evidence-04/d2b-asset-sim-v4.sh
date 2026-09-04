#!/bin/sh
# D2b-asset 受控替身验证 v4：完整发布段抽取（保留 EOF 末行）+ 资产参数强制校验。
# 用法: run-release-v4.sh <server|web> <fresh|rerun> <S1> <S2>
set -u

REPO="$1"; SCENARIO="$2"; S1="$3"; S2="$4"
SIMROOT="/tmp/d2b-v4"; WORKDIR="${SIMROOT}/${REPO}-${SCENARIO}"
LOG="${SIMROOT}/${REPO}-${SCENARIO}.log"
rm -rf "$WORKDIR"; mkdir -p "$WORKDIR"
cd "$WORKDIR"

if [ "$REPO" = "server" ]; then
  WF=/usr/local/projects/Smart-WorkFlow/product/p59-ch-apaas-project-update/receipts/evidence-04/d2b-asset-server-workflow-6ab9ae5.yml
  SRCREPO=/tmp/p59-server-main
  SRCCOMMIT=6ab9ae50080b2ae884eefaa728ae021702661ece
else
  WF=/usr/local/projects/Smart-WorkFlow/product/p59-ch-apaas-project-update/receipts/evidence-04/d2b-asset-web-workflow-f9dca42.yml
  SRCREPO=/tmp/p59-web-main
  SRCCOMMIT=f9dca42317e33fd31254ed38d6c28f34473d40e5
fi
WF_SHA256=$(shasum -a 256 "$WF" | awk '{print $1}')
WF_BLOB=$(git -C "$SRCREPO" rev-parse "$SRCCOMMIT:.github/workflows/build-release.yml")

{
echo "== D2b-asset 完整发布段验证 =="
echo "== workflow 副本: $WF =="
echo "== 源提交(SRCCOMMIT)=${SRCCOMMIT} 源blob=${WF_BLOB} 文件sha256=${WF_SHA256} =="
echo "== 场景=${SCENARIO} S1=${S1} S2=${S2} =="

# 远端初始化：main=S2（模拟构建 S1 期间 main 推进）
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

# ---- 替身 git：拦截 ls-remote --tags 记录调用；其余委托真 git ----
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

# ---- 替身 gh：状态机 + 资产参数强制校验 ----
cat > "${WORKDIR}/bin/gh" << 'GHEOF'
#!/bin/sh
# 调用形态: gh release view|delete|create <tag> [flags] [asset...]
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
    # 解析 --target 与资产参数：跳过已知 flags
    TARGET=""
    ASSETS=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --target) TARGET="$2"; shift 2 ;;
        --title|--notes) shift 2 ;;
        *) ASSETS="${ASSETS} $1"; shift ;;
      esac
    done
    # 资产参数强制校验：必须存在非空
    if [ -z "${ASSETS}" ]; then
      echo "GH_CREATE_FAIL no_assets tag=${TAG}" >> "${WORKDIR}/calls.log"; exit 1
    fi
    for a in ${ASSETS}; do
      path="${a%%#*}"   # 去掉 #displayname 后缀
      if [ ! -f "${path}" ] || [ ! -s "${path}" ]; then
        echo "GH_CREATE_FAIL missing_or_empty ${path}" >> "${WORKDIR}/calls.log"; exit 1
      fi
    done
    /usr/bin/git tag "${TAG}" "${TARGET}" 2>/dev/null
    /usr/bin/git push -q origin "refs/tags/${TAG}" 2>/dev/null
    echo "GH_CREATE_OK tag=${TAG} target=${TARGET} assets=[${ASSETS}] now=$(git rev-parse ${TAG} 2>/dev/null)" >> "${WORKDIR}/calls.log"
    exit 0
    ;;
  *)
    echo "GH_UNKNOWN ${CMD}" >> "${WORKDIR}/calls.log"; exit 1
    ;;
esac
GHEOF
chmod +x "${WORKDIR}/bin/gh"

# ---- 完整发布段抽取（python 全文逐行，保留 EOF 末行；替换 Actions 上下文表达式） ----
python3 - "$WF" "$REPO" > release-step.sh << 'PYEOF'
import sys
body = open(sys.argv[1]).read()
repo = sys.argv[2]
# 按物理行拆分（保留末行，即使无换行结尾），再剥离 YAML run 块缩进（10 空格）
raw = body.split('\n')
# 定位 run: | 所在行
start = None
for i, line in enumerate(raw):
    if 'run: |' in line:
        start = i + 1
        break
assert start is not None, "run: | not found"
out = []
for line in raw[start:]:
    if not line.strip() and not out:
        continue
    out.append(line[10:] if line.startswith('          ') else line)
text = '\n'.join(out)
# 末行若为空行则剔除
while text.endswith('\n\n'):
    text = text[:-1]
text = text.rstrip('\n') + '\n' if text.endswith('\n') else text + '\n'
# Actions 上下文表达式 → 本地实测值（仅替换值，命令结构不变）
text = text.replace("${{ steps.locate.outputs.version }}", "1.0.0-SNAPSHOT")
text = text.replace("${{ steps.locate.outputs.jar }}", "sw-bootstrap/target/bootstrap.jar")
text = text.replace("${{ steps.locate.outputs.jar_name }}", "bootstrap.jar")
text = text.replace("${{ steps.package.outputs.version }}", "0.0.0")
sys.stdout.write(text)
PYEOF
echo "== 发布段($(grep -c '' release-step.sh) 行含末行) =="
echo "== 末行为: [$(tail -1 release-step.sh)] =="

# ---- 非空隔离样本产物 ----
if [ "$REPO" = "server" ]; then
  mkdir -p sw-bootstrap/target
  printf 'sample-jar-bytes-2026-09-04\n' > sw-bootstrap/target/bootstrap.jar
  echo "样本产物: sw-bootstrap/target/bootstrap.jar（非空 $(wc -c < sw-bootstrap/target/bootstrap.jar) 字节）"
else
  printf 'sample-dist-zip-bytes-2026-09-04\n' > "dist-${S1}.zip"
  echo "样本产物: dist-${S1}.zip（非空 $(wc -c < dist-${S1}.zip) 字节）"
fi

export PATH="${WORKDIR}/bin:$PATH"
export GITHUB_SHA="$S1"
export GITHUB_TOKEN="sim-token"
export WORKDIR
sh release-step.sh
RC=$?
echo "== 发布段退出码: ${RC} =="
echo "== git/gh 调用序列 =="
cat "${WORKDIR}/calls.log" 2>/dev/null || echo "(无)"
echo "== 结束时远端 tags =="
/usr/bin/git ls-remote --tags origin 2>/dev/null || echo "(无 tags)"
} > "$LOG" 2>&1
cat "$LOG"
exit 0