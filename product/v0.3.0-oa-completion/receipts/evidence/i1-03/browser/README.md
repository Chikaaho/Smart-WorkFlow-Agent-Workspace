# 浏览器真实操作证据索引（G1b，i1-03）

| 文件 | 场景 | 证据点 |
|---|---|---|
| 01-dept-leader-column.png | admin→部门管理 | 修复挂载加载后，I1D1/I1D2 负责人列正确回显"岗位任职王五" |
| 02-role-member-added.png | 角色成员弹窗-添加 | 搜索 i1_init → 选项 → 添加成功 toast；列表出现 i1_init/流程发起人李四/移除 |
| 03-role-member-removed.png | 角色成员弹窗-移除确认 | 移除确认框（确定将该用户移出角色"I1证据角色"吗?） |
| 04-role-member-removed-done.png | 角色成员弹窗-移除完成 | "成员已移除" toast；列表回空 |

对应 DB 回读：添加后 sys_user_role 出现 i1_init↔I1_ROLE(deleted=0)；移除后 0 行（见回执 03 §G1b）。
