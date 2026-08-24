# 功能追踪：agent-tool-configuration-frontend（P48 / M07-F03-02 工具与函数调用前端配置闭环）

> 工作区统一知识库 — 单功能规划与追踪。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P48 / M07-F03-02 |
| 功能名称 | 工具与函数调用前端配置闭环 |
| 功能目标 | 为既有工具 CRUD 与 Function Calling 能力补齐可达、可授权、可验证的前端配置闭环（统一「工具管理」入口维护内部/外部 HTTP 工具，启用后可被图设计器 TOOL 节点选择） |
| 创建日期 | 2026-08-24（D184 方向下发） |
| 当前状态 | COMPLETED（D203 功能级 12/12 PASSED + 阶段三终态同步，2026-08-25，第31个） |
| 涉及模块 | 前端 Smart-WorkFlow-Web（Agent 工具管理页/表单/API/Mock/路由/权限）+ 后端仅 V37 菜单 seed（双方言） |

---

## 2. 需求分析

### 2.1 功能目标

在「智能体」管理域提供单一「工具管理」入口，明确区分内部工具与外部 HTTP 工具；
列表/新增/编辑/启停/删除真实 API 闭环；inputSchema 校验与无损往返；权限沿用
`agent:tool:view`/`agent:tool:manage`；Mock 与真实 API 语义一致；图设计器 TOOL 节点
通过既有数据源消费新建/启停工具。

### 2.2 非目标

- 不修改工具 Entity/Mapper/Service/Controller/运行时 Factory/既有 Function Calling 语义
- 不建设调试台、调用日志、统计、版本管理、导入导出、工具市场
- 不纳入 P9 图节点级多 Key 轮询、助手配置、RAG、SSE 对话窗口、Token 统计
- 不重构图设计器/ToolPanel；不新增默认用户、不默认扩大普通角色权限
- 不修改业务表结构；仅新增 V37 菜单 seed（双方言最小，不改写历史迁移）

---

## 3. 执行与验收轨迹

### 3.1 方向与复验链

| 编号 | 日期 | 类型 | 结论 |
|------|------|------|------|
| D184 | 2026-08-24 | 方向下发（12 项验收标准） | READY |
| D185 | 2026-08-24 | 首次审查 | FAILED |
| D187/D189/D191/D193/D195 | 2026-08-24 | 复验链（提示1—5） | FAILED（逐步锁定标准） |
| D197 | 2026-08-24 | 提示 5 后复验 | **FAILED（5/12 锁定）** |
| D199 | 2026-08-24 | 提示 6 后复验 | **FAILED（9/12 锁定；仅标准 1、11、12 待补）** |
| D201 | 2026-08-24 | 提示 7 后复验 | **FAILED（11/12 锁定；仅标准 11 待补）** |
| D203 | 2026-08-25 | 功能级最终验收 | **PASSED（12/12）→ 阶段三终态同步 COMPLETED（第31个）** |

### 3.2 标准锁定状态（D203 终态）

**12/12 全部 PASSED**：
- 标准 1（真实后端生产菜单响应链，VITE_USE_MOCK=false）、标准 2（双工具区分/列表真实加载/空态/错误态/检索筛选）、标准 3（内部工具真实 API 闭环/字段无损往返）、标准 4（外部工具真实 API 闭环）、标准 5（真实后端 timeout 0 归一化 1 / 1 原样 + 持久化 + 回读）、标准 6（启停删除反馈/列表与服务端一致）、标准 7（图设计器 TOOL 节点消费既有数据源）、标准 8（内部/外部×未认证 401/缺 manage 403 四场景 + 数据前后值）、标准 9（敏感路径零 diff 原始输出）、标准 10（独立 V36→V37 + 同一会话查询）、标准 11（严格顺序串行四门 typecheck→lint→test→build，100f/981t 零失败零跳过）、标准 12（当前入口唯一口径）

### 3.3 提示 6 补证（2026-08-24 执行层，D199 已锁定 5/8/9/10）

| 标准 | 证据 | D199 结果 |
|------|------|------|
| 5 | `AgentToolConfigSecurityIntegrationTest` L5（真实 Security 链+Service+H2，timeout 0→归一化1、1 原样，持久化+回读） | **PASSED（新增锁定）** |
| 8 | 同测试类四拒绝场景（内部/外部×未认证 401/缺 manage 403）+ 数据前后值 + superadmin 对照 | **PASSED（新增锁定）** |
| 9 | `k13-sensitive-path-zero-diff.md`（敏感路径 git diff 零输出 + untracked 检查 + 根仓归属） | **PASSED（新增锁定）** |
| 10 | `FlywayFullChainH2Test` L10（独立 V36 起点→仅 V37，同一会话查询 sys_menu 212/213 + view/manage） | **PASSED（新增锁定）** |
| 1 | `tool-production-menu-chain-v2.spec.ts`（mock 语义）——D199 否：非生产菜单 | FAILED（提示 7 需真实后端） |
| 11 | `k15-gate-evidence.md`——D199 否：含 1 file/5 tests skipped、双快照 4 秒无法证明串行 | FAILED（提示 7 需零 skip） |
| 12 | 全文同步——D199 否：memory 多入口仍冲突 | FAILED（提示 7 需唯一口径） |

---

## 4. 测试与基线

- 后端：`AgentToolConfigSecurityIntegrationTest` 8 用例、`FlywayFullChainH2Test` 14 用例
  （含 L10 V36→V37）；项目级正式基线 **827/0/0/0（Agent 338）**
- 前端：正式基线 **100 spec files / 981 tests（0 failed、0 skipped）**（D203 严格顺序串行四门）
- Flyway：正式基线 **V37（H2/PostgreSQL）**；独立 V36→V37 单迁移 + 同会话查询验证

---

## 5. 状态与交接

- 功能状态：**COMPLETED**（D203 功能级 12/12 PASSED + 阶段三终态同步，第31个）；
  P48 已核销、M07-F03-02 升 ✅、清单 **✅27/🟦23/⬜40**、功能数 **31**、
  正式基线 **827/Agent338、100f/981t、V37**
- 主方向：`product/agent-tool-configuration-frontend/passed/direction-agent-tool-configuration-frontend.md`（已归档）
- 终态同步方向：`ready/direction-agent-tool-configuration-frontend-terminal-sync.md`（待规划终态复核后归档）
- 下一动作：规划层终态复核本阶段三终态同步回执；通过后规划比较并选择下一唯一功能
