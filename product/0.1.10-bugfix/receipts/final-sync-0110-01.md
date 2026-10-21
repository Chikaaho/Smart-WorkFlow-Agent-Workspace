# 0.1.10 发布后同步回执（01）

2026-10-21｜Executor｜L｜EXECUTION_SUBMITTED（发布与同步完成，待规划终审）

入口：`../ready/direction-release-handoff-0110.md`；收口：`closeout-0110-01.md`；发布：`release-0110-01.md`；核查：`search_fallback/release-readiness-0110.md`。

## 1. 唯一事实

- 正式发布与 UAT 部署：**0.1.10**。开发默认：Server `0.1.10-SNAPSHOT`、Web `0.1.10`。DB versioned 终点：`V0.1.7`。
- Server 发布源 `8a2aa56`（annotated tag `0.1.10` 对象 `0564ee7b…`）；Release `CH-aPaaS Server 0.1.10`（ID `419678054`）资产 `bootstrap-0.1.10.jar` 218,065,590 B sha256 `b447fa09f6a6146e22a0adb01616a76fab47b348574b28dcacfe5d7a8be86f57`。
- Web 发布源 `e03a886`（annotated tag `0.1.10` 对象 `32e1972a…`）；Release `CH-aPaaS Web 0.1.10`（ID `419653361`）资产 `sw-web-dist-0.1.10.zip` 1,360,081 B sha256 `a9d6a5088f406ede626e84a0a8ccbfb657dddfeee71b37f5dba3b2ec4386cd6c`，入口 `assets/index-qOqx_U4O.js`。
- CI：Server run `39616993514` success；Web run `39611689870` success（Vitest 179 文件/1653 通过/3 跳过）。
- UAT：`build.version=0.1.10`、Web `index-qOqx_U4O.js`、健康 `UP`、`Started StarterApplication in 181.914 seconds`、本次启动段 ERROR 0、根路径 200；Flyway 应用 `0.1.10 admin password`、`application center menu` 两条 repeatable，versioned 终点 `V0.1.7`。
- 当前分支：Web main/develop `2df670b`；Server main/develop `85e1ab7`；根 `develop-sw` 本同步批次（推送后回读见 §6）。

## 2. 当前入口覆盖矩阵

| 入口 | 同步前 | 实际值/处理 | 回读证据 |
|---|---|---|---|
| `knowledge/current-status.md` | 0.1.10 PLANNING/待核实 | 0.1.10 发布完成、VERIFYING（规划终审）；6/1/0；唯一动作 Planner 复核 | 顶部当前条目 |
| `knowledge/session-handoff.md` | 同上 | 同上 | 顶部当前条目 |
| `memory/README.md` | 0.1.10 VERIFYING/待核实 | 发布完成/待规划终审；回执入口 | §3 字节表 |
| `memory/state.md` | 2/1/4 | 6/1/0；正式/部署 0.1.10、开发版本、UAT/DB 事实 | §3 |
| `memory/handoff.md` | 收口待核实 | 已做/未做/下一动作/边界 | §3 |
| `memory/features.md` | 0.1.10 VERIFYING | 发布完成，修复批次不新增功能数 | §3 |
| `memory/issues.md` | 0.1.10 收口核实待办 | 改为应用导入导出待 L 方向 + 规划终审待复核 | §3 |
| `memory/decisions.md` | 收口决策 | 0.1.10 发布与收口决策、历史基线 | §3 |
| `memory/constraints.md` | 0.1.10 VERIFYING 2/1/4 | 发布完成/待终审；UAT 0.1.10；既有运维约束保留 | §3 |
| `todo/requirement-pool.md` | 0.1.10 VERIFYING 2/1/4 | 0.1.10 发布完成；0.1.9 转历史；下一动作 Planner 终审 | 顶部/最近完成 |
| `product/0.1.10-bugfix/items.md` | 仅 SYNC-01 + 收口说明 | BF0110-01—08 已发布并部署待终审；BF0110-09 待 L 方向 | 表格 |
| `product/0.1.10-bugfix/ready/direction-bugfix-0110.md` | 总 2/2/3 | 总 6/1/0，发布链与实际一致 | 整体进度 |
| `product/0.1.10-bugfix/receipts/closeout-0110-01.md` | 收口回执 | 补记 CI 夹具修复、发布链与阶段实际值 | 全文 |
| `product/0.1.10-bugfix/receipts/release-0110-01.md` | 新建 | 合并/CI/tag/Release/UAT/DB 分列 | 全文 |
| 根 `README.md` | 0.1.9 当前发布 | 0.1.10 发布、资产、UAT、DB | 第 13 行 |
| 根 `CHANGELOG.md` | 0.1.9 为首条 | 新增 0.1.10 段，0.1.9 保留历史 | 第 3 行 |
| 根 `version.json` | 0.1.9 | 0.1.10；Server/Web 投影、Flyway、回退、manifest 更新 | 解析回读 |
| 根 gitlink | 旧基线 | Web `2df670b`、Server `85e1ab7` | §6 提交后回读 |
| Server `README.md` | 0.1.9 | 0.1.10 发布源/资产/迁移/开发默认 | 第 18 行 |
| Server `功能清单.md` | 0.1.9 焦点 | 0.1.10 焦点，0.1.9 转历史 | 第 52 行 |
| Server `pom.xml`、workflow、`build-prod.sh`、`check-version-identity.sh` | 0.1.9 | 0.1.10；pom/workflow/develop 三模式 PASS | 版本检查输出 |
| Web `package.json` | 0.1.9 | 0.1.10 | `node -p` 回读 |
| Web `README.md` | 0.1.9 | 0.1.10 发布源/资产/包版本 | 第 18 行 |
| `docs/ops/production-ops.md` | 0.1.8 说明 | 新增 0.1.10 制品/迁移/备份/UAT 说明 | §8 前注 |
| `project.md` | 无版本事实 | 不适用，未改 | — |
| `release/` | 0.1.0—0.1.3 历史目录 | 不新增目录；0.1.10 事实由 version.json/CHANGELOG 承载 | — |
| CI/CD 其他配置 | 0.1.9 | 仅 Server workflow/脚本断言需随版本收敛，已更新；无其他硬编码 | 全仓 0.1.9 扫描仅历史注释 |

## 3. memory 字节数

| 文件 | 字节 |
|---|---|
| README.md | 823 |
| architecture.md | 857（未改） |
| constraints.md | 4,584 |
| decisions.md | 1,888 |
| features.md | 1,288 |
| handoff.md | 1,484 |
| issues.md | 1,356 |
| state.md | 893 |
| **合计** | **13,173** |

## 4. 发布配置与版本分列

- 版本来源：Server `pom.xml` `<revision>` 为唯一开发默认，Release workflow 以 Maven effective 求值并剥离 `-SNAPSHOT`，`-Drevision` 同源驱动测试/打包/门禁；Web `package.json` 为唯一包版本。
- 制品命名：CI build Release Server 资产名 `bootstrap.jar`，语义 Release 版本化名为 `bootstrap-0.1.10.jar`；Web CI 资产 `dist-<sha>.zip`，语义 Release 为 `sw-web-dist-0.1.10.zip`。
- 回退值：`bootstrap.jar.bak-20261021_pre0110`、`web.bak-20261021_pre0110`、`smart_workflow_20261021_2215_pre0110.dump`；步骤见运维手册 §8.1/§8.2/§9.1。
- 正式/开发/部署分列：正式与部署 0.1.10；开发 Server `0.1.10-SNAPSHOT`、Web `0.1.10`；DB 版本化 `V0.1.7`。

## 5. 残留检查与边界

- 当前入口未再出现“0.1.9 当前发布”“0.1.10 PLANNING/2-1-4”或“待核实”表述；0.1.9/0.1.8 等旧版本只保留在历史段与历史回执。
- 应用导入导出仍缺 L 方向，未实现、未验收、未延期；保持待决，不进入 0.1.10 候选。
- 0.1.9 已过业务/UAT 验收未重开；本次为修复批次，不新增业务功能数、不核销 P。
- Server 首次 CI 的 I5 SSO 测试夹具口令缺失已修复并在新 run 通过；不作为产品回归或部署限制。

## 6. 提交与推送回读

- 子仓文档提交：Web `2df670b`（main=develop）；Server `85e1ab7`（main=develop）；均已推送回读。
- 根同步批次：提交后回读见本条追补；tag `0.1.10` 均指向发布源，不随文档提交移动。
- 唯一下一动作：Planner 复核本回执、`release-0110-01.md` 与 `closeout-0110-01.md`，下发终审值与整轮结束裁决。
