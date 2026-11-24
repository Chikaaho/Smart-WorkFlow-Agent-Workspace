# 交接

2026-11-24｜规划｜1.2.0 阶段 3 第 3 轮基本通过（`planning-review-120-04.md`）。

## 当前（1.2.0）

- **执行方**：按 `product/v1.2.0/receipts/planning-execution-prompt-120-04.md` 做 T1~T4 四个尾巴，在最终提交上跑门禁（Web 四项 + Server agent/bpm/form/workflow `mvn test`），回执写明哪些夹具是 SQL 直写的。回执 `execution-120-16`。通过后进阶段 4 合并、main CI。
- **规划**：已锁 12 项不重验；E4-1 修复前基线用 Owner 截图加单测；E1-3T 来源显示按缺陷修（T2）。SQL 夹具不能拿来证明设计器或发布路径。
- **进度**：七阶段，已完成 2，进行中 1（验收），未开始 4。
- **沿用规则**：CI 只在合并 main 后跑；截图对着图写、头部与证明区同框，在修复提交之后拍；不在演示服务器装非运行时依赖；E3-3 历史行在阶段 6 改；阶段 7 清理 `sw_iso120`、`sw_iso120_x1` 和 18094 的 worktree。
- **观察项**：P75、P68、P78、P79、`PageResult.total` 类型标注；X1 schema null 根因未明，阶段 6 在演示环境做发布回归。

## 2026-11-19 执行批次（代码规范治理，已终态）

- 功能数 58、线上 1.1.2 不变（纯 develop 快进）。千行文件清零、两族存量测试全绿；p3c 豁免口径见 `knowledge/known-issues.md` 2026-11-19 条，勿重议。
- 1.1.3 之后的候选：P67、P68；i18n views 覆盖（487 处写死中文，产品级）；NodeFunctionService 线程池有界化（先做负载论证）。

## 线上基线

Server main/Latest=1.1.3（tag `54b2657b`）；Web main/Latest=1.1.3（tag `05b9739`）。UAT 跑 Server 1.1.3 + Web 1.1.3，Flyway 35 行。登录私钥走文件 `SW_LOGIN_RSA_PRIVATE_KEY_FILE`。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`、`postgres`/`redis`/`mosquitto-024` 容器；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110/UAT112 测试图、表单、流程、执行保留。

## 更早历史

2026-11-20 1.1.3 COMPLETED（`planning-review-113-05.md`）；2026-11-15 1.1.2 COMPLETED（`planning-review-112-06.md`）；1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
