# U020 / W020 发布快照与审批操作执行记录

2026-10-23｜Executor｜XL｜实施中

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本记录保存本轮实际结果，尚未提交整版验收，不改变正式功能状态、计数与 P 编号。

## 已取得的行为结果

- 可见浏览器采用 1920×1080，`innerWidth/innerHeight` 为 1920/1080，devicePixelRatio、visualViewport.scale、浏览器 zoom 均为 1。侧栏收起后宽度为 64 CSS px，再次点击可展开。
- 已发布表单 `w020_e2e_flow`（ID `72514bbc-4998-414a-b3ef-55a32605019e`）的历史版本入口可打开完整快照。表单 v2 匹配流程 `bpm_9ca1404dea5344dc` v1，概览及三节点配置均可读取；展开审批节点可见原始参与人 ID `2113516345554395137`。旧快照没有冻结列表配置，显示空态。
- 在真实审批用户选择中发现 64 位 ID 被 Number 转换后变成 `2113516346351313000`，服务端拒绝目标用户。保留字符串后，同一任务选择两名人员并提交前加签、串行成功，出现「加签已提交」。该结果仅证明创建成功，完整串行办理仍待验证。
- 随后调用待确认加签端点返回 403：接口使用页面权限 `workflow:todo:view`，真实会话的按钮权限集合没有该值。正在修复该入口与参与人、租户及重复表态边界，并继续补齐节点允许操作。

可见会话为 `headless=false`，URL 为 `http://127.0.0.1:5173/form/designer/72514bbc-4998-414a-b3ef-55a32605019e`，超级租户 0 的系统管理员；加签提交使用本地隔离库的 W020 审批人1。实例 `0ff96d73-ceab-11f1-88b6-00ff9e2a8dfb`、原任务 `1003f4d0-ceab-11f1-88b6-00ff9e2a8dfb`。

原图位于 `C:/Users/hjxch/.codex/evidence-020/e2e/screens/`：`u020-sidebar-collapsed-1920.png`、`u020-published-snapshot-overview-1920.png`、`u020-published-snapshot-node-1920.png`。截图尺寸与 DOM 视口已核对；尚未取得同数据、同状态的正式像素通过结果。

## 本轮实现范围

Web：完整发布快照查看器、跨模块适配与版本匹配、关联定义分页；侧栏折叠及可访问属性；系统列表路由、操作权限和 token 修正；用户 ID 字符串传递；审批更多菜单、节点操作交集与补签入口；登录页对照及操作手册。部分项目仍在实施，以最终 Git 与验证结果为准。

Server：首次及后续发布时把管理员列表配置嵌入冻结定义；待确认加签与表态的认证、参与人及租户校验；重复更新零副作用；节点允许操作与实际部署定义读取。新增项在验证完成后追加真实结果。

## 已有验证与剩余动作

Web `568bf28` 的既有四连通过：194 个通过文件、1 个跳过文件，1718 个通过测试、3 个跳过测试。此结果仅对应设计器主题修复，不覆盖本轮后续未提交修改。

剩余动作：完成后端和前端在途实现，串行运行适用工程门禁；在真实发布流程验证前/后加签、串/并行、重复/越权及终态；复核快照版本和列表冻结；完成登录及受影响页面同态视觉对照；更新覆盖矩阵和当前入口，按适用门禁提交推送。A03/A04/A14/A15 均未据本记录宣称通过。

## A03 历史数字校正

回执 07 中详情页 17.8061% 是旧截图结果。现存 `e2e/screens/pixel-results.json` 中同尺寸详情结果为 44.9801%（差异像素 1,140,893 / 2,073,600，阈值任一 RGB 通道差大于 8，无遮罩）。数据与状态仍未完全对齐，保持诊断用途，不作为像素还原通过依据。历史回执保留原时点内容。

## 本地服务与 Git 时点

本轮已退出自有 Vite 5173/5174 两个 PTY 会话，并停止自有截图接收器 36696；本地 Java 验收进程 24756 仍在运行，连接隔离库 `smart_workflow_020_e2e`。PostgreSQL/Redis 为既有服务，保持运行。后续机器门禁按前后端互斥规则执行，浏览器复验时再按实际包恢复自有服务。

已核实任务跟踪分支 Server `codex/0.2.0-tenant-form-flow`（d951016）、Web `codex/0.2.0-ui-tenant-form-flow`（568bf28）；本轮代码尚未提交。Web 在途 `vite.config.ts` 的 allowedHosts 修改继续保留在原工作树，排除出本轮提交。根仓记录位于独立续接工作树；原工作区的在途治理与 0.1.10 文档保持原状。

## 后端修复与门禁追加

Server 已推送并远端回读一致：`da8a34a`（加签对象授权、更新冲突与列表配置冻结）和 `5757367`（发布节点允许操作与冻结意见配置）。

`allowedActions` 从任务实际部署的 BPMN 节点读取，详情返回同一配置，普通办理与转办、委托、沟通、加签在执行前校验。未声明沿用旧动作；显式空数组不允许任何操作；未知名称、错误类型在发布和运行时拒绝。后加签还要求该节点允许原办理意见对应的审批操作。意见表单读取实际部署快照，现行设计图修改不再覆盖既有任务配置。

实际验证：

- Form 全模块：216 tests / 0 failures / 0 errors / 0 skipped；日志 `e2e/server-core-regression-08-02.log`。同次 reactor 在后续 Engine 新增测试失败，Form 结果单列，不称整条命令通过。
- Engine 全模块：163 tests / 0 failures / 0 errors / 0 skipped；BPM Process 全模块：446 tests / 0 failures / 0 errors / 0 skipped。`MAVEN_OPTS=-Xmx2g mvn -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am test`，exit 0，日志 `e2e/server-core-regression-08-03.log`。
- 新增测试覆盖冻结部署之间的配置差异、历史配置、非法 JSON/null/数组拒绝，普通与生命周期动作绕过节点策略的拒绝；服务端参与人/租户/顺序/重复更新拒绝；首次及后续列表配置分别冻结。
- 首次完整 reactor 遇到新测试泛型断言编译失败；修正后遇到新测试嵌套 Mockito stubbing 错误，已拆分构造与 stubbing 并在上列全量结果通过。原失败日志 `server-core-regression-08.log`、`server-core-regression-08-02.log` 保留。
- `MAVEN_OPTS=-Xmx2g mvn -DskipTests package`，exit 0，36.430 秒，日志 `e2e/server-package-08.log`。这是本地验收包，未发布；开发版本仍为 0.1.10-SNAPSHOT。

以上日志均位于 `C:/Users/hjxch/.codex/evidence-020/` 下对应相对路径。自有 Java 验收进程 24756 已在打包前退出，未停止既有 PostgreSQL/Redis。后端完成后进入 Web 门禁，遵守前后端重型命令互斥。

## 登录稿与字体追加

已读取 Figma `32:2` 原始参数：1920×1080，品牌区 1180×1080，登录卡片 x1300/y167、500×746，Noto Sans SC 字体。登录品牌渐变和光晕用代码 SVG 实现；页面保留真实登录、租户编码、密码显隐、SSO 与备案入口。可选租户编码由账号旁入口展开。

此前仅声明 Noto Sans SC 字体名，仓库未带字体资源，实际会依赖系统回退。现已加入自托管 Noto Sans SC 变量字体，101 个按字符范围加载的 WOFF2 子集共 4,500,544 B，并附 OFL 许可。运行时不访问字体外站。此变更影响全局文字排版，既有像素诊断数字不作为新字体后的结果，需重新拍摄受影响页面。

Web 当前完整门禁正在执行，结果另行回填；不以格式化或资源下载代替 typecheck/lint/test/build。

## 办理链与审批暂存追加（2026-10-23 17:30）

可见普通登录会话已迁至 `http://127.0.0.1:5174`，关闭前端调试身份覆盖，1920×1080、DPR 1。W020 审批人2、3分别通过可见待确认列表完成前加签串行；首位未完成时第二位不可办理，两位完成后原任务仍待原办理人审批。原始截图 `e2e/screens/w020-before-serial-{first-pending,second-enabled,second-completed}-1920.png`，原对象保持前文任务身份。

同一已发布表单另建三实例：前并行、后串行、后并行，完整映射 `e2e/w020-mode-objects.json`。前并行两人反序确认后原任务仍 RUNNING；后并行在可见界面选择两人并提交，原生接口两人反序确认，首人完成仍 RUNNING，末人完成 APPROVED/canHandle=false。历史办理人仍为 `2113516345554395137`，原意见精确保留为「W020 后加签并行原办理意见」。原始请求与对象回读 `e2e/w020-parallel-mode-{trace,results}.json`，截图 `e2e/screens/w020-{approval-more-actions,after-parallel-configured}-1920.png`。后串行保留待确认状态，用于后续旧请求拦截及串行结算复验。前加签原办理与终态补签尚待补齐；不将原生请求冒称可见浏览器操作。

在可见界面发现「暂存审核意见」403：控制器误用按钮权限名，已改为认证准入加当前任务办理人、租户及未结束状态逐项校验，查询显式按租户和办理人定域。另补齐旧式空请求也必须等待加签的约束。新增安全代理测试证明无页面/按钮权限的已认证当前办理人可管理自己的草稿，匿名请求拒绝；他人、跨租户、缺失身份和结束任务拒绝，零删除副作用。

修复后的完整 Engine 163/0/0/0、BPM Process 451/0/0/0；命令 `MAVEN_OPTS=-Xmx2g mvn -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am test` exit 0，1分47秒，原文 `e2e/server-draft-regression-09.log`。本地 `mvn -DskipTests package` exit 0，36.987秒，原文 `e2e/server-package-09.log`。可见暂存恢复及新包真实负向仍待继续，以上测试不替代它们。

## 原始截图与登录像素结果校正

已确认 CDP 在 `captureBeyondViewport=false` 时，本机窗口底部出现与实际 DOM 不符的绘制残留。后续原图统一以 layoutMetrics 对应可视区域 clip、scale 1、`captureBeyondViewport=true` 取得，不缩放或修图。字体加载完成后的正确原图 `e2e/screens/u020-login-aligned-1920.png`：整图 2,073,600 像素，差异 42,357，一致率97.9573%；品牌区98.2037%、卡片95.004%。只排除验证码最小矩形6912像素后，整图98.2824%。仍低于 A03 门槛，保持未通过；几何已对应卡片 x1300/y167/w500/h746，不以大背景或动态排除掩盖文字和控件差异。

Web 上次完整门禁 `e2e/web-{typecheck,lint,test,build}-08-03.log` 四连退出0，200通过文件/1跳过文件、1764通过/3跳过测试。随后补充登录可访问名称、挑战重试恢复及字体排版，目前最新四连另存 `e2e/web-{typecheck,lint,test,build}-09.log`，以实际最终输出追加结果。

此刻自有 Vite 85148 已退出、自有旧 Java 16412 已停止；未停止既有 PostgreSQL/Redis。先串行完成重型门禁，再恢复新包浏览器验证。


后续权威续记：`w020-approval-draft-sign-09.md`。Server `eff9a92`、Web `e486ae4` 已推送；四组合结算、可见意见恢复/审批与终态补签结果均在09；最新Web四连1766通过/3跳过，Engine163、Process451全部通过。此处早期“进行中/待验证”保留发生时点，当前事实按09与knowledge/current-status.md。
