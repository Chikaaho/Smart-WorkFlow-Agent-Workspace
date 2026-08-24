# P48 执行补充提示 8（D201 后）

> 标准1—10、12已锁定PASSED，禁止专项重验。本提示只处理标准11的四门严格顺序证据。

## 1. 唯一缺口：标准11

在真实后端运行、前端门开始前无构建/测试进程的前提下，用同一个串行脚本或同一连续终端会话严格依次执行：

1. `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`
2. 前一步退出0后，执行`NODE_OPTIONS="--max-old-space-size=2048" pnpm lint`
3. 前一步退出0后，执行`NODE_OPTIONS="--max-old-space-size=2048" pnpm test`
4. 前一步退出0后，执行`NODE_OPTIONS="--max-old-space-size=2048" pnpm build`

每一步打印同一时钟来源的毫秒级`start_ms`、`end_ms`、退出码和原始末尾输出。必须满足：`typecheck_end ≤ lint_start ≤ lint_end ≤ test_start ≤ test_end ≤ build_start ≤ build_end`；前端全量0 failed、0 skipped，计数可复算；命令均带2G。开始前和全部结束后各给一次覆盖完整工具族且不自匹配的进程快照，如实分类标准1所需常驻后端。

D200的真实菜单链、后端定向测试、迁移、权限与同步均已锁定，不得重跑作为专项证据。只追加新的执行回执和独立测试回执，不覆盖历史。

## 2. 状态纪律

- 标准1—10、12保持锁定，不重新解释。
- P48开放、M07-F03-02原状态、功能数30、正式基线827/338与86f/850t/V36、主方向ready。
- 将knowledge当前状态/交接/功能追踪机械更新为D201 FAILED、11/12锁定、仅补标准11即可；这只是记录最新规划裁决，不重新验收标准12。
- 禁止写PASSED/COMPLETED、核销P48、晋级基线或移动方向。
