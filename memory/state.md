# 当前状态摘要

2026-11-10｜Planner（下发 Web 0.3.7）｜活动任务 Web 0.3.7 补丁 READY；P66 **COMPLETED**（第 52 功能）；Z4 置顶到点插入。

## 当前任务

**Web 0.3.7 补丁（L，READY）**：Owner 2026-11-10 选定、版本已确认；W-a—W-d、README 补图、两仓 MIT 许可证；方向 `product/web-037-patch/ready/direction-web-037-patch.md`，七阶段 1/0/6。

P66 多数据库兼容（XL）**COMPLETED**（`product/multi-database-compat/receipts/planning-final-review-p66-completed.md`，方向归 `passed/`），以 **Server 0.4.0** 发布并部署 UAT。审查链 final-02—11：Z1 七图重拍、README 按 Owner 方案 A 下掉 agent-graph/approval-detail（剩 6 张）；Z2 回滚必须恢复 pre040 dump；Z3 develop=main=`a4f6c278`；W-a—W-d 留下个 Web 补丁（`todo/web-ui-defects-20261109.md`），测试流程不隐藏。已合入分支按规则删除，两仓只剩 main/develop/未完成分支，tag 未动。Z6—Z9 已完成（`execution-final-05.md` §6/§7/§9）；Z4 见需求池置顶。

- **发布**：tag `0.4.0`=`a4f6c278`，Release `438918154`，`bootstrap-0.4.0.jar`
  236,245,457 B sha256 `188be963…`。
- **UAT**：build.version=0.4.0、health UP、根 200、Flyway v0.4.0（33 行）；新增
  `V0.4.0__knowledge_vector_persistence.sql` 与 `R__0.4.0_rename_bpm_opinion_comment.sql`；
  旧 31 条校验和不变；管理员工具启用过滤 internal=3/external=1/disabled=0。
- **X1**：智能体工具 `enabled` 恢复 Boolean 绑定；PG 真实测试覆盖 12 处查询；六库冒烟全部通过。
- **验证**：全量 `mvn test` **2,481 / 0 / 0 / 45 skipped**；CI feature #123、develop #126、
  main #127 success。

三示例流程（0.3.1—0.3.6）保持 **`COMPLETED`**；Web 0.3.6（tag `c3f1d6e`，Release `438126185`）不变。

## 基线

功能 **52**；M59/18/13=90；ADV1/7/56=64；实际 P63；问题 57；正式基线变更 []。已核销
P2/P4/P9/P15/P19/P29/P34/P47/P65/P66，P35 部分；P20 未核销。

正式/部署版本：Server **0.4.0**（tag `a4f6c278`，Release `438918154`），Web **0.3.6**
（tag `c3f1d6e`，Release `438126185`）；Flyway V0.4.0。UAT 磁盘 67%（余 6.0G）。

Owner 定：本机隔离环境（`smart_workflow_030`、`.runtime-030` 等清单见 handoff）保留不删，
含凭据密文，只要求不泄露，已 gitignore。Key/授权码不入 Git。

## 后续候选（需求池观察区）

DM8/KingbaseES Owner 实库验证；日志管理页面（按类动态调等级）；
`JavaSubprocessExecutor` 子进程输出竞态（`todo/iot-subprocess-output-race.md`）；CI 偶发失败族；
知识库写权限粒度；短信电话渠道（未采购）；Agent 逐节点进度事件；P20。

## 教训

0.3.3：缺陷判定要看迁移链跑完后的最终列类型，不能只看基线；Boolean 列不能绑 1/0。
0.3.x：审查要逐字核对表单数据内部一致性；用户可见英文编码判不通过；「我的实例」只含发起实例。
0.2.4：给执行的替代路线先核前提是否存在。P66：六库冒烟必须含智能体工具启用过滤，不能只跑建表/种子。
