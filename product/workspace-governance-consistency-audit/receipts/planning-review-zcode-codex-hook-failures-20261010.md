# 双宿主Hook故障规划复核

2026-10-10；Planner。独立读取[双线回执](receipt-admin-zcode-codex-hook-failures-20261009.md)、[Codex修复回执](receipt-admin-codex-hook-failure-20261009.md)与product原事件/派发结果/组件结果/公共回归/hooks-list/Git/生命周期记录。未读取治理实现/宿主原数据库或直接运行门禁。

**本次不能裁决两宿主恢复全部通过。** Codex实现与真实隔离宿主派发验证通过，真实工作区生效尚待Owner信任；ZCode诊断及可观测性增强接收，修复后自然Stop与受治理拒绝续行仍待同session原件。前次Owner通过保留历史，不要求追认截图无时点的唯一事件。

## HK-C

- 原POSIX声明在本机app-server原输出=failed/exit1、无Validator；合法结束=completed、同session三阶段exit0；缺marker场景同thread01a1215c-ce72、同turn01a1215c-ce9a内blocked→completed、两次响应，入口block→pass，确有自动续行。Admin结束completed，无Executor Validator。18组件/70公共契约实跑结果接收，规则未被放宽。
- 证据为真实安装app-server+隔离CODEX_HOME/声明+本地确定性HTTP fixture，证明宿主派发与协议续行，不追认为原桌面线程已重触发。原截图历史时点未唯一关联不阻止已复现接线缺陷的修复验收。
- 原工作区hooks-list原输出`enabled=true`但`trustStatus=modified`，hash=`sha256:18ecf395895e2e65f1060e65172f62ae890a40481f80dfdb640ee439f553cb91`。**实现验收通过，真实工作区生效待Owner。** Admin回执引用职责原文“工作区hook的宿主信任评审由Owner在宿主界面完成，管理员不代持信任”；本Planner也不代修改trusted_hash。
- 剩余：Owner在宿主界面审阅并信任这份精确声明，然后Admin一次有限读取当前hooks-list及真实工作区自然派发结果；只有状态改变无需重跑18/70或隔离矩阵。若新增定义hash变化，按实际新定义重新审阅，不靠旧hash推断当前信任。
- 清理：四例进程树已结束；主动清理后的宿主exit1不能当Hook失败。回执记两个临时目录递归删除被自动审批拒绝，保留目录与无活宿主边界，不把它写成全部物理清理完成。无需扩大删除权限才能接收实现验证。

## HK-Z

- 接收21:41:49.777Z换算本地及289ms/session/turn/36分37秒的关联；失败时门禁无审计，支持“入口尚未产生可观察执行”的定位，不能精确区分未spawn、首语句前退出、路径/解析或其他宿主原因。缺失审计不能排除所有治理入口/配置因果；不将“非治理实现缺陷”当已唯一证实根因。
- 空`${ZCODE_PROJECT_DIR}`快速失败是有受控测量的候选机制；同进程成败交错只排除稳定的进程级故障，不能排除单次展开/启动故障。候选与未知边界保留，不推广为Codex共同根因。
- 回执中的后续正常Stop是**新增launcher-invoked前**的原会话事件；原件`zcode-persisted-hook-results.json=[]`不承担新验证结果。launcher首语句诊断增强及49/14/38受控回归接收为Admin提供的测试层结果，**不是修复后真实自然派发/拒绝续行原件**。selfcheck live=false保留失败台账，不能说不稳定宿主已修复。
- 剩余：只读核修复提交bce10e45之后Admin sess_5ca9dce0自然Stop的launcher-invoked→gate invoked/payload-read→宿主结果/角色静默通过；若已存在真实Executor拒绝与同session自动续行记录则压缩提取，无需新造长任务。真实自然触达安全不可得时给实际能力边界，不把手动点击继续替代自动回注。不重跑49/14/38，不删历史失败。

下一动作见[续办任务](../../../todo/admin-zcode-codex-hook-failures-20261009.md)当前补充段。治理与P64业务各自保留未完成账，不新增业务功能/P/问题计数。普通精确治理Git收尾沿既有授权，Planner不执行Git。

最新截止补核：本轮已通知原Codex Admin有限一次只读回读，返回[2026-10-10当前声明原结果](codex-hook-acceptance-readback-20261010.json)：request_count=1、enabled=true、同hash18ecf395…、trustStatus仍modified、configuration_error_count=0，进程exit0并已结束；未修改信任、未新建thread、未重跑测试。由此确认“待Owner信任”是本轮新快照而非只沿用昨晚状态；实现通过/工作区尚待信任裁决保持。
