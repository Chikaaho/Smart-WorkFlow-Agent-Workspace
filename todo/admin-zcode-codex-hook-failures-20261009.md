# ZCode与Codex Hook故障续办

## 2026-10-10当前裁决：ZCode核查通过，Codex挂起

依据[复核02](../product/workspace-governance-consistency-audit/receipts/planning-review-zcode-codex-hook-followup-02-20261010.md)及Owner最新“验收，codex的hook先挂起”：HK-C挂起，已通知原Admin停止信任催办、派发补证、重复读取及继续修复，仅收尾自身在途任务；等待Owner明确恢复。原实现/真实隔离派发通过与原工作区modified未可信生效边界保留。挂起事项不包含停用/删除配置或改trusted_hash，不作为P64业务依赖。

HK-Z本次核查与诊断增强验收通过、续办关闭。修复后真实Admin/Executor自然Stop三段关联齐全，三阶段exit0；历史同session拒绝后无用户输入自动续行，结合未变裁决路径及已过受控回归构成充分组合。无需人为制造修复后新拒绝。间歇派发根因未定，空项目根候选、遥测缺失与历史失败/live=false保留；Owner以后报告同型故障再进入具体核查。

当前无HK-Z补证待办，HK-C按Owner挂起。精确治理文档Git收尾沿既有普通授权，不重开验证。以下为原交接与前次执行口径，仅作追溯。

## 原交接与前次执行口径（历史）

当前HK-C状态（2026-10-09）：Owner最新分工为本会话只处理Codex。Codex Windows接线已修复，入口回归与本机app-server真实隔离派发/同线程自动续行通过；真实工作区新声明的信任状态仍为`modified`，生效边界见[Codex修复回执](../product/workspace-governance-consistency-audit/receipts/receipt-admin-codex-hook-failure-20261009.md)。下文保留初始双线交接；ZCode沿另一会话回执独立办理。

2026-10-09；Planner交接，执行角色Admin。状态：待管理员分别核查。Owner本轮明确要求管理员任务继续，分别检查ZCode和Codex；授权核实、修复对应治理接线、配置与诊断，按既有规则验证和精确Git收尾。业务实现由Executor独立推进。

## 输入与事实边界

- Owner报告约21:50两宿主Hook失效。首图显示21:41：UserPromptSubmit用户132ms，Stop用户289ms失败；第二图显示Stop项目，运行1/未成功1/已阻止0，`hook exited with code 1`。截图只能证明显示的失败现象，尚不能确认未执行、规则拒绝或运行能力故障。
- 两张Owner原图副本：[ZCode现象](../product/workspace-governance-consistency-audit/receipts/evidence/hook-failures-20261009-2150/zcode-stop-failed.png)、[Codex现象](../product/workspace-governance-consistency-audit/receipts/evidence/hook-failures-20261009-2150/codex-stop-exit-1.png)。以实际宿主身份复核图片归属，不凭外观推定根因。
- 前次[正式安装回执](../product/workspace-governance-consistency-audit/receipts/receipt-admin-windows-stop-gate-installed-20261009.md)及[Owner通过记录](../product/workspace-governance-consistency-audit/receipts/receipt-owner-windows-stop-gate-acceptance-20261009.md)保持历史结案。本次是Owner反馈后的新事件；前次受控进程链通过没有完成真实宿主派发验证。

## 两条独立核查线

| ID | 核查对象 | 必须回答与结果 |
|---|---|---|
| HK-Z | ZCode UserPromptSubmit/Stop | 定位21:41及约21:50对应session、角色、Hook来源/有效范围、实际声明与展开后的argv/cwd；宿主是否调用launcher、收到何种stdout/stderr/退出码，拒绝是否正确呈现并让同会话继续。 |
| HK-C | Codex项目Stop | 定位`hook exited with code 1`对应session、角色和项目配置；检查实际可支持的Hook协议、事件载荷、调用参数、cwd/项目根、权限环境与宿主投影，区分合法拒绝被当失败、运行失败和未接线。 |

先按本地时间21:35—22:00有限窗口查原日志，保留时区与原时点；扩大窗口须由明确线索驱动。每条关联同session的宿主事件→入口→公共Validator三阶段→退出投影；脱敏记录解释器真实可执行性、组件revision、异常类别、错误流与退出码。不要把两宿主合并推定为WindowsApps或同一根因，不用现有历史失败计数当本次失败证据。

## 实施与验收

1. 先读system.md并确认Admin，读取Admin职责及前次记录；检查正式修复、实际用户/项目配置是否一致，包含宿主启动环境快照、路径展开、UTF-8/stdin传递及角色/任务绑定。Planner或未武装会话的Stop行为须符合原角色边界。
2. 按每条真实诊断修复最小受影响适配/配置/诊断路径，保留公共契约、合法拒绝和fail closed，不通过停用Hook、删失败记录或强制放行结束任务。涉及宿主能力事实以本机版本/官方协议为据，不靠猜测。
3. 对每个平台分别取得修复后真实宿主派发结果：合法结束可结束；受治理的未完成/合法拒绝输入应明确阻止并在同会话继续，原因可回读。受控进程链/单测可补充但须明确层级，不能替代真实宿主派发。若无法安全触发自然宿主事件，完成独立工作后如实说明缺失及实际能力限制，不虚报通过，也不索取重复实施授权。
4. 所有验证有限、可观测、有超时与精确自身进程清理；不终止Owner已有服务。不进入业务代码/数据库/测试，不改Server/Web gitlink。普通治理路径提交推送沿既有授权，精确排除并行业务文档和代码。
5. 追加`product/workspace-governance-consistency-audit/receipts/receipt-admin-zcode-codex-hook-failures-20261009.md`，分别给HK-Z/HK-C现象、根因或未证实边界、修改与有效范围、真实派发证据/反向断言、清理、Git截止回读及剩余动作。证据放同名事件目录，原图/历史原件保留。没有真实派发材料的项不得以“全部通过”交回。

完成条件：两宿主各自链路解释明确、授权内修复及真实派发验证充分，或实际外部能力阻塞被证实且独立工作已穷尽。不得让本事件替代P64业务验收；不增加业务功能/P/问题计数。
