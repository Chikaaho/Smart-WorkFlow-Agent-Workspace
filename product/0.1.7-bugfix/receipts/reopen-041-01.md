# 第41项线上组织种子与管理员密码返修回执 01

2026-10-18｜Executor。依据 `product/0.1.7-bugfix/ready/direction-reopen-041-production-seed.md`（L，延续原第41项）与规划纠正 `receipts/planning-reopen-041.md`；探索回传 `search_fallback/reopen-041-production-seed.md`。**结论先行**：线上组织种子实际已入库（两租户各 7 节点/14 用户），Owner 现象由**租户隔离可见性**解释；admin 口令线上此前未更新，本轮按授权完成一次性更新并通过新旧口令正反向验证；9001/9002 组织数据经对应租户管理员身份在正常后台入口可见（最小截图与 URL 见 §3）。

## §1 环境关联与事实基线（同一目标线上环境）

| 项 | 值 |
|---|---|
| 域名/入口 | `https://chikaho.cn`（前端 `/opt/smart-workflow/web`；API `/sw-server/api`） |
| 运行制品 | `bootstrap.jar` sha256 `309e9e1ea33665aaa5cf020f7c9af71b7090d73bc63952f446b107303c325826`（218,033,508 B）＝0.1.7 发布源 `5af1329` 的 CI 制品；服务运行中，健康 `UP` |
| 数据库 | 本机 PostgreSQL 5433 `smart_workflow`；`flyway_schema_history` versioned 终点单条 **0.1.7**（checksum `2016046975`）＋`R__ 0.1.7 catalog menu first`、`R__ 0.1.7 org demo seed`（success=t） |
| 登录身份（验证用） | `admin`（tenant 0，超级管理员）、`demo_a_hq_1`（tenant 9001 租户管理员）、`demo_b_hq_1`（tenant 9002 租户管理员） |

## §2 按租户组织数据与迁移对应（脱敏查询结果）

- 组织树（每租户 7 节点；父子关系与 Owner 结构一致）：总公司 ├ 分公司1 ├ 分公司2（├ 部门1 └ 部门2 └ 团队1）└ 分公司3；9001 id 前缀 91xxx、9002 92xxx，全部 `status=0`、`deleted=0`。
- 用户：每租户 14 人（每节点 2 人，`demo_{a|b}_{hq|br1|br2|br3|dept1|dept2|team1}_{1|2}`），`dept_id` 与节点逐一对应；`sys_user` 按租户 alive/total＝0:1/1、9001:14/14、9002:14/14；`sys_dept`＝0:1/1、9001:7/7、9002:7/7（无软删残留/重复）。
- 角色关联：9001 → 9501 租户管理员 `demo_admin`（data_scope=ALL，授 `demo_a_hq_1`）、9502 普通用户 `demo_user`（data_scope=SELF，授其余 13 人）；9002 → 9503/9504 同构（`demo_b_hq_1` 为租户管理员）。租户管理员授权集含后台用户/部门/角色等菜单（80 项）。
- 迁移执行 ↔ 实际数据：R__ `0.1.7 org demo seed` 的幂等插入与库内租户/部门/用户/角色/关联一一相符（"种子未入库"结论**不成立**）。

## §3 可见浏览器验证（用户可见，最小截图）

| 身份（租户） | 页面 | 结果 | URL | 截图（本机留存） |
|---|---|---|---|---|
| `demo_a_hq_1` 张伟（9001 管理员） | 用户管理 | 「共 14 条」demo_a_* 14 人 | `/system/user` | `evidence/reopen-041/uat-01-9001-users.png` |
| `demo_a_hq_1` 张伟（9001 管理员） | 部门管理 | 7 节点树（demo-a-*，负责人与用户对应） | `/system/dept` | `evidence/reopen-041/uat-02-9001-depts.png` |
| `demo_b_hq_1` 张伟（9002 管理员） | 部门管理 | 7 节点树（demo-b-*） | `/system/dept` | `evidence/reopen-041/uat-04-9002-depts.png` |
| `demo_b_hq_1` 张伟（9002 管理员） | 用户管理 | 「共 14 条」demo_b_* | `/system/user` | （同页结构，文本核对） |
| `admin` 系统管理员（tenant 0） | 用户管理 | 「共 1 条」仅 admin（复现 Owner 截图） | `/system/user` | `evidence/reopen-041/uat-03-admin-users-only-tenant0.png` |

- 网络索引（页面请求，脱敏）：`/sw-server/api/auth/refresh`、`/api/system/auth/me`、`/api/system/auth/menus`、`/api/system/user/page?pageNum=1&pageSize=10`、`/api/system/dept/*`（均 200）。
- 证据位置：`product/0.1.7-bugfix/receipts/evidence/reopen-041/`（按现行证据规则**仅本机留存**，未入库）。工具限制如实记录：验证码为 4 位小写字母/数字图像，自动化读图存在误读，最终采用画布阈值化放大读取（样例 `captcha-method-sample.png`）；期间出现 1 次挑战接口瞬时不可用（重载恢复），未绕过认证、未放宽隔离。截图为最小必要集，未冒充更广的正式视觉验收。

## §4 管理员口令更新（目标身份、执行与正反向验证；不含秘密）

- 目标身份：`sys_user` id=1、`username=admin`、`tenant_id=0`、`deleted=0`。
- 变更前状态：散列≠目标散列（布尔比对 f）；服务器无引用目标值的更新脚本；`admin/admin123`（种子默认）登录**成功** → Owner"密码未按要求修改"属实。
- 执行：一次性单行更新（`UPDATE 1`，仅该行；未批量、未重置整库、未碰其它账号、未改权限），沿用既有本地记录的目标散列（**不在本回执重复散列**）；未加入任何"每次启动覆盖密码"的行为，未写入迁移。
- 变更后：散列＝目标散列（布尔比对 t）；其它租户用户计数不变（0:1、9001:14、9002:14）。
- 正反向登录（全新会话，不依赖既有会话是否仍有效）：**新口令登录成功**（进入 `/workspace`）；**旧口令 `admin123` 被拒**：`POST /sw-server/api/auth/login` → `code 2104 / msg 密码错误 / errorKey auth.credential_invalid`。
- 种子用户与默认 admin 分别说明：演示租户 28 人沿用种子口令（租户管理员＝Owner 指定值，其余 `123456`）；默认 admin 为本轮更新对象。

## §5 修复变化、验证范围、版本与恢复

- 修复变化：仅 1 行口令数据（线上库）；组织数据零改动；无代码/配置/权限/隔离/迁移变更；无需新发布（部署/运行版本保持 0.1.7，发布源 `5af1329`，tag/Release 未动）。
- 适用验证：同一线上域名/应用/数据库 + 明确账号与租户（§1—§4）；复用范围＝`release-017-01` §3/§7 的发布与部署事实、`release-017-02` §2/§3 的 Release 与清理事实（未重跑 Owner 已验收业务项）。
- 未解决差异（回传规划/Owner 裁定）：admin（tenant 0）按隔离设计**不能**跨租户查看 9001/9002；Owner 预期若为"admin 直接可见跨租户组织数据"，需变更跨租户产品权限（本项未擅自放开、未把租户数据复制到默认租户）。现有可用路径＝以对应租户管理员身份（口令＝Owner 指定值）登录后查看。
- 恢复措施：口令如需回退，按同法对 id=1 单行恢复原散列即可（原状态散列未外发；如需回退值由 Owner 指示）；组织数据无需恢复（未改动）。

## §6 状态与同步

- 本项复开 **IN_PROGRESS**（沿原七阶段，进度 1/1/5：目标与范围确认完成；定向修复/复测进行中；修复验收同步、必要合并、必要交付、交付后同步、结束未开始）。
- 计数与边界保持：功能 49、46/22/22=90、ADV64/问题 57、P 核销集合空、P62 延期/OFF、P65 待排期；不新建 Bug 编号、不重新纳入已移除跟踪的清单正文。
- 受影响当前入口（knowledge 当前状态/交接、memory 四件、需求池、Server 功能清单、CHANGELOG）已按"复开 IN_PROGRESS"同步；历史终审与既有发布事实保留原时点。
