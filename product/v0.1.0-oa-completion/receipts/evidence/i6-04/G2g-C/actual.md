# G2g-C 实际结果（effect-raw.log + effect-chainC/D/E.log + db-effect.txt）

## 正向（规则对后续真实投递生效）
- 组合规则生效：I6G2G_CE（IN_APP,EMAIL，接收人=ASSIGNEE）启用时，链A 任务 6a780436 双渠道落库
  （IN_APP SUCCESS + EMAIL FAILED · db-effect.txt 首段），组合与优先次序按规则执行
- 失败策略生效：RETRY 规则的 EMAIL 失败写入 attempt=1 RETRYABLE 并排定 next_retry_time（见 G1a 包 sql-backread.txt）

## 反向
- 非法组合拒绝：EMAIL-only 创建 → 400「渠道顺序必须以 IN_APP 开头（站内信保底）」（effect-raw.log 第1行）
- 停用规则不继续生效：
  - 链C（仅 I6G2G_CE 停用、R100 仍启用）EMAIL 仍出现 → 证明其他启用规则继续生效、被停用的规则退出组合
  - 链E（全部 T100 TODO_CREATED 规则停用）：链E 任务 ac353cc2 仅 IN_APP 兜底、零 EMAIL 行；
    PROCESS_APPROVED（R101 已停用）也仅 IN_APP
- 历史不改写：规则行仅 enabled 翻转（db-effect.txt 末段 id/version/update_time 不随投递变化）；
  停用前的历史消息/尝试行未删除未改写（sw_notify_message 全量对比仍在）

## 覆盖边界
- 接收人身份（不串收件人）：TODO_CREATED→10002（ASSIGNEE）、PROCESS_APPROVED→10001（INITIATOR），
  分属规则 recipient_rule 与 BPM 事件权威（BpmNotifyListener 单接收人事件），链A—E 逐行一致
- 删除规则同停用路径由 API 权限与删除接口覆盖（G3d-R 跨租户删除已证 404；同租户删除走规则管理端点，未在本包重复）
- 定时重试恢复的终态见 G1c-E（文件库），本原子不重跑
