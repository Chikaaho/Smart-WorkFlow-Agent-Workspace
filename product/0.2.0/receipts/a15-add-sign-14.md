# 0.2.0 统一执行·批次 13（A15 节点操作与加签：位置/模式/闸门/表决/恢复链/补签/取消/越权）

2026-10-25｜Executor｜PG dev 环境（同稳定对象）；零代码改动（既有实现的真实行为链）

## 真实链（API 直连 8080＋PG 直读；被加签人=t100nobody 9101）

1. **前加签＋并行**：`POST /tasks/{taskId}/add-sign {participants:[9101], mode:PARALLEL, signPosition:BEFORE}` → sw_bpm_sign_record `ADD_SIGN/PARALLEL/9101/seq0/PENDING`＋TASK_SIGN_REQUESTED 通知；UI 弹窗（顺序/位置/备注）形态沿 W020 既有视觉证据。
2. **闸门（原办理人最后完成）**：加签 PENDING 期间原办理人提交完成 → 执行段 **「存在待处理加签，不能直接办理」** → 有界重试 5 次 → **命令终态失败**。
3. **表决**：被加签人 `/sign/pending` 可见（recordId/mode/position）→ `/sign/{recordId}/express` → 记录 **DONE**＋「加签表决完成（原待办保留，由原责任人办理）」。
4. **恢复链**：表决前终态失败的命令重放 → FAILED 重新入队 → 撞准入截止 EXPIRED（如实记录：截止 30s 内未决即过期）→ 再次提交生成 **:R1 恢复命令**（`EXPIRED 命令生成恢复命令` 日志，原命令行独立保留）→ 执行 → 实例 `469f6516` **APPROVED**。
5. **补签不改终态**：APPROVED 实例 `/instances/{pid}/supplement-sign` → code 0，状态保持 **APPROVED**。
6. **后加签＋串行＋取消**：AFTER/SERIAL 记录 PENDING → `/sign/{recordId}/cancel` → **CANCELLED** → 取消后原办理人完成不受闸门阻挡（实例正常推进）。
7. **越权**：nobody 对他人任务 add-sign → **同步 403**（workflow:task:add-sign 缺失）；nobody 审批他人任务 → 执行段「无权处理该任务」（批次 12）。

## 边界与剩余

- 串行的顺序办理轨迹（SERIAL 多人逐个）本轮以记录/契约字段（modeType/seqNo/serialBlocked）＋取消段承接，SERIAL 多人逐个的实际办理轨迹未单独造链——如实记录。
- A12 函数目录、富文本、通知、节点高级、A03—A05 归后续批次；Owner 新 UI 反馈（顶栏折叠入口）单列批次 14。

## 服务收尾

- 服务保持运行至批次 14（同环境连续 UI 整改），随批次 14 一并净停。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
