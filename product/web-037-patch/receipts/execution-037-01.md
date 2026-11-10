# Web 0.3.7 补丁 · 阶段 2 实施与验收证据（execution-037-01）

日期：2026-11-10｜执行（Executor）｜方向：`product/web-037-patch/ready/direction-web-037-patch.md`｜等级：L

## 1. 概要

阶段 2 实施完成，两仓分支已推送并回读一致。W-a、W-b、W-d 修复完成并在本地 mock 环境验证行为；W-c 按方向 §2.1 停止条件停在“需 Server 改动”，事实见 §6；L1—L3 许可证完成。R1—R3 截图依赖 0.3.7 部署演示环境，安排在阶段 6；R4、R5 的许可证/文字部分已完成，版本号文案待发版后回写。

- Web 分支：`fix/0.3.7-ui-defects` @ `6031b51`（已推送，远端回读一致）
- Server 分支：`docs/license-readme-20261110` @ `d672760`（已推送，远端回读一致）
- 阶段进度（七阶段）：评估、实施已完成；W-c 停在待 Owner 裁决；合并、发版、发布后同步、结束未开始 → **2/1/4**

## 2. 实际修改文件

### Web（commit `6031b51`，8 文件 +143/−13）

| 文件 | 摘要 |
|---|---|
| `src/adapters/flow-graph/index.ts` | W-a：引入 `theme-default.css`；业务节点类型（START/LLM/CONDITION…）不是 vue-flow 内置类型，统一映射 `default` 渲染，原类型写入 `vf-node-<type>` class |
| `src/adapters/flow-graph/node-theme.css`（新增） | W-a：按类型叠加边框色/底色（START/END 绿、LLM 蓝、TOOL 橙、CONDITION 红、LOOP 灰、FORK/JOIN 虚线、KNOWLEDGE 紫） |
| `src/modules/workflow/views/TaskDetail.vue` | W-b：`.instance-flow-panel` 与 `.detail-card--actions` 设 `flex: 0 0 auto`，作为 flex 子项不再被压缩，页签不被 el-card `overflow:hidden` 裁切 |
| `src/modules/workflow/views/ProcessInstanceList.vue` | W-d：新增 `formatDrawerTime`（`yyyy-MM-dd HH:mm`），用于抽屉“发起时间”和审批记录“开始/完成时间” |
| `src/foundation/mock/handlers.ts` | 补三个缺省 mock handler：`GET /workflow/tasks/:taskId/opinion-draft`、`GET /workflow/commands/tasks/:taskId/latest`、`GET /agent/knowledge-bases`（缺 handler 会穿透到真实代理并以 401 触发登出，阻断本地验证） |
| `LICENSE`（新增） | L1：MIT 原文，`Copyright (c) 2026 Chikaho` |
| `README.md` | L2/R5：License 徽章 `internal demo`→`MIT`；许可证段落改为指向 LICENSE |
| `package.json` | L3：`"license": "MIT"` |

未提交：`vite.config.ts` 的既有未提交改动（与本任务无关，按方向 §7 保留不动）。

### Server（commit `d672760`，3 文件）

| 文件 | 摘要 |
|---|---|
| `LICENSE`（新增） | L1：MIT 原文，`Copyright (c) 2026 Chikaho` |
| `README.md` | L2/R4：License 徽章改 MIT；许可证段落指向 LICENSE；「临届停机线」→「临界停机线」 |
| `pom.xml` | L3：`<licenses>` 声明 MIT |

## 3. 门禁与验证

### 3.1 Web 四连（本地，全部通过）

| 命令 | 结果 |
|---|---|
| `pnpm typecheck`（`vue-tsc -b --noEmit`） | 通过，无输出错误 |
| `pnpm lint`（`eslint .`） | 通过，无输出错误 |
| `pnpm test` | **235 passed / 1 skipped（236 文件）；2054 passed / 3 skipped（2057 用例）** |
| `pnpm build` | `✓ built in 5.41s`（仅有 rolldown 纯注解位置提示，非错误） |

`src/adapters/flow-graph/index.spec.ts` 单跑 6/6 通过（adapter 契约未破坏）。

### 3.2 Server

仅文档与 pom 元数据改动（`LICENSE`、`README.md`、`pom.xml`），未涉及 Java 代码与迁移；按方向 §4 门禁项以改动文件清单说明未跑全量测试的依据。CI 将在阶段 4 合并时给出结论。

### 3.3 浏览器行为验证（本地 dev:mock，1440×900 / 1920×1080，登录身份 superadmin）

| 项 | 实际结果 | 证据 |
|---|---|---|
| W-b | 修复前 `.instance-flow-panel` 被压缩（el-card `overflow:hidden` 裁掉页签内容）；修复后 1440×900 面板高 112–144px、页签内容区可见，1440/1920 两档 `scrollWidth=clientWidth`（无横向溢出）；流转记录/流程图/审批详情三页签可切换 | `evidence/w-b-task-detail-1440.png`、`evidence/w-b-task-detail-approval-tab-1440.png`；实测值：1440×900 → panel 112 / tabsContent 64 / activePane 96；1920×1080 → panel 112 / tabsContent 64；两档 `sw=cw` |
| W-d | 实例详情抽屉“发起时间”=`2026-07-25 13:20`，审批记录开始/完成时间=`2026-07-25 13:20`/`14:00`；整个抽屉文本无 `T`、无微秒 | `evidence/w-d-instance-drawer-1440.png` |
| W-a | 本地 mock 画布节点渲染存在**既有** dev 故障（边缘 svg 正常、`.vue-flow__nodes` 为空、transformationpane opacity 0）。已用 `git stash` 还原本次改动做基线对照：**原代码同样 0 节点**，证明与本次改动无关。正式视觉验证按方向要求放在演示环境（0.3.7 部署后）进行 | 基线对照见本回执 §5 |

W-b 页签内容折叠问题的直接触发条件是“表单画布很高时流程信息卡被压缩”，mock 数据表单较短，故另行注入 2000px 高的 `.task-main` 模拟超长表单：面板保持自然高度 112px、不被压缩，页面在 `.task-detail` 滚动容器内滚动。

## 4. 证据文件位置

- 本回执 §3 截图：`product/web-037-patch/receipts/evidence/`（已 gitignore，不入 Git）
- 命令原始输出：Web 四连输出见本机终端记录；本回执 §3.1 计数为实际输出。

## 5. 已知限制与偏差

1. **W-a 本地视觉验证不可得**：dev 环境 vue-flow 节点渲染存在既有故障，与本次改动无关（stash 对照同为 0 节点）。修复有效性将在演示环境 0.3.7 部署后按方向 §4 验证（1440×900 截图、节点类型清单、属性面板）。
2. **流程实例列表页“发起时间”列仍显示 ISO 原文**（如 `2026-07-25T13:20:00`）：W-d 按方向字面范围只修实例详情抽屉与审批记录；列表列属同类但未点名的显示。未扩大范围，报规划决定是否另开。
3. mock 增补的 3 个 handler 属 dev 验证设施，生产构建不包含（`import.meta.env.DEV` 双 gate + 动态 import）。

## 6. W-c 停止事实（按方向 §2.1 停止条件）

- **所需数据不在现有任务详情响应中**：`GET /workflow/tasks/{taskId}` 由 `BpmTodoController` 组装 `approvalHistory`，未调用 `resolveOpinionFields`（仅“我发起的”实例详情 `BpmMyInstanceController` 有该逻辑），因此会签记录行没有 `opinionFields`，前端只能回退显示意见表单名。
- **部门字段不存在**：`ApprovalHistoryItemDTO` 没有 `assigneeDept` 字段，Server 任何位置都未 `setAssigneeDept`；Web 契约里该字段恒为空字符串，故整列 `-`。
- **部门数据本身可取得**：`GET /system/user` 返回用户 `deptId`，`GET /system/dept/options` 可映射部门名；但*意见摘要*必须由 Server 侧按冻结表单快照解析（`opinionFormSnapshot` 只在 Server 动作记录里），Web 无法从现有接口还原。
- **结论**：W-c 必须改 Server 才能实现（`BpmTodoController` 接入 `resolveOpinionFields` + DTO 增补/填充 `assigneeDept`）。按方向停在 W-c，请 Planner 报 Owner 确认是否发 Server `0.4.1`；本回执其余项照常提交。
- 依赖接口：`GET /api/workflow/tasks/{taskId}`（`BpmTodoController.taskDetail`）；改动面：`ApprovalHistoryItemDTO` + 该控制器历史组装（复用 `BpmMyInstanceController.resolveOpinionFields` 的现有实现，含人员姓名/日期本地格式）与部门解析（`/system/user`/`dept` 目录服务）。

## 7. 许可证核查结论（L1—L3 前置）

- 两仓此前均无 `LICENSE`、无其它许可证声明（Server `pom.xml` 无 `<licenses>`；Web `package.json` 无 `license`，README 徽章为 `internal demo`）。
- 两仓源码无复制进来的第三方源码带冲突许可证头（对 `Apache License`/`GPL` 等关键词全量 grep 为 0）。
- 两仓提交作者均为 Chikaho 系（`Chikaho`/`Chikaaho`/`Chikaho@server`），按方向取 `Copyright (c) 2026 Chikaho`。

## 8. 与验收标准逐项对照

| ID | 标准 | 现状 |
|---|---|---|
| W-a | 各节点类型有可见外框/底色、可区分、连线不重叠、点击开属性面板 | 代码完成；本地 dev 无法渲染（既有故障）；演示环境验证待阶段 6 |
| W-b | `.instance-flow-panel` 计算高度 >0、页签可见可切换、无横向溢出（1440/1920） | 本地 mock 实测通过（数值见 §3.3），演示环境复核待阶段 6 |
| W-c | 意见摘要与部门 | **停止**，待 Owner 裁决 Server 0.4.1 |
| W-d | 时间与 0.3.4 同格式、无 T/微秒 | 本地实测通过；格式为 `yyyy-MM-dd HH:mm` |
| R1—R3 | 三张截图重拍 | 待阶段 6（部署后） |
| R4 | 临届→临界 | 完成 |
| R5 | 版本文案、读者通读、链接 | 版本号文案待发版后回写；链接与禁用词检查在阶段 6 统一做 |
| L1—L3 | 两仓 MIT | 完成，GitHub 识别（`license.spdx_id`）待合并后回读 |

## 9. 自验结论

阶段 2 范围内可执行项已完成并通过门禁；W-c 按停止条件保留，未影响其余项。后续按方向阶段 4—6 继续（合并、Web 0.3.7 发版、部署、截图与同步）。自验不等于规划验收。
