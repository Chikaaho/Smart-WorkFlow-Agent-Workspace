# v0.0.2 OA 完善 — 执行回执 06（A8 修正轮 D1—D4，自验提交规划验收）

2026-09-07；执行角色：Executor。唯一执行入口：`product/v0.0.2-oa/ready/direction-v0.0.2-oa-readme-closeout.md`（更新版）；验收依据：`product/v0.0.2-oa/receipts/planning-review-v0.0.2-oa-05.md`（A8 首次验收未通过，D1—D4 修正）。本回执只提交 `VERIFYING / EXECUTION_SUBMITTED`，不自判 `PASSED / COMPLETED`，不推进阶段三终态同步或发布。

## 1. 本轮范围（只修正验收05 剩余差异）

验收05 已锁定主体（CH-aPaaS 定位、OA 用户旅程、三个示例、场景状态、链接与卫生）本轮不改写；只处理 D1—D4 四项差异，并遵循更新后方向 §2.5（不设工程章节、语言/框架最多出现在项目身份一次、工程资料只保留一个汇总链接）与 §2.1/§2.4（首屏 Logo、面向外部读者的版本介绍）。

| ID | 修正内容 | 结果 |
|---|---|---|
| D1 Server 产品化表达 | 删除“快速开始”整段（JDK/Maven/Redis/H2|PostgreSQL/SW_CIPHER_KEY/Profile/启动测试命令/端口/API 文档路径）；README 以项目入口结尾；首句仅保留一次身份说明“（Java 21 / Spring Boot）” | 完成 |
| D2 Web 产品化表达 | 删除“快速开始”整段（Node/pnpm/真实 API|Mock/代理地址/typecheck/lint/test/build 命令）；README 以项目入口结尾；首句仅保留一次身份说明“（Vue 3 / TypeScript）” | 完成 |
| D3 外部版本文案 | 两仓“当前版本”改为：v0.0.1 已发布（以仓库 v0.0.1 标签为准）、v0.0.2 即将发布并列出版本亮点、正式发布以仓库标签为准；删除“已完成验收/文档收口”等内部术语 | 完成（两仓逐字一致） |
| D4 首屏 Logo | Owner 原图 `/Users/chikan/Downloads/135208.PNG` 复制为两仓 `docs/images/ch-apaas-logo.png`（同一视觉源）；两仓 README 标题下以相对路径 `<img src="docs/images/ch-apaas-logo.png" alt="CH-aPaaS Logo" width="180" />` 展示，等比缩放、无拉伸裁切、无本机绝对路径 | 完成 |

配套收敛：两仓“项目入口”表按方向 §2.5 收拢为仓库链接（本仓＋对端）＋项目规划与知识中心＋一个工程文档汇总链接；原“功能清单.md/平台整体架构”两行并入汇总入口，不再展开多行工程资料。工程操作词复查零命中（身份句框架名除外，属方向允许的一次出现）。

## 2. 修改文件

本轮（r2）修改：
- `Smart-WorkFlow-Server/README.md`（相对上一轮：删除快速开始、收敛项目入口表、改版本文案、加 Logo 行）
- `Smart-WorkFlow-Web/README.md`（同上）
- 新增 `Smart-WorkFlow-Server/docs/images/ch-apaas-logo.png`、`Smart-WorkFlow-Web/docs/images/ch-apaas-logo.png`（两仓稳定文档资源目录，同一原图复制）

两仓其余工作树未提交修改（Server 4 个 Java 文件＋新增测试目录/schema-copy-h2.sql/upload 目录；Web 3 个 TS/Vue 文件＋f-cfg/graph 杂散文件）均为 A1—A7 轮次既有内容，本轮未触碰。渲染用临时 HTML（仓库根 render.html）已在截图后删除，不留在工作树。

## 3. 验收05 差异逐项证据

### D1/D2（最终标题清单＋技术操作词扫描）

两仓最终标题清单（原文见 `evidence/readme-closeout-r2/link-scan-render-r2.txt` §1）：

```
Server: # Smart-WorkFlow-aPaaS-server / ## 谁可以使用、可以做什么 / ## 当前可体验的 OA 闭环 /
        ## 三个示例应用场景（### 场景一/二/三）/ ## 当前版本 / ## 项目入口
Web:    # Smart-WorkFlow-aPaaS-Web / 其余与 Server 同构
```

无“快速开始/环境要求/开发模式/常用命令/启动”等工程章节；两仓均以“项目入口”结尾。
技术操作词扫描（JDK|Maven|mvn|Redis|PostgreSQL|H2|SW_CIPHER_KEY|profile|pnpm|npm|node|typecheck|lint|vitest|build|8080|5173|swagger|proxy|Mock|端口|代理|快速开始|环境要求|开发模式|常用命令|启动）两仓零命中；身份句仅保留框架名一次（Server“Java 21 / Spring Boot”、Web“Vue 3 / TypeScript”），符合方向 §2.5。

### D3（版本段落逐字核对）

两仓“当前版本”段落 diff 无差异，原文：

> 上一正式发布版本为 v0.0.1（以仓库 v0.0.1 标签为准）。v0.0.2 即将发布，重点完善 OA 业务闭环：工作台、流程中心、个人办理、表单体验、前后台分层与通知闭环；正式发布以仓库标签为准。

无“验收/收口/候选”等内部过程术语。三示例场景段落两仓逐字一致（本轮未改动，复核通过）。

### D4（Logo 同源哈希、相对路径与渲染截图）

- SHA-256 对照（三处一致，同一视觉源文件）：
  `f5194ac671c42957f46797228e9ffd827f996a8c289c04f83297c9d58d48552e` = Owner 原图 `/Users/chikan/Downloads/135208.PNG` = 两仓 `docs/images/ch-apaas-logo.png`。
- 相对路径解析：两仓 `docs/images/ch-apaas-logo.png` 均实际存在；README 使用 `docs/images/ch-apaas-logo.png`（无本机绝对路径）。
- 实际渲染截图：headless Chrome（本机 Google Chrome，marked 解析为 GitHub 风格 HTML，file:// 打开）整页截图两仓各一张——`server-readme-render.png`（1920×4990）、`web-readme-render.png`（1920×4852）。渲染脚本程序化断言（非目视）：两仓页面各自唯一图片 `src=docs/images/ch-apaas-logo.png`、`alt=CH-aPaaS Logo`、`naturalWidth=444/naturalHeight=468`（与 Owner 原图尺寸一致，证明相对路径真实加载）、`displayed=180`（等比缩放，无拉伸无裁切）。

## 4. 其余验收证据（r2 原始结果摘要，全量见 evidence/readme-closeout-r2/）

| 项目 | 结果 |
|---|---|
| 本地链接静态检查 | Server 3 条、Web 3 条相对链接全部解析存在，零缺失 |
| 外部链接实际访问 | 两个 GitHub 仓库 URL 复查均 HTTP 200（curl -L 带 UA） |
| 敏感信息扫描 | 原模式清单两仓零命中；无敏感配置、连接信息、账号或调试认证材料 |
| Markdown 基础检查 | 无围栏代码块；项目入口表格管道一致；两仓各 1 个 <img>（Logo） |
| 两仓 git diff --check | Server 退出码 0、Web 退出码 0，无空白错误 |
| 哈希清单回读 | `shasum -a 256 -c SHA256SUMS.txt` 10/10 OK（证据 6 文件＋两仓 README＋两仓 Logo 资源） |
| 本轮改动范围 | 仅两仓 README.md 修改＋新增两仓 docs/images/ 资源；业务实现变化为 0 |

## 5. 身份记录（仅用于验收回执）

| 仓库 | 基线提交（HEAD） | README 工作树差异身份 | Logo 资源 |
|---|---|---|---|
| Smart-WorkFlow-Server | `4cba2114b43685e902531d3fbd34ede29bb46cd7`（develop） | ` M README.md`（diff 见 `server-readme-r2.diff`） | 新增 `docs/images/ch-apaas-logo.png` |
| Smart-WorkFlow-Web | `ef1fdc71d1e6b218ca13d177218d274da3c158c0`（develop） | ` M README.md`（diff 见 `web-readme-r2.diff`） | 新增 `docs/images/ch-apaas-logo.png` |

两仓均位于 `develop` 分支，未推送、未合并、未打 tag、未触发 Release。

## 6. 已完成门禁（更新后方向 §5）逐项对照

| 门禁 | 结果 |
|---|---|
| 首屏说明用户、价值与主要使用方式 | 通过（与验收05 锁定内容一致，未改写） |
| 首屏展示同源 Logo，比例/清晰度/替代文字/相对路径正确 | 通过：三处哈希一致、alt=`CH-aPaaS Logo`、宽 180 等比、相对路径加载实证 |
| OA 闭环以使用者旅程呈现且与验收能力一致 | 通过（锁定内容未动） |
| 三个示例已写入且未扩展原始业务含义 | 通过（锁定内容未动，两仓逐字一致） |
| 场景与已交付能力状态清楚 | 通过（状态声明保留） |
| 两仓表述一致、侧重明确，链接与版本状态可核对 | 通过：版本/场景逐字一致；链接全部可解析；版本以仓库标签为口径 |
| README 修改之外的业务实现变化为 0 | 通过：仅 README＋Logo 资源 |
| 证据索引与工具生成哈希清单并已回读 | 通过：`EVIDENCE-INDEX-r2.md`、`SHA256SUMS.txt`，回读 10/10 OK |

## 7. 偏差、问题与未完成内容

- 偏差：无。
- 问题：无阻塞。外部链接复查稳定 200（与 r1 结论一致）。
- 影响说明（如实上报，未越权处理）：工作区根 `README.md` 的“后端/前端环境与启动”两行指向 `README.md#快速开始` 锚点；按方向 §2.5 删除“快速开始”章节后该锚点不再存在。根 README 属工作区文档，不在 A8 授权修改范围，本轮未改动；是否调整根 README 锚点由规划/所有者决定。
- 未完成内容：无（本轮 A8 范围内全部完成）。

## 8. 证据位置

`product/v0.0.2-oa/receipts/evidence/readme-closeout-r2/`：`EVIDENCE-INDEX-r2.md`、`SHA256SUMS.txt`、`server-readme-r2.diff`、`web-readme-r2.diff`、`server-readme-render.png`、`web-readme-render.png`、`link-scan-render-r2.txt`。（r1 证据保留于 `readme-closeout/` 作历史。）

## 9. 执行提交

D1—D4 修正完成并通过全部自验：最终标题清单与技术操作词扫描、链接检查、敏感扫描、Markdown 检查、两仓 `git diff --check`、Logo 同源哈希对照与渲染截图、哈希清单回读 10/10。提交 `VERIFYING / EXECUTION_SUBMITTED`，等待 Planner 独立验收 A8；按验收05 §4 与方向 §5，不开始阶段三终态同步或发布。