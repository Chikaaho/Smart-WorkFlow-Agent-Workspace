# 0.2.0 批次85：图表格架收口（12图型/双轴单位/HEX透明度/列表滚动/撤销重置/1366）

2026-10-27｜Executor｜0.2.0 IN_PROGRESS｜任务03

## 本批结论

原 W66-VERIFY/A02/A04 图表格架的未证状态已用真实对象补齐；同时发现并修复两处实际消费缺陷（切换自动滚动不启动定时器、自定义颜色无透明度入口），以及一处配置语义缺口（多指标弹窗缺左右轴上限）。已证柱图、保存失败/成功、12图型基础渲染等旧结果不重跑，仅在改动命中的柱图/图例/颜色消费者上复验。

证据根：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/`。身份 t100admin / i5-tenant-100（userId 9001）。图型基础图 `types/00-柱状图.png` 至 `types/11-热力图.png`；配置与保存链 `01`—`16`；本批新增 `20`—`28`。

## 实际结果

### 1. 12 图型渲染与数据列表

- 柱状/条形/折线/面积/组合/饼/环形/散点/雷达/漏斗/仪表盘/热力图均以真实表单数据渲染，截图分别在 `types/00`—`11`；不是同一柱图换名。
- 散点在当前单分类数据下为空态（`types/07-散点图.png`），属该聚合输入的真实结果，未伪造第二分类。
- 数据列表 `13-data-list.png`：6 页、每页 5 行，分页可翻页；列头来自真实字段。

### 2. 多指标、左右轴与单位（本次修复后实证）

对象：表单“演练统计探针”`u020_ws_probe_66`（4 条记录，字段 amount 计划数量 / completed 完成数量）。

- 多指标弹窗新增与参考一致的两行指标及底部“左轴 / 右轴”上限选择；实际显示 `0 至自动 · 次`、`0 至 100 · %`（`20-metrics-axis-dialog.png`）。
- 预览图 `21-right-axis.png`：左轴刻度 14/10/7/3/0（计划数量），右轴独立刻度 100/75/50/25/0（完成数量），右轴轴线与刻度实际绘制；图例显示 `计划数量 (次)`、`完成数量 (%)`。
- 保存后从布局回读 `metadata.dataConfig`：metrics 为 amount/SUM/left/次 与 completed/SUM/right/%，`axisScale {left:null,right:100}`；绑定 formKey `u020_ws_probe_66`。回读后页面重载仍显示双轴（`23-saved-axis-reload.png`）。

### 3. HEX 透明度（本次新增）

- 原实现只有原生 `input[type=color]`，只能输出 `#RRGGBB`，无法表达透明度；参考状态“自定义颜色”要求 HEX 与百分比并显。
- 新增 `WorkspaceColorDialog`：HEX 输入、不透明度 0—100、常用色板、棋盘格预览；样式页签系列色与多指标弹窗色块均接入（`22-color-alpha-dialog.png`，名称为字段标签“计划数量”）。
- 实际消费：选择 `#3286E7` + 50% 后，图表填充为 `#3286e780`，浏览器计算色 `rgba(50, 134, 231, 0.5)`（`21b-right-axis-alpha.png`）；保存回读 `seriesColors.amount = "#3286e780"`。
- 限定：热力图渐变仍沿用原生取色器，不含透明度；本批不声称渐变已支持 alpha。

### 4. 保存失败/成功、撤销、重置

- 保存失败：拦截布局 PUT → 提示“模拟保存失败”，页头保持“未保存”（`14-save-failed.png`）。
- 保存成功：真实保存后 `custom=true`，重载回读图表与配置（`15-saved-reload.png`、`23`）。
- 撤销：新增条形图后卡片 9→撤销后 8，条形图卡片消失（`24-undo.png`）；随后保存，布局仅保留柱状图，无条形图。
- 重置布局：点击后出现确认框；确认后回到默认 5 张卡片，数据列表被移除，页头“未保存”（`25-reset-draft.png`）。测试结束调用 `resetWorkspaceLayout` 恢复 `custom=false`，未把测试布局留在真实账号。

### 5. 列表自动滚动（本次修复）

- 原实现切换“自动滚动”时不会启动定时器，只有重新加载数据才调度；实际表现为分页器隐藏但内容不动。
- 修复后 `26-auto-scroll.png`：A11 表单（28 条）首行由“通知链-2049-02”推进到“挂起阻断验证”，分页器隐藏，每页 5 行。

### 6. 1366 桌面

- 1366×768 下新增柱状图并打开多指标弹窗：弹窗 820×325，位于 (273,115)，完整落在视口内，页面横向溢出 0（`27-1366-chart-config.png`）。
- 1366 下保存成功，回读 `custom=true`、1 张柱图、formKey `u020_ws_probe_66`（`28-1366-chart-saved.png`）；随后恢复默认布局。
- 未重采 79/80 已证 1366 打开态，未验移动端。

## 实现改动

- `workspace-data.ts`：新增 `WorkspaceAxisScale`、`parseHexColor`/`composeHexColor`。
- `WorkspaceChart.vue`：指标颜色优先级（样式覆盖 > 指标色 > 调色板）、图例单位、右轴动态留白/轴线/刻度、左右轴固定上限及裁剪保护。
- `WorkspaceMetricsDialog.vue`：左右轴上限控件、按轴单位生成标签、指标颜色弹窗接入。
- `WorkspaceColorDialog.vue`（新增）：HEX + 不透明度 + 常用色 + 透明预览。
- `WorkspaceInspector.vue`：系列色改为色块按钮并打开自定义颜色弹窗，显示字段标签。
- `WorkspaceDataCard.vue`：传递 `axisScale`；监听 presentation 切换以启动/清理自动滚动定时器。
- `locales/zh-CN.ts`、`en-US.ts`：自定义颜色与轴上限文案。
- 测试：`WorkspaceChart.spec.ts` 新增图例单位/颜色覆盖/双轴刻度 2 例；`workspace-data.spec.ts` 新增颜色解析 2 例。

## 工程与验证

- typecheck、lint 通过。
- 全量测试：227 个文件通过、1 跳过；1951 个测试通过、3 跳过（较上批 +1 文件/+4 测试）。
- 生产构建：通过，4.26s。
- 浏览器验证使用 1920×1080 DPR1 与 1366×768 DPR1；非正式整版像素裁决，不据此晋级整版 PASSED。

## 保留的诚实边界

- 轴上限当前提供“自动/100”两档，与已读参考状态一致；未提供任意数值输入。
- 12 图型基础截图在本批前段采集；后续改动影响图例单位与颜色，几何未改；单位图例已在柱图/组合图实际复验，其余图型共用同一组件路径，未逐型重拍。
- 散点单分类空态、热力图渐变无 alpha 为已知边界，本批不声称已消除。
- 目录浮层与非空应用卡仍缺合法场景，按规划条件保留，未自增权或重复空态/403。
- 移动端不验；A17 发布依赖不变。

## Git

- Web `codex/0.2.0-ui-tenant-form-flow`：`25380f2cbc8fe799d8211573e9ddcb8fb01c00da`，已推送并按 `ls-remote` 回读同 SHA；`vite.config.ts` 在途未纳入。
- 根 `codex/0.2.0-delivery`：本回执及规划产物随后精确提交，提交与回读见回执补记。

本次完成不等于整版交付结束；正式49、清单46/22/22=90、ADV64/问题57、P62延期/OFF、旧9整页通过0及A17依赖均保持。

## Git 回读补记

- 根提交 `b0e34bf627c5b2dc156d00a3e0a1aeea75cfffe9`，推送 `3a298776..b0e34bf6`；`git ls-remote origin refs/heads/codex/0.2.0-delivery` 回读同 SHA。
- 根内 Web gitlink 为 `25380f2cbc8fe799d8211573e9ddcb8fb01c00da`，与 Web 远端回读一致；`vite.config.ts` 在途仍未纳入，根状态保留 `m Smart-WorkFlow-aPaaS-Web` 属该受保护改动，不表示 gitlink 未更新。
- 本补记提交后根 SHA 以该补记提交为准，并在状态摘要更新；不回写历史提交。

