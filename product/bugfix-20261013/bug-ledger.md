# 持续修复问题台账

2026-10-13｜当前开放收集；发布集合尚未冻结。

原始反馈可直接用自然语言、截图或复现过程提交，由 Planner 整理；功能缺失、行为不符与体验优化均接收。新 ID 从 BF20261013-001 开始。现有问题 0 项，这只表示尚未收到具体反馈，不代表任务完成。

| ID | Owner 原始反馈/日期 | 实际与预期 | 影响/优先级 | 验收标准 | 状态 | 执行证据/规划结论 |
|---|---|---|---|---|---|---|
| BF20261013-001 | 2026-10-13：放置约10分钟回来被自动登出回登录页；双 token 未用上，预期过期应无感刷新 | 实际：access 900s 空闲到期后 401 直接跳登录（前端 401 拦截器无刷新重试，预刷新失败亦被吞）；Server 端双 token（rt cookie HttpOnly+轮换）实测健康。预期：access 过期经 rt 无感续期，不掉登录页 | 中（会话体验）；不涉及数据与权限边界 | 空闲跨过 access 过期窗口后返回页面，请求经 rt 无感续期成功，不出现登录页；auth 端点 401 不受影响 | 待验收 | Web `1f90fa3`（已推送回读一致）：401 拦截器单飞 refresh+原请求重放（打标防循环），src/foundation/request/index.ts；四门 typecheck exit0/lint 0e3w/vitest 1393+3/build ✓（+4 用例）。**可见浏览器验证（60s 临时过期实测，验证后已恢复 900s）**：登录工作台→跨 60s 过期窗口点「流程中心」保持登录态不回登录页；F5 冷启动 guard 静默续登恢复 /workflow/catalog 与「系统管理员」徽标。服务端链路 node 实测 login→rt cookie→refresh 轮换 200（脚本 /tmp/bugfix-20261013/auth-flow-test.mjs）。Server 无代码改动（900/604800 配置合理） |

条目状态使用：待澄清、待执行、执行中、待验收、已通过、Owner 延期。执行自验只进入待验收；新反证或相关变更可重开受影响项。延期须保留 Owner 决定及未验证范围。每批验收锁定已过项与证据引用。

## 运行与修复循环（Owner 2026-10-13 指令）

- **点验环境**：本机运行一套 Server（8080，local profile=远程 PG `sw_apaas_local`，凭据经环境变量注入不落盘）+ Web（5173，vite 代理 8080）；启动前已核实无其他实例（8080/5173 零监听，无需 kill）。日志 `/tmp/bugfix-20261013/`（server.log / web.log / build.log）。
- **修复循环**：Owner 反馈问题 → 本台账登记编号（BF20261013-NNN）→ Executor 在两仓 `codex/bugfix-20261013` 修复 → 修复完成即重启 Server（`mvn -pl sw-bootstrap -am package -DskipTests` 后 `java -jar`，Web vite 热更一般无需重启）→ 台账记实际结果与编号对应批次 → 该修复批次提交推送两仓 `codex/bugfix-20261013`，供 Owner 上位点验。
- 编号与批次一一对应记录于上表"执行证据"列与各仓提交信息；发布集合冻结前所有修复累积在修复分支。

当前执行收尾入口：receipts/planning-review-branch-init-01.md R-GIT-01（回执 branch-init-close-01.md，2026-10-13 完成）；整体方向：ready/direction.md；开发声明：ready/development-declaration.md。
