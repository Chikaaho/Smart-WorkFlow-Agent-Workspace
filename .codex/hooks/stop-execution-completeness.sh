#!/bin/sh

# Only inspect the point where Claude is about to hand control back. This hook
# does not run on ordinary tool calls and does not change bypassPermissions.
input=$(cat)

transcript_path=$(printf '%s' "$input" | /usr/bin/jq -r '.transcript_path // ""')

# This project also has Planner and Admin sessions. Enable the completion gate
# only when the latest explicit canonical role assignment is Executor. The
# optional active_role field exists only to make the command easy to self-test.
active_role=$(printf '%s' "$input" | /usr/bin/jq -r '.active_role // ""')
if [ -z "$active_role" ] && [ -r "$transcript_path" ]; then
  active_role=$(
    /usr/bin/jq -r '
      def message_text:
        if type == "string" then .
        elif type == "array" then
          [ .[] | select(.type == "text") | .text ] | join(" ")
        else ""
        end;
      select(.type == "user") | .message.content | message_text
    ' "$transcript_path" 2>/dev/null |
      awk '
        /你是执行层|你是执行角色|本会话角色[：: ]*执行|授予你执行权限|以执行身份|以执行角色/ { role="executor"; next }
        /你是规划层|你是规划角色|本会话角色[：: ]*规划|授予你规划权限|以规划身份|以规划角色/ { role="planner"; next }
        /你是管理员|本会话角色[：: ]*管理员|授予你管理员权限|以管理员身份|以管理员角色/ { role="admin"; next }
        END { print role }
      '
  )
fi

if [ "$active_role" != "executor" ]; then
  exit 0
fi

message=$(printf '%s' "$input" | /usr/bin/jq -r '.last_assistant_message // ""')
background_count=$(printf '%s' "$input" | /usr/bin/jq '[.background_tasks[]? | select(.status == "running" or .status == "pending" or .status == "in_progress")] | length')

if [ "$background_count" -gt 0 ]; then
  printf '%s\n' '{"decision":"block","reason":"仍有后台任务或 Sub Agent 在运行。请等待并回收其结果，完成当前授权任务的全部剩余项后再结束。"}'
  exit 0
fi

# Catch explicit self-admission of unfinished work, including the failure mode
# where a compacted summary says NOT YET DONE but the main agent still stops.
if printf '%s' "$message" | grep -Eiq 'NOT YET DONE|PENDING|IN_PROGRESS|尚未完成|还未完成|仍未完成|任务还没结束|剩余(任务|工作|步骤|事项)|还需(完成|处理|更新|执行)|待(完成|处理|更新|执行)|下一步(继续|需要|应当|还要)'; then
  printf '%s\n' '{"decision":"block","reason":"最终回复仍明确包含未完成项。当前执行任务尚未达到 COMPLETED 或 BLOCKED；请恢复剩余清单并连续执行，不得用阶段性汇报结束任务。"}'
  exit 0
fi

# Executor sessions must make a verifiable terminal claim. Ordinary progress
# reports, summaries after one subtask, and recoverable-error reports are not
# terminal states and must return to the agent loop.
if printf '%s' "$message" | grep -Fq '执行终态：COMPLETED'; then
  exit 0
fi

if printf '%s' "$message" | grep -Fq '执行终态：BLOCKED' &&
   printf '%s' "$message" | grep -Fq '阻塞类型：EXTERNAL' &&
   printf '%s' "$message" | grep -Fq '解除条件'; then
  exit 0
fi

printf '%s\n' '{"decision":"block","reason":"执行会话缺少合法终态。单项完成、阶段性总结或可恢复异常均不能结束父任务。请重新读取需求方向、审查结论和剩余清单，继续执行；只有全部闭环后才能声明“执行终态：COMPLETED”，真实外部阻塞才可按协议声明 BLOCKED。"}'
exit 0
