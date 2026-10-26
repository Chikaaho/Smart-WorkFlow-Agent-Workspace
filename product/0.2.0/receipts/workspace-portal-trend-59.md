# 0.2.0 门户 7:2 趋势链补全与蓝色复验（批次59，任务03继续）

2026-10-27｜Executor｜承接批次58；消费 design-blue-20261026 core/7-2.png（05 企业门户）

## 范围与实现

批次23已实现门户 7:2 整页骨架（hero 1880×144、概览 3×160×70、快捷 5 列卡 80px、下栏 1420:440、关注行 90px）；本批运行态复验发现两处真实缺口并修复：

- **服务端趋势缺口**：`/workflow/monitor/analytics/summary` 响应无 `dailyTrend` 字段，`PortalHome` 的趋势柱渲染器（含首末日期标签与末柱主题色）因 `v-if="analyticsTrend.length"` 恒不渲染——参考 7-2 的 30 天柱状图实际缺失（node 直连探测实锤响应无该键）。`codex/0.2.0-tenant-form-flow` `47385e74..b57e9d31`：`BpmMonitorServiceImpl.analyticsSummary` 追加 `dailyTrend`（近 30 天按天复用 `monitorCount`，定义/时间/数据范围口径不变，date 为 MM-dd，显式 timeFrom/timeTo 窗口优先），避免另写 PG/H2 跨方言日期分组 SQL；新增 `BpmMonitorServiceImplTest` 2 例（30 天窗口与 MM-dd 标签、显式窗口与 defKey 透传）。
- **前端紫残留**：`PortalHome.vue` `.portal__analytics-bar span` 硬编码紫系浅色 `#e3def8`（紫主题时代残留，末柱已用主题 token）——改 `var(--el-color-primary-light-8)` 随主题；全仓 grep 该值仅此一处。`codex/0.2.0-ui-tenant-form-flow` `ebf382f..68db128`，1 文件 1 行。

## 验证

- **服务端聚焦**：`BpmMonitorServiceImplTest` 2/0/0；jar 重建 221,094,961 B（第一次 repackage 失败系运行中 java 锁定 jar，净停后重建成功，如实记录）。
- **Web 四连（提交态）**：typecheck 0、lint 0、226 文件通过/1 跳过、build 3.98s，exit 0（`/tmp/web-fourgate-59.log`）。
- **真实链探测（node 直连 8080）**：登录链 t100admin@`i5-tenant-100`（期间两次失败如实留痕：口令误记 `admin123@租户100` 与 tenantCode=`100` 均 2104；根因=租户 code 实为 `i5-tenant-100`，口令为 `admin123`）；修复前 summary 无 dailyTrend → 修复后 30 项 09-28..10-27，**10-25=22、10-26=20 与 dev 库真实实例对应**。
- **真实可见会话（IAB 1920，t100admin）**：门户顶栏 #1D4ED8；hero 1880×144 三统计 3×160×70（3 可发起/42 我发起/40% 完成率真实值）；下栏 1420:440；关注区 270=3×90（21 待办/57 未读）；趋势 30 柱渲染、首末标签 09-28/10-27、**非末柱 rgb(211,224,251)=light-8 蓝系、末柱 rgb(37,99,235)=#2563EB 主蓝**、柱高数据驱动（22 实例满高 215px/20 实例 195px/0 为 18px min）。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/formal-59-portal-trend-network-index.json`（4 步请求级索引+页面几何）。IAB 截图管线本宿主持续 surface 超时（批次58 起 8 次尝试），颜色/几何全部以 computedStyle/DOM 计算值验收，正式像素归 A03—A05。
- **环境收尾**：验后双服务净停，PG/Redis 保持。

## 边界与剩余

- 门户 7:2 几何与颜色在蓝色主题下复验通过；正式 99%/98%/1px/RGB≤3 像素验收仍归 A03—A05 全量同态批次。
- hero 统计与关注数据为 dev 库真实消费（3/42/40%、21/57），非演示值；设备告警行 dev 无 IoT 告警数据未单独造链。
- 剩余账本：A03—A05 全量同态像素（待截图能力恢复，属大体量分批）、25 族其余状态、66 状态不同语义补证、DR06 授权集成；A17 合并/0.2.0 发布依赖整版验收。计数 49、46/22/22=90、ADV64/问题57、P 核销空保持。

总 7 阶段 1/1/5。常规决定：趋势窗口 30 天与「近 30 天」文案对齐（PortalHome 固定不传窗口）；未发其他会话消息。
