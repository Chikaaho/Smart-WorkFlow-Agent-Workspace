# BF20261013-026 执行回执：审批人单一口径（修正 BF025 遗留）

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 追加文字一条。

## Owner 口径（本次修正依据）

- 不需要两套配置概念：**审批人就是参与人**，同一概念只能有一个说法。
- 若配置出来的「参与人」可能不是审批人，即无意义——**需要「参与但不审批」的人，用抄送**（抄送是独立节点/能力，不占用审批节点的配置概念）。

## 修正内容（BF025 的方向被否决并覆盖）

- **设计器审批/会签节点配置面**：「参与人策略」→「审批人策略」；「指定人员」按钮「选择人员」→「选择审批人」；旧数据兼容提示与表达式脚本弹窗标题中的「参与人」→「审批人」。
- **选择弹窗**（ApproverCandidatesDialog）：「选择参与人」→「选择审批人」、「已选参与人（{count}）」→「已选审批人（{count}）」；部门模式标题保持「选择部门」。
- **运行时加签**（TaskDetail ADD_SIGN）：「参与人」→「审批人」、占位符→「搜索并选择审批人」、校验提示→「请选择至少一个审批人」；补签占位符独立为「搜索并选择确认人」（原复用「参与人」占位造成与标签不一致）。
- **服务端能力契约**（权威标签）：APPROVAL/会签 的 participant 字段标签「参与人」→「审批人」；**抄送 / 通知等服务节点保持「参与人」**——那正是 Owner 指的「参与但不审批」落点（抄送）。Web 侧 mock 能力清单同步。
- 未用 key（participantIdsLabel）删除。

## 验证

- Server：engine 模块全量测试通过（EXIT=0）；`mvn -pl sw-bootstrap -am package -DskipTests` 打包成功；**重启（pid 22499，8080，health 200）**；登录后实测能力端点 `GET /api/workflow/defs/node-capabilities`：审批=审批人、会签=审批人、抄送=参与人、通知=参与人（脚本 /tmp/bugfix-20261013/bf026-capability-check.mjs）。
- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest 1477 通过 3 跳过、build ✓。
- 实景（应用内浏览器，本机 5173，1280×720，管理员会话）：审批节点面板「审批人策略=选择人员」「指定人员→选择审批人」（evidence/bf026-node-panel.png）；弹窗标题「选择审批人」、已选「已选审批人（0）」（evidence/bf026-picker-dialog.png）。

## 数据说明

- 浏览器核对只做节点选中与弹窗开关（未点保存、未切换策略、未确认选择），Owner 流程定义未被改写；验证结束标签页回到原设计器地址。

## 提交

- Web：codex/bugfix-20261013 `cf349d0`（设计器/弹窗/TaskDetail/locales/mock）。
- Server：codex/bugfix-20261013 `65a0918`（ApprovalUserTaskTranslator、ConsensusNodeTranslator 标签）。
- 根仓：台账 BF20261013-026 行 + BF025 修正注记 + 本回执 + 两子仓 gitlink。

## 状态

待 Owner 点验（与 BF001—025 同批）。
