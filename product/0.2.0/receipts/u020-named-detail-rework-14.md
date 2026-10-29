# 0.2.0 执行提示14回执：六节点剩余局部整改

2026-10-29｜Executor｜EXECUTION_SUBMITTED。对应[执行提示14](planning-execution-prompt-unified-020-14.md)（revision15，9 项关闭锁定不重做）。本轮仅修 6 个 REWORK 节点的剩余局部并可见会话实测。未重跑保存/发布/隔离/认证链、未造示例数据、未核销 P、未晋级基线、未整版 PASSED。Server 未触碰；vite.config.ts 他人未提交改动保持不动。

## 一、身份与证据

- 会话/视口：t100admin@i5-tenant-100（G14/G17/G37/G18）、admin@tenant-0（G26）；1920×1080/DPR1，Chromium **可见交互会话（headless:false）**，DOM `getBoundingClientRect` + Range 墨迹 + computed style 实测。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-geometry.json`（5 组 verdict 覆盖 6 节点）与 `u020-14-*.png`；网络索引 `u020-14-network.json`（真实联调流量）；采集脚本 `tools/u020-14-capture.cjs`（末轮全量复跑）。13 回执的 `u020-13-geometry.json`/19 图与 design-blue 原图沿用，未重复采集已过条件。

## 二、6节点逐项实测（末轮）

| 节点 | 本轮改动 | 实测 | 结论 |
| --- | --- | --- | --- |
| G14①冻结图 | 缺坐标冻结节点仅在查看层按真实拓扑确定性分离（有坐标原样保留，不写回版本/不编连线）：入边松弛分层 x=140+层×300、层内行 y=80+行×90；SVG 宽高属性=视盒尺寸+2px 边框补偿（修 1px 边框致 122/124 主导整体缩至 0.984），初始 1:1 不放大 | **scale 1.002（client/视盒，边框口径）**；三框 **128×44/230×44/128×44**（事件含边框、普通 230×44）；中心 (350,377)/(650,377)/(950,377) 互不遮挡；逐节点点选回显 node_start/主管审批/node_end | 通过 |
| G14②右栏控件表面 | 表单右栏由 dl 平铺文字改为只读控件表面：前五框（字段名/宽度/标题位置/占位提示/必填）真实 readonly 输入框，标签 14/22 mb6、组距 16（步距 76）、边框 #DDE3EF；数据规则（字段标识/类型/最大长度/校验规则/值变更脚本/显示条件）按真实配置可读承接，校验/脚本/显隐保留「查看」只读详情，脚本存在时展示真实脚本预览 | **五框 (1604,188/264/340/416/492) 296×32**（DOM 295 亚像素）、边框 rgb(221,227,239)、标签 14px/22px；rules 区真实值：字段标识 items、类型 TABLE、校验规则条数/查看 | 通过 |
| G14③中央画布 | 移除「表单设计」小节标题与灰色大卡片（`.snapshot-design` 白底/无边框/零内距）；FormPreview title 空串不写示例标题；字段沿冻结配置，未补造类型 | h3s=[]；designBg rgb(255,255,255)、border 0px、padding 0 | 通过 |
| G17 | 表头/正文单元格强制左对齐（th/td `.cell` text-align:left），首列 cell padding-left 18（墨迹与原图约 443 对齐）；添加字段按钮去 Plus 图标、宽 80（padding 0 8px） | th/td 四列 textAlign 全 **left**；首列墨迹 x443；添加按钮 **80×32@x1415**（右缘 1495）、文本「添加字段」、无 svg 图标；取消/确定未动 | 通过 |
| G18 | body 顶内距 4→23px：三 Provider 行内容组下移 19px（名称/状态/按钮同组；弹窗/标题/页脚未动） | 绑定按钮顶 **438/522/606**、72×32；名称中心=按钮中心（454/538/622 同一视觉中线）；84 步距保持 | 通过 |
| G26 | 树工具两按钮改绑既有词典键 `system.expandAllNodes/collapseAllNodes`（模板此前引用不存在的 `system.expandAll/collapseAll` 致裸键越界）；按钮 14/22 蓝色 | 文本 **「展开全部」「收起全部」**、88×32 框内完整、14px/22px、rgb(37,99,235)；展开/收起绑定动作未改，树数据/勾选未动 | 通过 |
| G37字体 | 浮层内部：外框内顶距 4px（1px 边+3px 内距）、列表 6×36=216 一次完整显示（scroll wrap overflow hidden，无内滚条/上下箭头）、item 左内距 13（文字左距外框 14）、常规字重 400 | popper **208×224**、firstTopGap **4**、inkLeft **14**、scrollable=false、barVisible=false、lastInside=true、fontWeight 400、选中 #EFF6FF/蓝字保持 | 通过 |
| G37字号 | 同上（7×36=252，无内滚） | popper **120×260**、firstTopGap **4**、inkLeft **14**、scrollable=false、barVisible=false、lastInside=true、7 项 12—28px 全展示 | 通过 |

首轮偏差与修复（末轮佐证）：G14 SVG 1px 边框挤占内容盒（806/808×122/124，高度比 0.984 主导）→ 宽高属性 +2 补偿；G14 右栏 flex gap 误计 label↔input 间距（步距 92）→ 改组结构（组内 mb6/组间 16）落位 76 步距；G17 添加按钮默认内距 88 宽 → 80+8px 内距；G26 键名不匹配裸显英文键 → 改绑既有键；G37 文字左 15 → 13px 内距落 14。

## 三、必要回归与门禁

- Web 四门禁全绿：typecheck 通过；eslint 0 问题；unit **1956 通过/3 跳过**（228 文件）；build 通过（4.24s）。
- 受影响 spec 更新：PublishedSnapshotViewer「表单设计右属性外壳」由 props-target/dl 断言改为控件表面断言（5 只读框值切换 + 无保存/发布/恢复入口，13/13 过）。
- 已过锁定未触碰：G19/G24/G25/G27/G29/G30/G31/G36/G37颜色零改动；G14 字段清单 7 列/查看属性 11 键/编号空态/通知监听/全屏 56 头 40 页签/252/220/336 分栏保持；G17 外框/列宽/表头行高/页脚保持（仅列内锚点与添加按钮）；G18 水平/外框/标题/页脚/关闭保持；G26 布局/权限/勾选保持；G37 外框/选中色/行高/值域保持。G23/G28/G39/G40 未触碰。

## 四、边界与如实保留

1. **G14 布局派生**：A11 该版本节点无冻结坐标，分离布局仅存在于查看层（每次按同拓扑确定性生成），未写回版本；无真实坐标的连线按节点中心直连（原 JSON 无 waypoints，未编造拐点）。
2. **G14 scale 1.002**：SVG client 含 1px 边框（宽高属性已 +2 补偿内容盒），client/视盒比 1.002 为边框口径；三节点框 128×44/230×44 精确。
3. **G17 墨迹口径**：组件/必填列墨迹 x997/1257 vs 原识别值 990/1250——原图列内左锚，规划明确墨迹仅作识别、不作为 DOM 基线；对齐判定以 left 计算值为准。
4. **G18 下移载体**：以 body 顶内距 19px 增量实现组下移（弹窗 390 高、页脚/关闭坐标不变）。
5. **G26 不扩全站**：仅修本页两按钮键名与样式，未动语言配置治理。
6. 四外部密钥为本机 dev 一次性值（不入 Git 不回显）。

## 五、机器状态

- Web：分支 `codex/0.2.0-ui-tenant-form-flow`，基线 477d1bd → 本轮 SHA（见终态行，已推送回读）；vite.config.ts 保持他人未提交改动未提交。Server fe2bba4d 未变。
- 证据文件：`u020-14-geometry.json`、`u020-14-network.json`、6 张 `u020-14-*.png`、`tools/u020-14-capture.cjs`。
- knowledge/current-status.md 已同步本批（见同批提交）。
