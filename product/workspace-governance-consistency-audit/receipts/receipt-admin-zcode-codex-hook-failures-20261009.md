# ZCode与Codex Hook故障核查回执

2026-10-09；Admin。任务入口：[续办说明](../../../todo/admin-zcode-codex-hook-failures-20261009.md)。Owner指示“分别检查ZCode和Codex，先检查zcode情况”，随后分工为本Codex会话只处理Codex。两个管理员会话分别记录：ZCode侧会话`sess_5ca9dce0`（本回执HK-Z部分）与Codex侧会话`thread 01a11df3`（下方HK-C及[独立修复回执](receipt-admin-codex-hook-failure-20261009.md)，修复与真实隔离派发验证已完成，原工作区宿主信任状态仍为modified）。两宿主分别核查，不作共同根因推定。

## HK-Z：ZCode UserPromptSubmit / Stop

### 现象与定位（本地时区UTC+8；日志为UTC）

- Owner原图[zcode-stop-failed.png](evidence/hook-failures-20261009-2150/zcode-stop-failed.png)：21:41消息钩子记录UserPromptSubmit用户132ms、Stop用户289ms失败。以宿主日志复核归属，不凭外观推定。
- 宿主日志`~/.zcode/cli/log/zcode-2026-10-09.jsonl`定位：`2026-10-09T13:41:49.777Z`（本地21:41:49.777）`hook.run.failed`，`sessionId=sess_ebe8d1f2-9887-4935-b335-2721b3e96f42`（P64 Executor会话），`turnId=turn_388cbcb0-bfca-40d7-9ace-14eace1ced0f`，`hookEventName=Stop`，`hookIndex=0`，`source=config.Stop.0.0`，`durationMs=289`。与截图“Stop 用户 289ms 失败”一致。
- 回合时长核对：`turn_388cbcb0`于13:05:12.621Z开始、13:41:50.026Z结束，时长36分37秒，与截图“已工作36分37秒”精确一致；该回合提示词为13:05:12.614Z的用户输入“继续”（宿主`db.sqlite`的`session_input`表）。
- 角色：该会话角色=`executor`，经`user_prompt_submit`于09:22:17Z绑定（`runtime/zcode/sessions/sess_ebe8d1f2-*.role.json`）。
- Hook来源与有效范围：Stop hook来自**机器级用户配置**（`effective_scope=user`；仓库声明`.codex/governance/zcode-hooks-declaration.json`与`~/.zcode/cli/config.json`逐字一致、`drift=false`；宿主UI该条显示“用户”）。展开后argv为`C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ${ZCODE_PROJECT_DIR}/.codex/governance/zcode-stop-launcher.ps1`，cwd=工作区根`E:\code\Smart-WorkFlow-Agent-Workspace`。
- 同回合UserPromptSubmit侧：21:00:35本地“未通过，读提示04”（13:00:35.224Z）经真实宿主派发并写审计（`action=unchanged`，角色保持executor，132ms量级与截图对应）；但21:05:12与21:51:32两次“继续”**未产生角色绑定审计**（见“根因判定”附注）。

### 链路三阶段与退出投影

- **宿主是否调用launcher、收到何种输出**：该时刻治理侧**零痕迹**——`invocations.log`无该时点`invoked`回执、`entry-failures.log`整体不存在、`audit.jsonl`无记录、Windows应用事件日志无powershell.exe崩溃/WER记录。按launcher与gate的既有设计，脚本内所有失败路径都投影为`block` JSON+`exit 0`（宿主会显示“已阻止”）；宿主却记录`hook.run.failed`（289ms）且零脚本痕迹，只能解释为**powershell.exe在任何脚本体语句执行前即终止或未被spawn**。宿主对process型hook只记录duration+失败，不记录退出码与stderr预览——此为宿主遥测边界，无法由宿主侧进一步区分“未spawn”与“启动最早期退出”。
- **拒绝呈现**：21:41事件不是规则拒绝而是派发失败：门禁未运行、无block输出、回合未被裁决即结束（`system.md`§0.8“宿主派发失败等价于门禁缺失”）。不存在“合法拒绝被当失败”。
- **同会话继续**：用户21:51:32点击“继续”开启新回合；`2026-10-09T14:14:36Z`的Stop**完整派发通过**（`invocations.log` invoked+payload-read 18198字节；`audit.jsonl`三阶段HOST_LIFECYCLE/TERMINAL/TERMINAL_LIFECYCLE全部exit 0，`decision=pass`、`TERMINAL_ACCEPTED`、`terminal_state=EXECUTION_SUBMITTED`；`*state.json`终态一致）。会话在修复前已自行以合法终态收束，门禁最终接受了该终态。

### 根因判定与未证实边界

- **已证实（宿主/OS层派发故障，非治理实现缺陷）**：同型失败两日共5次，全部为Stop、`config.Stop.0.0`、耗时231/277/293/232/289ms、全部零脚本痕迹（`hook-selfcheck.ps1`宿主失败台账完整呈现，证据存档[selfcheck-report-20261009.json](evidence/hook-failures-20261009-2150/selfcheck-report-20261009.json)）：2026-10-08T12:30:36.741Z（sess_2bb70c7f）、12:47:31.184Z（sess_2bb70c7f）、13:50:54.419Z（sess_7d2f06cc）、22:00:16.620Z（sess_78dc7a83）、2026-10-09T13:41:49.777Z（sess_ebe8d1f2）。跨3个宿主进程、4个会话；**同一宿主进程内成败交错**（如10-08的P4进程：13:28–13:47成功11次、13:50:54失败、14:39成功），排除进程级环境/配置原因，判定为间歇性宿主派发故障。该形态在正式修复时已被记载（`stop-gate.ps1`回执注释“宿主长时高负载窗口实测存在Stop hook进程启动最初期即崩溃的形态（170-309ms、无任何脚本痕迹）”），本次为其**首次在真实宿主上观测并归入该类别**；配置、声明、解释器均健康（自检`drift=false`、`hooks_enabled=true`、`python_available=true`，同会话/同进程另有完整成功派发与三阶段审计）。
- **量化验证的候选机制（未证实，不排除其他宿主层原因）**：若某次派发时`${ZCODE_PROJECT_DIR}`未展开为空，则Stop侧`-File "/.codex/..."`目标不存在、PowerShell快速退出`-196608`，UserPromptSubmit侧外层`if exist`守卫为假、静默`exit 0`。本机受控实测：缺失路径`-File`失败耗时184–230ms、退出码-196608；守卫空转耗时106–108ms、退出码0。分别覆盖观测到的Stop失败区间（231–293ms，含宿主开销）与截图UserPromptSubmit 132ms。历史实物佐证：`C:\.codex\governance\runtime\zcode\entry-failures.log`存有`2026/09/19 周六 2:57:08.85 Stop entry failed rc=-196608`——当年空展开时旧cmd包装层按盘根路径落盘的失败记录，退出码与实测一致。宿主不记录展开后argv与子进程退出码，故无法最终判定每次失败均为该机制；不将其推广为两宿主共同根因。
- **附注（同窗口伴生观测，非本事件根因）**：sess_ebe8d1f2在21:05:12与21:51:32的“继续”未产生角色绑定审计而宿主UI显示成功，与上述守卫空转路径的耗时特征一致；同会话/同日其他提示词（含本管理员会话15:14:53Z的“继续”）审计正常。历史会话（sess_7d2f06cc、sess_78dc7a83）同样出现过“审计静默缺失+`STOP_DISPATCH_MISSED`标注+派发失败”的同窗口共现。该侧无法从治理侧注入检测（脚本未运行），记录为既有宿主派发不稳定性的组成部分。

### 修改与有效范围

- 修改`.codex/governance/zcode-stop-launcher.ps1`：在脚本体最前增加`launcher-invoked`派发回执（+11行，写入同一`runtime/zcode/invocations.log`），把不可观测窗口从“进程启动→gate启动”收窄到“进程启动→首语句”：无`launcher-invoked`=进程未执行脚本体（宿主/OS层，本次5次失败均属此类）；有`launcher-invoked`而无gate`invoked`=launcher体早期中断；有gate`invoked`而无outcome=gate体中断。回执写失败不影响裁决（try/catch吞掉），不改变公共契约、终态规则、宿主声明、argv形态与fail-closed投影；用户级声明无需变更（改实现不改声明）。
- 未做的选择及原因（边界记录）：不加第二Stop条目（同一事件双重裁决）；不把Stop改为command型守卫（会以“静默通过”掩盖空展开，违反fail closed与可见性）；不改声明为固定绝对路径（破坏非受治理工作区静默无操作）。空展开本身无法在任何脚本体层拦截，只能靠台账暴露与本次机制归因。

### 验证证据（修复后）

- 治理契约测试（宿主同款Windows PowerShell 5.1；移除`AGENT_CODING_ENGINE_PYTHON`覆盖，走默认解释器发现）：`test-terminal-contract.ps1` **49/49 exit 0**；`test-windows-validator-diagnostics.ps1` **14/14 exit 0**（含launcher pass/block/contaminated/failure四态、重试同载荷、双流与异常脱敏）；`test-stop-gate.ps1` **38/38 exit 0**（含真实运行链用例，落账invocations.log与audit并被回读）。
- `hook-selfcheck.ps1`当前报告：`drift=false`、`effective_scope=user`、`hooks_enabled=true`、`command_ok=true`、`python_available=true`、入口失败台账不存在；宿主失败台账含本次21:41:49.777Z记录，24h计数2（另一次为10-08T22:00:16Z）；`live=false`（因24h内存在宿主失败，如实反映而非删除记录）。
- 真实宿主自然派发：本管理员会话15:14:53Z“继续”由真实宿主派发UserPromptSubmit并写审计（受治理链路自然触发）；本回合结束的自然Stop为修复后launcher首语句回执的首次真实宿主派发，其`launcher-invoked`/`invoked`/`payload-read`台账与宿主hook结果由下一回合读取回补——受控进程链与隔离runtime测试不替代该自然派发，本回执不将其预先记为通过。
- 反向断言：未停用hook、未删除任何失败记录（5次历史失败原样保留）、未强制放行、未放宽规则；未触发或改动任何Executor会话状态；业务P64未受影响。

### 清理

- 验证均有限、有超时：诊断90s、接线240s、契约240s、自检60s；测试使用隔离临时runtime并在finally清理。中断的一次接线测试经核对：无遗留进程（按命令行身份核对）、临时目录`ace-zcode-gate-test-06bbf62b*`（创建于23:14:39、属该次测试）已精确删除。未终止Owner任何既有服务；未按端口/进程名批量清杀。记录件`C:\.codex\...`为历史实物证据，保留不删。

### Git

本回执与`zcode-stop-launcher.ps1`修复、任务入口待办随本批次提交推送`origin/develop-sw`；操作前HEAD与跟踪分支领先/落后0/0（前次HEAD `772146c2`）。本批次提交`bce10e457a588d55d0fc96ce893bac9ffdb1e788`，推送结果`772146c2..bce10e45 develop-sw -> develop-sw`，远端回读`git ls-remote origin refs/heads/develop-sw`=同一SHA；回读存档`evidence/hook-failures-20261009-2150/git-closeout-hk-z.json`。精确排除并行的P64业务文档、`memory/`状态文件、Server/Web gitlink与Codex侧管理员会话在途改动（当时含`.codex/hooks.json`、`codex-stop-adapter.ps1`、`test-codex-stop-adapter.py`等）。

## 剩余动作

1. 本回合结束的自然Stop派发为修复后launcher回执的首次真实宿主触达：下一回合读取`invocations.log`（预期`launcher-invoked`+`invoked`+`payload-read`三行，session=`sess_5ca9dce0`，admin角色静默通过）并回补本回执；若未出现`launcher-invoked`则落回“脚本未执行”类别，与本事件5次失败同型。
2. HK-C修复与本机app-server真实隔离派发验证已完成，见下节；真实工作区新声明仍为`modified`，保留Owner宿主信任评审这一生效边界。
3. 若宿主再次出现同型派发失败（两日窗口内已5次），以新增的launcher回执三分归因；空展开候选机制需宿主侧遥测（展开后argv/子进程退出码）方可最终证实，属宿主能力边界。

## HK-C：Codex项目Stop（修复与真实隔离派发验证已完成）

Codex侧Admin已按Owner最新“只检查Codex、直接处理完”的指令完成独立核查与修复，详见[Codex修复回执](receipt-admin-codex-hook-failure-20261009.md)。本机Codex 0.159.2 app-server用原POSIX声明精确复现`hook exited with code 1`；新增Windows编码引导和薄适配后，真实Stop正常完成，缺终态时在同thread、同turn自动续行并在合法终态后放行。正常路径三阶段Validator均exit0。新声明已被真实工作区识别，但`trustStatus=modified`，未代持Owner信任。下列截图及早期定位保留为历史记录。

- Owner原图[codex-stop-exit-1.png](evidence/hook-failures-20261009-2150/codex-stop-exit-1.png)：钩子统计“运行次数1/已阻止0/未成功1”，运行记录“未成功 Stop **项目**”，错误“hook exited with code 1”——项目级Stop，退出码1。
- 项目声明`.codex/hooks.json`（505字节，最后修改9月11日）：唯一Stop hook为`type: "command"`，命令为POSIX shell语法（`${CODEX_PROJECT_DIR:-...}`、`while [ ]`、`$(dirname ...)`、`sh .../.codex/hooks/codex-stop-adapter.sh`）。
- Codex线程记录（`thread_history_1.sqlite`全线程）：本地21:35–22:10（13:35–14:10Z）**无任何回合结束**——截图统计不对应21:50时点的派发；21:50前最近一次回合结束为规划线程12:53:17Z（本地20:53:17）。
- 22:48:51本地，规划线程（`01a11b92`）经`send_message_to_thread`把本续办任务委派给管理员线程`01a11df3`（“分别检查并修复……回执文件供Planner复审”）；该管理员线程随后自述只处理Codex侧并持续核查中（其证据写入本同名事件目录，如`codex-hooks-lib.rs`、`codex-native-hooks-list.json`等）。
