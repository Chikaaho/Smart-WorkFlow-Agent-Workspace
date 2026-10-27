# 0.2.0 批次86：四图型正向语义补证（散点/雷达/热力/组合）

2026-10-27｜Executor｜0.2.0 IN_PROGRESS｜任务03 revision4

## 范围与对象

按任务03 revision4，只处理散点、雷达、热力、组合四个图型的正向消费；85 已证轴/单位/颜色/列表/保存撤销重置/1366 不重跑。使用既有合法探针表单“演练统计探针”`u020_ws_probe_66`（4 条真实记录），未新增历史数据、未改用户布局。

真实记录（列表端点按散点列查询时返回 amount/completed）：

| 名称 | 类型 | 区域 | amount | completed |
| --- | --- | --- | --- | --- |
| 演练A | 机房断电 | 华东 | 12 | 10 |
| 演练B | 火灾告警 | 华东 | 8 | 6 |
| 演练C | 网络故障 | 华北 | 5 | 4 |
| 演练D | 机房断电 | 华北 | 3 | 2 |

证据目录：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/4sem/`。

## 四图型实际结果

### 1. 散点：真实数值 X/Y 点位

- 配置：关联 `u020_ws_probe_66`，X=`amount`（计划数量），Y=`completed`（完成数量）。
- 实际：`01-scatter.png` 显示 4 个点位，坐标分别为 (3,2)、(5,4)、(8,6)、(12,10)，随数值递增；不是空态或单分类退化。
- 图例显示“完成数量”，X 轴标题“计划数量”、Y 轴标题“完成数量”；4 点使用同一系列色，不再按点轮换调色板。
- 保存回读：`chart_scatter` 的 `xField=amount`、`yField=completed`、`formKey=u020_ws_probe_66`；重载后仍为 4 点（`05-scatter-reload.png`）。

### 2. 雷达：多维数据形状

- 配置：维度=`name`（演练名称），指标为 amount SUM 与 completed SUM 两项。
- 实际：`02-radar.png` 形成演练A/B/C/D 四个真实轴，两条闭合多边形；amount 序列 12/8/5/3，completed 序列 10/6/4/2，形状随真实值变化，不是单轴直线。
- 保存回读：`chart_radar` 的 `groupBy=name`、metrics 两项均为 `u020_ws_probe_66` 真实字段；重载后仍为四轴两系列（`06-radar-reload.png`）。

### 3. 热力：双维度与颜色值

- 配置：X 维度=`name`（演练A—D），Y 维度=`category`（机房断电/火灾告警/网络故障），颜色值=amount SUM。
- 实际：`03-heatmap.png` 为 4×3 二维格架共 12 格；演练A×机房断电=12、演练D×机房断电=3、演练B×火灾告警=8、演练C×网络故障=5，其余为 0；单元格颜色随 0/3/5/8/12 呈 5 档梯度，数值与颜色对应真实聚合。
- 修复：原左留白固定 46px，四字 Y 维度名被 SVG 左边界裁切（显示为“房断电”）；改为按最长 Y 维度名动态留白（上限 140px），`03-heatmap.png` 中“机房断电/火灾告警/网络故障”完整可读。
- 保存回读：`chart_heatmap` 的 `groupBy=name`、`groupBy2=category`、metric amount SUM；重载后仍为 12 格（`07-heatmap-reload.png`）。

### 4. 组合：一柱一线分别消费指标

- 配置：指标1 amount SUM、左轴、柱状；指标2 completed SUM、右轴、折线。
- 实际：`04-combo.png` 同一图内 4 根柱（amount 12/8/5/3）与 1 条折线（completed 10/6/4/2）并存，左轴 14/10/7/3/0、右轴 12/9/6/3/0；柱/线分别消费各自指标，不是两柱同形态。
- 保存回读：`chart_combo` 的 metrics `presentation` 分别为 `bar`/`line`，`axis` 为 `left`/`right`；重载后仍为 4 矩形+1 折线（`08-combo-reload.png`）。

### 5. 保存与配置总览

一次保存后从布局 `metadata.dataConfig` 回读四张卡片，均绑定 `u020_ws_probe_66`；`09-config-saved.png` 为保存后配置页。测试结束调用 `resetWorkspaceLayout`，`custom=false`，未把四卡布局留在真实账号。

## 实现改动

- `WorkspaceChart.vue`：
  - 散点新增 X/Y 轴标题 props、单一系列色与 Y 字段图例，避免使用未参与绘制的指标名。
  - 热力图左侧留白按 Y 维度名长度动态计算，`PLOT_W` 同步扣减。
- `WorkspaceDataCard.vue`：按 `xField`/`yField` 解析字段标签并传入图表。
- `WorkspaceChart.spec.ts`：新增散点单色/轴名/单图例、热力维度留白 2 例。
- 雷达与组合未改渲染代码；原实现已支持维度轴与逐指标呈现方式，本批以适配输入证明其正向消费。

## 验证

- typecheck、lint 通过。
- 全量测试：227 文件通过/1 跳过；1953 测试通过/3 跳过（较 85 +2 测试）。
- 生产构建：5.33s 通过。
- 浏览器：1920×1080 DPR1，t100admin/i5-tenant-100；headless 隔离回归，不晋级正式整版像素。

## 保留边界

- 散点仍为单组 X/Y 点位，不扩为参考图的两条 Y 指标系列；本批任务只要求真实 X/Y。
- 热力图未新增渐变图例文字；格值数字与颜色梯度已可辨。
- 未重跑 85 已证的轴/单位/系列透明度/列表/保存撤销/1366；未改用户现有布局、未造业务历史。
- 目录/非空应用、A05—A16 裁决、九整页基准、A17 仍由 Planner/Owner 处理；移动端不验。

## Git

- Web `codex/0.2.0-ui-tenant-form-flow`：`f45cc26a8a23be28ac38a3779968a615c7d8427e`，已推送并 `ls-remote` 回读同 SHA；`vite.config.ts` 在途未纳入。
- 根 `codex/0.2.0-delivery`：本回执与记忆更新随后精确提交，回读见补记。
