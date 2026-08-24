# 执行补证回执 — P48 / M07-F03-02 工具与函数调用前端配置闭环

**执行任务终态：EXECUTION_SUBMITTED**
**功能状态：自验通过·待规划验收**
**补证轮次：D186（D185 首轮验收 FAILED 后补证）**

---

## D185 缺口逐项修复

### 缺口 1：2 个 Vitest 失败（标准 11 全绿门槛）

**根因**：`agent-debug-handlers.spec.ts` 中 2 个单步调试测试失败，原因是 Mock 调试会话的 `expiresAt` 使用 `toISOString()` 生成 UTC 时间后剥离 'Z' 后缀，解析时被 `new Date()` 当作本地时间处理，导致时区偏移使会话立即过期（返回 400 而非 0/409）。

**修复**：
- `src/foundation/mock/handlers.ts`：创建会话时 `expiresAt` 保留完整 ISO 格式（含 'Z'），确保 `new Date(sess.expiresAt).getTime()` 解析为 UTC
- `src/foundation/mock/seeds.ts`：种子数据 `MOCK_DEBUG_SESSIONS` 的 `expiresAt` 统一为 ISO 格式

**验证**：`agent-debug-handlers.spec.ts` 15/15 全通过

### 缺口 2：标准 1—8 行为测试（结构/自述证据→真实行为证据）

**新增 3 个 spec 文件，30 个行为测试用例**：

#### ToolList.spec.ts（10 个用例）
| 用例 | 覆盖标准 | 行为证据 |
|------|---------|---------|
| mount 时以 pageNum=1 pageSize=10 调用 pageInternalTools | 标准 2 | 验证默认 Tab=internal、API 调用参数、列表数据渲染 |
| 关键字查询：pageInternalTools 携带 nameKeyword | 标准 2 | 验证查询/重置行为、trim 处理、页码回 1 |
| 编辑内部工具：editRow 打开弹窗并携带行 id | 标准 3 | 验证 editRow→dialogVisible=true、editingId 正确传递 |
| 删除内部工具：二次确认后调用 deleteInternalTool | 标准 3/6 | 验证 ElMessageBox.confirm→deleteInternalTool→列表刷新 |
| 删除内部工具：取消确认时不调用 deleteInternalTool | 标准 3/6 | 验证取消→API 不调用→列表不刷新 |
| 启停内部工具：toggleInternalTool 被调用 | 标准 3/6 | 验证 toggleInternalTool(id, !enabled)→列表刷新 |
| 权限：manage 缺失→新建按钮隐藏 | 标准 1 | 验证 canManage=false→按钮不可见 |
| 权限：manage 可用→新建按钮可见 | 标准 1 | 验证 canManage=true→按钮可见 |
| 空态：列表为空时显示空态 | 标准 2 | 验证 isEmpty=true |
| 错误态：API 报错时设置 errorMsg | 标准 2 | 验证 reject→errorMsg 设置 |

#### InternalToolFormDialog.spec.ts（10 个用例）
| 用例 | 覆盖标准 | 行为证据 |
|------|---------|---------|
| 新增模式：toolId=null 时不调用 getInternalTool | 标准 3 | 验证新建不触发详情加载 |
| 编辑模式：toolId 存在时调用 getInternalTool 回填 | 标准 3 | 验证详情回填全部字段 |
| 校验：工具名为空→不调用 API | 标准 5 | 验证空名→formError→API 不调用 |
| 校验：工具名非法格式→不调用 API | 标准 5 | 验证 '123-invalid'→格式错误提示 |
| 校验：描述为空→不调用 API | 标准 5 | 验证空描述→必填提示 |
| 校验：inputSchema 非法 JSON→不调用 API | 标准 5 | 验证 '{bad json'→JSON 格式错误提示 |
| 新增成功：校验通过后调用 createInternalTool | 标准 3 | 验证完整字段→API 调用→emit saved |
| 编辑成功：调用 updateInternalTool | 标准 3 | 验证更新→API 调用→emit saved |
| API 失败：ApiError 时显示错误信息 | 标准 6 | 验证 ApiError→formError 显示后端消息 |
| submitting 状态：阻止重复提交 | 标准 6 | 验证 submitting=true→按钮禁用 |

#### ExternalToolFormDialog.spec.ts（10 个用例）
| 用例 | 覆盖标准 | 行为证据 |
|------|---------|---------|
| 新增模式：toolId=null 时不调用 getExternalTool | 标准 4 | 验证新建不触发详情加载 |
| 编辑模式：toolId 存在时调用 getExternalTool 回填 | 标准 4 | 验证详情回填全部字段 |
| 校验：URL 为空→不调用 API | 标准 5 | 验证空 URL→必填提示 |
| 校验：URL 格式非法→不调用 API | 标准 5 | 验证 'not-a-url'→格式错误提示 |
| 校验：URL 非 http/https 协议→不调用 API | 标准 5 | 验证 'ftp://...'→协议错误提示 |
| 校验：超时时间 < 1→不调用 API | 标准 5 | 验证 timeoutSeconds=0→正整数提示 |
| 校验：inputSchema 非法 JSON→不调用 API | 标准 5 | 验证 '{bad json'→JSON 格式错误提示 |
| 新增成功：校验通过后调用 createExternalTool | 标准 4 | 验证完整字段→API 调用→emit saved |
| 编辑成功：调用 updateExternalTool | 标准 4 | 验证更新→API 调用→emit saved |
| API 失败：ApiError 时显示错误信息 | 标准 6 | 验证 ApiError→formError 显示后端消息 |

### 缺口 3：标准 9—11 同轮可复算证据

见独立测试回执 `product/agent-tool-configuration-frontend/receipts/test-receipt-d186.md`。

### 缺口 4：标准 12 阶段二当前态同步

**回执触碰文件清单**：
- `knowledge/`：未触碰（功能验收前禁止核销 P48、提升 M07-F03-02、增加功能数、晋级正式基线）
- `memory/`：未触碰
- 需求池：未触碰
- 功能清单：未触碰

实际修改仅限前端代码（3 个新增 spec 文件 + 2 个 bug fix 文件）+ 后端零改动。

**功能状态**：READY → 自验通过·待规划验收（未自行写 PASSED/COMPLETED）

---

## 本轮实际修改的文件

| 文件路径 | 仓库 | 修改类型 |
|----------|------|---------|
| `src/foundation/mock/handlers.ts` | 前端 | 修改（修复 expiresAt 时区 bug） |
| `src/foundation/mock/seeds.ts` | 前端 | 修改（统一 expiresAt ISO 格式） |
| `src/modules/agent/views/ToolList.spec.ts` | 前端 | **新增**（10 个行为测试） |
| `src/modules/agent/views/InternalToolFormDialog.spec.ts` | 前端 | **新增**（10 个行为测试） |
| `src/modules/agent/views/ExternalToolFormDialog.spec.ts` | 前端 | **新增**（10 个行为测试） |

---

**提交时间**：2026-08-24
**提交者**：执行代理
