# 0.2.0 迁回E盘现场与流程分类侧栏（批次56，任务03前置+业务继续）

2026-10-26｜Executor｜消费 direction-workspace-return-020.md 与任务03（planning-execution-prompt-unified-020-03.md）；任务03同一回执

## 一、迁回前置（方向完成条件对照）

- **ROOT-020**：E 根 `E:/code/Smart-WorkFlow-Agent-Workspace` 已切至 `codex/0.2.0-delivery` 并接续原跟踪分支（HEAD `b7fbc36c`→`a19fcbd1`→`2fcfc986`，与 `origin/codex/0.2.0-delivery` 同点回读）；C 盘 `020-continuation` 源工作树已 `git worktree remove` 退役，登记仅剩 E 根与 `governance-review-delivery`（未触碰）。分支历史与回执链原样承接。
- **KEEP-020**：源工作树未提交修改（memory 6 件、direction-unified、任务03）提交为 `b7fbc36c` 并推送；19 个未跟踪产物（16 回执/方向＋2 search_task＋1 方向）复制到 E 根后按清单逐文件在位与总字节（105,562 B）双校验一致，随 `a19fcbd1` 入库。E 根 0.1.10 在途收尾（product/0.1.10 5 路径＋memory/todo 相应行）独立提交为 develop-sw `4eaa3883`；Web `vite.config.ts` 在途改动全程保护未纳入。旧收尾与迁回批次分开提交。
- **ASSET-020**：`C:/Users/hjxch/.codex/evidence-020/` → `E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/`，robocopy 8,737 文件/592 目录/497.73MB 0 失败；两侧文件数与总字节（521,911,414 B）一致；抽样回读 `real-joint/ws-fix-66-final.json`、`ws-fix-66*` 13 件、`design-sidebar-20261026{,-categories}` 索引、`design-offline-20261026-workspace-r2`（images 68 PNG）均可读。路径映射：`C:/Users/hjxch/.codex/evidence-020/<相对路径>` → `E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/<相对路径>`；历史回执中的 C 盘证据路径按此读取。源目录在校验通过后删除。
- **STATE-020**：knowledge/current-status.md 顶部旧字段已修（“最新已推送”→Server `f530d33e`/Web `81d3731`，“唯一下一动作”由任务02改为任务03并注明迁回完成），新增迁回记录段；“等待新侧栏参考”依赖核销（批次54/55中的“新侧栏参考未通过”指运行像素，参考本体已交付）。memory README/state/handoff/features 与 todo 顶部同步为迁回后 E 盘口径；develop-sw 侧 memory/todo 路由经临时工作树改为指向迁回后现场（`bc794646`、`96f9cb6f`），临时工作树已移除。
- **GIT-020**：迁回与保全批次 `a19fcbd1`、入口/gitlink 批次 `2fcfc986`（gitlink 记 Web `34a5541`/Server `f530d33e`）+ 本批 `2fcfc986` 之后的 gitlink 更新（见下）均推送并回读同 SHA；与 develop-sw `4eaa3883` 分支分开。
- **SOURCE-020**：源证据目录删除、源工作树退役均已回读；未使用/未保全项无留账。

## 二、正式可见会话能力与工作台证据（FORMAL_FLOW）

本会话宿主（ZCode IAB）截图能力实测可用（登录页截图一次成功）。真实环境：`bootstrap-dev.jar`（HEAD `f530d33e` 重打包，`mvn -pl sw-bootstrap -am package -P dev -DskipTests` exit0）+ 本地 Docker PG `smart_workflow_dev` + dev 本地密钥（`.p61-tmp/start-dev.sh` 口径，非真实秘密）；前端 `pnpm dev --port 5175` 代理 8080。真实登录 t100admin/验证码1234。

- **首页 `/workspace`（1920×1080，headless=false）**：banner 1920×64@0,0；工作台侧栏 224×1016；入口「配置工作台」95×32@1805,92；导航四项；统计卡真实计数 待我处理21/我发起的42/本周已办24/草稿1；快捷发起空态（与上批撤销后一致）。证据 `formal-56-*.png` 前缀见下。
- **全屏配置 `/workspace/config`**：组件库 224×960@0,120、属性区 336×960@1584,120、主区 1360（三栏 224/1360/336 成立）；工作区 y120、画布标题区 68px（标题 y144、首卡 y188）；`#app-sidebar` 数量 0（无管理端侧栏）；系统卡 4＋数据组件 14；旧统计概览卡显示真实 21/42/24/1。临时添加「柱状图」：卡 418×322@248,704、SVG 384×236 viewBox `0 0 384 236`（1:1）、首个轴文字计算字号 **12px**；随后「撤销」回到 7 卡无图表，未保存。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/formal-56-config-1920.png`、`formal-56-config-geometry.json`、`formal-56-chart-1920.png`、`formal-56-chart-geometry.json`。此为可见会话实测，非 headless 隔离回归；但 A03—A05 全量同态像素对照仍未做，本节只证明该路径能力与关键几何/字号事实。

## 三、流程中心分类侧栏（承接 categories 增量参考）

改造前实测：运行态为 225px 紧凑树（36px 行、选中实底蓝白字、无收起），与 13 图参考不符——登记为真实缺口后实施。

- **实现**（Web `34a5541..81d3731`，`feat(workflow): 流程中心分类侧栏按独立分类参考实现`）：`ProcessCatalog.vue` 分类侧栏重写——展开 236px/收起 64px；40px 行、名称左对齐＋右侧数量徽标；选中浅品牌底＋品牌字＋3px 左条；标题「流程分类」；底部 48px「← 收起 / →」开关；收起态首字兜底＋`el-tooltip` 悬停「名称 数量」；筛选链路与计数口径不变（全部=total、分类=服务端可见计数、未分类仅在有项时显示）。新增 i18n 键（workflow.catalogAll/processCategories/treeCollapse，中英）。
- **测试**：新增 `ProcessCatalog.spec.ts` 3 例（行渲染与数量徽标、点击分类 categoryId 传参与页码复位、收起切换/首字/提示内容/再展开）；提交态复跑 3/3。
- **四连**：typecheck 0、lint 0、**225 文件/1942 通过/3 跳过**（较上批 +1 文件 +3 测试）、build 4.69s，exit 0。
- **真实可见会话复验（同环境）**：grid `236px 1616px`、树 236 宽、行 40px、数量徽标右置（首行 36×16@203,142）、开关 48px「←收起」；收起 `64px 1788px`、首字 36×36（全/未）、开关「→」；悬停第二项弹层 `el-popper is-dark` 文本「未分类 3」69×32@95,176。证据 `formal-56-category-after-1920.png(+geometry)`、`formal-56-category-collapsed-1920.png(+geometry)`、`formal-56-category-tooltip-1920.png`。
- **环境收尾**：双服务按精确进程身份（java bootstrap-dev.jar PID 29800、vite 5175 PID 12828，命令行逐一核对）净停，8080/5175 回读无监听；PG/Redis 容器保持。

## 四、Git 汇总

根仓 `codex/0.2.0-delivery`：`b7fbc36c`（源工作树 Planner 修改保全）→`a19fcbd1`（未跟踪产物＋迁回方向＋探索回执）→`2fcfc986`（gitlink＋当前入口 E 盘口径）；develop-sw：`4eaa3883`→`bc794646`→`96f9cb6f`。Web `codex/0.2.0-ui-tenant-form-flow`：`81d3731`；Server 无本批改动（HEAD `f530d33e`）。以上均推送并回读同 SHA；根仓本批随本回执将 gitlink 记至 Web `81d3731`。

## 五、剩余账本（真实、按依赖）

- 选择表单中的分类列表（参考 645:28735）：`FormSelectDialog` 现无分类维度，待实现。
- 门户 7:2、工作台 3:2 其余页与 25 组件族其余状态、A03—A05 全量同态像素对照（能力已证，属大体量执行）。
- 66 状态中多轴/单位/透明度/列表分页滚动等不同语义按 W66-VERIFY 口径继续；DR06 真实授权调用按 direction-authorized-integration-020 承接。
- A17 合并/0.2.0 发布/发布后同步依赖整版验收；正式计数 49、46/22/22=90、ADV64/问题57、P 核销空保持。

总 7 阶段：需求评估完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始（1/1/5）。常规决定：迁回按方向一次性连续完成；分类侧栏收起状态为会话内存态（与多级侧栏口径一致）；未发其他会话消息。
