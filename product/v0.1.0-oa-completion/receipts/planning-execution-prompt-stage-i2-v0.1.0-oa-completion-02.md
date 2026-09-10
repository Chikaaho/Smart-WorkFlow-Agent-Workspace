# P60 I2 二级执行补充提示 02

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-10  
> 功能：P60 I2「低代码表单收口」  
> 级别：二级补充提示（一级提示后仍失败）  
> 当前状态：P60 `IN_PROGRESS`；I2 `VERIFYING`

## 1. 权威输入与替代关系

本提示替代 `planning-execution-prompt-stage-i2-v0.1.0-oa-completion-01.md`，是 I2 当前唯一执行入口；提示 01 与更早回执只作证据追溯，不同时作为待办。按顺序读取：

1. `planning-review-stage-i2-v0.1.0-oa-completion-03.md`；
2. 本提示；
3. `stage-i2-v0.1.0-oa-completion-03.md` 及仅与剩余原子对应的 `evidence/i2-03/e0b/`、`e2c/`、`e4b/`、`e5b/`、`e6b/`、`e7b/`；
4. `planning-execution-prompt-stage-i2-v0.1.0-oa-completion-01.md` 的对象与锁定边界；
5. `ready/direction-stage-i2-low-code-form-closure.md` §4.3—§4.7、§7。

本提示不改变需求方向、角色权限或 Git 门禁，不授权 I3、终态同步、提交、推送、标签或 Release。

## 2. 唯一剩余原子矩阵

父子映射：E0b→E0b2；E2c→E2c2；E4b→已锁定 E4b1 + 剩余 E4b2；E5b→已锁定 E5b1 + 剩余 E5b2；E6b→已锁定 E6b1 + 剩余 E6b2；E7b→已锁定 E7b1 + 剩余 E7b2。

| 原子 ID | 最新失败事实 | 完成条件 | 必要反向断言 | 固定对象 | 最小充分证据 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|
| E0b2 | 候选清单遗漏大量 I2 未跟踪文件；终态把未关闭项写 COMPLETED/0 | 完整机器清单覆盖 workspace、Server、Web 的 tracked/untracked task-owned 文件，生成于最后实现与验证之后；终态对应六项真实状态 | 不吸收既有无关删除，不漏未跟踪实现，不在任一剩余项未关时写 0 | 最终三仓候选 | `git status --short --untracked-files=all`、`git diff --stat HEAD`、HEAD/branch、mtime、清单交叉核对、Validator 原始四件套 | 所有行为和门禁结束后最后生成 | 仅真实 Git/文件系统工具失败且已保存 stderr/exit |
| E2c2 | 负向只有请求前 total=1，无请求后零副作用回读 | 失效引用、伪造引用、伪造附件每次请求前后使用同一查询条件，记录总数和目标详情不变 | 任一拒绝不得产生记录、草稿、文件引用或流程实例 | `i2_live_20260909b` 或显式新旧映射后的同一表单/目标记录 | 三组 `before/request/after` JSON；字段至少含 code、recordId、total、draftTotal、instanceTotal | 先建立只读采集点，再逐个负向调用并立即回读 | 无外部依赖，不得停止 |
| E4b2 | 超限返回 code=0/1000 行；敏感扫描无附件 | 超过 maxRows/响应大小时返回明确非成功 code/message，响应不冒充完整结果；敏感扫描可复算且零秘密 | 不允许静默截断成功；响应/日志/定义/回执不得出现密码、token、完整 JDBC 连接秘密 | 现有受控 H2 数据源与 overlimit contract | 超限请求原始 response/status/exit、服务日志片段、审计回读；扫描 command/stdout/stderr/exit | 先修复超限失败语义，再用现有 30 万行源复验；最后扫描 | 本地受控源可复现，不得停止 |
| E5b2 | 缺运行实例/流程绑定/草稿/业务数据四类引用删除链；缺停用后直接 flow start 与审计 | 四类引用分别建立并各自拒绝删除；停用后直接发起流程失败；既有实例/任务/记录/快照继续可读；审计有对应事件 | 所有拒绝前后对象计数、状态、业务值不变，不新增实例/任务 | 同一 formKey、definitionId、draftId、recordId、processDefKey、processInstanceId、taskId | 对象图 + 每类 before/request/after + lifecycle audit + 停用 flow-start 响应 | 先建完整引用图，再按四类逐项拒绝，最后停用/恢复 | 若真实引用类型与方向冲突，保存实际接口/模型证据并报告，不得用另一类型替代 |
| E6b2 | filler1 无 flowStart 权限却产生实例；viewer 空列表不能证字段投影；授权导入与真实跨租户缺失 | filler1 提交只产生业务记录且实例/任务增量为 0；admin 提交实例/任务增量各为 1；viewer 本人真实行仅返回可见字段；admin 授权导入成功并回读；非零租户双向零读写 | filler 不得通过提交间接启动流程；viewer 不得通过详情/筛选/排序/导出/error 取到禁看字段；跨租户不得读写 | admin、filler1、viewer1、nobody1、一个真实非零租户主体；同一表单和记录族 | 身份登录结果、权限定义、before/request/after API/SQL、授权导入文件与结果、跨租户双向矩阵 | 先修复 flowStart 服务端权威，再创建 viewer 本人行、授权导入、非零租户矩阵 | 非零租户若产品入口确不存在，必须提交真实创建/登录失败结果，并使用服务端租户上下文构造两个不同 tenantId 的实际对象做双向验证 |
| E7b2 | 撤权前详情已 1507；撤权后仍返回草稿 payload；定义变化来自另一表单 | 撤权前 filler 对自己的记录和草稿可读；撤权后新旧 token 读取记录/草稿均 403；admin/审批侧仍按旧版本读取原记录/实例/任务；同表单发布新定义后旧对象不漂移 | 撤权主体不得再取得草稿列表、详情或 payload；新定义不得改写旧记录、公式、数据源摘要、快照和审批显示 | 同一 filler、formKey、old/new version、draftId、recordId、processInstanceId、taskId | 单一 object-map + 变更前后同接口响应 + 审批页面/API + 快照/持久化回读 | 修复草稿权限并从变更前采集点重建一条同对象时间线 | 无外部依赖，不得停止 |

## 3. 锁定项与禁止重验

- 验收 02 §2 的 S-DEV-CAPTCHA-01、E0a/E0c/E1、E2a/E7a、E3a、E4a、E5a、E6a、E8a继续锁定。
- 验收 03 §2 的 E2b、E3b、E4b1、E5b1、E6b1、E7b1、E8b、E0a3/E0c3继续锁定。
- 不重采 PC 设计/审批、移动管理员主链、公式全矩阵、已通过的数据源负向、已有四身份请求子集或清理链。
- 新代码若触及锁定结论依赖路径，只复验受影响断言并在回执列出“变化文件→失效锁定项→复验结果”；没有触及时不得扩大重验。

## 4. 固定对象、目录与生命周期

新证据只写入：

`product/v0.1.0-oa-completion/receipts/evidence/i2-04/`

开始前生成 `object-map-before.md`，至少登记 tenantId、userId/roleId、formKey/definitionId、old/new version、draftId、recordId、datasourceId/queryKey、processDefKey/processInstanceId/taskId、应用 PID/JDBC 类型。原运行实例若已销毁，写明旧 ID、销毁证据与新 ID，随后所有 E2c2/E5b2/E6b2/E7b2 必须使用同一组新对象，不得再分别造公式表单、权限表单和生命周期表单拼接结论。

顺序必须是：变更前采集点 → 负向/撤权/停用/新定义行为 → 每步立即回读 → 受影响验证 → 清理 → 最终候选指纹 → 唯一 terminal payload 生成与验证 → manifest 生成/回读 → 回执正文并逐字节附加已验证 payload。不得先销毁环境再补回读。

## 5. 允许读取、修改与命令

### 5.1 允许读取

仅限 §1 文件、`evidence/i2-03/` 对应六项、相关 Server/Web 实现、两仓工程宪法和正式 terminal contract。

### 5.2 允许修改

证据确认的产品缺陷只允许落在下列受影响文件或同目录中经调用链证明不可避免的直接依赖；扩大文件范围必须在回执写明调用链：

- `Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormExtDataService.java`
- `Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormSubmitService.java`
- 表单草稿查询/详情的现有 controller/service 权限实现文件（先用 `rg --files ... | rg 'Form.*Draft.*(Controller|Service)'` 解析真实路径，原始结果写入 `scope/draft-files.txt`，不得凭猜测新建平行实现）
- 对应错误码、聚焦测试与集成验证资产
- 新增 `evidence/i2-04/` 和回执 04

禁止修改旧回执、旧 evidence、规划审查、主方向、knowledge 正式状态、无关删除和其他阶段代码。

### 5.3 必须执行并保存的命令

以下命令在对应仓库运行，stdout/stderr/exit 分离保存；行为调用可沿用现有登录助手和 HTTP 夹具，但不得沿用其结论。

```bash
git rev-parse HEAD
git branch --show-current
git status --short --untracked-files=all
git diff --stat HEAD
rg --files sw-biz/sw-biz-form | rg 'Form.*Draft.*(Controller|Service)'
```

若修改 Server 代码：按 Server 工程宪法执行受影响聚焦测试与最终全量门禁；至少包含 `FormI2ClosureIntegrationTest`、超限行为测试、flowStart 权限测试、撤权后草稿拒绝测试。门禁原始输出和 exit 必须属于最后代码快照。

行为、门禁、清理、候选指纹及 terminal Validator 四件套全部冻结后，在 `evidence/i2-04/` 内执行并保存：

```bash
find . -type f ! -name 'manifest.sha256' ! -name 'manifest-verify.*' -print0 | sort -z | xargs -0 shasum -a 256 > manifest.sha256
shasum -a 256 -c manifest.sha256
```

先把唯一最终 JSON 写入 terminal input，以正式 `.codex/governance/validate-terminal.sh` 对它生成 input/stdout/stderr/exit 四件套；manifest 将四件套纳入后生成并回读。最后写回执正文，并从已验证 input 逐字节附加一次 `ENGINE_TERMINAL` 末行；不得验证后再改写 payload，也不得在 manifest 或回执之后改写任何证据附件。

## 6. 每项原始输出字段与固定文件名

| 原子 | 必须存在的原始文件 | 必须可直接读出的字段 |
|---|---|---|
| E2c2 | `e2c2/<case>-before.json`、`<case>-request.json`、`<case>-after.json` | request code/message；before/after recordTotal、draftTotal、instanceTotal、targetExists/targetValue |
| E4b2 | `e4b2/overlimit-response.json`、`http-status.txt`、`server-log.txt`、`audit-after.json`、`secret-scan-command.txt`、`secret-scan-stdout.txt`、`secret-scan-stderr.txt`、`secret-scan-exit.txt` | 非成功 code/message；返回 rows 数；审计 outcome；扫描根、pattern、命中数、exit |
| E5b2 | `e5b2/object-graph.json`、四组 `*-before/request/after.json`、`disabled-flow-start.json`、`existing-instance-after.json`、`lifecycle-audit.json` | 引用类型、对象 ID、请求 code/message、前后 status/count/value、instance/task 增量、audit action/outcome |
| E6b2 | `e6b2/permission-definition.json`、`flowstart-before.json`、`filler-submit.json`、`filler-after.json`、`admin-submit.json`、`admin-after.json`、`viewer-row.json`、`authorized-import.json`、`authorized-import-readback.json`、`tenant-matrix.json` | userId/tenantId/role、flowStart rule、businessKey、instance/task delta、可见/缺失字段、导入计数、双向 code/count |
| E7b2 | `e7b2/object-map.json`、`before-record.json`、`before-draft.json`、`after-record-old-token.json`、`after-draft-old-token.json`、`after-record-new-token.json`、`after-draft-new-token.json`、`admin-history.json`、`approval-history.json`、`new-definition.json`、`old-object-after-definition.json` | 同一组 ID/version；撤权前 code=0；撤权后 403 且无 payload；管理员/审批旧值与版本；新旧定义值对照 |
| E0b2 | `e0b2/*-head.txt`、`*-branch.txt`、`*-status.txt`、`*-diff-stat.txt`、`candidate-crosscheck.md`、`final-mtime.txt`、terminal 四件套 | 三仓 HEAD/branch；tracked/untracked 全清单；最后代码/测试/证据冻结时间；work_items 与真实剩余数 |

`code=500/系统异常` 可证明失败发生，但若验收要求调用方可判定具体边界，则需稳定业务错误码/消息；不得用日志中的异常名称替代 HTTP 契约。

## 7. 相对提示 01 的方法变化

- **删除**：删除已通过的 E2b、E3b、E8b 及 E4b/E5b/E6b/E7b 的已成立子链，不再重跑九大项。
- **原子化**：只保留六项；把产品缺陷、缺证据和对象错配分开，避免用更多截图掩盖行为反证。
- **替代路径**：用每个负向的 before/request/after 三联、实例/任务增量、同一对象撤权时间线和完整 tracked/untracked 候选清单，替代空列表推断、文字说明和手工文件枚举。
- **可判定提交**：三处行为缺陷均有修复后反向结果，六项固定文件与字段齐全，最终门禁属于最后快照，terminal 中剩余数与事实一致，才可提交回执 04。

## 8. 提交前核对矩阵

以下每行全部为“是”才允许提交：

| 核对项 | 是/否 | 对应附件 |
|---|---|---|
| 超限是否返回明确非成功结果，而非 code=0 截断？ |  |  |
| filler1 提交后的实例/任务增量是否均为 0，admin 是否各为 1？ |  |  |
| 撤权前记录/草稿是否可读，撤权后新旧 token 是否均不能取得 payload？ |  |  |
| 三类对象负向是否各有 before/request/after 且零副作用？ |  |  |
| 四类生命周期引用是否分别建立并拒绝，停用 flow start 是否失败？ |  |  |
| viewer 有真实本人行、授权导入有正向回读、跨租户有双向真实对象结果？ |  |  |
| 敏感扫描是否保存命令、范围、stdout/stderr/exit 且零命中？ |  |  |
| 最终清单是否覆盖 tracked/untracked 且未吸收无关删除？ |  |  |
| 受影响门禁、terminal payload/Validator、manifest、回执是否按正确冻结顺序生成？ |  |  |
| terminal 的 work_items/remaining_actionable_count 是否与本表事实一致？ |  |  |

任一答案为“否”时继续执行，不得提交“全部 COMPLETED”。如真实外部阻塞满足 terminal contract，按真实状态提交，不得用 `independent_work_exhausted=true` 掩盖授权内剩余动作。

## 9. 回执与合法终态

追加回执：

`product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-04.md`

回执正文每项只写：`原子ID → 原始附件 → 实际结果 → 边界`。Executor 合法状态仍为 `VERIFYING / EXECUTION_SUBMITTED`；不得写 I2 `PASSED/COMPLETED`、阶段三值、核销 P 编号、提交/推送 Git、移动方向或发布版本。
