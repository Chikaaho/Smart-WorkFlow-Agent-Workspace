#!/usr/bin/env bash
# 统一命令记录器：把「命令 / 工作目录 / 开始结束时间 / 真实退出码 / 原始输出」追加写入日志。
# 使用 set -o pipefail + tee，并用 PIPESTATUS[0] 取被管道左端命令（Maven）的真实退出码，
# 避免 tee 的成功退出掩盖 Maven 失败。
#
# 用法: run-logged.sh <日志文件> <工作目录> <命令> [参数...]
set -o pipefail

LOG="$1"; shift
WORKDIR="$1"; shift

CMD_TEXT="$*"
START="$(date -Iseconds)"

{
  echo "================================================================"
  echo "# command: $CMD_TEXT"
  echo "# cwd: $WORKDIR"
  echo "# start: $START"
  echo "----------------------------------------------------------------"
} >> "$LOG"

( cd "$WORKDIR" && "${@}" ) 2>&1 | tee -a "$LOG"
CODE="${PIPESTATUS[0]}"

END="$(date -Iseconds)"
{
  echo "----------------------------------------------------------------"
  echo "# end: $END"
  echo "# exit_code: $CODE"
  echo "================================================================"
} >> "$LOG"

exit "$CODE"
