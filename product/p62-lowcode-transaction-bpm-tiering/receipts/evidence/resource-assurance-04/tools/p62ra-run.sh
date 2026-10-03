#!/bin/zsh
# P62 资源保障证据运行包装 v2（RA01b：运行身份三件套 + 制品指纹算法/文件集显式化）
# usage: p62ra-run.sh <evidenceDir> <runId> <surefireTestSelector> [extra -D... 参数...]
#   - 制品指纹 artifactFingerprint = SHA-256(排序后的 "sha256␣␣相对路径" 清单全文)，清单落盘
#     artifact-manifest.sha256（文件集=仓库内全部 */target/classes/** 与 */target/test-classes/**，
#     即本进程实际加载的编译产物；算法与文件集随 run 一并归档，可独立复算）
#   - worktreeStatus = HEAD 全 SHA + `git status --porcelain` 的 SHA-256（仅说明工作树是否 clean，
#     不证明源码内容——源码内容由 HEAD + 制品指纹 + 清单共同承载）
set -u
EV="$1"; RUNID="$2"; SEL="$3"; shift 3
REPO=/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server
cd "$REPO" || exit 90
MANIFEST="$EV/artifact-manifest.sha256"
mkdir -p "$EV"
find . -type f \( -path "*/target/classes/*" -o -path "*/target/test-classes/*" \) 2>/dev/null \
  | sort | xargs shasum -a 256 > "$MANIFEST"
FN=$(shasum -a 256 "$MANIFEST" | cut -d' ' -f1)
FILE_COUNT=$(wc -l < "$MANIFEST" | tr -d ' ')
MANIFEST_SHA=$(shasum -a 256 "$MANIFEST" | cut -d' ' -f1)
STATUS_SHA=$(git status --porcelain | shasum -a 256 | cut -d' ' -f1)
HEAD_SHA=$(git rev-parse HEAD)
WS="HEAD=${HEAD_SHA}|porcelain_sha256=${STATUS_SHA}|clean=$([ "$STATUS_SHA" = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" ] && echo yes || echo no)"
START=$(date -Iseconds)
{
  echo "runId=$RUNID"
  echo "evidenceDir=$EV"
  echo "repo=$REPO"
  echo "branch=$(git rev-parse --abbrev-ref HEAD)"
  echo "head=$HEAD_SHA"
  echo "worktree=$WS"
  echo "artifactFingerprint=$FN"
  echo "artifactFingerprintAlgorithm=SHA-256 over sorted 'sha256  path' manifest lines"
  echo "artifactFingerprintFileSet=all files under */target/classes/** and */target/test-classes/** (repo-wide)"
  echo "artifactFileCount=$FILE_COUNT"
  echo "artifactManifest=artifact-manifest.sha256 sha256=$MANIFEST_SHA"
  echo "testSelector=$SEL"
  echo "extraProps=$*"
  echo "start=$START"
} > "$EV/run-identity.txt"
MAVEN_OPTS="-Xmx2g" mvn -pl sw-bootstrap -am test \
  -Dtest="$SEL" -Dp62.runId="$RUNID" -Dp62.evidence.dir="$EV" \
  -Dp62.build.commit="$HEAD_SHA" -Dp62.worktree.status="$WS" \
  -Dp62.artifact.fingerprint="$FN" "$@" \
  -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false \
  > "$EV/run-console.log" 2>&1
RC=$?
END=$(date -Iseconds)
{
  echo "exitCode=$RC"
  echo "end=$END"
  grep -E "Tests run:.*(Failures|Errors)" "$EV/run-console.log" | tail -3
  grep -E "P62-EV" "$EV/run-console.log" | tail -8
} >> "$EV/run-identity.txt"
echo "exitCode=$RC end=$END"
grep -E "Tests run:.*(Failures|Errors)" "$EV/run-console.log" | tail -2
