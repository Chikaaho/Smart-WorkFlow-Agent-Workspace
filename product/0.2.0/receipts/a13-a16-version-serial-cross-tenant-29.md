# A13—A16：版本冻结、串行加签多人轨迹、同对象跨租户负向

2026-10-26｜Executor｜批次29，对应 A13/A14 绑定版本与监听、A15 多人串行轨迹、A16 跨租户同对象负向；同时修正 W020 通知配置在后续设计器保存/发布中的丢失。

## 一、A13/A14：发布版本冻结与旧实例绑定

- 流程定义 `2114316486343405570`（processKey `bpm_3e373530637b4888`，A16 全链流程）已发布 v1—v7；每个版本在 `sw_bpm_process_def_version` 保存独立 `graph_json` 快照与 `form_version=2`。
- 快照差异（PG 实查）：
  - v3：`triggers` 1 条，无 notification；旧实例 `2114327413025411073`、`2114330434610524161`、`2114332461289828353` 等保持 `def_version=3`。
  - v4：1 条触发器 + notification 对象（发起人/审批人/站内信/邮件/其他接收人 9101）。
  - v6：2 条触发器（含节点脚本）+ notification 键存在但值为 null（原因见第四节）。
  - v7：2 条触发器 + notification 对象，`published_version=7`。
- 旧实例（3）与 v4/v6/v7 新实例各自按创建时 `def_version` 读取快照；新配置/新触发器未追溯旧实例。已发布版本页只读预览，不在本批改动。

## 二、A15：串行加签多人真实轨迹

- 实例 `2114449539401322498`（defVersion=6），任务 `1fed68f3-d0b0-11f1-ab27-00ff9e2a8dfb`（node_1 主管审批，办理人 9001）。
- 加签请求：`ADD_SIGN`，`mode=SERIAL`，`signPosition=BEFORE`，参与人 **9101（seq 0）**、`t100serial`（id `2114450614086864898`，seq 1）。
- PG `sw_bpm_sign_record` 实查：
  - `2114450800175550466` seq0 / participant 9101 / DONE / APPROVE；
  - `2114450800217493506` seq1 / participant 2114450614086864898 / DONE / APPROVE。
- 乱序尝试：seq1 在 seq0 未表态前办理被拒绝，提示“串行加签存在前置未表态记录”，记录保持 PENDING；seq0 完成后 seq1 的 `serialBlocked=false`，再按顺序 DONE。原任务在所有加签完成后才由 9001 正式 APPROVE。
- 64 位参与人 id 以 JSON **字符串**提交，避免浏览器 Number 精度把 `2114450614086864898` 舍入为 `...65000`；这是本批实际踩到并修正的边界。
- 最终 `sw_bpm_approval_action` 4 行：ADD_SIGN（9001，SIGN_REQUESTED）、SIGN_APPROVE（9101）、SIGN_APPROVE（2114450614086864898）、APPROVE（9001，APPROVED，command 2114451368549879809 COMPLETED）；实例状态 APPROVED。

## 三、A16：第二活跃租户对同一对象的负向

- 第二活跃租户 `demo-org-a`（tenant 9001）用户 `91101`，对租户100 的同一任务 `1fed68f3...` 发起审批命令 `2114449967115472898`：
  - `sw_bpm_command.status=FAILED`，`failure_reason=无权处理该任务`，`tenant_id=9001`，payload 中 taskId 指向租户100任务；
  - `sw_bpm_approval_action` **没有** 91101 的任何行；
  - 任务随后仍由租户100 的 9001 正式完成，实例 APPROVED，证明负向尝试零越权效果。
- 同一跨租户身份读取该任务被拒绝“无权查看该任务”；读取同一目标表单定义返回“表单不存在”。HTTP 200 未当作业务成功，按响应体失败码与零副作用判定。

## 四、W020 通知配置版本保留修复（批次27 的补正）

批次27 曾写“notification（v4 配置）随 v6 图继续保留”，PG 实查 v5/v6 的 `notification` 为 null，该表述不成立。根因：设计器 `load()` 未把 `definition.notification` 放入 `DesignerGraph`，`buildGraphPayload()` 只合并 variables/triggers，后续保存/发布把 50:88 配置覆盖为空。

- 修复 Web `110967d..f78dcea`（`codex/0.2.0-ui-tenant-form-flow`，已推送）：
  - `DesignerGraph` 增加 `notification`，加载时保留；
  - 新增 `buildDesignerGraphPayload(serialized, graph)`，保存时原样带回 notification；旧定义无配置时不新造字段；
  - 3 个单元测试覆盖“保留 / 旧定义不新造 / null 不写成显式关闭”。
- 真实链：50:88 页重新保存 notification（发起人+审批人+站内信，其他接收人 9101）→ 设计器打开并保存 → PG 草稿 notification 仍为对象 → 发布 v7 → v7 冻结快照 notification 为 `{initiator:true,approvers:true,channels:["IN_APP"],otherRecipientIds:["9101"]}`。
- 批次26 的另一处口径补正：v4 首次实例 `42888703-...` 的 9101 行标题为“您的申请已通过”（当时运行时尚未使用最终收件人文案），不能作为“其他接收人中性文案”的证据；最终文案以第二次实例 `b666e3ea-...` 的 9101 行“流程已通过 / 您关注的流程已审批通过”为准。

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **215 文件通过/1 跳过，1871 通过/3 跳过**、build 3.83s（`/tmp/web-fourgate-29.log`）。
- 服务端本批零改动；上一批 `49c320f` 的租户 403 修复与 `66ca50b` 的通知/版本链保持。
- `vite.config.ts` 与根工作区既有在途治理文件未提交、未触碰。

## 未验证/边界

- A15 乱序拒绝为真实接口响应与最终库态证明，未保留被拒瞬间的数据库快照；seq1 最终 DONE 且顺序号正确。
- A16 表单“表单不存在”为跨租户读取响应，未在本批重跑全部表单/实例读接口矩阵。
- 通知配置 v7 已冻结，但 v7 新实例的收件人副本、邮件渠道仍未重跑；沿用批次26 的站内信真实投递证据，不虚报邮件送达。
- 修复后截图仍受宿主 surface/rAF/OS 捕获限制，本批无 PNG；A03—A05 正式像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
