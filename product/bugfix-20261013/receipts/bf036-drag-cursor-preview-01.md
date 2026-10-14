# BF20261013-036 执行回执：拖动端点光标固定（不再小手/箭头乱跳）+ 目标端预览不镜像

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 文字「拖动端点时鼠标乱变，在小手、箭头之间一直变，一动就变」。

## 原因

1. **光标乱跳（Owner 报告项）**：拖动中光标完全由「指针下方命中元素」的 `cursor` 决定，而拖动中的预览几何每帧重算，指针下方的元素随之在四类之间切换：
   - 指针恰在折线端点处 —— 命中路径 10px 描边与空白背景交替命中（描边边界抖动）；
   - 悬停节点时折线端跳到节点端口 —— 指针改落到节点盒（`cursor: move`，箭头）或空白（`default`，箭头）；
   - 端点圆（`grab`，小手）与命中路径（`pointer`，小手）。
   实测（修复前）：从 审批 左缘端点出发横穿节点盒拖动 31 步，指针下元素依次为 端点圆 → 命中路径 → 节点盒 → …，光标 `grab`/`pointer`/`move` 随帧切换。
2. **附带实测发现：目标端预览被镜像**（BF035 遗漏的镜像分支）：`edgePathOf` 悬停分支一律把命中节点传在 `previewEdgePath` 的 **source** 位。被拖端是 `source` 时正确；是 `target` 时角色互换 → 预览被画成「命中节点 → 固定端」，甚至绕出画布（实测出现 `M 340 180 L -4 180 L -4 300 L 20 300`），与松手后实际改接方向相反，直接违背 BF035「预览=落下」。

## 修复

1. **拖动会话光标固定**：新增 `edgeDragCursor(kind, axis)`（端点拖动=`grabbing`；内段拖动=按轴 `ew-resize`/`ns-resize`，保留方向语义）；设计器在拖动会话期间给画布加 `pg-svg-dragging` 类并写入 `--pg-drag-cursor` 变量，CSS 用 `.pg-svg-dragging * { cursor: var(--pg-drag-cursor) !important }` 覆盖整棵子树 —— 拖动中不再依赖命中检测，指针在端点圆/折线/节点盒/空白上都是同一光标。松手即移除类与变量，hover 态语义不变（路径=pointer、节点盒=move、端点圆=grab）。
2. **目标端预览不镜像**：悬停分支按被拖端决定入参顺序 —— `source` → `previewEdgePath(命中节点, 固定端, {source})`；`target` → `previewEdgePath(固定端, 命中节点, {target})`。
3. **指针捕获**：连线拖动按下时 `setPointerCapture`（try/catch 兼容合成事件，无活动指针时跳过）——指针滑出画布（如到右侧属性面板）仍能收到 pointermove/pointerup，拖动会话与固定光标不会悬空。

## 验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1505** 通过 3 跳过（新增 2 例：`edgeDragCursor` 取值 / target 端预览不镜像且 = 落下 path，含正交无重叠断言）、build ✓。
- 实景（应用内浏览器，本机 5173，1280×720，管理员会话，tab `iab-tab:d2402b32-…`）：
  - **光标固定**：拖动中 8 个采样点覆盖 端点圆 / 命中路径 / 节点盒 / 空白背景 四类元素，光标**全部为 `grabbing`、跳变 0 次**；另对 7 个空白点扫描，命中 `rect.pg-bg` 时同样 `grabbing`（旧口径此处为 `default` 箭头）；画布 `class="pg-svg pg-svg-dragging"`、`--pg-drag-cursor=grabbing`，松手后恢复 `class="pg-svg"`、变量为空。
  - **目标端预览=落下**：拖 target 端点悬停 审批 节点（落点最近边=right）时预览 `M 180 300 L 524 300 L 524 180 L 500 180`（起点=固定端 START 右缘端口，终点=命中节点右缘端口 + 24px 固定小段），松手后 path **逐字符相等**（`previewEqualsDrop: true`）；修复前同一动作的预览是镜像路径 `M 340 180 L -4 180 …`。
  - **真实鼠标**（cua.drag）：端点从 审批 右缘拖到 审批 底边，122ms 生效 → `M 180 300 L 300 300 L 300 229 L 420 229 L 420 205`（端口换底边、固定小段向下 24px、与预览同源），`.el-message`=0。
- **数据说明**：拖动均在草稿态完成，结束时经应用内「未保存离开确认 → 退出」丢弃并重进设计器；两条边回到已保存路径（`M 180 300 L 260 300 L 260 180 L 340 180` / `M 420 205 L 420 240 L 600 240 L 600 275`）、无脏标记；服务端 `graph_json` 未变（edge config 空、节点坐标原值）。

## 影响面

- `src/adapters/process-graph/index.ts`：新增 `edgeDragCursor`（纯函数，光标口径与 `edgeSegmentHandles.cursor` 一致）。
- `ProcessDesigner.vue`：`activeDragCursor` 计算属性 + 画布 `:class`/`:style` 绑定 + `.pg-svg-dragging` 覆盖规则；`edgePathOf` 悬停分支按被拖端决定入参顺序；`captureEdgeDragPointer`（端点/内段拖动按下时捕获指针）。
- 数据面：无新增契约字段、无服务端改动、无迁移。

## 提交

- Web：codex/bugfix-20261013（光标固定 + 目标端预览同源 + 指针捕获 + 2 例单测）。
- Server：本批无改动。
- 根仓：台账 BF20261013-036 行 + 本回执 + 证据（本地，`.gitignore` 忽略）+ Web gitlink。

## 状态

待 Owner 点验（与 BF001—035 同批）。
