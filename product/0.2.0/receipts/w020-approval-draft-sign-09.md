# W020 审批暂存与四种加签办理结果

2026-10-23｜Executor｜XL｜实施中，自验事实追加

总7阶段：已完成1「需求评估」；进行中1「分支实施」；未开始5「验收同步、合并、发布、发布后同步、结束」。本回执不替代整版验收，不改变正式状态、计数、P编号或验证基线。

## 已完成的真实行为

本地隔离库 `smart_workflow_020_e2e`，表单 `w020_e2e_flow` v2、流程 `bpm_9ca1404dea5344dc` v1，租户0，三位 W020 审批测试用户。可见会话 `headless=false`，正常登录用户 `w020_e2e_1`，客户端关闭调试身份覆盖。API辅助请求使用已配置的本地测试身份，不用于替代可见操作。

| 组合 | 稳定对象 | 实际结果 |
| --- | --- | --- |
| 前加签串行 | 任务 `1003f4d0-ceab-11f1-88b6-00ff9e2a8dfb` | 两位参与人按序在可见待确认列表办理；原任务仍运行；原办理人随后可见审批通过，最终APPROVED/canHandle=false |
| 前加签并行 | 任务 `4658ca01-cec1-11f1-a95b-00ff9e2a8dfb` | 两人原生请求反序确认，原任务仍运行；原办理人可见审批通过，最终APPROVED/canHandle=false |
| 后加签串行 | 任务 `4658ca00-cec1-11f1-a95b-00ff9e2a8dfb` | 新包证明旧式空请求仍被待确认加签拦截；两位按序原生确认，首位后RUNNING、末位后APPROVED；原办理人与原意见均保留 |
| 后加签并行 | 任务 `4658c9ff-cec1-11f1-a95b-00ff9e2a8dfb` | 可见界面选两人创建；原生请求反序确认，首位后RUNNING、末位后APPROVED；原办理人与原意见均保留 |

原办理人均为 `2113516345554395137`。后串行意见精确保留「W020 AFTER SERIAL 原办理意见」；后并行意见精确保留「W020 后加签并行原办理意见」。完整对象映射 `e2e/w020-mode-objects.json`，轨迹及结算 `w020-parallel-mode-{trace,results}.json`、`w020-draft-serial-09-trace.json`、`w020-after-serial-settled.json`、`w020-before-{serial,parallel}-final-09.json`。早办、非参与人、原任务存在待确认时直接完成均被拒绝；重复表态成功幂等。

### 暂存恢复与终态保护

原办理人可见任务详情填入「W020 可见暂存保存与重新打开恢复」，点击暂存，提示「审核意见已暂存」；关闭并重新打开，恢复精确文本并显示本人暂存草稿。随后同一可见任务审批通过，历史原意见精确保留该文本。其他办理人对该任务GET/PUT/DELETE暂存均拒绝，匿名GET拒绝；已结束任务PUT/DELETE拒绝。原始请求 `e2e/w020-draft-serial-09-trace.json`、`e2e/w020-before-serial-final-09.json`；原图 `e2e/screens/w020-draft-restored-1920.png`。

### 终态补签

可见「我发起的」列表选择已通过实例 `46508d7a-cec1-11f1-a95b-00ff9e2a8dfb`，打开补签、选择原审批节点与用户2，提交提示「补签已提交」。用户2原生确认后，实例始终APPROVED/canHandle=false，原审批历史前后完全相同。原始结果 `e2e/w020-supplement-terminal-09.json`；原图 `e2e/screens/w020-supplement-terminal-1920.png`、`w020-my-instances-terminal-1920.png`。

实际发现普通用户的既有 `/workflow/my-instances` 深链缺少静态路由，菜单缺省时404。Web已增加本人实例静态入口、既有深链别名及工作台侧栏入口，沿用后端本人实例定域与补签权限校验；新 `/workspace/my-instances` 纳入前台归属，保持工作台布局。1366×768原图 `e2e/screens/w020-my-instances-1366.png`；文档宽1366、无横向溢出，三行补签按钮均在可视范围（x1280、宽28）。正式主视口已恢复1920×1080。

## 实现与机器验证

Server提交 `eff9a9261609e7bc2977333f2688607b34920236` 已普通推送并回读 `origin/codex/0.2.0-tenant-form-flow` 同SHA。范围7文件：任务DTO增加权威租户、引擎运行/历史DTO赋值；意见暂存认证入口与办理人/租户/终态授权；旧请求待加签门禁及相关测试。无迁移或部署。

完整Engine163/0/0/0、BPM Process451/0/0/0（测试/失败/错误/跳过），命令 `MAVEN_OPTS=-Xmx2g mvn -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am test` exit0，1分47秒，`e2e/server-draft-regression-09.log`；`mvn -DskipTests package` exit0，36.987秒，`e2e/server-package-09.log`。两命令及新包真实验证均已完成。

Web `e2e/web-{typecheck,lint,test,build}-09.log` 四连exit0，200通过文件/1跳过文件、1765通过/3跳过测试，140.95秒；此后补齐本人实例路由及归属，最新完整门禁 `e2e/web-{typecheck,lint,test,build}-09-02.log` 四连exit0，200通过文件/1跳过文件、1766通过/3跳过测试，132.82秒。许可文本原有一处行尾空白被git diff --check拦截，清理空白后再次build通过（`e2e/web-build-09-license.log`），许可正文含义未变。Git hooks已完成eslint/prettier且回读工作树仅保留vite.config.ts；Web162文件提交 `e486ae435f38ef15daa4c63d1be8f1bb085574b8` 已推送且远端同SHA，覆盖快照/审批/导航/系统页与自托管字体。

## 失败事实与边界

- 初次新包验证脚本误用 `/workflow/tasks/{id}/detail` 返回404；已改为真实API `/workflow/tasks/{id}`。失败请求原文保留 `e2e/w020-draft-serial-09-wrong-path.json`，修正后通过。该失败是辅助脚本路径错误，未修改产品API。
- 可见开发会话仍有既有Vue Router next警告、分页total字符串警告、ResizeObserver通知和UserRemoteSelect多根style透传警告；本次办理、补签与响应式结果实际成功。告警未作为通过证据。
- 本回执覆盖A14/A15的相应行为，仍需结合整版矩阵和其他节点/实例配置证据由Planner独立验收。A03像素仍未通过；其他U020页面及文案覆盖继续，不宣称整版完成。
- 本地原始证据根目录 `C:/Users/hjxch/.codex/evidence-020/`，均可直接回读，不提交原始附件。既有PostgreSQL/Redis保持运行；本轮自有Java38540已停止，Vite61424已退出，后端父任务36302已退出并回读；最新Web门禁97370与提交构建81984均退出0。无发布操作。

授权内常规决定：复用本人实例列表与既有对象授权，为菜单缺省用户提供个人入口；正式验收门槛及历史终态保持原口径。


## 证据索引与当前剩余

可见请求的服务端网络索引为 `e2e/backend-09.log` 中 ACCESS 记录（请求路径、clientRequestId、eventRef、身份与状态）；辅助API索引为上述trace文件，不保存令牌或登录秘密。截图原始PNG保持1920×1080或已声明的1366×768，使用可视区域原点、DPR1、scale1，无图像后处理。此前 `captureBeyondViewport=false` 的绘制残留与正确采集口径见回执08，不复用为本次正式通过依据。

当前独立可执行工作为U020剩余画框/状态的实现、同态视觉和文案审阅；A03/A04整体保持未通过。Planner正式验收、终态同步、develop/main合并及0.2.0发布仍按真实依赖后续推进。本次提交只关闭本批源代码和已列验证工作，不结束整版。
