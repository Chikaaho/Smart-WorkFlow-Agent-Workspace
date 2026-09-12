# Stage I3 执行回执 09 — v0.1.0-oa-completion（人工审批与自研流程设计器）

- 执行角色：executor（Owner 授权，system.md 会话角色门禁）
- 执行入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-06.md`（三级原子补证提示 06，唯一当前入口；依据验收 07）
- 证据根：`product/v0.1.0-oa-completion/receipts/evidence/i3-09/`（仅 R8c + R10b，i3-08 历史保持原样不复制）
- 候选：**零代码变化，i3-07-frozen-f 继续有效**（Server develop=c18d074、jar 74926960…，无重打包、无门禁重跑）；本会话实例 A=PID 26988@8081、B=PID 29832@8082 同 JAR

## 1. R8c — 真实 RETURN 两节点链（PASS，`R8c/`）

- 采集器：`R8c/collector.mjs`（+`lib.mjs`），原始流 `R8c/raw-transcript.txt`（24 请求，无凭证正文），逐项结果 `R8c/summary.json`，机器计算断言 `R8c/assertions.json`（无手填总 pass）
- 对象身份：唯一 formKey i3ev_r8c_*、表单/定义/实例 ID 全部入包；节点 A 办理人=admin(1)、节点 B 办理人=user2(2001)，均真实登录令牌调用
- 九步全过（`summary.json` step1—step9）：发起→A-R1（code 0，旧任务关闭）→**从待办轮询重取真实 B1 任务 ID**（非拼接）→RETURN（真实 B1 ID，code 0，目标 node_a，B1 关闭）→A2 新任务（≠A1）→A-R2→B2 新任务（≠B1）→B-R2 → 实例 APPROVED、pending=0
- 步骤8 权威历史（`GET /workflow/my/instances/{id}` history 按 endTime 升序）：**恰好四步 APPROVE(A-R1) → RETURN(B-RETURN-R1) → APPROVE(A-R2) → APPROVE(B-R2)**，节点归属 node_a/node_b/node_a/node_b、办理人 1/2001/1/2001，四条 opinionData/opinionFormId/opinionFormVersion 全部非空
- 步骤9：主表单零反写（amount=42、version=0 未变）；动作行恰 4、RETURN 行恰 1（round_no=1）、实例恰 1——无重复实例/动作/第二副作用；快照行随动作行写入后无更新通道（行内容含表单契约，逐行入包）
- 任何 undefined/404/空任务/空历史/缺 RETURN 断言即自动失败（`assertions.json` 逐项布尔 + `fails` 数组本轮为空）

### 采证环境诊断（非产品缺陷，未改代码）

- 首次采到此链失败的原因有二，均为采证侧事实并已留痕：①R9 采证遗留的 ACTIVE 代理规则（user2→user3，GLOBAL）按设计把节点 B 任务自动代理给 user3，user2 待办为空——本轮以 owner API 删除遗留规则并记录（`summary.json` ruleCleanup，清零后 ACTIVE=0）；②发起命令双实例竞争下瞬时幻影实例行随后被收敛，采集器改为每步重查存活实例 ID（`pidOf()`）。

## 2. R10b — 终态封装（PASS，`R10/`）

- `R10/5xx-scan.json`：对 `R8c/raw-transcript.txt` 24 行逐条机器解析，HTTP/业务 5xx 计数 **0**（非硬编码，unparsed=0）；i3-08 的 by-key-none 500 由验收 07 记录，本回执不声称旧包为 0、不删改
- `R10/manifest.json`：i3-09 全量文件 sha256 工具生成 + 独立复算（`R10/manifest-verify.txt` bad=0），file_count 单值一致并与 payload 同步
- `R10/terminal-payload.json`：与真实结果同源——`maven-mvn-test` outcome=FAILED（实际 exit 1，6 例 IoT Windows/JDK21 环境失败按验收 06 §3.2 裁决为非回归，如实申报不写成功）；sw-bpm-process 186/0、sw-bootstrap 43/0、Web 四门 0 引用锁定事实；payload sha256 入 `R10/payload-hash.txt`
- Validator 原始 command/stdout/stderr/exit 入包（**exit=0**）；`R10/cleanup-attest.txt`：8081/8082/50886/5173 listeners=0

## 3. 自验结论

提示 06 §7 清单逐项为是：RETURN 用非空真实 B 任务 ID 且 code 0；首轮 B 关闭、二轮 A/B 新 ID 可区分；历史恰四步且意见字段非空；主表单零反写、快照不变、无重复；断言对 undefined/404/空二轮自动失败；5xx 机器扫描为 0；manifest/payload/Validator/清理回执最后生成且一致；Server 门禁 exit 1 与 6 例环境失败如实申报。合法状态 `VERIFYING / EXECUTION_SUBMITTED`；未写 PASSED/COMPLETED、未核销 P4/P34/P35/P47/P60、未移动正式方向。
