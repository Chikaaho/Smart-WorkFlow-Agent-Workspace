# checklist-gap-hardening — 清单缺口加固第一批（I33 登录停用校验 + I43/I44 生产菜单 seed）

> 单功能追踪文件。压缩记忆，方向文档见 `product/checklist-gap-hardening/ready/direction-batch1-security-reachability.md`（目标 3 为本知识库全量同步，system.md §3.3 第10项）。

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | checklist-gap-hardening（第一批，批次内含 2 个交付项） |
| 功能名称 | 清单缺口加固第一批：安全与可达性缺口修复 |
| 功能目标 | 修复 2026-08-12 功能清单全量审计（`search_fallback/feature-checklist-full-audit.md`）暴露的高风险缺口：I33 停用用户仍可登录（安全缺陷）+ I43/I44 生产菜单不可达（交付断裂） |
| 创建日期 | 2026-08-13 |
| 当前状态 | COMPLETED ✅ |
| 涉及模块 | 后端 `sw-biz-system`（AuthController 双入口校验）、`sw-bootstrap`（Flyway V29 菜单 seed）；前端零改动 |

---

## 2. 功能目标

1. **登录停用校验（I33）**：登录认证链路对 `SysUser.status` 为停用状态的账号拒绝登录（含拒绝签发 access/refresh token），并对已停用账号的既有 refresh token 刷新路径做同等拦截（如刷新链路已有校验，给出证据即可）。
2. **生产菜单 seed（I43/I44）**：为定时任务（任务管理+执行日志）与文件存储补生产菜单树 Flyway seed（h2/postgresql 双份），使正式环境菜单可达，层级/父目录/权限标识遵循既有菜单 seed 先例（V6/V10/V15/V26）与 seeds.ts mock 中的现有结构。
3. **知识库全量同步（方向文档目标 3）**：功能清单 M01-F02-02、M10-F03-01、M10-F06-01 状态回升 🟦→✅；known-issues I33/I43/I44 补修复记录；current-status.md 清单计数同步。

## 3. 非目标

- 不做 M02-F04-01 数据权限（DataScope）完整落地（独立大功能，留待后续轮单独规划）
- 不做 I31-I44 中其余记录性缺口（M01/M02 关联筛选要素、M03 控件库/删除、M05 删除/过滤等）
- 不做验证码/密码策略/登录失败锁定（M02-F06-01 的 SPI 空接口维持现状）
- 不改登录认证双 token 架构本身（auth-seam-completion 已完结的结构不动，只加 status 校验点）
- 不新增菜单管理配置 UI（M02-F02-01 范围）

---

## 4. 实施记录（执行层自主闭环）

### 4.1 交付 1：登录/刷新停用校验（I33）

- **改动文件**：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java`（登录 + 刷新双入口 status 校验）+ 两个 auth 测试文件（`AuthControllerTest.java`、`AuthFlowIntegrationTest.java`）
- **校验语义**：status=0 正常放行；status=1 停用 / 2 锁定 / null 与未知值一律拒绝——登录入口不签发 token，刷新入口拒绝续期；401 返回语义区分「账号已停用/账号已锁定」（防枚举 vs 提示友好权衡由执行层裁定）
- **测试**：新增 10 个测试，后端全量 435 tests / 0 failures 全绿

### 4.2 交付 2：生产菜单 seed（I43/I44）

- **迁移**：Flyway **V29**，h2/postgresql 双份：
  - `sw-bootstrap/src/main/resources/db/migration/h2/V29__job_storage_menu_seed.sql`
  - `sw-bootstrap/src/main/resources/db/migration/postgresql/V29__job_storage_menu_seed.sql`
- **4 行菜单**：id16 文件管理（顶级叶子菜单，menu_type=1，path=storage，permission=storage:view，仿 V6 先例）/ id17 定时任务（顶级目录，menu_type=0、component=NULL，仿 V6「低代码」目录先例）/ id18 任务管理 / id19 执行日志（id17 下二级菜单，component=job/views/JobList、job/views/JobLog，permission=job:list、job:log，仿 V10/V15/V26 先例）；不 seed sys_role_menu（超管旁路，V6 决策沿用）
- **冒烟测试**：27 个迁移按序应用无 validate 失败 + 4 行菜单逐列断言通过（bpm 目录受既有 known-issues I47 阻断，非本批引入）；前端零改动

---

## 5. 测试和验收汇总

| 项目 | 结果 |
|------|------|
| 后端 | **435 tests / 0 failures**（426 基线 + 10 新增 = 436 运行口径，−1 个 V26 临时冒烟测试不在源码 = 435 源码口径；mvn test BUILD SUCCESS） |
| 前端 | **63 files / 552 tests** 四连全绿（typecheck/lint/test/build，含 2 个高负载超时 flaky 重跑通过） |
| V29 冒烟 | 27 迁移按序应用无 validate 失败 + 4 行菜单逐列断言通过 |
| 功能清单 | ✅7/🟦40/⬜42 → **✅10/🟦37/⬜42**（回升 3 行：M01-F02-02、M10-F03-01、M10-F06-01） |
| 基线演进 | 后端 465 → 426（M07 阶段）→ 435（2026-08-13）；前端 60f/521t → 63f/552t（2026-08-13） |

---

## 6. 功能完成检查清单

- [x] 两项交付均已执行并测试通过（I33 新增 10 测试；I43/I44 V29 冒烟验证）
- [x] 已更新 `knowledge/current-status.md`（清单计数/测试基线/前次验证/已完成列表）
- [x] 已更新 `knowledge/known-issues.md`（I33/I43/I44 索引状态列 + 修复记录段；其余条目未动）
- [x] 已标注功能清单中对应项状态（M01-F02-02 / M10-F03-01 / M10-F06-01 → ✅）

---

## 7. 实际修改范围

| 文件路径 | 修改类型 | 摘要 |
|----------|:---:|------|
| `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java` | 修改 | 登录/刷新双入口 status 校验（停用/锁定/null 拒绝，401 语义区分） |
| `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthControllerTest.java` | 修改 | 新增登录停用/锁定校验用例 |
| `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthFlowIntegrationTest.java` | 修改 | 新增刷新拦截集成用例（合计新增 10 个测试） |
| `sw-bootstrap/src/main/resources/db/migration/h2/V29__job_storage_menu_seed.sql` | 新增 | 菜单 seed（H2 方言） |
| `sw-bootstrap/src/main/resources/db/migration/postgresql/V29__job_storage_menu_seed.sql` | 新增 | 菜单 seed（PostgreSQL 方言） |
| `Smart-WorkFlow/功能清单.md` | 修改 | 3 行状态列 🟦→✅（M01-F02-02 / M10-F03-01 / M10-F06-01） |
| `knowledge/known-issues.md` | 修改 | I33/I43/I44 修复记录 |
| `knowledge/current-status.md` | 修改 | 计数/基线/前次验证/已完成列表同步 |

---

## 8. 遗留问题

| 问题 | 严重程度 | 计划处理 |
|------|:---:|------|
| I47：bpm 目录全链 H2 阻断（V29 冒烟测试时确认受既有问题阻断，非本批引入） | — | 待规划层决策 |
| 停用前已签发且未过期的 access token 至自然过期仍可用 | 低 | 属方向文档范围外，后续批次可评估（短 TTL 或黑名单） |
| sw-bootstrap 无测试基建（V29 冒烟测试为临时测试，不在源码中） | 低 | 待规划层决策是否固化为源码内测试 |
| 436 vs 435 计数口径（运行含 1 个 V26 临时冒烟测试 vs 源码不含） | 低 | 已按源码口径 435 记录基线 |

---

> 证据来源：`product/checklist-gap-hardening/ready/direction-batch1-security-reachability.md`；`search_fallback/feature-checklist-full-audit.md`（I33/I43/I44 登记）；本批次执行/测试回执与 V29 迁移源码（迁移路径见 §7）。
