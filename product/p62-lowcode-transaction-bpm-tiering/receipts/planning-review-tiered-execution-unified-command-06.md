# 分级执行与统一命令复核06：VERIFYING

2026-10-02，Planner。输入回执06、提示04、r06原始输出；仍VERIFYING。G7a身份及原始回归交付关闭；G3b拆为G3b1同键异载荷拒绝、G3b2旧FLOW_START重复实例反证。提示05成为唯一入口，提交回执07。

## 独立核验

r06证据清单15/15哈希匹配；另有g3b-final三件及提交身份追加记录，按各自声明范围阅读，不将清单15误称全部文件数。Server最终ea6d16c与Web c75f77e有原始ls-remote输出；Workspace证据批次03387aa9有原始读回，记录自身所在追加批次不递归要求自身SHA。7ba52ee生产快照→b6e9a45修复映射与最终快照实跑已交，后续仅测试和文档差异已声明；G7a关闭。

原始测试输出确认process全量242/0/0/0，边界类6/0/0/0，合跑中Overlap3/0/0/0、真实引擎Overlap4/0/0/0、CrossChannelIdentity2/0/0/0。合跑FrozenSemantics3/1F/0E，单跑3/0/0/0。不得将两轮组合宣称无失败，以下按失败断言实义裁决。

## G3b1：实际合同不符

boundary-raw.txt明确：
- async-payload原comment为第一载荷，第二次改为第二载荷仍http200/code0返回同commandId；payload_fingerprint=NULL。
- sync-payload同身份改comment/opinionData仍http200/code0；记录保留旧值。

锁定原结果不被覆盖、无新增效果的子结论；但这不等于同键异载荷被拒绝。原ready方向“命令与一致性合同”及U02从一开始要求同键不同有效载荷拒绝；提示04也明确同一边界。回执同时承认comment/opinionData在首次执行会写入动作记录，不能因任务已结束就把它们重新定义为无效载荷。并非强制某个指纹字段或新增API，而是要求明确冲突结果；当前行为属于合同缺陷，须修复生产路径及测试期望。

不同操作人/不同动作四个场景的2305或FAILED、原结果无新增已证实，锁定。只有修复触及这些分支时补受影响回归。

## G3b2：锁定项因新反证局部重开

g7a/bootstrap-four-tests-run1-frozen-flake.log明确失败方法：P62FrozenSemanticsPgTest.realFlowStartHandlerStartsRealInstanceAndIsIdempotent，第260行，断言标题“旧类型命令消费启动真实实例”，expected 1L but was 2L。

这是非空旧handler实例唯一性反证，直接触及U02/U03/U06与此前G3b已锁定旧handler，不因本轮审批修复与该类无代码交集而消失。单独重跑绿只证明另一次通过，尚未区分生产竞态、夹具污染或查询范围错误；当前不能确定实际生产缺陷，先诊断真实对象和双实例来源，再修复相应层。严禁把expected改为2或仅通过串行化/禁调度隐藏生产竞争。

## 已过与下发

G7a关闭，G3b其他正向/身份边界保持；测量、OA、UI、设备与已确认恢复全部锁定。只下发两行，不重开全面业务验收。P62整体PLANNING、分级执行VERIFYING、首事务COMPLETED、0.1.3 Owner已验收；功能45/清单46-22-22/ADV64/问题57不变。下一动作Executor按提示05修正两项并提交07。
