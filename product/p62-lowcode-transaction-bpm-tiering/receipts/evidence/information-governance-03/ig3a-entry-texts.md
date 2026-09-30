# IG3a 附件：根 CHANGELOG 与两工程 README 最终正文及链接目标回读（information-governance-03 补证）

> 生成：2026-09-30 执行03。工作目录：工作区仓库根。以下引文为**当前工作树实际文本逐字摘录**（python 读取，严格 UTF-8），供 Planner 直接复核（不要求 Planner 读 knowledge 或 Git diff）。链接目标为本地跨仓相对目标，已用 ls 实际解析；纯本地引用未做联网验证（按审查允许）。

## 1. 根 CHANGELOG.md（`CHANGELOG.md`，工作区仓库根）

位置：L3—L14（0.1.3 与 0.1.2 两节，0.1.0 及更早节未改动）。逐字摘录：

```markdown
## 0.1.3（2026-09-30 发布并 UAT 删库重建部署；发布/部署回执待规划验收）

- **版本发布事实**：两仓 `develop` 快进合入 `main`（Server `8e23a2d`、Web `e3ae316`）；annotated tag 与公开 Release `0.1.3`（双仓 Latest）；Flyway 种子合并为单一基线 `V0.1.0__baseline_seed.sql`（PG 102/H2 104 唯一版本，全新建库终态与原链逐字段等价），**0.1.3 起仅支持全新建库**，≤0.1.2 原地升级被 validate 显式拒绝；UAT（chikaho.cn 单机）删库重建上线，Flyway 2 条至 v0.1.0、健康 200。材料 `release/0.1.3/`；回执 `product/v0.1.3-release/receipts/release-20260930.md`、`deployment-20260930.md`。
- **功能内容（0.1.2→0.1.3）**：后台 SSO 配置管理与 B 端手机号准入页面（`sso-admin-config`，COMPLETED（规划已确认，2026-09-29））；`SW_SSO_CIPHER_KEY` 契约收紧为 Base64 解码后 ≤32 字节（0.1.3 fail-fast 拒绝超长旧值）。
- **边界**：本版本不新增业务功能数、不核销 P 编号；1629/0/0/0 为执行报告基线（未锁定为 Planner 基线）。

## 0.1.2（2026-09-28 发布并部署生产（历史时点，该机现按 0.1.3 部署回执为 UAT 身份）；规划发布复核 PASSED）

- **版本发布事实**：两仓 `develop` 快进合入 `main`（Server `fd704ff`、Web `5368e6c`）；annotated tag 与公开 Release `0.1.2`；Flyway 自动增量 V94—V102（0.1.1 无独立 tag/Release，其修复随链路发布）；2026-09-28 生产部署（历史时点）。材料 `release/0.1.2/`；回执 `product/v0.1.2-release/receipts/`。
- **功能内容（0.1.0→0.1.2）**：`v0.1.1-bugfix` 与 `v0.1.2-bugfix` 两轮缺陷修复列车（25+23 项）；`backend-architecture-optimization` Phase 1—6C 与 Final 架构治理（动态宽表唯一受控入口 `DynamicTableSql`、可靠业务事件、IoT API 边界、依赖版本治理、生产制品隔离、CI-friendly 版本身份）。
- **边界**：无新增业务功能数。

```

链接目标解析（条目中引用的材料路径，均相对工作区仓库根）：

- `release/0.1.3` → 目录存在 ✅（内容 6 项：CONFIG-CHANGES.md, DB-MIGRATIONS.md, MANIFEST.json, RELEASE-NOTES.md, ROLLBACK.md, UPGRADE.md）
- `release/0.1.2` → 目录存在 ✅（内容 6 项：CONFIG-CHANGES.md, DB-MIGRATIONS.md, MANIFEST.json, RELEASE-NOTES.md, ROLLBACK.md, UPGRADE.md）
- `product/v0.1.3-release/receipts/release-20260930.md` → 文件存在 ✅（6053 bytes）
- `product/v0.1.3-release/receipts/deployment-20260930.md` → 文件存在 ✅（4379 bytes）
- `product/v0.1.2-release/receipts` → 目录存在 ✅（内容 8 项：deployment-20260928.md, evidence, planning-final-review-terminal-sync-20260928-passed.md, planning-review-release-20260928-passed.md, planning-review-terminal-sync-20260928-verifying.md, release-20260928.md, terminal-sync-20260928-02.md, terminal-sync-20260928.md）

## 2. Server README（`Smart-WorkFlow-aPaaS-server/README.md`）"当前可体验的业务闭环"段首

```markdown
当前发布版本为 **0.1.3**（发布/升级/回滚材料位于工作区仓库的 `release/0.1.2/` 与 `release/0.1.3/`；0.1.3 新增后台 SSO 配置管理与 B 端手机号准入页面，并将 Flyway 迁移合并为仅支持全新建库的种子基线）。0.1.0 已交付的业务闭环（办公审批/OA 场景）为主线，如下：
```

## 3. Web README（`Smart-WorkFlow-aPaaS-Web/README.md`）同段首

```markdown
当前发布版本为 **0.1.3**（发布/升级/回滚材料位于工作区仓库的 `release/0.1.2/` 与 `release/0.1.3/`；0.1.3 新增后台 SSO 配置管理与 B 端手机号准入页面）。0.1.0 已交付的业务闭环（办公审批/OA 场景）为主线，如下：
```

链接目标解析（两工程 README 所指"工作区仓库的 release/…"—即本工作区仓库根下的目录，跨仓本地目标）：

- 工作区仓库根下 `release/0.1.2` → 存在 ✅（6 份材料：RELEASE-NOTES/DB-MIGRATIONS/CONFIG-CHANGES/UPGRADE/ROLLBACK/MANIFEST）
- 工作区仓库根下 `release/0.1.3` → 存在 ✅（6 份材料：RELEASE-NOTES/DB-MIGRATIONS/CONFIG-CHANGES/UPGRADE/ROLLBACK/MANIFEST）

> 说明：两工程仓库内不存在 `release/` 目录（`ls Smart-WorkFlow-aPaaS-server/release` 无此目录），故 README 文字明确写"位于工作区仓库的 release/…"并以工作区根为解析基准——这是审查01/02 要求的"按仓库实际位置验证"后的正确表述，未以标签替代有效目标。

## 4. 核验命令与时点

- 读取时点：2026-09-30（执行03）；python3 open(encoding="utf-8") 严格解码，U+FFFD=0。
- 目标解析：os.path.isdir/isfile 实测；上述"存在 ✅"均为本次实跑输出。
- 身份绑定：本附件所述文件内容以批次提交 SHA 为准（见回执03 IG4 表）。
