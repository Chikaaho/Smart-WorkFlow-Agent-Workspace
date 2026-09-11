# G4a 五态浏览器映射证据

## 采集（浏览器 admin 会话，snapshotId=i3-05-frozen-b jar 1172aff5…）
- 前端筛选修复：ProcessInstanceList.vue 状态筛选补齐六态（运行中/已完成/已驳回/已撤回/已废弃/失败）
  （此前只有 3 个选项，失败/废弃/撤回无法筛选——G4a 映射反证已修，vite dev 热更验证）
- g4a-01 筛选「失败」→ g4a-failed 实例列表行：状态徽标红色「失败」
- g4a-02 实例详情弹层：实例 ID=9984de5a-adba-11f1-b465-8e7a76db281d、业务单号 e33d0307-…、
  状态「失败」徽标；流程图节点映射：START（已走过边框）→ g4a审批（绿色=已完成）
  → 条件分支（灰色=未到达）→ END（灰色=未到达）；tabs「活跃节点/已完成节点」

## 服务端五态实例 ID（step4a-failed.json）
- RUNNING: 247b53af-adaf-11f1-bb59-8e7a76db281d
- DISCARDED: 6b1e5d49-adaf-11f1-a94e-8e7a76db281d
- WITHDRAWN: 68602799-adaf-11f1-a94e-8e7a76db281d
- FAILED: 9984de5a-adba-11f1-b465-8e7a76db281d（真实失败：分支求值 2311 → updateStatus(FAILED)，非 WITHDRAWN/DISCARDED 代替）
- APPROVED: 见 g6_g11/step20.json（G6 场景 approved 实例，如 bpm_56396a349ab54f54 APPROVED 徽标）

## 服务端状态回读
- sw_bpm_instance.status='FAILED'，complete 响应 code=2311「分支条件求值失败: 表达式比较类型不匹配」
