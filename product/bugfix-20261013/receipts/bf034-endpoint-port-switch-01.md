# BF20261013-034 执行回执：端点改接异常修复 + 拖端点换端口侧

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 文字「现在拖动端口想换到节点其他端口就异常了」+ 截图（乱线：连线脱开两节点、折点错乱）。

## 异常定位

拖端点（V011-BUG-025 的改接能力）时：

1. **拖动预览**按「指针 → 固定端」重算路由，但沿用了 `edge.waypoints`（旧拐点基于旧几何）→ 画面上出现穿来穿去的乱线；BF033 把段数上限放宽到 12 之后，这条乱线不再被收敛压掉，因此现在才暴露出来。
2. 端点落下只支持「改接到另一个节点」，**没有换端口侧的通道**（同节点换侧被当作无变化），所以「换到节点其他端口」这个诉求本身也做不到。

## 修复

1. **不再沿用失效拐点**：`edgePathOf` 的端点拖拽预览不传 waypoints；`setEdgeEndpoint` 改接或换侧一律 `waypoints: []` 重排（旧拐点基于旧几何，保留只会画出乱线或穿节点）。
2. **换端口侧**：新增 `PortSide`（left/right/top/bottom）、`config.sourceSide` / `config.targetSide`、`edgePortSides`（自动侧）、`edgeEndpoints(sides)`，`resolveEdgeRoute` 按侧给出端口与端口腿轴向；`setEdgeEndpoint(id, which, nodeId, side?)` 同一入口支持「同节点换侧」与「跨节点改接」，同节点同侧返回 null（无变化），自环/重复边仍拒绝。
3. **指定侧的端口腿几何**：`sideOutward` + `directLegWithStubs`——端口旁固定小段 24px（与自动侧同一净空口径），连接段首/末段轴向各自满足（同轴三肘居中、异轴单肘），避免自动居中的肘点落到节点内部或沿边框走。
4. **设计器**：端点落下按落点最近的一条边算出端口侧（`nearestPortSide`）并传入。

## 验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1501** 通过 3 跳过（新增 3 例：同节点换侧固定小段垂直出入 / 同节点同侧无变化 + 跨节点改接丢弃旧拐点 / 终点换侧固定小段）、build ✓。
- 实景（应用内浏览器，本机 5173，1280×720，管理员会话）：
  - 拖动中预览为干净路由 `M 176 300 L 260 300 L 260 180 L 344 180`（无乱线）；
  - 终点换到 审批 下缘 → `M 180 300 L 300 300 L 300 229 L 420 229 L 420 205`（起点水平出线、终点固定小段垂直入线）；
  - 起点再换到 START 上缘 → `M 100 275 L 100 251 L 260 251 L 260 229 L 420 229 L 420 205`（两端均为指定侧，5 段全轴对齐、无重叠）；
  - 全程 `.el-message`=0。
- **数据说明**：全部拖动为草稿态，结束时经应用内「未保存离开确认 → 退出」丢弃并重进设计器；两条边回到已保存路径、无脏标记，服务端 `graph_json` 未变（waypoints 空、无 side 键、节点坐标原值）。

## 影响面

- `src/adapters/process-graph/index.ts`：`PortSide` / `sideAxis` / `sideOutward` / `edgePortSides` / `edgeEndpoints(sides)` / `directLegWithStubs` / `EdgeRouteHint.sourceStubOutward|targetStubOutward`；`resolveEdgeRoute` 读 `config.sourceSide|targetSide`；`setEdgeEndpoint` 增加 side 参数并在改接/换侧时丢弃拐点。
- `ProcessDesigner.vue`：端点预览不传 waypoints、`nearestPortSide` 按落点定侧。
- 数据面：新增可选 `config.sourceSide/targetSide`（缺省=按几何自动，旧图零影响）；无服务端改动、无迁移。

## 提交

- Web：codex/bugfix-20261013（预览/改接丢弃失效拐点 + 端口侧 + 指定侧端口腿几何 + 用例）。
- Server：本批无改动。
- 根仓：台账 BF20261013-034 行 + 本回执 + 证据（本地）+ Web gitlink。

## 状态

待 Owner 点验（与 BF001—033 同批）。
