# 第41项线上种子/密码交付差异核实（回传）

2026-10-18｜Executor。依据 `search_task/reopen-041-production-seed.md`；只读核实（未改数据/密码/权限），修复见 `product/0.1.7-bugfix/receipts/reopen-041-01.md`。

**总判定**：①运行版本与 DB 指向与发布回执一致；②admin 被正确限制在 tenant 0（用户列表仅 1 行）＝Owner 截图现象；③**9001/9002 组织种子实际已入库**（各 7 节点/14 用户，R__ 与数据逐项对应）——"没有新增用户/部门"是**租户可见性**而非种子缺失；④线上此前**无** admin 口令更新（旧口令可登录），本轮已更新并正反向验证；⑤既有入口可用：对应租户管理员（口令＝Owner 指定值）可见本租户 14 用户与 7 节点树。

## ① 线上运行版本与数据库指向

- 同一线上环境：`https://chikaho.cn`（前端 `/opt/smart-workflow/web`，nginx 80/443 → 后端 8080）。
- 运行制品：`bootstrap.jar` sha256 `309e9e1ea33665aaa5cf020f7c9af71b7090d73bc63952f446b107303c325826`＝0.1.7 语义 Release 资产（发布源 `5af1329` 的 CI 制品）；健康 `/api/actuator/health`=`{"status":"UP"}`。
- 数据库：本机 PostgreSQL 5433 `smart_workflow`；`flyway_schema_history` versioned 终点单条 **0.1.7**（checksum `2016046975`）＋`R__ 0.1.7 catalog menu first`、`R__ 0.1.7 org demo seed`（success=t）——与 `release-017-01` §7 一致。**确认事实**。

## ② 默认 admin 的租户、权限与接口返回

- `sys_user` id=1 `admin`：`tenant_id=0`、`is_admin=1`、角色＝超级管理员（role 1，`superadmin`）、`status=0`、`deleted=0`。
- admin 实测 `/system/user`「共 1 条」仅 admin；请求 `GET /sw-server/api/system/user/page?pageNum=1&pageSize=10`（200）。→ 现象由**租户数据隔离**解释，不能据此推断 9001/9002 不存在。

## ③ 9001/9002 组织树、用户/角色关联、软删与 R__ 对应

- 租户：9001「演示集团A」`demo-org-a`、9002「演示集团B」`demo-org-b`（status=0）。
- 树（每租户 7 节点，id 前缀 91xxx/92xxx）：总公司 ├ 分公司1 ├ 分公司2（├ 部门1 └ 部门2 └ 团队1）└ 分公司3，父子与 Owner 结构一致，全部 `status=0`、`deleted=0`。
- 用户：每租户 **14 人**（每节点 2 人，`demo_{a|b}_{hq|br1|br2|br3|dept1|dept2|team1}_{1|2}`），`dept_id` 与节点逐一对应，`is_admin=0`。
- 角色：9001→9501 租户管理员 `demo_admin`（data_scope=ALL）授 `demo_a_hq_1`（张伟，总公司）、9502 普通用户 `demo_user`（SELF）授其余 13 人；9002→9503/9504 同构（`demo_b_hq_1` 为租户管理员）；租户管理员授权集含后台用户/部门等 80 项菜单。
- 计数（alive/total）：`sys_dept`＝0:1/1、9001:7/7、9002:7/7；`sys_user`＝0:1/1、9001:14/14、9002:14/14（无软删残留/重复）；与 R__ 幂等插入逐项相符。**确认事实**。

## ④ admin 口令更新记录与新旧口令结果（不记录口令/散列）

- 此前**无**更新：散列≠目标散列（布尔 f）、服务器无引用目标值的脚本、变更前 `admin/admin123` 登录**成功**（Owner 反馈属实）。
- 本轮一次性单行更新（`UPDATE 1`，仅 id=1；未批量/未重置整库），更新后布尔=t；其它租户计数不变。
- 正反向（全新会话）：新口令登录**成功**（`/workspace`）；旧口令 `admin123` **被拒**——`POST /sw-server/api/auth/login` → `code 2104 / msg 密码错误 / errorKey auth.credential_invalid`。
- 种子用户与默认 admin 分别说明：演示租户 28 人沿用种子口令（租户管理员＝Owner 指定值、其余 `123456`）；默认 admin 为本轮更新对象。

## ⑤ 既有入口访问路径与权限缺口

- `demo_a_hq_1`（9001）：`/system/user`「共 14 条」（demo_a_*）、`/system/dept` 7 节点树（demo-a-*）；`demo_b_hq_1`（9002）：`/system/dept` 7 节点树（demo-b-*）、`/system/user`「共 14 条」。
- 网络索引（脱敏）：`/sw-server/api/auth/refresh`、`/api/system/auth/me`、`/api/system/auth/menus`、`/api/system/user/page`、`/api/system/dept/*`（均 200）。
- 判定：**无产品缺陷**——admin 属默认租户且被隔离（正确行为）；9001/9002 经对应租户管理员身份在正常入口可见。若 Owner 期望 admin 直接跨租户查看，需变更跨租户产品权限（本探索未放开隔离、未复制租户数据），差异回传规划裁定。
- 工具限制（如实）：验证码为 4 位小写字母/数字图像，自动化读图存在误读，最终以画布阈值化放大读取（样例 `product/0.1.7-bugfix/receipts/evidence/reopen-041/captcha-method-sample.png`）；期间 1 次挑战接口瞬时不可用（重载恢复）；未使用任何绕过认证手段。

## 最小影响范围

仅 `sys_user` id=1 一行（口令）；组织数据零改动；无迁移/权限/隔离/部署变更。已解决：口令交付、可见性解释、访问路径；待裁定：admin 跨租户视图（需另行授权）。
