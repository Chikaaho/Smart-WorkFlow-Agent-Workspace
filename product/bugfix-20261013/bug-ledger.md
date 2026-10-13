# 持续修复问题台账

2026-10-13｜当前开放收集；发布集合尚未冻结。

原始反馈可直接用自然语言、截图或复现过程提交，由 Planner 整理；功能缺失、行为不符与体验优化均接收。新 ID 从 BF20261013-001 开始。现有问题 0 项，这只表示尚未收到具体反馈，不代表任务完成。

| ID | Owner 原始反馈/日期 | 实际与预期 | 影响/优先级 | 验收标准 | 状态 | 执行证据/规划结论 |
|---|---|---|---|---|---|---|
| BF20261013-001 | 2026-10-13：放置约10分钟回来被自动登出回登录页；双 token 未用上，预期过期应无感刷新 | 实际：access 900s 空闲到期后 401 直接跳登录（前端 401 拦截器无刷新重试，预刷新失败亦被吞）；Server 端双 token（rt cookie HttpOnly+轮换）实测健康。预期：access 过期经 rt 无感续期，不掉登录页 | 中（会话体验）；不涉及数据与权限边界 | 空闲跨过 access 过期窗口后返回页面，请求经 rt 无感续期成功，不出现登录页；auth 端点 401 不受影响 | 待验收 | Web `1f90fa3`（已推送回读一致）：401 拦截器单飞 refresh+原请求重放（打标防循环），src/foundation/request/index.ts；四门 typecheck exit0/lint 0e3w/vitest 1393+3/build ✓（+4 用例）。**可见浏览器验证（60s 临时过期实测，验证后已恢复 900s）**：登录工作台→跨 60s 过期窗口点「流程中心」保持登录态不回登录页；F5 冷启动 guard 静默续登恢复 /workflow/catalog 与「系统管理员」徽标。服务端链路 node 实测 login→rt cookie→refresh 轮换 200（脚本 /tmp/bugfix-20261013/auth-flow-test.mjs）。Server 无代码改动（900/604800 配置合理） |
| BF20261013-002 | 2026-10-13 截图：设计器画布 select/人员/部门控件提示文字左侧被裁（" elec"/"员选择"/"门选择"） | 实际：DesignerCanvas 对齐 hack 对 el-select__wrapper/el-input__inner 用 text-indent:-12px+padding:0，placeholder 左移出裁切区。预期：提示完整可见 | 低（视觉）；不改数据 | design 态各类型控件 placeholder 完整不裁切 | 待验收 | 修复=移除负缩进 hack（DesignerCanvas.vue，控件恢复 Element Plus 默认内边距、贴缘由壳负 margin 承担）；点验：画布内 2 个 select placeholder 与全部 input placeholder DOM 测量零溢出裁切 |
| BF20261013-003 | 2026-10-13：拖出来的组件默认全用 12 格（半行），不要预设宽度 | 实际：24 栏制新拖字段默认 colSpan=12。预期：新拖组件默认占满整行（24），作者可再调窄 | 中（布局体验）；不改存量表单 | 新拖入字段 colSpan=24；存量已保存定义不受影响 | 待验收 | 修复=field-types.ts baseField 默认改 FORM_GRID_COLUMNS（normalize 历史 fallback 不动，已保存表单零影响）；palette 提示文案同步（zh/en）；点验：点击/拖入新字段 data-col-span=24，存量 10 字段渲染不变 |
| BF20261013-004 | 2026-10-13：拖出组件时目标位置左边已有组件，无法放到空白处 | 复现结论：合成 DnD 实测行尾右侧空白与画布底部空白落点解析均正常（预览渲染于实际插入位置）；「放不进空白处」体感=行满时（12+12=24）预览跳到下一行行首与指针分离，属 24 栏流式布局确定性行为——满行右侧无空位可插入 | 中（核心交互） | 行内右侧空白可正常落点插入 | 待验收 | BF003 默认整行后新拖预览=整行、落点位置清晰；并排放置工作流=拖入后属性面板调窄再拖第二项自动并排（属性面板宽度调节既有）；如需「行内自由空位插入」属新布局能力，请 Owner 裁决是否立项 |
| BF20261013-005 | 2026-10-13：组件多到一页满后无法新增，要自动往下扩并可上下滑动 | 实际：白板卡为滚动容器但拖拽无边缘自动滚动，字段满一屏后指针到不了下方区域落点 | 中（核心交互） | 字段超一屏后拖拽近边缘自动滚动、可在任意深度位置插入 | 待验收 | 修复=DesignerCanvas dragover 检测最近 overflow 滚动容器，指针近上下边缘 56px 自动 scrollBy（24px/次）；点验：合成拖拽停底缘 scrollTop 130→332（+202），画布高度随内容自动扩展（grid 流式） |
| BF20261013-006 | 2026-10-13 补充：要可以点击组件默认加到最后，现在点击没效果 | 实测：点击添加链路本身有效（10→11，新项进 items 末尾）；「没效果」真因=字段满一屏时新项落在视口外无视觉反馈 | 中（核心交互） | 点击组件库项后画布自动滚动到新组件；新组件默认整行 | 待验收 | 修复=FormDesigner addPaletteItem/addDroppedItem 后 nextTick 将选中壳 scrollIntoView（nearest+smooth）；点验：点击「下拉选择」scrollTop 0→211、新 DICT 字段整行滚入可视区（验证后已删除恢复原状） |

条目状态使用：待澄清、待执行、执行中、待验收、已通过、Owner 延期。执行自验只进入待验收；新反证或相关变更可重开受影响项。延期须保留 Owner 决定及未验证范围。每批验收锁定已过项与证据引用。

## 运行与修复循环（Owner 2026-10-13 指令）

- **点验环境**：本机运行一套 Server（8080，local profile=远程 PG `sw_apaas_local`，凭据经环境变量注入不落盘）+ Web（5173，vite 代理 8080）；启动前已核实无其他实例（8080/5173 零监听，无需 kill）。日志 `/tmp/bugfix-20261013/`（server.log / web.log / build.log）。
- **修复循环**：Owner 反馈问题 → 本台账登记编号（BF20261013-NNN）→ Executor 在两仓 `codex/bugfix-20261013` 修复 → 修复完成即重启 Server（`mvn -pl sw-bootstrap -am package -DskipTests` 后 `java -jar`，Web vite 热更一般无需重启）→ 台账记实际结果与编号对应批次 → 该修复批次提交推送两仓 `codex/bugfix-20261013`，供 Owner 上位点验。
- 编号与批次一一对应记录于上表"执行证据"列与各仓提交信息；发布集合冻结前所有修复累积在修复分支。

当前执行收尾入口：receipts/planning-review-branch-init-01.md R-GIT-01（回执 branch-init-close-01.md，2026-10-13 完成）；整体方向：ready/direction.md；开发声明：ready/development-declaration.md。
