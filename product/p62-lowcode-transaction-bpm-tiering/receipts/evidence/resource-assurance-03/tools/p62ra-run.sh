#!/bin/zsh
# P62 资源保障证据运行包装（RA01b 运行身份三件套 + 命令/退出码/时点留档）
# usage: p62ra-run.sh <evidenceDir> <runId> <surefireTestSelector> [extra -D... 参数...]
set -u
EV="$1"
RUNID="$2"
SEL="$3"
shift 3
REPO=/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server
cd "$REPO" || exit 90
FN=$(find sw-biz/sw-bpm/sw-bpm-process/target/classes sw-bootstrap/target/test-classes -type f 2>/dev/null \
  | sort | xargs shasum -a 256 | shasum -a 256 | cut -c1-32)
STATUS_SHA=$(git status --porcelain | shasum -a 256 | cut -c1-32)
HEAD_SHA=$(git rev-parse HEAD)
WS="HEAD=${HEAD_SHA}|porcelain_sha256=${STATUS_SHA}|clean=$([ "$STATUS_SHA" = "e3b0c44298fc1c149afbf4c8996fb924" ] && echo yes || echo no)"
mkdir -p "$EV"
START=$(date -Iseconds)
{
  echo "runId=$RUNID"
  echo "evidenceDir=$EV"
  echo "repo=$REPO"
  echo "branch=$(git rev-parse --abbrev-ref HEAD)"
  echo "head=$HEAD_SHA"
  echo "worktree=$WS"
  echo "artifactFingerprint=$FN"
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
  grep -E "P62-EV" "$EV/run-console.log" | tail -5
} >> "$EV/run-identity.txt"
echo "exitCode=$RC end=$END"
grep -E "Tests run:.*(Failures|Errors)" "$EV/run-console.log" | tail -2
