# 功能追踪：P63 MES前置能力（表单驱动动态并行审批与一次性 IoT 预约下发）

> 工作区统一知识库 — 功能登记（P63；计数归属待 Planner 终态同步裁决，当前正式功能数基线 46 不变）。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P63（需求池编号；不对应 Mxx-Fyy-zz 既有明细，不改变 90 明细与 I 集合） |
| 功能名称 | MES前置能力：表单驱动动态并行审批与一次性 IoT 预约下发 |
| 功能目标 | 用户从真实表单配置人员/部门及预约时间，完成动态并行审批；流程成功结束后产生一次性 IoT 预约，到点下发并回查结果；普通手工并行与旧流程继续正常使用 |
| 创建日期 | 2026-10-06（Owner 需求 → 探索复核 → 正式方向下发） |
| 当前状态 | **已实现并提交完成回执 01，待 Planner 功能验收**（本文件不含终态裁决；依据 `product/p63-mes-workflow-foundations/receipts/completion-p63-mes-workflow-foundations-01.md`） |
| 等级 / 优先级 | L / P0 |
| 涉及模块 | Server `sw-biz-form`（多选存储/datetime/子表列/实例读 Facade）、`sw-bpm`（FORM_FIELD 策略、动态并行v2轮次、手工并行网关、预约意图 recorder）、`sw-basic-iot`（预约意图/到点调度/取消/查询）；Web 表单设计器-填报-渲染、流程设计器参与人与动态并行面板、任务详情预约卡、iot-reservation 适配接缝 |

---

## 2. 方向与回执

| 项 | 路径 |
|---|---|
| 唯一执行方向（READY，未归档） | `product/p63-mes-workflow-foundations/ready/direction-p63-mes-workflow-foundations.md` |
| 探索回执 | `search_fallback/p63-mes-workflow-foundations-readiness-20261006.md` + 附件 |
| 规划复核 | `product/p63-mes-workflow-foundations/receipts/planning-review-readiness-01.md` |
| 完成回执 01 | `product/p63-mes-workflow-foundations/receipts/completion-p63-mes-workflow-foundations-01.md`（A01—A10 矩阵+偏差声明+门禁终值） |
| 浏览器证据 | `product/p63-mes-workflow-foundations/receipts/evidence/browser-01/`（01—09 图 + db-readbacks.md） |

---

## 3. 交付要点（能力摘要）

- 表单主字段/表格列 × 人员/部门 × 单选/多选八组合存储与读取（多选 JSON 数组 VARCHAR(1000)，DATE `format='datetime'`）；APPROVAL/CONSENSUS/DYNAMIC_PARALLEL 统一 FORM_FIELD 参与人策略与权威解析（人员直解析、部门逐个解析唯一负责人）。
- 动态并行 v2（semanticVersion 门控）：对象分支去重、表格来源行保留、轮次按多实例根 executionId 键控（同轮复用/重入新轮/旧轮 SUPERSEDED_BY_ROUND）、v1 旧语义不迁移。
- 手工并行：新增 PARALLEL_GATEWAY 翻译器（改动前生产注册表无此翻译器，属新增式补齐——见回执偏差 1，交 Planner 裁决）。
- 一次性 IoT 预约：同事务冻结意图（unique(租户,实例)）、到点条件认领、显式时区（歧义/不存在拒绝）、迟到窗口 1—3600 默认 60、取消竞争单结果生效、查询/取消路由与任务详情卡；存量幂等/结果链复用，UNKNOWN 禁自动重发边界不变。

---

## 4. 边界与留账

- **计数**：正式功能数基线 46、清单 90 行（✅46/🟦22/⬜22）、ADV 64、问题 57 均未由本执行方改动；P63 计数归属待 Planner 终态同步。
- **未覆盖层级**：设备物理回执/真实 broker 对端（验收环境命令按既有失败语义 FAILED「发送通道未装配」如实可查）；真实重启停机恢复演练；TABLE 列来源浏览器级全链；窗口过期路径真实调度链。
- **观察项**：首入双轮（round0 SUPERSEDED_BY_ROUND→round1，净行为正确）；窄屏顶栏「中文」按钮换行；真实链修复缺陷 5 项已随 edf5646/9ce09b6 提交（见回执 §3）。
- **验收库**：`sw_p63_accept` 已销毁回读 0；任务自有进程（8080/5173）已清理；Server/Web develop 分支全部推送（72b5aef…edf5646 / 5b0988a…9ce09b6）。
