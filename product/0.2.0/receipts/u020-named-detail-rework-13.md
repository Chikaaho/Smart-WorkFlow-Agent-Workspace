# 0.2.0 执行提示13回执：15具名节点剩余参数整改

2026-10-28｜Executor｜EXECUTION_SUBMITTED。对应[执行提示13](planning-execution-prompt-unified-020-13.md)（revision14）。G07/G08 按上轮锁定关闭不重开；本轮仅对 15 节点做剩余参数整改并真实浏览器复测。未重跑保存/发布/隔离/认证链、未造示例数据、未核销 P、未晋级基线、未整版 PASSED。Server 未触碰；vite.config.ts 他人未提交改动保持不动。

## 一、身份与证据

- 会话/视口：t100admin@i5-tenant-100（G14/G17/G18/G19/G36/G37）、admin@tenant-0（G24/G25/G26/G27/G29/G30/G31）；1920×1080/DPR1，Chromium **可见交互会话（headless:false）**，DOM `getBoundingClientRect` + computed style 实测（首轮排查用 headless 同口径，末轮验收数据以可见会话复跑为准，结果一致）。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-geometry.json`（13 组 verdict 覆盖 15 节点）与 `u020-13-*.png`；网络索引 `u020-13-network.json`（可见会话全程 3599 请求/531 去重 URL，后端 8080 + vite 5175 真实联调流量）；采集脚本 `tools/u020-13-capture.cjs`（末轮全量复跑）。
- 后端本机 dev 8080（bootstrap-dev.jar + SW_DEV_DB_* + 四外部密钥一次性 dev 值，不入库不回显）；前端 vite 5175。真实数据：富文本与子表探针（5f2b5468，G36/G37）、A11 表单事件探测（1fe2ed4e，G14 冻结载体）、灾备演练申请-87（G17 入口）、系统管理真实数据。

## 二、15节点逐项实测（末轮）

| 节点 | 本轮改动 | 实测 | 结论 |
| --- | --- | --- | --- |
| G14 | PublishedSnapshotViewer 冻结消费者落地：字段清单（原列 #/字段名/字段编码/控件类型/字段长度/必填/操作 + 查看属性 DetailDialog 560 含基础5项+数据规则6项）；表单设计（组件列 252 + 冻结画布 + 类型属性 336：字段名/宽度/标题位置/占位提示/必填/字段标识/类型/最大长度/校验规则/值变更脚本/显示条件，说明 80）；流程设计（版本列 220 + graph_json elements 冻结 SVG 图：事件胶囊 128×44/菱形网关/普通节点、polyline #8996AB 连线、点选节点右栏只读属性）；编号设置承接 numbering；流程设置承接 notification/事件监听（triggers+表单 events）/变量/审批脚本 | fieldsHead 八列齐；propsDialogRows/designPropsLabels 11 键齐；processNodeCount 3、hint「3 个节点」、点选 node_end 属性回显；**编号页 A11 该版本无冻结编号规则 → 同布局空态**（「编号规则该版本未冻结编号规则，无法展示。」）；settingsHeads 通知配置/事件监听齐 | 通过 |
| G17 | SubFieldDesigner 列 min-width 560/260/130/120 + 根内距清零/正文25（全局块） | 标题 x425；四列 x425/985/1245/1375 = **560/260/130/120（w1070）**；取消 x1327/确定 x1415 均 80×32 | 通过 |
| G18 | AccountBindings 行内参数（行 66px+mb18、header 28/25、右上关闭 32×32 top25/right25、footer 37/25/27、provider 按钮 72） | Provider 文字 x526（±1）；绑定按钮 **x1322 w72 h32**；行中心 435；底关闭 x1314/y675 80×32；右上关闭框 x1362/y371 32×32；标题 32 高头内 16/24 | 通过 |
| G19 | WorkspaceStudio：18 类型 SVG path 常量 LIBRARY_ICONS（stroke #2563EB fill none 1.6）、组距 first 21/后续 17 | 系统行 y245.7/305.7、数据行 y396.7 起（步距 60）；iconPaths 18 项非零、strokes 仅 rgb(37,99,235) | 通过 |
| G24/G25/G27/G29/G30/G31 | edit-dialogs.css 收口：header 32/25/17、title 16/24/500、headerbtn 24×24 top34/right25；`.sw-edit-grid` 输入/步进 wrapper **box-sizing:border-box + height 32**（修首轮 rect 34）、标签 14/22、字段行 60+16 | 六弹窗 titleX 605、titleFs 16px、全部字段 h32（G24 八字段、G31 八字段、G29 备注 73/G30 备注 80 自然增高保持） | 通过 |
| G26 | RoleList 左字段重排（名称/编码/排序+状态 `.role-edit__pair`/数据范围/备注 80）+ 树搜索 248×32 + 展开/收起各 88×32（`:key` 重挂保持勾选 + filter-node-method） | titleX 485；labels 六项序正确（排序 y455/状态 y475 同排）；search x899 248×32；tools x1155/x1263 各 88×32；treeW 536；勾选 18×18 | 通过 |
| G36 | FieldConfigPanel：head mb12、行距 20、label 14/22 mb6、`:deep()` 六控件命中、cols 内相邻行 margin-top:0（修字重列下坠 20px）、textarea 显式 1px #DDE3EF 边框 | **内容(1604,208,296,80)、对齐(1604,336,296,36)、字号(1604,420,140,32)、字重(1760,420,140,32)、颜色(1604,500,296,32)、宽度(1604,580,296,32)**（DOM 报 1605/295/139.5 为亚像素取整）；绘制边框实测 textarea 1px rgb(221,227,239)、select inset box-shadow rgb(221,227,239) | 通过 |
| G37字 | rt-font-popper 含边框可见外框 208×224（border-box） | **208×224**、6 项、选中 bg rgb(239,246,255) 文字 rgb(37,99,235) | 通过 |
| G37号 | rt-size-popper 120×260 | **120×260**、7 项、选中 #EFF6FF | 通过 |
| G37色 | 颜色面板 fixed 定位 + 视口边界翻转（placeColorPanel/nextTick），430×286 | **430×286 fullyVisible=true、position:fixed、sat 域存在**，未被编辑控件裁切 | 通过 |

首轮偏差与修复（均有末轮实测佐证）：G24-G31 输入 rect 34 → wrapper box-sizing:border-box；G36 字重/颜色/宽度 y+20 → `.config__cols .config__row + .config__row` 误命中共享行距规则，补 margin-top:0；G36 textarea 无绘制边框（EP 主题 border-width 0）→ 显式 1px #DDE3EF（JSON borderColor #303A55 确非绘制边框，未再派"修边框色"）；G19 组距 19→17；G37 采集误取内层 `.el-select-dropdown.rt-font-popper`（222/258）→ 改选 `.el-popper.rt-*`（224/260）。

## 三、必要回归与门禁

- Web 四门禁全绿：typecheck 通过；eslint 0 问题；unit **1956 通过/3 跳过**（228 文件，含 PublishedSnapshotViewer 13 例）；build 通过（4.28s）。
- G07/G08 关闭锁定未重开（edit-dialogs.css 收口仅作用于 446 系列 `.sw-edit-dialog/.sw-edit-grid`，未新增全站规则；G23/G28/G39 未触碰——G28 属提示12 已锁定节点，不在本轮 15 节点内）。G09 事件/网关/连线常量未动。
- 弹窗规则仍按 Teleport 无 scoped 属性口径置于全局块（本页专用类名），未影响其他页面。

## 四、边界与如实保留

1. **G18 ±3 口径**：Provider 文字 x526（目标 525）、绑定按钮 x1322（1323）、右上关闭 x1362（1363）、关闭 y675（676），均为 ±1 亚像素；行中心 435（三行 438/522/606 目标为首行盒顶，实测行盒 66px 中心制）。
2. **G19 ±0.7**：sysRow1 y245.7（目标 246）、dataRow1 y396.7（396）——92×48 盒在 grid 步距 60 下的亚像素。
3. **G36 ±1**：面板内距 20 由 x1584 起算，DOM 报 1605/295（rounding）；对齐行 36 为三段 radio inner 高。
4. **G14 编号空态**：A11 快照 definition 无 numbering 字段，按提示"真实无此配置显示同布局空态，不造数据"处理；列配置/权限仍在字段清单与流程设置真实语义入口。
5. **G37 采集口径**：尺寸断言以 `.el-popper.rt-*` 外层可见框为准（含 1px 边框）；内层 dropdown 222/258 为内容盒，不作为验收对象。
6. G14 流程冻结图为只读 SVG 展示+点选，不依赖画布库；历史版本未保存/未发布。
7. 四外部密钥为本机 dev 一次性值（不入 Git 不回显）。

## 五、机器状态

- Web：分支 `codex/0.2.0-ui-tenant-form-flow`，基线 93e12d9 → 本轮 SHA（见终态行），12 文件改动；vite.config.ts 保持他人未提交改动未提交。Server fe2bba4d 未变。
- 证据文件：`u020-13-geometry.json`、`u020-13-*.png`、`tools/u020-13-capture.cjs`。
- knowledge/current-status.md 已同步本批（见同批提交）。
