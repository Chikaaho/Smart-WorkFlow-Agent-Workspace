# fe020-02 流程设计器多分支会签选中态

2026-10-24｜Executor（前端）｜XL｜IN_PROGRESS｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本批补齐流程设计器当前三节点、空选中状态无法覆盖的设计验收夹具，并验证会签节点的真实属性面板。仅修改 mock 验证数据与 E2E 用例，未改产品业务逻辑；不表示真实后端对象已完成同态视觉验收。

## 交付事实

- Figma `42:4` 参考为 13 节点多分支且选中“科技负责人会签”，右栏显示审批人、审批意见表单、节点脚本、比例结算等配置；既有运行图只有开始、审批、结束且未选中。
- `design-fixtures.ts` 的 `node09` 夹具已把居中会签节点设为真实 `CONSENSUS`，位置保持 x416/y327；补充指定人员、意见表单、75% 比例、允许操作和开始前脚本触发器。右侧分支、条件回流和汇聚边保留。
- 新增 `e2e/visual/process-designer-consensus.spec.ts`，在 1920×1080 加载 13 节点夹具、选择科技负责人会签、断言属性栏和脚本状态并保存截图。

## 可见结果

可见 IAB（`headless=false`）、1920×1080/DPR1：

- 画布 13 个节点标签，节点库 220×928、画布 `[236,168,1332,896]`、属性栏 `[1584,152,336,928]`，文档宽 1920，无横向溢出。
- 选中态右栏：“会签节点”、指定人员“已选 2 人”、意见表单已绑定、节点开始前“编辑脚本/已配置”、节点结束“编写脚本/未配置”、结算方式“比例”、通过比例 `75`、允许操作 8 项、监听器配置可见。
- 默认蓝选中态：边框 `rgb(37,99,235)`、浅底 `color(srgb 0.880314 0.914353 0.98902)`；切紫后边框 `rgb(111,45,255)`、浅底 `rgb(233,225,255)`。
- 会签节点库图标在蓝/紫下均为固定棕 `rgb(148,95,0)`。

证据：`C:/Users/hjxch/.codex/evidence-020/theme-blue/screens/process-designer-consensus-selected-blue-final-1920.png`、`process-designer-consensus-selected-purple-1920.png`、`process-designer-consensus-blue-final.json`、`process-designer-consensus-purple.json`、`process-designer-consensus-selected.json`；Figma 原图 `screens/design-process-designer-42-4-purple.png`。

## 工程验证

- `pnpm exec playwright test e2e/visual/process-designer-consensus.spec.ts --project=chrome-1920 --headed`（配置本身为 `headless:false`）：1/1 通过，exit 0。
- 首次用例直接点击 SVG `<tspan>` 被节点矩形拦截；改为点击 `.designer-node` 分组后通过，属于测试定位修正，不改实现。
- 原 `pnpm test` 四连已在本批之前的主题提交 `d6ee85d` 全绿；本批只改 mock 夹具和视觉用例，使用上述 E2E 作为适用门。完整四连待同批 F020/J020 合并后统一复跑。
- 完整日志 `C:/Users/hjxch/.codex/evidence-020/theme-blue/web-e2e-process-consensus.log`。

## 验收边界

- 本批消除了“三节点/空选中不能证明多分支会签属性”的证据缺口；会签节点、画布拓扑、审批人来源、比例条件、脚本和监听状态均进入可见结果。
- 证据来自 mock fixture，层级为 `ISOLATED_REGRESSION`；真实后端需使用同态流程对象重走，才能作为 A03/A04 正式通过证据。
- Figma 整页/内容像素差、蓝/青/自定义完整画框、动态并行专属配置、审批人选择弹层、流程变量/触发器/高级配置及起草/IoT/Agent 产品裁定仍未完成。
- 21 设置导航、23 设计器几何和 24 宽桌面导航继续承接已锁定行为；本批改变选中节点与右栏内容，不改变主容器几何。

## Git

- Web 提交 `8c51283137ef0f312c8cbc0d0beec405d3866b04`，信息 `test(workflow): 覆盖会签多分支选中态`。
- 推送后 `HEAD` 与 `origin/codex/0.2.0-ui-tenant-form-flow` 同 SHA，0/0。
- `vite.config.ts` 在途修改保持原归属。

自验结论：多分支会签选中态与属性覆盖已完成；真实后端和整页视觉仍为 `IN_PROGRESS`，待规划验收。
