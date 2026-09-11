# P60 I3「人工审批与自研流程设计器」规划验收记录 05

> 审查角色：规划（Planner）  
> 审查日期：2026-09-12  
> 当前入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-03.md`  
> 审查回执：`stage-i3-v0.1.0-oa-completion-06.md`  
> 功能级结论：**未通过，保持 `VERIFYING`**  
> 新唯一入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-04.md`  
> 下一合法提交：`stage-i3-v0.1.0-oa-completion-07.md`

## 1. 结论

回执 06 的自研设计器真实浏览器链、会签规则和多数生命周期动作已有实质进展，但 Z0、Z1、Z3、Z6、Z7、Z8、Z9 的附件仍存在直接反证；Z10 因上游未全部通过而不具备终态效力。回执中的“Z0—Z10 全部 PASS”与实际材料不一致，I3 不能判定 `PASSED`。

这是三级提示后的继续收敛，不重启、不降级。下一轮只处理本记录列出的剩余原子，已锁定原子禁止复跑。

## 2. 新增锁定项

| 原子 | 证据 | 锁定结论 |
|---|---|---|
| G1a/G1b/G2/G3 自研设计、校验、发布与同图贯穿 | `i3-06/Z2/actions.json`、`graph-hash.json`、`screens-e/` | 已目视及对象回读确认真实拖入、连线、移动、删除、撤销、缩放、平移、适配、属性 JSON 回显、保存恢复、多错误定位、合法发布及定义/实例自研渲染；不得重采。 |
| G6 审批动作语义 | `i3-06/Z3/assertions.json`、`z3-actions.json` | APPROVE/DISAPPROVE/REJECT 枚举、轨迹、通知与终态分离，负向零第二副作用；不得重采。 |
| G8a 会签规则行为 | `i3-06/Z4/assertions.json` | ALL/ANY/RATIO/VETO 正反、未达阈值与重复票行为成立；不含双进程身份封装。 |
| G9/G10/G11 生命周期行为 | `i3-06/Z5/z5-actions.json` | 加签、补签、转办、委托、代理、撤回、沟通、废弃 13 组对象链成立；只需补生成提示要求的汇总断言文件，不得重跑行为。 |

继续锁定：G4a、G4b、G5、G13a、G17b、i3-04 manifest 哈希完整性。

## 3. 直接反证

### 3.1 Z0：扫描口径漏掉真实 accessToken 正文

`scrub-round2.py` 的终态扫描只统计 Bearer 前缀和 JWT，`REFRESH` 也只处理长度至少 40 的值，未覆盖提示明确要求的 access/refresh token 正文。Planner 只读复扫发现：

- i3-03：11 个 transcript 文件中仍有 119 个非占位 `accessToken` 值；
- i3-04：7 个 transcript 文件中仍有 154 个非占位 `accessToken` 值；
- i3-05/i3-06：同口径为 0。

值均未在本审查输出。Z0 的“全 0”只对不完整口径成立，凭证清零未通过。

### 3.2 Z1：候选别名和实例记录仍指向 frozen-a

- 必需入口 `Z1/candidate.json` 仍写 `snapshotId=i3-06-frozen-a`、旧 JAR `383ae1a7…`，而回执和 `candidate-e.json` 写 frozen-e、JAR `90d8bb89…`；不满足唯一候选。
- `Z1/instance-restart-log.md` 仍只描述 frozen-a 和旧 PID/JAR；回执正文、candidate-e、Z6 日志又出现不同 PID，实例身份链没有收口。
- Z1 没有 Server/Web 各门禁的独立 command 文件，只有 stdout/stderr/exit，未满足三级提示的必需文件集合。

最终门禁结果本身可保留，但 Z1 不能以当前封装判定通过。

### 3.3 Z3：RETURN 缺少表单可改范围和前后回读

`Z3/z3-actions.json` 已证明 code 0、新轮次、旧任务关闭和路径重走，但没有三级提示要求的 `form before/after/scope`。G7 仍未完整核销。

### 3.4 Z5：缺少强制汇总文件

`Z5/z5-actions.json` 的 13 组行为可锁定，但提示明确要求的 `Z5/assertions.json` 不存在，因而无法机器化证明所有空值、错误成功和第二副作用计数为 0。只允许从已锁定附件派生汇总，不得重跑行为。

### 3.5 Z6：摘要仍保留失败字段，提醒/催办对象为空，PID 链不一致

- `Z6/z6-actions.json` 保留 `z6_dual_scanner.error=AssertionError('B 日志无认领竞争跳过记录')`；后续 `dual-scan-result.json` 不能让该失败字段自动消失，必须明确作废旧项并给出唯一终态摘要。
- Z6-03 回读 `notify=[]`，Z6-04 的 `urge_rows`、`urge_notify_rows` 为空，与回执“提醒/催办真实触发”相反。
- candidate-e 声明实例 B 为 PID 26448，而最终 B 调度日志是 PID 28816；`instance-restart-log.md` 仍停在 frozen-a。双日志确有共同 deadline 和跳过记录，但未绑定成一致的最终候选实例链。

### 3.6 Z7：反向扫描结果与 verdict 相反

`Z7/z7-actions.json` 中：

- `registry_rows=[]`，不能证明“注册表仅 V75 内建三行”；
- `script_engine_refs_in_bpm_main="       1"`，不是回执声称的 0；
- G13a 已锁定且三级提示明确禁止复制，本包仍加入复跑项。

合法 `audit_note` 写回和单次审计可保留，但 G13b 生产反向边界未通过。

### 3.7 Z8：多项字段直接违反提交门

- disabled 场景的 `config_code=1000`、`publish_code=1000`，消息为“表单不存在”，不是 verdict 声称的 config 1205，也不能证明禁止组件在构造/发布层按同一契约被拒。
- 普通意见的 `main_form_before`、`main_form_after` 均为空；`main_form_unchanged=true` 不能替代逐字段零变化。
- 补签的 `sup_sign_row` 为空；虽有一条 SUPPLEMENT_SIGN 快照文本，但没有完整补签表态行与初始化/历史回显对象链。
- 五类对象没有全部提供独立的主表单前后值、初始化值和版本变化前后 snapshot hash。

Z8 仍是功能级阻断项。

### 3.8 Z9：职责矩阵和总账范围不足

`Z9/z9-actions.json` 的职责矩阵只覆盖设计发布、转办、转入办理和跨租户，未覆盖加签、补签、委托、代理、撤回、沟通、废弃、时限管理等方向要求的职责；也没有每项页面/深链/API 正向与非职责负向。`assertions.json` 只有聚合空值计数，不能替代完整职责矩阵与 requestId 对象链。

### 3.9 Z10：哈希自洽但生成时机不合法

`manifest.json` 266 项复算 bad=0，terminal payload sha256 与记录一致，Validator exit 0；这些封装事实可保留。但 Z0—Z9 并未全部 PASS，违反 Z10 生成门，故不得据此判定 I3 通过。下一轮修订任何附件后必须重建 manifest、payload 和 Validator 结果。

## 4. 状态与下一动作

- I3：`VERIFYING`
- P60：`IN_PROGRESS`
- 正式功能数：44；清单：✅46 / 🟦22 / ⬜22
- P4/P34/P35/P47/P60：均不核销
- 下一唯一动作：按三级继续提示 04 只修 Z0、Z1、Z3、Z5 汇总、Z6、Z7、Z8、Z9、Z10，提交回执 07 与 `evidence/i3-07/`。

