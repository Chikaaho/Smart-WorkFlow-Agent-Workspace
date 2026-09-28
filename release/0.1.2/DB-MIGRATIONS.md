# CH-aPaaS 0.1.2 数据库迁移说明

- 迁移引擎：Flyway（单数据源，`{vendor}` 目录；H2 与 PostgreSQL 双份逐字节一致）
- 迁移区间：0.1.0 终点 **V93** → 0.1.2 终点 **V102**（前向迁移，应用启动时自动执行；已应用迁移不原地修改）
- 候选提交：Smart-WorkFlow-aPaaS-server `fd704ff12af3ccd99febaa700c523d7688e91509`

| 版本 | 名称 | 内容 | 数据影响 |
|---|---|---|---|
| V94 | v011_workspace_card_types | 工作台卡片类型与低代码元数据契约（renderer_key 白名单） | 新增表 + 更新工作台布局记录 |
| V95 | admin_ia_normalization | 后台信息架构规整：菜单更名/归位/路径规范化（低代码→表单管理、流程引擎→流程管理等） | 更新既有 `sys_menu` 记录 |
| V96 | p4_reliable_events | 可靠业务事件：IoT 流程触发恢复身份列 + OpenAPI 回调持久任务 | 加列 + 新增表 |
| V97 | v012_bug011_017_menu_ia | 菜单信息架构（011/017）与租户名称唯一化（019） | 更新菜单记录 + 唯一约束 |
| V98 | v012_bug017_dict_dir_path_fix | 字典管理目录 path 与子项去重 | 更新字典记录 |
| V99 | v012_bug009_process_favorite | 流程收藏表 `sw_bpm_process_favorite` | 新增表 |
| V100 | v012_bug010_theme_rule | 流程主题规则（system 侧）：`sw_bpm_process_def.theme_rule` 列与主题表 | 加列 + 新增表 |
| V101 | v012_bug010_theme_rule_bpm | 流程主题规则（bpm 侧） | 新增表 |
| V102 | v012_bug009_favorite_audit_cols | 收藏表补 BaseEntity 审计列（create_by/update_by） | 既有表加列 |

## 兼容边界

- V95 更新的菜单记录随迁移自动生效，升级后无需手工调整菜单数据。
- 从 0.1.0 直接升级：应用启动时 V94→V102 自动前向迁移。
- 生产状态（2026-09-28 部署轮更新）：生产库 2026-09-26 已应用至 **V96**；2026-09-28 0.1.2 部署已增量应用 **V97—V102（6 个迁移，0 failed）**，生产当前终点 **V102**（部署回执 `product/v0.1.2-release/receipts/deployment-20260928.md`）。
- 迁移为前向唯一方向；回滚数据库需使用升级前的数据库备份恢复（见 ROLLBACK.md）。
