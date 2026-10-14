# BF20261013-027 执行回执：提示去除 / 可退回节点选择 / 发起子流程三步向导

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 截图×2 + 文字三项。

## ①不需要这种提醒

- 移除节点属性每次变更弹出的「属性已更新（保存后生效）」提示（ProcessDesigner.applyProps），中英 key `workflow.propsUpdated` 同步删除。
- 验证：已送达模块核对 `fetch('/src/modules/workflow/views/ProcessDesigner.vue')` 与 `zh-CN.ts` 均不含 `propsUpdated`/`属性已更新`；实景交互全程 `.el-message` 计数 0。

## ②可退回节点应该是选择，不要填写

- `returnTargets` 字段改为**本流程节点多选**（审批/会签节点，排除当前节点；值=节点编号，与服务端 `BFTaskFacade.isAllowedReturnTarget` 的严格声明口径一致）；兼容旧图逗号分隔文本回显。
- 验证：面板渲染为 el-select（placeholder 选择节点），截图 evidence/bf027-node-panel.png。

## ③子流程配置改为三步向导（发起条数由后台按数据决定）

面板只留：开关「发起子流程」+ 入口（配置子流程/修改配置）+ 一行摘要（子流程名｜初始值 n 项｜同值汇总/逐行单独）。点击进入弹窗，三步：

1. **触发方式**：写脚本（统一脚本弹窗，变量授权=全部已定义变量，与节点触发器同口径）或**选字段**（选主表单字段，字段值为真即发起；自动生成等价脚本并补齐 `var_<字段>` 同名自动取值变量）。
2. **子流程**：选择已发布流程（自动解析其绑定表单作为初始值候选字段来源）。
3. **初始值**：每行 = 子流程表单字段 + 取值方式（**选字段/自由填写/脚本**）+ 取值；来源选字段时按分组选择「主表单字段」（→ 同名变量）或「表格列」（→ 逐行/分组取值 + 自动补齐 ROWS 集合变量）。
   - **汇总 / 单独**：来源含表格列时出现该单选——单独=逐行各发一条（START_EACH）、汇总=相同列值合并一条（START_GROUPED，groupBy=该列）。**发起条数不再由用户配置**（移除「发起范围」「集合变量」入口），由数据行数与合并选择决定，服务端 maxDispatch 护栏不变。

向导为**草稿态**：取消即零改动（不写节点配置、不生成触发/等待块、不建变量）；「完成」才统一应用并补齐变量。旧配置形状（mode/sourceVariable/取变量值/自由填写）自动映射回显。

**引擎配套（本批唯一服务端改动）**：`ActionConfig.ActionMapping` 新增 `script` 映射源，`TriggerExecutionService` 每动作求值一次后逐项复用（与判断脚本同上下文/快照；求值失败整体拒绝派发，不静默降级为 null）。新增单测「映射脚本源」1 例。

## 验证

- Server：engine 全量测试 EXIT=0（TriggerExecutionServiceTest 22/22）；`mvn -pl sw-bootstrap -am package -DskipTests` 打包成功；重启（pid 26351，health 200）。
- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest 1477 通过 3 跳过、build ✓。
- 实景（应用内浏览器，本机 5173，1280×720，管理员会话）：面板（提示消失/可退回节点选择/子流程入口）、向导第①②③步逐屏核对（截图 bf027-node-panel / bf027-wizard-step1..3）。第②步下拉当前环境无已发布流程定义（无数据，属数据现状）；第③步「汇总/单独」随表格列来源出现，Owner 表单当前无表格字段故未出现（逻辑与引擎分组用例已覆盖）。
- **数据说明**：向导全程草稿态，取消后无脏标记、无提示、Owner 节点配置与已保存图零改动；验证结束标签页回到原设计器地址。

## 提交

- Web：codex/bugfix-20261013（ProcessDesigner 三项 + locales + mock）。
- Server：codex/bugfix-20261013（ActionMapping.script + TriggerExecutionService 求值 + 单测）。
- 根仓：台账 BF20261013-027 行 + 本回执 + 证据（本地）+ 两子仓 gitlink。

## 状态

待 Owner 点验（与 BF001—026 同批）。
