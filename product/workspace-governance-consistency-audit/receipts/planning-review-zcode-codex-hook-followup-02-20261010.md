# Hook复核02：ZCode核查通过，Codex事项挂起

2026-10-10；Planner。依据Owner最新“验收，codex的hook先挂起”、[前次复核](planning-review-zcode-codex-hook-failures-20261010.md)及[ZCode自然回读补证](receipt-admin-zcode-hook-readback-20261010.md)/[最小原提取](zcode-hook-readback-20261010.json)。独立读取product原件，不读取治理实现或宿主日志。

## Codex HK-C：Owner挂起

Codex Hook事项按Owner明确要求挂起，停止信任催办、派发补证、重复回读及继续修复，等待Owner明确恢复；本轮已通知原Codex Admin聊天停止后续工作并仅收尾自身在途任务。实现与真实隔离派发验证的已通过事实保留，最新原工作区声明modified/配置错误0和未可信生效边界保留。挂起不意味着停用/删除Hook配置、改trusted_hash或改公共门禁规则；Planner未操作这些配置。该事项不作为P64推进的待办条件。

## ZCode HK-Z：本次核查与诊断增强验收通过

- 修复后自然Admin会话sess_5ca9dce0在15:23:58—59Z有launcher-invoked→gate invoked→payload-read7100字节，角色admin静默通过，宿主正常完成。
- 修复后自然Executor sess_ebe8d1f2在16:13:45—47Z有三入口回执、18830字节载荷、三阶段Validator exit0、EXECUTION_SUBMITTED/TERMINAL_ACCEPTED及宿主正常完成；当日所读宿主失败计数0。前次“修复后自然Stop缺原件”关闭。
- 真实历史同session12:24:00Z block/TERMINAL exit1→12:24:15Z continuation=true/三阶段exit0/pass；两次间无用户输入。另一历史会话三次continuation=true且tool_call_count449→468→469。证明实际自动续行，不是手动“继续”。

**证据方法修正**：本次代码修改仅新增launcher首语句回执，裁决/拒绝/自动续行规则未变；已接收受控49/14/38回归，加修复后真实合法派发及未变路径的历史真实拒绝续行，构成等强度组合。无需人为制造修复后新拒绝来重复证明未变语义；原件明确该新拒绝尚未自然观察，不能称已观察到。前次将“必须另有修复后新拒绝”留作当前动作在此收敛，不计执行失败。

通过范围=本次故障核查、可观测性增强及对应派发/角色/续行验证，不追认为宿主间歇派发故障根因已定位或永久消除。空项目根展开仍为候选，process-hook退出码/stderr遥测缺失、历史5次失败/live=false保留。以后若Owner报告同型故障，按三段入口回执与当次宿主实际记录重入具体核查；不新增定时监控任务。

ZCode本次续办关闭，无当前补证待办；Codex挂起独立保存，原Owner前次结案和原失败台账均保留。本轮不增加业务功能/P/问题计数，Git普通精确治理文档收尾沿原授权，Planner不执行Git。
