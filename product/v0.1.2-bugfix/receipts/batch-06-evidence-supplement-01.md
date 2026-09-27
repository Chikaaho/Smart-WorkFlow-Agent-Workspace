# 批次 6 修正回执（证据补充 01）— 复核缺口 G1/G2/G3 与批次 5 指针

- 日期：2026-09-27；承接 `planning-review-batch-06-20260927.md`（结论 VERIFYING）剩余差异 G1–G3 与回执指针差异。
- 结论：**G1–G3 与指针差异已逐项处理完毕，执行自验通过，待规划证据复核与 Owner 单项验收。**
- 提交：Web `0.1.2-bugfix@fe9f6be`（G1 修复 + More 回归 spec，推送回读一致）；Server 无新代码改动（`6a43d04` 不变，G2 复用既有行为测试聚焦重跑）。
- 证据目录：`receipts/evidence/batch-06-supplement-01/`（本回执所有制品相对此目录）。

## G1 操作列截断与发布状态列（已修复 + 行为验证）

**根因（实测）**：sticky 固定列本身生效（`td.el-table-fixed-column--right` position:sticky right:0，钉住于滚动容器右缘）；截断真因是 `FormDefList` 给操作列传 `width=190`，而 3 个直显按钮（Edit / Initiation scope / Disable，英文 locale）内容宽约 208px，`.list-actions` 为 `nowrap` flex，超出部分被单元格裁掉——「Disable」只显示「D…」，视觉上呈"红色按钮文字截断"。1366×768 下发布状态列位于内容区 940px 中被钉住的操作列覆盖，需横向滚动查看（el-table 固定列的标准局部滚动机制）。

**修复**：`FormDefList.vue` 操作列 `width: 190 → 240`（注释说明英文 locale 不裁尾）；组件 `ListActionsColumn` 本体不改（标准实现正确）。

**行为验证（headed，headless=false，admin，English locale）**：

| 项 | 证据 |
| --- | --- |
| 1440×900 三按钮完整 | DOM 实测 Disable 右缘 1381 < 单元格右缘 1408；截图 `form-def-list-1440x900-actions-full.png` |
| 1366×768 三按钮完整 | DOM 实测三按钮右缘均 ≤ 1334（cellRight）；截图 `form-def-list-1366x768-actions-full.png` |
| 四格对齐 | 直显 Edit/Initiation scope/Disable 三格横排 + 末位固定更多位（本页仅 3 动作无更多触发项），flex 对齐不变 |
| 局部横向滚动可达性 | `el-scrollbar__wrap` scrollWidth 990 / clientWidth 830；`scrollLeft=160` 滚到最右后 Publish status 表头完整可见（实测区间 984–1094）、操作列仍钉住；截图 `form-def-list-1366-scrolled-right-status-visible.png` |
| 更多菜单（四格末位标准） | 真实交互：NotifyTemplateList 新建演示模板 → 行内恰好 Preview/Edit/Disable 三直显 + 第 4 位「More」→ 点 More 下拉展开含 Delete（截图 `notify-template-more-dropdown-open.png`）→ 点 Delete 确认删除成功、行消失（More 命令链路端到端验证；演示数据已清场，净零状态变化） |
| 常驻回归 | `page-layout.spec.ts` 新增 ListActionsColumn 3 例（>3 动作→3 直显+更多+收拢项断言；≤3 全直显无更多；visible=false 不占名额），聚焦实跑 38/38 通过 |

## G2 权限/租户行为证据与接口↔页面对象关联（已补）

| 项 | 证据 |
| --- | --- |
| 允许路径（真实请求） | 浏览器会话内 XHR 捕获（axios 默认 XHR 适配器，Search 触发重查）：`GET /api/form/def/page?pageNum=1&pageSize=10` → HTTP 200，`records[0].createByName="系统管理员"`；制品 `api/form-def-page-xhr-capture.json`（含完整响应体） |
| 创建人返回值↔页面对象关联 | 同会话 DOM 实测行单元格 Created by = 「系统管理员」，与响应字段同值；headers/rowCells 已记录于同一 JSON 制品 `domAssociation` |
| 拒绝路径（既有行为测试） | `FormDefinitionControllerAuthorizationTest`（7 例）聚焦重跑通过：S1 用例含 `form:design` 有权限 `/form/def/page` 过网关、无权限 403，另有未认证 401；原始输出 `logs/server-focused-g2-tests.log` |
| 租户边界（既有行为测试） | `TenantOwnershipBehaviorTest`（2 例，I5 行为证据）：租户 0 与 100 同 formKey 双方零串读、`create_by` 归属操作者真实租户——`sw_form_def` 行级隔离；创建人展示名 `UserQueryFacadeImpl.getUserDisplayNames` 走 `sysUserMapper.selectList`（MyBatis-Plus 租户拦截器），system 门面集成测试（`OrgAuthorityFacadeIntegrationTest` 4 例，覆盖展示名/候选查询经租户拦截器取当前租户）在全仓套件内通过 |
| 全量套件快照适用性 | 批次 6 全仓 `mvn -B -o test` 于 02:05–02:25 实跑通过（1574/0/0/0），运行时工作树与提交 `6a43d04` 内容一致（测试后无代码改动即提交）；原始汇总行提取（未改写）`logs/server-full-suite-summary-extract.log` |

## G3 原始输出与提交身份（已补）

- 既有原始输出：批次 6 当时的原始日志均在宿主 /tmp 保留，已按"提取行未改写 + 来源/适用性声明"归档——`logs/server-full-suite-summary-extract.log`（14 模块汇总行求和 = 1574/0/0/0、BUILD SUCCESS、Total time 20:18；form-biz 三测试类与 system 门面集成测试原始行）。
- 补充实跑原始输出（本修正批）：`logs/server-focused-g2-tests.log`（26/0/0/0）；`logs/web-typecheck.log` / `web-lint.log`（0 error）/ `web-vitest.log`（1298 passed + 3 skipped）/ `web-build.log`（exit 0）——修正后前端四连全绿。
- 提交身份与远端回读：`git-readback.txt`（Server `6a43d04` = origin/0.1.2-bugfix 回读一致；Web `fe9f6be` = origin 回读一致；计数核对记录）。
- 澄清：批次 6 回执的"1573→1574"与"1295+3"计数均来自实际输出（/tmp 原始日志），非推算；本目录制品为其可回读指针。

## 批次 5 指针差异（已修正）

`requirements-handover-20260927.md` §批次 5 索引原引用"批次 5 回执"，但 receipts 下无独立 batch-05 文件。已修正为精确指针：批次 5 要点记录于 `bug-ledger.md` 轮 6 与该清单本身（治理提交 `65d8ab1`），Web 批次提交 `89bebbd`。未新建 batch-05 文档、不重复实现。

## 与复核完成条件逐项对照

| 缺口 | 完成条件 | 结果 |
| --- | --- | --- |
| G1 | 核实溢出/遮挡原因 | ✅ 实测根因=操作列宽 190 不足以容纳三直显按钮被单元格裁尾；sticky 正常；发布状态列被钉住列覆盖属固定列标准滚动机制 |
| G1 | 修复操作可达性 | ✅ width 190→240；双视口 DOM+截图证明三按钮完整；既有通过项未回退（创建人列、无底色 link 均在） |
| G1 | 验证四格与更多菜单 | ✅ 四格对齐双视口截图；More 菜单真实交互（新建→展开→Delete 命令→删除成功→净零清场）+ 组件 3 例常驻回归 |
| G1 | 两视口完整可见截图；若局部滚动须证明滚动可达 | ✅ 三张截图 + scrollLeft=160 实测状态列完整可见、操作列保持钉住 |
| G2 | 真实请求/既有行为测试覆盖允许、拒绝、租户边界、接口↔页面对象关联 | ✅ XHR 真实捕获（200+createByName）+ 鉴权测试（放行/403/401）+ 租户行为测试（行级隔离+门面租户拦截器）+ DOM 行同值关联；均标注层级与快照适用性 |
| G3 | 可回读原始输出/指针，核对计数与提交身份 | ✅ /tmp 原始日志提取归档（未改写+来源声明）+ 补充实跑日志 + git-readback 制品；计数复核：Server 1574/0/0/0（批次 6 时点）、Web 修正后 1298+3 |
| 指针 | 补精确位置或修正指针 | ✅ requirements-handover 已指向台账轮 6 + 治理提交 65d8ab1 + Web 89bebbd |

## 偏差与边界

- 本页 1366×768 未滚动时发布状态列被钉住的操作列覆盖（内容宽 990 > 容器 830）：按复核记录以"局部横向滚动可达"口径处理并已证明可达；如 Owner 期望该页不滚动即全列可见，需压缩列宽/列数设计裁决，属产品口径不属于执行自行扩大。
- 更多菜单浏览器演示使用通知模板页（当前测试库无自然产生 ≥4 动作的行，如实记录）；演示模板已删除，测试库净零变化。
- Server 无代码改动；`/tmp/server-test.log` 原始全量日志（7.7MB）不入库（仓库既有大日志排除纪律），以未改写提取行 + 来源声明归档。

## 自验结论

G1–G3 与指针差异全部处理完毕并附可回读证据，执行自验通过；**待规划证据复核**，BUG-015 整项与 014/016/018 的 Owner 验收口径不变。整体修复循环保持开放。

```
ENGINE_TERMINAL status=EXECUTION_SUBMITTED task=v0.1.2-bugfix level=L work_items=0 remaining_actionable_count=0 independent_work_exhausted=true next_action=等待规划对G1-G3修正的证据复核与Owner单项验收 next_action_type=WAIT_PLANNER_REVIEW progress_basis=files_changed+tool_results+browser_evidence progress_fingerprint=web:fe9f6be,server:6a43d04,evidence:batch-06-supplement-01 stop_reason=planner_evidence_review_pending tool_results=server_focused:26/0/0/0,web_four_gates:typecheck0+lint0error+vitest1298+3+build0,browser:headed_headless=false_more_menu_e2e browser_status=formal_evidence_saved_evidence/batch-06-supplement-01
```
