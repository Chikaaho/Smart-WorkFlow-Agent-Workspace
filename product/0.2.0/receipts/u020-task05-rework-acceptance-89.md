# 0.2.0 批次89回执（执行提示05）

2026-10-28｜Executor｜VERIFYING｜revision 4｜总7阶段 2/1/4 不变。本回执只写原ID→实际变化/结果→通过条件是否满足→仍缺什么及原因；正式49、46/22/22=90、ADV64/问题57、P62延期/OFF保持，不晋级整版。

## 已过锁定（本批未重做）

- `P3/101:2/填写框架`、`P4/A10-Q2`、`P4/A14-Q4` 沿88通过结论锁定；本批未改其实现，未重跑其链路。
- 采集口径保持1920×1080/DPR1/zoom1；原始参考图与87/88运行图未修改。本批正式采集为**用户可见浏览器（headed）**：`captureTier=FORMAL_VISIBLE_BROWSER`；A11为网络/接口分支实测，非视觉结论。

## 七项当前动作

### 1. `A03/Owner裁决-文字判定口径落地`

**实际变化**：新判定工具 `E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/tools/a03-s7c.cjs` 按 §7.1「以 DOM 文字矩形为单位」重写，只核97:2/32:2。

- 同名文本关联：先按设计行逐父级累加坐标（实例后代按 `I<instance>;...` 路径前缀回退到最近可查祖先）就近关联，再按「标签/计数」包含关系、数字计数同 y 带、同位置重叠依次兜底；不再靠字号相同匹配。
- 行盒对行盒：静态/行高比较取元素盒（元素仅承载该文本时）或 Range 行盒并集；运行计算 `line-height` 与设计行高同量比较。
- 墨迹对墨迹：参考图与运行图各自取墨迹外接矩形（x/y/宽/高≤1、基线 maxY≤1、核心色 RGB≤3）；参考采样在 DOM 框外扩 8px 内完成，保证三坐标落在同一实际对象。
- 字体图标（箭头/星形/几何符号）计非文字，不进入文字项分子分母；无同名/同位置设计行的运行文本列 unmatched，不扣除、不当通过。
- 动态文本（无同名）按 §7.3 只比锚点/基线/字体字号字重颜色，不比内容/宽度。

**结果（正式headed，报告含 `captureTier`）**：

- `97:2` `a03-s7c-97-2-report.json`：参考文本行63、参考图标行6；DOM文本项109；图标排除18（10个`›`+8个`☆`）；unmatched 14；判定77；通过3；失败74。
  - 筛选「流程名称」→ `refId=I318:3709;317:2057;318:3714;317:2061;318:3475`，exact，距离31；墨迹 ref `[274,110,328,122]` / run `[276,111,326,122]`；真实差异为字号13/设计14、行高19/22、字色 `[48,58,85]`/`[92,102,120]`（非白、非顶栏logo）。
  - 侧栏「行政办公」→ `refId=I269:2043;258:85`（设计行「行政办公  2」），positional，距离55；墨迹几何 x0/y1/w1/h1；字族 Arial/设计 Noto、字重400/500、行高19/22；不再取到表内同名或异常绿色。
  - 计数已分离并与正确行关联：「8」→`I269:2041;258:87`「全部  6」；「2」(y165)→`I269:2043;258:85`「行政办公  2」；「2」(y387)→`I269:2053;258:85`「未分类  0」。
  - 顶栏：工作台/流程中心/应用中心全条件通过；我的门户仅墨迹宽差2；中文仅字色差（字体/行高/位置均过）；主题行高32/18为真实差异（不在五处范围）。
- `32:2` `a03-s7c-32-2-report.json`：参考文本行30、图标行3；DOM30；图标排除3（`↗`/`▤`/`✧`）；unmatched 2（租户编码、ICP备案号）；判定25；通过18；失败7。
  - 两行标题：Range 全行并集，行盒 `(84,328,700,120)`，行高60=设计60；墨迹并集 ref `[85,339,542,438]` / run `[85,340,542,439]` → 通过（不再只取首行）。
  - 「欢迎登录」：行盒 `(1341,215,112,28)`，行高28=设计28；墨迹 ref `[1342,216,1451,242]` / run `[1342,217,1451,243]` → 通过（不再拿Range高40比行盒28）。
  - 7个失败项即真实差异：`CH-aPaaS`（基线/墨迹高）、`登录`（行高48/22）、`单点登录`（字色）、`租户名称`（字号13/14+墨迹）、`企业微信`/`飞书`/`钉钉`（字色与行高20/22），原位保留。

**通过条件**：同名按实际对象关联✓；参考/DOM/像素同一对象✓；行盒与墨迹同类比较✓；全部条件成立才通过✓；图标与失败项不扣✓；动态用户名/计数按原规则✓。

**仍缺**：97:2 整页正式headed一致率70.999%（`a03-report-97-2-b05.json`，父项表格/卡片高度与侧栏字体等主链差异）；A03 不再以错报告批量派页面修复，74/7项真实失败按原页面父项归属保留。工具输出为文字项判定，不改变原页面级71%口径。

### 2. `P3/3:2/截止标签`

**实际变化**：

- 断点确认：本轮已建 `20261028-001` 待办 createTime `2026-10-28T11:17:34.126`、dueAt `2026-10-28T11:47:34.180317`，但 `< 13:25` 查询返回 null。原因：到期提醒触发后 `sw_bpm_task_deadline.run_state` 已由 PENDING 推进为 DONE，而 `BpmTodoController` 只查 PENDING/CLAIMED。
- 服务端只读修正：`BpmTodoController` 仅排除 `CANCELLED`，DONE/CLAIMED/PENDING 的既有期限仍返回；同一任务多条取最早 dueAt。Server `32874851`。
- 前端如实标示：`WorkspaceBoard.isOverdue()` 仅按真实 dueAt 判断，文字仍显示真实期限，过期用 `--sw-danger`/`--sw-danger-bg` 语义色；无期限仍不渲染。Web `2bb7a36`。

**结果**：`deadline-3-2-b05.json` + `a03-runtime-3-2-b05.png`（正式headed）：目标行 meta「租户100管理员 · 11:17」、dueText「今天 11:47」、class `wsd-task__due is-overdue`、色 `rgb(229,72,77)`；API 同一时点 dueAt 与行文字一致；无期限行 dueText 为空。A11 新产生的同流程任务各自显示真实未来期限（14:02/14:03），未改历史任务。

**通过条件**：真实 dueAt 即显示✓；已过期如实表达✓；无期限不渲染✓；可见文字与同一时点响应关联✓；未改历史任务✓。**仍缺**：无；未新增表单/流程、未重建期限引擎（本轮仅复用既有对象；A11同流程新实例为合法测试对象）。

### 3. `P3/7:2/环比行`

**实际变化**：仅校正三副注的局部排版——`.portal__analytics-summary` 上边距 4→8px、列内 gap 2→4px、数值行高32→36px、标签行高20→18px、em margin-top 2→0；副注保持12px/18px/`--sw-success-text`（#12805C）。未改上期计算、14柱与真实—/—/数量差。

**结果**：`trend-notes-7-2-b05.json`（正式headed）：三副注行盒 `[41,547,446.66,18]`、`[506.656,547,446.66,18]`、`[972.3125,547,446.66,18]`；设计 `x=41/506.33/971.67, y=547, h=18`，偏差≤0.64px；字号12px、行高18px、色 `rgb(18,128,92)`；文字仍为「—」「—」「+1」。

**通过条件**：三副注行盒≤1px✓；颜色符合✓；空基期—保持✓；不造非空环比✓；后端来源/14柱未动✓。**仍缺**：无。

### 4. `P3/97:2/分页快照`

**实际变化**：`ProcessCatalog` 默认 `pageSize` 20→10，页大小选项补10（`[10,20,40,60,100]`，20仍可选）；受影响断言 `ProcessCatalog.spec.ts` 同步为10。无用户偏好写入（该页无持久化偏好键）。

**结果**：`pagination-97-2-b05.json` + `a03-runtime-97-2-pagination-b05.png`（全新浏览器上下文，`localStorage=[]`、`sessionStorage=[]`，正式headed）：页脚实际显示「10条/页」；同页数据8条不变。

**通过条件**：无偏好首次打开真实10条/页✓；实际截图同一状态✓；用户手选20等合法选择保留✓；不以整页分数要求本子项✓。**仍缺**：分页区行盒/字号与设计仍有父项级差异（整页70.999%内），不属本子项。

### 5. `P4/A05-AC01-Q1`

**实际变化**：只处理四个具名键；先回读各键值/消费者，再仅改确有差异者；键集前后对账零丢失。

| 键 | 消费者 | 前值 | 后值 |
| --- | --- | --- | --- |
| `menu.WorkflowDesigner` | `menu-title.ts`（NODE_TITLE_KEYS→菜单标题） | 流程设计器页 | 流程设计器（en不变：Process designer） |
| `system.newSubDept` | `DeptList.vue` 新建按钮 | 新建 / New | 新建子部门 / New sub-department |
| `form.fillSaveTemporary` | `FormRender.vue` 暂存按钮 | 暂存 / Save | 暂存 / **Save draft** |
| `taskDetailUi.signParticipants` | `InstanceFlowPanel.vue` 会签统计 | 参与 / participants, | 参与 / **participants** |

源同步：`p61-copy-dictionary-batch21.json` 字面量改「流程设计器」、`p61-copy-dictionary-batch22.json` 增 `common.submitResultUnknown`、`p61-locales-manual.json` 补 `form.fillSaveTemporary` 与去尾逗号。运行文件与源同值落盘；**未重跑全量生成器**（既有单源缺口2700键，重生成会丢3341行，属既有问题，本批不重构生成器）。

**结果**：`zh-CN/en-US` 键集 3267→3268，丢失0；新增仅 `common.submitResultUnknown`；实际变更精确为上述4键（zh 3处、en 4处）。A11 实测 `common.submitResultUnknown` 已解析为中文文案（不再显示原始键名）。

**通过条件**：四消费者含义准确✓；键集/动态引用有效✓；零丢失✓；无引用死键与纯引号/冒号风格未作为缺陷✓；编号/编码与errFieldUnknown未动✓。**仍缺**：全量生成器单源缺口（2700键）未修，登记为既有基础设施问题；本批以运行文件+源镜像双写保证当前产品值正确。

### 6. `P4/A11-Q3`

**实际变化**：沿用既有 `acceptSubmit()` 三分支；本批补两个原未知分支的真实结果，并修掉测试暴露的缺失文案键（`common.submitResultUnknown` 在88回滚中丢失，曾渲染原始键名）。

**结果**（`a11-A-branches-b05.json` / `a11-B-branches-b05.json`；浏览器 `route.fetch()+abort` 制造「服务端已处理、页面收到网络错误」）：

- A（受理响应丢失、查询可用）draft `2115315912138584066`：POST submit **1**；GET draft 2（含原号回收）；GET command 1；提示「提交结果未知…」后「提交成功」各1次；草稿 SUBMITTED、submitSeq 1、command COMPLETED、resultRecordId 真实；按 businessKey 实例数 **1**。
- B（受理响应丢失、状态查询也失败）draft `2115315999547879426`：POST submit **1**；GET draft 3（回收查询被断）；GET command **0**；仅「提交结果未知…」1次、无成功提示；服务端草稿 SUBMITTED、submitSeq 1、command COMPLETED、实例数 **1**。

**通过条件**：追原 command 完成且无第二次业务提交✓；实际业务只落一次✓；查询失败明确未知且不再发业务提交✓；后处理不重复（该表单 definition 无 events，afterSubmit 为空；完成分支成功提示A=1/B=0）✓。**仍缺**：无；正常成功路径沿88结论未重演。

### 7. `P3/97:2/顶栏文字排版`

**实际变化**：仅五处静态文字——`.app-main-nav__label { line-height:22px }`（四导航14px不变）；`.app-topbar__locale` 补 `font-family:var(--sw-font-family)` 与 `line-height:18px`（中文12px不变）。未改头像/用户名数据、宽高、图标槽、导航或语言切换行为。

**结果**：`topbar-97-2-b05.json`（正式headed）：四导航盒 `(309,21,42,22)`、`(434,21,56,22)`、`(566,21,56,22)`、`(698,21,56,22)`，均 Noto 14px/22px/500；中文盒 `(1702,23,24,18)`，Noto 12px/18px/400；与参考位置差0～1px。点击我的门户→`/portal`、流程中心→`/workflow/catalog`；语言下拉仍列「中文/English」。

**通过条件**：四导航14/22✓；中文Noto12/18✓；位置≤1px✓；菜单/下拉行为不变✓；已修图标未动✓。**仍缺**：我的门户墨迹宽差2、中文设计字色偏暗（A03项真实失败，本项仅限字体/行高/位置，未改页面凑报告）。

## 工程与Git

- Web：typecheck `TC=0`；test `227 files passed / 1 skipped`、`1953 passed / 3 skipped`、`TEST_EXIT=0`；build `4.83s`、`BUILD_EXIT=0`；lint `LINT_EXIT=0`。受影响断言 `ProcessCatalog.spec.ts` 由20改10后全量复跑通过。
- Server：`BpmTodoControllerTest` 27/0/0（TodoTests 3、DetailTests 9、CompleteTests 5、RejectTests 4、ClaimTests 3、ProcessedTests 3）；`mvn -pl sw-bootstrap -am package -DskipTests -P dev` 成功并用于dev实测。
- Git回读：Web `56df440..2bb7a36`、Server `1e9379bd..32874851` 已推送；根仓回执/知识同步见下。`vite.config.ts` 为会话前既有本机改动，未纳入提交。
- 证据位置：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/tools/a03-s7c.cjs`、`b05-capture.cjs`、`a11-branches.cjs`；`real-joint/a03-s7c-*-report.json`、`a03-runtime-*-b05.png`、`deadline-3-2-b05.json`、`trend-notes-7-2-b05.json`、`pagination-97-2-b05.json`、`topbar-97-2-b05.json`、`a11-{A,B}-branches-b05.json`。

## 仍缺与原因

- 97:2 整页正式一致率70.999%（601,356/2,073,600差异像素口径），父项表格/卡片高度、侧栏字体与数据行差异未在本批修；本批仅完成具名子项。
- A03 判定工具已按裁决口径落地；97/32 的失败项为真实差异（74/7），不因工具修正而扣除。
- 全量 locale 生成器单源缺口2700键为既有问题；本批未重构生成器、未丢键（3267→3268，0丢失）。
- 整版未通过：验收后合并develop/main、0.2.0发布、发布后同步、结束依赖保留（2/1/4）。
