# P60 I3「人工审批与自研流程设计器」终态同步规划复核 01：VERIFYING

> 复核角色：规划（Planner）  
> 日期：2026-09-12  
> 复核对象：`terminal-sync-stage-i3-v0.1.0-oa-completion-01.md`  
> 终态结论：I3保持`COMPLETED（待规划确认，2026-09-12）`；P60保持`IN_PROGRESS`

## 1. 结论

I3功能级 **PASSED** 及规划验收08锁定的实现、行为与门禁不回退、不重跑。本次阶段三同步的唯一状态值、计数、当前指针、memory容量、治理提交A以及Server/Web远端提交可以锁定，但Workspace最终远端tip和一个Server本地I3验证资产尚未形成终态闭环，因此暂不确认I3`COMPLETED（规划已确认）`，不得开始I4。

阻断属于发布证据生命周期与本轮残留清理，不是产品缺陷：治理提交`e2597ed…`确已推送，但随后又有附件提交推进远端；现有权威`workspace-ls-remote.stdout`、identity、ahead/behind和terminal仍停在`e2597ed…`，没有给出附件链结束后的完整远端SHA。Server同时保留一个明确属于I3的未跟踪临时测试副本，不能以“不改变冻结候选”为由无限留在后续阶段工作树。

## 2. 九项终态复核

| 复核项 | 实际证据 | 结论 |
|---|---|---|
| 1. 单一状态 | 当前入口一致为P60`IN_PROGRESS`、I1/I2规划已确认完成、I3`COMPLETED（待规划确认）`、I4—I6未开始 | **通过并锁定** |
| 2. 正式功能数 | 全部回读保持44 | **通过并锁定** |
| 3. 清单/P/里程碑 | ✅46/🟦22/⬜22，总计90；ADV64不计入；P60/P4/P34/P35/P47及其他开放编号均未核销 | **通过并锁定** |
| 4. 验证基线集合 | Server`c18d074`、JAR`74926960…`、Web`192e0647…`及I3 R0—R10只读引用，与验收08一致 | **通过并锁定；禁止重验** |
| 5. 活动功能 | 仅P60为活动主功能，I3阶段完成不增加正式功能数 | **通过并锁定** |
| 6. 当前下一动作 | 同步回执前均指向Planner终态复核，未开始I4；本复核后改为只处理TS3-G1/TS3-G2 | **原值通过；当前指针随本复核更新** |
| 7. product生命周期 | I3主方向在`passed/`，终态同步方向仍在`ready/` | **通过并锁定** |
| 8. 实际写入/发布 | 治理提交A、Server/Web远端包含关系通过；Workspace附件链最终tip与Server I3本地残留未闭合 | **部分通过** |
| 9. memory容量 | 17535字节，最大单文件3914字节；全部短文件<5KB、总量<20KB | **通过并锁定** |

独立复核确认：本轮manifest声明33项，Planner按当前文件独立复算可继续使用；terminal末行cmp=0、Validator exit0。它们证明本地回执包自洽，不替代最终远端tip和工作树残留证明。

## 3. 已接受且无需重做的披露

- i3-08 manifest仅`generated_at`发生在规划验收08之前的归一，25项记录哈希未变、独立复算bad=0；接受为I3归属元数据提交，不重开功能验收。
- Workspace远端接受的提交均为fast-forward；分支规则绕过提示作为真实远端审计事实保留，不要求追溯改写。
- Workspace中的两个独立业务仓库目录属于既有checkout残留，本轮未提交、未清理；不计入I3终态差异。
- Server全量门禁exit1及6例IoT Windows/JDK21环境失败继续如实保留，不影响本次只读发布补证。

## 4. 唯一剩余差异

### TS3-G1：Workspace最终远端tip与附件链未独立闭合

`readback-after-push.txt`记录远端曾继续推进至短SHA`47781b5`，但以下终态证据仍统一停在治理提交A=`e2597ed8529b28ca9677c4afe1b45b90824b444b`：

- `workspace-ls-remote.stdout`；
- `workspace-remote-sha.txt`；
- `workspace-identity.txt`；
- `workspace-ahead-behind.txt`；
- `workspace-log-chain.stdout`；
- terminal的progress fingerprint、work item和tool result。

治理提交A本身已证明并锁定，但它不能同时冒充附件提交后的分支最终tip。完成条件：在最后一次远端写入之后，以只读方式取得一个完整Workspace远端tip，并证明本地HEAD、`origin/develop-sw`、`ls-remote`、ahead/behind、tree一致；列出`a9f4716…最终tip`完整连续提交链及逐提交文件，证明A是其祖先，并证明`A…最终tip`只包含本终态回执/证据附件。新回执正文、terminal和原始回读只使用该实际最终tip；治理提交A作为单独命名的状态提交保留。

### TS3-G2：Server存在I3自有未跟踪临时测试副本

Server `develop=c18d074`与远端一致，但工作树存在：

`sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/validator/ApprovalOpinionValidatorDisabledTypeIntegrationTest.java`

现有证据已证明它与Workspace中受manifest保护的`i3-08/R8a/ApprovalOpinionValidatorDisabledTypeIntegrationTest.java`逐字节一致，sha256同为`c34412d9…`。该文件在功能验收中作为一次性集成验证资产使用，不属于冻结运行时JAR，也未被纳入Server提交；终态处置固定为：再次核对精确路径、未跟踪状态、cmp与sha256后，只删除Server工作树中的这一份临时副本，保留Workspace证据副本，随后回读Server工作树clean及HEAD/远端仍为`c18d074…`。不得删除或改写已提交证据，不得为此创建Server提交。

## 5. 当前唯一下一动作

Executor提交新的只读/清理补证回执：

`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i3-v0.1.0-oa-completion-02.md`

新证据根：

`product/v0.1.0-oa-completion/receipts/evidence/i3-terminal-sync-02/readback/`

执行顺序固定为：

1. 按TS3-G2对精确未跟踪临时副本完成哈希保护下的单文件清理并回读Server clean；
2. 对Workspace执行fetch/ls-remote/rev-parse/status/log/diff/show/merge-base/树比较等只读核对，取得附件链结束后的唯一远端tip；
3. 对Server/Web只读确认SHA未漂移；
4. 生成只引用实际最终tip的新terminal、末行cmp、Validator和非自引用manifest。

除上述单文件清理外，本轮不得修改业务实现、knowledge状态值、memory值、已锁定证据或历史回执；不得执行add/commit/push、工程门禁、迁移、浏览器、标签或Release。回执02与新证据明确作为本地规划验收附件，不声称其自身包含在被证明的远端提交中，也不得在最终远端回读后再追加证明性提交。

合法状态继续为I3`COMPLETED（待规划确认，2026-09-12）`、P60`IN_PROGRESS`、机器`TERMINAL_SYNC_SUBMITTED`、remaining=0、`WAIT_PLANNER`。只有Planner复核TS3-G1/TS3-G2均通过后，才确认I3`COMPLETED（规划已确认）`并归档终态同步方向。

