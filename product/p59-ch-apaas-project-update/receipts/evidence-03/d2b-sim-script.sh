#!/bin/sh
# D2b 受控替身验证 v2：从两仓当前 workflow 抽取真实发布段，git/gh 替身记录调用。
# S1/S2 为 Server 仓真实提交 SHA（fetch 入模拟仓）。四场景由 SCENARIO 控制。
set -u

REPO="$1"; SCENARIO="$2"; S1="$3"; S2="$4"
SIMROOT="/tmp/d2b-sim"; WORKDIR="${SIMROOT}/${REPO}-${SCENARIO}"
LOG="${SIMROOT}/${REPO}-${SCENARIO}.log"
rm -rf "$WORKDIR"; mkdir -p "$WORKDIR"
cd "$WORKDIR"

if [ "$REPO" = "server" ]; then
  WF=/tmp/p59-server-main/.github/workflows/build-release.yml
  SRCREPO=/tmp/p59-server-main
else
  WF=/tmp/p59-web-main/.github/workflows/build-release.yml
  SRCREPO=/tmp/p59-web-main
fi
WF_SHA256=$(shasum -a 256 "$WF" | awk '{print $1}')

{
echo "== 发布段来源: $WF (sha256=${WF_SHA256}) =="
echo "== 场景=${SCENARIO} S1=${S1} S2=${S2} =="

# ---- 初始化裸远端并导入真实 S1/S2 对象 ----
git init --bare -q origin.git
git clone -q origin.git work 2>/dev/null
cd work
git config user.email sim@sim.sim; git config user.name sim
git fetch -q "$SRCREPO" "$S1" "$S2"
# main 指向 S2（默认分支最新态，模拟“构建 S1 期间 main 推进到 S2”）
git branch -f main "$S2"
git push -q origin main
echo "== 远端 main HEAD=$(git ls-remote origin refs/heads/main | awk '{print $1}')（应为 S2）=="
echo "== S1=${S1} S2=${S2} =="

# ---- 场景预置 ----
if [ "$SCENARIO" = "rerun" ]; then
  git tag "build-${S1}" "$S1"; git push -q origin "refs/tags/build-${S1}"
  echo "预置: tag build-${S1} -> ${S1}（同提交重跑）"
elif [ "$SCENARIO" = "conflict" ]; then
  git tag "build-${S1}" "$S2"; git push -q origin "refs/tags/build-${S1}"
  echo "预置: tag build-${S1} -> ${S2}（异提交冲突）"
elif [ "$SCENARIO" = "queryfail" ]; then
  echo "预置: tag 查询将失败（替身 git 返回非 0）"
fi

# ---- 替身 git：拦截 ls-remote --tags 记录调用，其余委托真 git ----
mkdir -p "${WORKDIR}/bin"
cat > "${WORKDIR}/bin/git" << GITEOF
#!/bin/sh
if [ "\$1" = "ls-remote" ] && [ "\$2" = "--tags" ]; then
  echo "GIT_LSREMOTE_CALLED \$3 \$4" >> "${WORKDIR}/calls.log"
  if [ "$SCENARIO" = "queryfail" ]; then
    echo "GIT_LSREMOTE_FAILURE_SIMULATED" >> "${WORKDIR}/calls.log"
    exit 1
  fi
  /usr/bin/git ls-remote --tags "\$3" "\$4"
  exit \$?
fi
/usr/bin/git "\$@"
GITEOF
chmod +x "${WORKDIR}/bin/git"

# ---- 替身 gh：状态机（release view/delete/create；view 依远端 tag 存在性；delete 仅删 Release 保留 tag；create 打 tag 指向 --target） ----
cat > "${WORKDIR}/bin/gh" << 'GHEOF'
#!/bin/sh
# gh 调用形态: gh release view|delete|create <tag> [flags]
SUB="$1"; CMD="$2"; shift 2 2>/dev/null || shift
echo "GH_CALL ${CMD} $*" >> "${WORKDIR}/calls.log"
case "$CMD" in
  view)
    TAG="$1"
    # ls-remote 无匹配仍返回 0：以输出是否非空判定 release 存在
    if [ -n "$(/usr/bin/git ls-remote --tags origin "refs/tags/${TAG}" 2>/dev/null)" ]; then
      echo "GH_VIEW release_exists ${TAG}" >> "${WORKDIR}/calls.log"; exit 0
    else
      echo "GH_VIEW release_absent ${TAG}" >> "${WORKDIR}/calls.log"; exit 1
    fi
    ;;
  delete)
    TAG="$1"
    # gh release delete 不带 --cleanup-tag：仅删 Release，保留 tag（不操作远端 tag）
    echo "GH_DELETE release_only ${TAG} (tag 保留)" >> "${WORKDIR}/calls.log"; exit 0
    ;;
  create)
    TAG="$1"
    TARGET=""
    while [ $# -gt 0 ]; do
      if [ "$1" = "--target" ]; then TARGET="$2"; shift 2; else shift; fi
    done
    # 若 tag 已存在且指向其他提交则 gh 会失败；这里由发布段前置 ls-remote 保证不会发生
    /usr/bin/git tag "${TAG}" "${TARGET}" 2>/dev/null
    /usr/bin/git push -q origin "refs/tags/${TAG}" 2>/dev/null
    echo "GH_CREATE tag=${TAG} target=${TARGET} now=$(git rev-parse ${TAG} 2>/dev/null)" >> "${WORKDIR}/calls.log"
    exit 0
    ;;
  *)
    echo "GH_UNKNOWN ${CMD}" >> "${WORKDIR}/calls.log"; exit 1
    ;;
esac
GHEOF
chmod +x "${WORKDIR}/bin/gh"

# ---- 抽取发布段（真实 workflow 代码，仅替换 Actions 上下文表达式为本地实际值） ----
python3 - "$WF" "$REPO" > release-step.sh << 'PYEOF'
import re, sys
wf = open(sys.argv[1]).read()
repo = sys.argv[2]
m = re.search(r'- name: Create GitHub Release\n(?:.*\n)*?        run: \|\n((?:          .*\n)+)', wf)
if not m:
    print("ERROR: release step not found", file=sys.stderr); sys.exit(1)
lines = [l[10:] if l.startswith('          ') else l for l in m.group(1).splitlines()]
while lines and not lines[-1].strip():
    lines.pop()
body = '\n'.join(lines)
# GitHub Actions 表达式替换为本地实测值（保持发布段命令结构不变）
body = body.replace("${{ steps.locate.outputs.version }}", "1.0.0-SNAPSHOT")
body = body.replace("${{ steps.locate.outputs.jar }}", "sw-bootstrap/target/bootstrap.jar")
body = body.replace("${{ steps.locate.outputs.jar_name }}", "bootstrap.jar")
body = body.replace("${{ steps.package.outputs.version }}", "0.0.0")
print(body)
PYEOF
echo "== 发布段抽取: $(wc -l < release-step.sh) 行 =="

# ---- 产物占位 ----
if [ "$REPO" = "server" ]; then
  mkdir -p sw-bootstrap/target; touch sw-bootstrap/target/bootstrap.jar
  echo "产物占位: sw-bootstrap/target/bootstrap.jar"
else
  touch "dist-${S1}.zip"; echo "产物占位: dist-${S1}.zip"
fi

# ---- 执行发布段 ----
export PATH="${WORKDIR}/bin:$PATH"
export GITHUB_SHA="$S1"
export GITHUB_TOKEN="sim-token"
export WORKDIR
sh release-step.sh
RC=$?
echo "== 发布段退出码: ${RC} =="
echo "== git/gh 调用序列 =="
cat "${WORKDIR}/calls.log" 2>/dev/null || echo "(无调用记录)"
echo "== 结束时远端 tags =="
/usr/bin/git ls-remote --tags origin 2>/dev/null || echo "(无 tags)"
} > "$LOG" 2>&1
cat "$LOG"
exit 0
