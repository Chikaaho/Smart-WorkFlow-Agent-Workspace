# P57 BPM Engine 统一流程节点扩展能力二级执行补充提示 02

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 触发原因：一级提示后仍有E2/E3/E5未执行、E4负向未执行，且E1出现终态矛盾  
> 功能状态：VERIFYING  
> 合法执行终态：EXECUTION_SUBMITTED

## 1. 精确权威输入

本轮只读取并服从以下规划输入：

1. `product/p57-bpm-node-extension/ready/direction-p57-bpm-node-extension.md`
2. `product/p57-bpm-node-extension/receipts/planning-review-p57-bpm-node-extension-03.md`
3. `product/p57-bpm-node-extension/receipts/planning-execution-prompt-p57-bpm-node-extension-02.md`
4. `product/p57-bpm-node-extension/receipts/execution-supplement-e1-e7-p57-bpm-node-extension-20260902.md`
5. `product/p57-bpm-node-extension/receipts/attachments/execution-output-e1-e7-20260902.txt`

审查01/02和提示01只作历史追溯，不再把已锁定项带回本轮。

## 2. 本轮唯一剩余缺口

| 包 | 固定输入 | 必须得到的原始输出 | 正向断言 | 反向零残留断言 |
|---|---|---|---|---|
| R1 验证实例终态 | 复用实例`4b6de97a-a6e2-11f1-a6fe-66ff24301f3c`和业务记录`9b343216-2b2a-45f9-8c18-167066dea421`；若测试数据已清理，使用同规则新建一组并在回执声明新ID | 同一实例的运行时状态、`activeNodeIds`、完整轨迹、业务记录状态和结果页DOM | 到达End后实例和业务结果采用现有系统定义的终态语义，页面不再显示RUNNING | 无活跃节点、已到End与业务RUNNING不得同时存在；修复不得把失败强写为成功 |
| R2 双租户普通授权 | 重建固定租户57001/57002、角色57101/57102、用户57201/57202；每个角色仅有`workflow:def:view` | 两个普通用户各自通过真实认证链登录后的能力HTTP状态和完整JSON；逐字段diff | 两者均200，能力定义完全一致且只含系统节点能力 | 不使用超级管理员/token伪造；响应不含租户业务数据；完成后按固定ID清理 |
| R3 五类publish与三类启动失败 | publish依次使用：预留节点、未知节点、缺审批人、未知审批人类型、非法审批配置；启动依次使用现有三个非法profile | 每个publish的固定graph、HTTP响应、发布/版本/Flowable定义/部署/相关表前后计数；每个非法profile的根因日志、健康端口探测与进程清理结果 | 五类publish均在部署前拒绝；三类非法profile均出现对应根因且未进入健康态 | 每个场景所有计数不增加；不得以一个未知节点代替其余场景；不再要求自然退出码，只要求未健康并可靠清理进程 |
| R4 三种浏览器fail-closed | 真实生产构建页面；分别制造能力请求传输失败、200畸形JSON、200缺必要字段 | 每种场景的URL、网络请求/响应、错误DOM、保存按钮/保存请求状态 | 页面明确显示能力加载失败并阻止保存 | 不使用Mock页面；不回退静态目录；网络中不得出现成功保存请求。允许浏览器网络拦截只改变能力响应，页面与其余后端必须是真实构建 |
| R5 APPROVAL主链与skeleton | 新建唯一前缀`p57-r5-`的表单/流程；使用DESIGNATED审批人；另读取现有skeleton入口 | 同一流程定义ID、实例ID、任务ID的设计、保存、发布、发起、待办、审批、结果和轨迹；skeleton可启动/执行的当前行为 | START→APPROVAL→END到达系统既有完成态，结果与轨迹一致；DESIGNATED生效 | 不拼接不同实例；不得修改审批业务语义；skeleton不得被P57注册表改造破坏 |
| R6 最终回归 | 完成R1—R5和所有临时入口清理后的最终工作树 | Server根整体测试、P57聚焦测试、Web test/typecheck/lint/build、两仓diff-check的原始日志/稳定报告、退出码和可复算计数 | 所有命令退出0，最终代码与行为证据一致 | 临时验收路由/控制器/凭据/测试用户零残留；不得沿用修改前输出 |

## 3. 已锁定通过项与禁止重验

- E6已完整通过，禁止重复运行或重新提交graph_json证据。
- 禁止重新证明隔离节点启动发现、4 translators、正常能力清单、正常设计器识别/保存/发布、serviceTask执行到End、生产目录零污染。
- 禁止重新证明401/403/超级管理员200、未登录跳转、当前聚焦测试摘要。
- R1只修复并证明终态一致性；R4只做三种失败场景；其余已锁定正常路径不得扩写。

## 4. 允许修改文件范围

- 只允许修改当前P57差异中直接负责以下行为的文件：节点运行完成/业务状态衔接、P57隔离验证profile与fixture、workflow能力加载失败处理、P57相关自动化测试。
- 允许新增或更新：`product/p57-bpm-node-extension/receipts/`下的一份补证回执和一份原始附件。
- 允许使用现有认证、租户、流程、表单、审批和数据库接口创建`p57-r2-`/`p57-r5-`测试数据；不得修改通用认证/验证码/权限语义来方便验收。
- 执行前必须把两仓`git diff --name-only`写入原始附件；后续任何新增修改文件必须在回执中逐文件说明与R1—R6的唯一对应关系。无法唯一对应的文件禁止修改。

## 5. 允许命令及强制顺序

1. 记录两仓HEAD、`git status --short`、`git diff --name-only`，启动真实H2/Redis应用与生产构建Web。
2. 先完成R1，确认终态矛盾消失；若必须修改产品代码，完成聚焦回归后再继续。
3. 重建R2夹具，以真实浏览器认证链分别登录两个普通用户，保存能力响应后清理。
4. 依次执行R3五类publish；每类请求前后立即查询同一组计数。再依次启动三个非法profile，探测健康端口失败并清理进程。
5. 在真实浏览器依次执行R4三种网络场景，保存DOM和网络输出。
6. 执行R5同ID审批主链和skeleton兼容行为，随后清理`p57-r5-`数据。
7. 删除临时验收入口/fixture数据，执行R6最终回归；所有原始输出写入一个稳定附件。
8. 仅当R1—R6自检全部为“是”时追加回执；否则如实列出未完成包，不得声称整体提交完成。

允许的验证命令类别仅限：本地服务构建/启动、真实HTTP/浏览器操作、H2只读查询和精确测试数据清理、P57聚焦测试、Server根整体测试、Web test/typecheck/lint/build、`git diff --check`和限定范围残留扫描。禁止远程部署、commit、push、生产迁移或破坏性清库。

## 6. 原始附件必备字段

原始附件按R1—R6分节，每节必须出现：

- `SERVER_HEAD`、`WEB_HEAD`、工作目录和最终`DIFF_FILES`；
- `INPUT_IDS`与身份/租户/节点/流程固定输入；
- `COMMAND`或浏览器操作；
- `HTTP_STATUS`、完整业务响应或稳定报告路径；
- `DB_BEFORE`、`DB_AFTER`、`DB_DELTA`（涉及写入/失败时）；
- `DOM_ASSERT`、`NETWORK_ASSERT`（涉及页面时）；
- `POSITIVE_ASSERT`、`ZERO_RESIDUE_ASSERT`；
- `EXIT_CODE`与可复算测试计数；
- `CLEANUP_RESULT`。

缺少任一适用字段，该包视为未提交。

## 7. 相对一级提示新增或收紧约束

- 删除E6及E1/E4已通过前半链，禁止再次用已通过内容增加篇幅。
- 将E1收紧为单一终态矛盾R1；`activeNodeIds=[] + 已到End + RUNNING`必须消失。
- 修正一级提示的退出要求：非法profile无需等待自然非零退出，但必须证明未进入健康态并可靠清理进程。
- publish失败场景固定为五类，每类必须独立请求和独立计数，不再使用含混“六类”表述。
- R4允许对真实构建页面做浏览器网络拦截以制造三种能力响应；拦截不得替换页面或其他后端。
- R6必须发生在所有修复和临时入口清理之后，修改前的测试输出不得沿用。

## 8. 提交前门禁

| 检查项 | 必须为“是” |
|---|---|
| R1实例/业务/页面终态一致，RUNNING矛盾消失 | 是 |
| R2两个租户普通授权用户真实登录且响应逐字段一致 | 是 |
| R3五类publish失败各自零写入，三类非法profile均未健康并已清理 | 是 |
| R4真实页面三种fail-closed均有DOM+网络且零保存请求 | 是 |
| R5同ID审批主链及skeleton兼容闭环 | 是 |
| R6最终工作树下全部回归、原始输出和零残留通过 | 是 |
| E6和其他锁定项未被重新展开 | 是 |
| 未改P58、认证权限语义、正式终态、P57核销或正式基线 | 是 |

任一项不是“是”，不得再次提交完成性回执。合法状态保持`VERIFYING / EXECUTION_SUBMITTED`。
