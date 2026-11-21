# 交接

2026-11-21｜规划｜1.2.0 阶段 3 第 1 轮部分通过（`planning-review-120-02.md`）。

## 当前（1.2.0）

- **执行方**：按 `product/v1.2.0/receipts/planning-execution-prompt-120-02.md` 先解决 X1~X6（部署绕过回退、实例落库、结束节点输出、回执口令、诊断日志、索引名长度），再取 E1 全套、E2 两张补图、E3-1。回执 `execution-120-12.md` 起，每批至少推进一个原子 ID。
- **规划**：重点看 X1 的 1.1.3 对照和回退、X2 根因、E1-3 两条实例走两边分支、E1-3T 线程占用。E1-1/E1-2 再不过就是第 2 轮，按 §7.1 先自查口径。
- **进度**：七阶段，已完成 2（评估、实施），进行中 1（验收），未开始 4。
- **沿用规则**：CI 只在合并 main 后跑；截图对着图写、头部与证明区同框；不在演示服务器装非运行时依赖；E3-3 历史行在阶段 6 改。
- **观察项**：P75（流程挂起等 Graph 回调）、P68、`PageResult.total` 类型标注不符；演示服务器 Chromium。

## 2026-11-19 执行批次（代码规范治理，已终态）

- 功能数 58、线上 1.1.2 不变（纯 develop 快进）。千行文件清零、两族存量测试全绿；p3c 豁免口径见 `knowledge/known-issues.md` 2026-11-19 条，勿重议。
- 1.1.3 之后的候选：P67、P68；i18n views 覆盖（487 处写死中文，产品级）；NodeFunctionService 线程池有界化（先做负载论证）。

## 线上基线

Server main/Latest=1.1.3（tag `54b2657b`）；Web main/Latest=1.1.3（tag `05b9739`）。UAT 跑 Server 1.1.3 + Web 1.1.3，Flyway 35 行。登录私钥走文件 `SW_LOGIN_RSA_PRIVATE_KEY_FILE`。

## 保留与保护

不改写历史、不强推、不动既有 tag/Release；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`、`postgres`/`redis`/`mosquitto-024` 容器；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_* 已停用不删；UAT110/UAT112 测试图、表单、流程、执行保留。

## 更早历史

2026-11-20 1.1.3 COMPLETED（`planning-review-113-05.md`）；2026-11-15 1.1.2 COMPLETED（`planning-review-112-06.md`）；1.1.0、1.0.0 COMPLETED；0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
