# Web 0.3.7 补丁：四个界面缺陷、README 补图与 MIT 许可证

日期：2026-11-10｜规划（Planner）｜等级：**L**（Web 界面修复 + Server/工作区 README 与许可证跨仓改动 + 正式发版，规划独立验收截图）｜状态：`READY`｜缺陷修复，不计功能数、不核销 P 编号

## 0. Owner 裁决与来源

- 缺陷来源：`todo/web-ui-defects-20261109.md`（P66 发布后截图审查 `product/multi-database-compat/receipts/planning-review-final-03.md` §4）。Owner 2026-11-09 定：W-a—W-d 留到下一个 Web 补丁；流程中心里的测试流程不处理。
- **Owner 2026-11-10 定**：下一个任务做本补丁；**本次 Web 版本号确认为 `0.3.7`**，走完七阶段（含发版与发布后同步）。
- **Owner 2026-11-10 补充**：Server、Web 两个代码仓补上 MIT 开源协议（本方向 §2 L1）。

## 1. 目标

Web 在 0.3.6（tag `0.3.6`=`c3f1d6e`）基础上发布 **0.3.7** 并部署演示环境：智能体编排画布节点能看清，任务详情能看到流转记录，会签记录能看到意见摘要和部门，实例详情与审批记录的时间按统一格式显示。修完后把两张截图补回三份 README；Server、Web 两仓带上 MIT 许可证。

非目标：不改流程中心的测试流程；不做设计器映射编辑框对非 JSON 字段可见、详情抽屉头部 ISO 时间以外的新需求；不处理 Web 未合入分支 `feature/ui-figma-align-20261027`；不做移动端。

## 2. 范围与验收标准

### 2.1 界面缺陷（Web）

| ID | 现状 | 验收标准（行为） |
|---|---|---|
| W-a | 智能体编排画布节点没有外框和底色，只有文字 | 1440×900 下，图中每类节点（START、KNOWLEDGE、LLM、CONDITION 及图中实际出现的其他类型）都有可见外框和底色，类型可区分，文字可读；连线与节点不重叠错位；点击节点能打开属性面板。用演示环境现有智能体图验证，不新建演示数据 |
| W-b | 任务详情 `/workflow/task/:id` 在 1440×900 下 `.instance-flow-panel` 高度为 0，流转记录与审批详情页签被裁掉 | 1440×900 下该面板计算高度 > 0，页签内容可见、可切换；页面无横向溢出（`scrollWidth ≤ clientWidth`）。1920×1080 同样正常 |
| W-c | 会签记录弹窗“动作/意见”列显示意见表单名，“所属部门”整列为 `-` | 以 A 流程 `YJ-20261108-008` 的“分公司技术委员会会签”为对象：“动作/意见”列显示意见摘要（与审批详情里的摘要同一来源和格式），“所属部门”显示处理人实际部门名。处理人确实没有部门时显示 `-` 可以接受，回执写明是哪个人 |
| W-d | 实例详情“发起时间”、审批记录“开始/完成时间”显示 ISO 原文并带微秒 | 这些时间与 0.3.4 已修的意见摘要时间使用同一格式（执行方在回执写明格式），不出现 `T` 和微秒；空值显示保持现有习惯。同一抽屉内其他已格式化的时间不回退 |

**W-c 若需后端改动**：先只读核实部门数据能否从现有接口拿到。能拿到就只改 Web。必须改 Server 才能实现时，停在 W-c，回执写明原因、涉及接口和改动面，由 Planner 报 Owner 确认是否发 Server `0.4.1`；W-a、W-b、W-d 及其他不依赖它的工作继续。

### 2.2 README 补图与文字（三仓）

- R1：演示环境重拍 `docs/assets/readme/agent-graph.png`（智能体编排，节点完整，打开属性面板）和 `approval-detail.png`（审批详情，视角与 `sample-a.png` 不同，能看到 W-c 修好的意见摘要和部门）。规格与 P66 Z1 一致：Playwright 1440×900、DPR 2（2880×1800），单张 ≤ 500KB，脱敏。
- R2：两图放回工作区根、Server、Web 三份 README（各仓 `docs/assets/readme/` 同步同一份图）。
- R3：顺带重拍 `sample-b.png`：顶部那行节点完整，左侧菜单高亮与页面一致。
- R4：Server README “临届停机线”改为“临界”。
- R5：三份 README 的版本描述更新到 Web 0.3.7 / Server 0.4.0（若发 0.4.1 则同步）。按读者视角通读：不写内部用语（Owner、UAT、回执、返修、sha256、Release id 等），标题不写状态；全部链接可打开。

### 2.3 许可证（Server、Web）

- L1：两仓根目录新增 `LICENSE`，标准 MIT 原文，`Copyright (c) 2026 Chikaho`（版权方取两仓提交作者名；Owner 要改名的话在验收前告诉 Planner 即可）。
- L2：两仓 README 加“许可证”一节（链接到 `LICENSE`），徽章区可加 MIT 徽章；工作区根 README 对子仓许可证的描述与之一致。
- L3：包描述里已有的许可证字段（如 Web `package.json` 的 `license`、Server `pom.xml` 的 `<licenses>`）与 MIT 一致；没有就按各生态惯例补上，不新增无关元数据。
- 先只读核查：两仓当前是否已有 LICENSE 或其他许可证声明；仓库内是否有复制进来的第三方源码带着与 MIT 冲突的许可证。发现已有非 MIT 声明或冲突时停在 L 项，回执列出事实，由 Planner 报 Owner；其他项继续。
- Server 只为 L1—L3、R2、R4、R5 做文档类改动，走 develop→main 普通合入，**不打 Server tag、不发 Server Release**（除非 W-c 触发 0.4.1 且 Owner 确认）。

## 3. 七阶段与发布

| 阶段 | 内容 |
|---|---|
| 1 评估 | 本方向（已完成） |
| 2 实施 | Web 从最新 `develop` 建 `fix/0.3.7-ui-defects`；Server 从 `develop` 建 `docs/license-readme-20261110`；实施并通过门禁 |
| 3 验收同步 | 提交回执，Planner 验收；通过后按规划下发的终态值清单同步 |
| 4 合并 | 两仓开发分支→develop→main 普通合入，CI success；合并后按长期规则删除已合入分支（删前 `merge-base --is-ancestor`） |
| 5 发版 | Web tag `0.3.7`，CI 构建，发 Release；工作流已固定 `--latest=false`，发布后把本次新建的 0.3.7 Release 设为 Web 的 Latest（同 0.3.6 的设定方式）；其他已发布 Release 不改 |
| 6 发布后同步 | 部署演示环境（只替换 Web 静态资源，先备份原目录，部署前根分区余 ≥ 3G），回读入口 `index-*.js`；同步 `version.json`、`CHANGELOG.md`、knowledge、memory、需求池、`todo/web-ui-defects-20261109.md` |
| 7 结束 | 发布与同步完成，无授权内剩余动作 |

版本：Web **0.3.7**（Owner 已确认，不再询问）。确认 Web 仓不存在 `0.3.7` tag；已有 tag 一律不动。

## 4. 首轮证据清单（一次列全）

过程截图和原始输出存 `product/web-037-patch/receipts/evidence/`（已 gitignore，不入 Git）；回执写结果摘要和文件位置，原文不截断。浏览器正式验收用可见、可交互的会话（`headless=false`），记录 URL、视口、登录身份和对象 ID。

| 项 | 最小充分证据 |
|---|---|
| W-a | 修复后编排画布 1440×900 截图（含属性面板打开态）；列出图中节点类型及各自是否有外框/底色 |
| W-b | 修复前后 `.instance-flow-panel` 计算高度、页签内容区高度、`scrollWidth/clientWidth`（1440×900、1920×1080）；两个页签切换后的截图 |
| W-c | `YJ-20261108-008` 会签记录弹窗截图；每行处理人、意见摘要、部门的实际显示值；部门数据来源（接口路径与字段名，结论即可） |
| W-d | 实例详情与审批记录截图；页面上各时间字段的实际显示值 |
| 门禁 | Web lint、类型检查、单测、构建的命令与结果计数；Server 仅文档改动时说明未跑全量测试的依据（改动文件清单）；两仓 develop、main 的 CI run 号与结论 |
| README | 三份 README 改动摘要、图片尺寸与字节数、GitHub 渲染回读、全部链接状态码、禁用词检查结果 |
| 许可证 | 核查结论（原有声明、第三方源码许可证情况）；两仓 `LICENSE` 在 GitHub 上被识别为 MIT 的回读（仓库页或 API `license.spdx_id`） |
| 发布 | Web 合并链 commit、tag、Release ID、产物文件名与字节数；Server 合并链 commit；演示环境部署前磁盘、备份位置、部署后入口文件名、页面 200 |
| 同步 | 受影响当前入口覆盖矩阵（`roles/executor.md` §4.5） |

## 5. 到点插入项（不阻塞本任务）

P66 Z4（需求池置顶）：2026-11-10 17:16 以后，在本任务中只读检查演示环境 `server.log` 大小与轮转产物、`df -h /`、logrotate 是否实际轮转；同一轮把 `version.json` 的 `development.statusNote` 与 `knowledge/features/multi-database-compat.md` 里的“待 Planner 终态复核”改为 COMPLETED。结果写入 `product/multi-database-compat/receipts/execution-final-05.md` §3。有异常只报告，单独开运维任务，不重开 P66。

## 6. 回执

- 实施与验收证据：`product/web-037-patch/receipts/execution-037-01.md`（阶段 2，含 §4 全部证据）。
- 合并、发版、部署与发布后同步：`execution-037-02.md`（阶段 4—6，Planner 下发终态值清单后执行）。
- W-c 或许可证核查触发停止条件时，在 `execution-037-01.md` 写明，其余项照常提交。

## 7. 冲突与约束

- 无在途任务，无冲突。Server 本次只改文档，与 `feature/p62-perf-bounded-20261011` 不冲突。
- 不碰 Web `vite.config.ts` 未提交改动，不处理 `feature/ui-figma-align-20261027`。
- 不删除、不重建演示服务器、数据库和容器，不清数据，不写演示环境数据库；W-c 验证只读打开既有实例。
- 不强推，不改写历史，不移动已发布 tag，不改已发布 Release（Owner 另有授权的除外）。
- 不碰用户 8080/5173 服务、`smart_workflow_f1v4b`；保留 `.runtime-*`、隔离库、凭据密文和 Server 两个隔离 worktree。
- 过程截图与凭据不入 Git；README 展示图片入 Git（脱敏）。
- 网络不稳定时推送可重试，不用 `sleep` 轮询；不启动不可控后台任务（`system.md` §0.8.2/§0.8.3）。
