# Server 0.4.1 + Web 0.3.8：会签记录意见与部门、画布与截图收尾

日期：2026-11-10｜规划（Planner）｜等级：**L**（跨仓接口字段 + 两仓发版）｜状态：`READY`｜缺陷修复，不计功能数、不核销 P 编号

## 0. 来源与 Owner 裁决

- 来源：`product/web-037-patch/receipts/planning-review-037-01.md` §2。
- **Owner 2026-11-10 定**：W-c 发 **Server 0.4.1 + Web 0.3.8**，版本号已确认，不再询问；走完七阶段。
- 已锁定、不重验：W-a 节点样式、W-d、L1—L3、R2 放置方式、R4、R5，以及 0.3.7 发布事实。

## 1. 第一步：0.3.7 收尾（只读或文档）

| ID | 动作 | 完成条件 |
|---|---|---|
| C1 | 回读 Server README 合并提交 CI（develop `42760022678` 重跑、main `42760040390`） | 两个 run 结论写进回执；失败的话给出失败用例，看是否属于已登记的偶发族 |
| C2 | 压缩 `memory/`：当前 20,561 B | 总量 < 20,000 B，单文件 < 5KB；回执写压缩前后字节数和移除了什么 |
| C3 | CI 安装源：检查 `registry.npmmirror.com` 从 runner 是否恢复 | 恢复了就去掉 Web `build-release.yml` 的 `npm_config_registry` 覆盖，随本次合并，CI 回读 success；没恢复就保留，回执写检查结果 |
| Z4 | P66 Z4（需求池置顶，2026-11-10 17:16 以后） | 按需求池置顶条目执行，写进 `product/multi-database-compat/receipts/execution-final-05.md` §3 |

## 2. 修复范围

| ID | 现状（`planning-review-037-01.md`） | 验收标准 |
|---|---|---|
| W-c（Server） | `GET /workflow/tasks/{taskId}` 的审批历史没有 `opinionFields`；`ApprovalHistoryItemDTO` 没有部门字段 | 该接口历史行带意见字段，解析方式与「我发起的」实例详情一致（复用现有实现，不另写一套）；带处理人部门名。真实 PG 测试覆盖：有意见表单的会签行、无意见表单的普通行、处理人无部门。新增字段不影响其他调用方。**不改迁移** |
| W-c（Web） | 会签记录弹窗「动作/意见」显示表单名，「所属部门」整列 `-` | 以 A 流程 `YJ-20261108-008` 的「分公司技术委员会会签」为对象：「动作/意见」显示意见摘要（与审批详情摘要同源同格式），「所属部门」显示实际部门名；确实没有部门的人显示 `-`，回执写明是谁 |
| W-a2 | 左→右排布的图，连线从节点底部接到顶部，绕出弧线；默认缩放下节点字约 7px | 按左→右排布，连线从源节点右侧接到目标节点左侧，不在节点上下绕弧、不压节点边框；打开设计器时画布自动适配，1440×900 下节点文字渲染 ≥ 12px（CSS），整张图横向占画布宽度 ≥ 60%。用「MES 温度偏离智能研判」v1 验证；W-a 节点样式不能回退 |
| W-b2 | 演示环境证据用的是单字段表单的「已办」弹层，没有触发原缺陷 | 不改代码，只读测量：在 `/workflow/task/:id` 路由打开一个表单高度 ≥ 1000px 的真实任务（A/B/C 示例流程的任务，回执写明 taskId 和表单高度），1440×900 与 1920×1080 下 `.instance-flow-panel` 高度 > 0，页签内容可见可切换，`scrollWidth ≤ clientWidth`。如果仍然被压缩，就作为缺陷在本轮修掉 |
| W-e | 流程监控实例列表「发起时间」列显示 ISO 原文 | 与 W-d 同格式（`yyyy-MM-dd HH:mm`），列表中无 `T`、无微秒；同页面其他已格式化时间不回退 |

W-c 的改动只限这个接口和它的 DTO；Server 不顺带改其他行为。

## 3. README 截图

规格同 P66 Z1：Playwright 1440×900、DPR 2，单张 ≤ 500KB，脱敏；三仓 `docs/assets/readme/` 放同一份文件，三份 README 引用。

- R1a `agent-graph.png`：W-a2 修好后重拍，属性面板打开，节点文字清楚。
- R1b `approval-detail.png`：W-c 修好后拍，视角与 `sample-a.png` 不同，能看到会签记录的意见摘要和部门列；放回三份 README。
- R3b `sample-b.png`：校园出入口异常事件分级处置（`XY-20261108-015`）流程图。从「已办任务」或「我发起的」进入，侧栏高亮与入口一致；流程图放大到横向占画布 ≥ 80%，节点文字清楚，顶部节点不被裁。
- 三份 README 版本描述更新为 Server 0.4.1 / Web 0.3.8；按读者视角通读，禁用词检查与全部链接回读。

## 4. 七阶段与顺序

| 阶段 | 内容 |
|---|---|
| 1 评估 | 本方向（已完成） |
| 2 实施 | Server 从 `develop` 建 `fix/0.4.1-approval-history`，Web 从 `develop` 建 `fix/0.3.8-approval-record`；本地/隔离环境实现与门禁 |
| 3 验收 | **先验收后合并**：在隔离环境（本机 Server 0.4.1 分支 + Web 分支）对 W-c、W-a2、W-e 取浏览器证据，提交 `execution-041-01.md`，等 Planner 验收通过再进入阶段 4 |
| 4 合并 | 两仓开发分支→develop→main 普通合入，CI success；已合入分支按长期规则删除 |
| 5 发版 | Server tag `0.4.1`、Web tag `0.3.8`，Release；0.4.1、0.3.8 分别设为两仓 Latest；其他已发布 Release 与 tag 不动 |
| 6 部署与同步 | 部署演示环境：先 Server 后 Web；部署前根分区余 ≥ 3G，先备份原 jar/配置与 Web 目录；Server 部署后核对 `build.version=0.4.1`、health UP、`flyway_schema_history` 无新增行。部署后做 W-c、W-a2、W-b2、W-e 演示环境复测与 R1a/R1b/R3b 拍图，提交 `execution-041-02.md`；同步 `version.json`、`CHANGELOG.md`、knowledge、memory、需求池、`todo/web-ui-defects-20261109.md` |
| 7 结束 | Planner 复核演示环境证据与同步后结束 |

两仓 tag 不存在 `0.4.1`/`0.3.8` 时才创建；已存在的 tag 不动。发布后发现问题需要移动 tag 或替换资产，先报 Planner，由 Owner 确认。

## 5. 首轮证据清单

过程截图与原始输出放 `product/approval-record-patch/receipts/evidence/`（不入 Git）。浏览器证据用可见会话，写明 URL、视口、登录身份、对象 ID。

| 项 | 最小充分证据 |
|---|---|
| C1—C3、Z4 | run 号与结论；memory 前后字节数；镜像检查结果 |
| W-c | Server：真实 PG 测试命令与计数，接口实际响应中该会签行的意见字段与部门字段（非秘密字段节选即可）；Web：会签记录弹窗截图与每行处理人/摘要/部门显示值 |
| W-a2 | 设计器截图；连线源/目标连接点位置（左右侧）；节点文字计算字号；图宽占画布比例 |
| W-b2 | taskId、表单高度、两档面板高度、页签内容高度、`scrollWidth/clientWidth`、页签切换截图 |
| W-e | 列表截图与「发起时间」列实际显示值 |
| 门禁 | Server 全量 `mvn test` 计数；Web typecheck/lint/test/build 计数；各 CI run 号 |
| 发布与部署 | commit、tag、Release ID、产物名与字节数；备份位置、部署后版本、health、Flyway 行数、入口文件名 |
| README | 三张图尺寸与字节数、raw 200、禁用词与链接检查结果 |
| 同步 | 覆盖矩阵（`roles/executor.md` §4.5） |

## 6. 约束

- 不删除、不重建演示服务器、数据库和容器，不清数据，不写演示环境数据库；W-c、W-b2 只读打开既有实例。
- 不强推，不改写历史；除 §4 的报批路径外不移动 tag、不改已发布 Release。
- 不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`。
- 不碰用户 8080/5173 服务、`smart_workflow_f1v4b`；保留 `.runtime-*`、隔离库、凭据密文和 Server 两个隔离 worktree。
- 过程截图与凭据不入 Git；README 展示图入 Git（脱敏）。
- 不用 `sleep` 轮询，不启动不可控后台任务（`system.md` §0.8.2/§0.8.3）。
