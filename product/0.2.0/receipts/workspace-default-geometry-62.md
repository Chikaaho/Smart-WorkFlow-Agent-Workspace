# 0.2.0 工作台 3:2 默认几何对齐参考（批次62，任务03继续）

2026-10-27｜Executor｜承接批次61；消费 design-blue-20261026 core/3-2.png（01 工作台）

## 范围与实现

批次61 首采 72.79% 的差异定位（排除数据区后暴露）：**运行页骨架几何与参考错位**——统计卡与面板间 ~200px 空隙、待办卡 y331 vs 参考 262。根因两条：

1. **dev 库保存的旧自定义布局**（stats h168/todo y184——r2 时代 Studio 默认值），经 UI「重置布局→保存」真实链恢复默认。
2. **Studio defaultCards() 硬编码 r2 旧值**（stats 168/todo 360/favorites 300），与 WorkspaceBoard.DEFAULT_CARD_GEOMETRY（参考 3:2：stats 96/todo(0,120,0.632,486)/favorites(0.644,120,0.356,208)/efficiency(0.644,344,0.356,262)/activity(0,621,1,260)）不一致；且 12 列行式排布模型（packCards 顺序装箱）**无法表达参考的右栏纵向堆叠**（快捷 208+效能 262 与待办 486 同行）。

修复（`codex/0.2.0-ui-tenant-form-flow` `5129954..本批`）：
- `workspace-studio.ts`：新增 `DESIGN_PRESET_GEOMETRY`（与 Board.DEFAULT_CARD_GEOMETRY 同源数值）与 `StudioCard.presetGeometry`；`pixelRects` 在**全部卡片携带预设**（重置后未拖动态）时直接采用预设绝对几何，否则回退 12 列流式排布。
- `WorkspaceStudio.vue`：`defaultCards()` 附预设几何（高度同步 96/486/208/262/260）；卡片拖动（onCardDrop）与缩放（onResizeMove）后清除 preset，用户手动调整即回退行模型，不覆盖用户布局。
- 修复过程中发现并修正 preset 分支返回值包裹错误（`{positions,height}`→`positions`，临时 spec 断言抓出后即改，临时文件不入库）。

## 验证

- **聚焦**：workspace-studio.spec 5/5 过；preset 分支临时断言 1/1。
- **真实链**：IAB UI「重置布局→确认→保存」（工作台配置已保存）→ 重采：**72.79% → 95.78%**（排除数据区后区外差异 87,434 像素）；DOM 量测五卡 y/h 与参考对齐（stats y144/todo y264 h486/favorites y264 h208/activity y782/efficiency 右栏堆叠）。
- **排除口径迭代**（如实）：整卡排除 59.9% 违反「禁遮整块卡片」→ 收紧至行级（.wsd-taskrows/.wsd-actrows/空态提示/数字 span）93.54%（排除 39.04%）——行级口径下因真实数据条数（待办 4 行 vs 示例 6 行）引发的后续区域位移落在区外，属数据形态差异的连锁，同门户结构性登记。
- **Web 四连**：typecheck 0、lint 0（首轮 `_dropped` 未用变量 error 即改即复跑）、226 文件通过/1 跳过、build 4.25s，exit 0（`/tmp/web-fourgate-62.log`）。Server 零改动。
- 证据：`real-joint/a03-{runtime,diff,report}-3-2.*`（最新轮）。
- **环境收尾**：验后双服务净停，PG/Redis 保持。

## 边界与剩余

- 工作台 3:2 剩余=数据内容差异（行内容/计数/效能值，排除登记）+ 行级排除口径的面积占比仍超 1%（结构性，与门户同批交 Planner 裁决）。
- 流程中心 97:2 新版式承接未开始（52.29% 基线在案）。
- 计数 49、46/22/22=90、ADV64/问题57、P 核销空保持。

总 7 阶段 1/1/5。常规决定：preset 仅重置态生效、用户交互即清除；不触碰 layout_json 存储结构。未发其他会话消息。
