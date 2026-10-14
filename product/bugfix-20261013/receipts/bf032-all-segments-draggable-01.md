# BF20261013-032 执行回执：每一段都可拖（端口沿节点边框滑动）

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 文字（Z 字只能拖一个方向 / 另一种只能上下）+ WPS 参考截图 4 张。

## 问题定位

BF031 之后每段有了方向光标，但**只有中间内段有手柄**——贴节点的两段（端口腿）没有手柄也拖不动：

- H-V-H 的 Z（如 START→审批）：只能拖竖段（左右），两条横段（应可上下拖）不动；
- V-H-V（如 审批→END）：只能拖横段（上下），两条竖段（应可左右拖）不动。

Owner 的 WPS 参考正好展示了目标形态：**每条段中点都有手柄**（另有两端落点小方块）。

## 修复

1. **段手柄覆盖每一段**：`edgeSegmentHandles` 由「只暴露内段」改为「每段都给手柄」，并新增 `port: 'source' | 'target' | null` 标记贴节点的两段（整条直线仍是 BF031 的合成中点手柄）。
2. **端口沿节点边框滑动**：新增 `EDGE_PORT_MARGIN=16` 与纯函数 `edgePortSlideSpan` / `portSlideCoordinate` / `portSlideOffset`；`portPoint(..., offset)` 按滑动量落点（边框两端留 16px 净空，避免贴角出线）；`resolveEdgeRoute` / `edgeEndpoints` 读取 `config.sourceOffset` / `config.targetOffset`（0..1 归一，随节点移动保持相对位置）。
3. **模型操作**：`setEdgePortOffset(id, which, offset)` 写入 config（并清除该侧的显式锚点，锚点优先语义不变），随后经统一入口 `rebuildEdge` 重建路径；偏移随 edge config 序列化落图，`normalizeGraph` 重载后按滑动端口渲染。
4. **设计器拖动会话**：`edgeEdit.port` 标记端口腿拖动；`portSlideSide`（由端口相对节点中心的方位定边框：垂直腿取上下缘、水平腿取左右缘）→ 按指针坐标换算滑动量实时落模型；手柄与悬停光标沿用轴向口径（垂直段 `ew-resize`、水平段 `ns-resize`）。

## 验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1495** 通过 3 跳过（新增 2 例：滑动映射与越界夹取 / 拖端口腿后路由重建 + 序列化回读；另改写 2 例段手柄断言为「每段都有」）、build ✓。
- 实景（应用内浏览器，本机 5173，1280×720，管理员会话）：
  - START→审批（H-V-H）选中出 3 个手柄 `220,300:ns-resize`（横段）/ `260,240:ew-resize`（竖段）/ `300,180:ns-resize`（横段）；拖起点横段下移到 y=309 → `M 180 309 L 260 309 L 260 180 L 340 180`；拖终点横段上移到 y=171 → `M 180 309 L 260 309 L 260 171 L 340 171`。
  - 审批→END（V-H-V）选中出 3 个手柄 `420,222.5:ew-resize` / `510,240:ns-resize` / `600,257.5:ew-resize`；拖起点竖段左移到 x=380、拖终点竖段右移到 x=620 → `M 380 205 L 380 240 L 620 240 L 620 275`。
  - 每步 3 段、全轴对齐、无重叠、`.el-message`=0。
- **数据说明**：全部拖动为草稿态，结束时经应用内「未保存离开确认 → 退出」丢弃并重进设计器；两条边回到已保存路径、无脏标记，服务端 `graph_json` 未变（waypoints 空、无 offset 键、节点坐标原值）。

## 影响面

- `src/adapters/process-graph/index.ts`：`EdgeSegmentHandle.port`、`EDGE_PORT_MARGIN`、`edgePortSlideSpan`/`portSlideCoordinate`/`portSlideOffset`、`portPoint(..., offset)`、`edgeEndpoints(..., offsets)`、`resolveEdgeRoute` 读 config 偏移、`DesignerModel.setEdgePortOffset`、`edgeSegmentHandles` 覆盖每段。
- `ProcessDesigner.vue`：`edgeEdit.port` + `portSlideSide` + 端口腿拖动分支（按指针换算滑动量）。
- 数据面：新增 `config.sourceOffset` / `config.targetOffset`（可选，缺省=边框中点，旧图零影响）；无服务端改动、无迁移。

## 待 Owner 确认（一处口径）

- 贴节点的段拖动 = **端口落点沿边框滑动**（本次实现，WPS/Visio 同类行为）。
- 如果 Owner 想要的是「拖到哪儿都能走、折数不够就自动加折」（WPS 截图 3/4 里出现更多折的形态），请告知，我再把路由从「夹取保形」改为「按需加折」。

## 提交

- Web：codex/bugfix-20261013（适配器端口滑动几何与每段手柄 + 设计器端口腿拖动 + 适配器用例）。
- Server：本批无改动。
- 根仓：台账 BF20261013-032 行 + 本回执 + 证据（本地）+ Web gitlink。

## 状态

待 Owner 点验（与 BF001—031 同批）。
