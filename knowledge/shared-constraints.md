# 跨项目共享工程约束

> 工作区统一知识库 — 约束分册。记录前后端共同遵守的工程约束与设计原则。
> 项目特有约束见各项目 `docs/governance/engineering-constitution.md`。
>
> 信息来源：`CLAUDE-java.md` · `CLAUDE-vue.md` · `Smart-WorkFlow-PRD.md`（均来自 `SmartWorkFlow_files.zip`，2026-07-16）。

---

## 1. 安全约束（前后端共同遵守）

### 1.1 Token 管理

| 规则 | 说明 |
|------|------|
| Token **仅内存存储** | 全仓库（前后端）无 `localStorage` / `sessionStorage` 写入 token |
| 刷新 = 重登录 | 前端 `POST /auth/refresh` 端点尚未实现（seam），刷新需重新登录 |
| Token 有效期 | 后端 JWT 7200 秒（2 小时） |

### 1.2 超管判定

- **`superAdmin` = `boolean`**（后端判定：角色 code 集合包含 `superadmin`）
  - CONFIRMED 2026-07-22：`UserDetailsProviderImpl` 用 `roleCodes.contains("superadmin")` 判定，`SystemAutoConfiguration` 注释明写"替换旧有 userId==1 硬编"。此前文档记载的 `userId == 1` 已 SUPERSEDED
  - seed 绑定 admin(id=1) → 角色 code=`superadmin`，故行为与旧口径一致，但判定依据是角色 code 而非 userId
- ❌ 不使用 `*:*:*` 通配符字符串模式
- 前端 `permissions`/`roles` 为空集 + `superAdmin=true` 时，`v-perm` 放行展示（暗态 gating）
- 暗态 gating 非安全漏洞，后端权限装配上线后自然切回真实拦截

### 1.3 多租户

- 租户隔离为**列级隔离**（`tenant_id` 列）
- **前端不发送租户头**：租户 ID 由后端从 JWT token 解码注入
- 动态宽表裸 SQL 必须手写 `WHERE tenant_id=?`（MyBatis-Plus 拦截器失效）

### 1.4 安全红线（🔒 违反即返工）

- ❌ **禁止远程代码执行（RCE）**：不接受用户上传代码包编译运行。用户可配置的是**数据**（流程 key、表单数据、cron、Prompt），不是**代码**。需用户自部署逻辑时只走进程外（执行器/HTTP/webhook）。
- ❌ **禁止 `eval` / `new Function`**：前端表达式求值仅走 `security/safe-eval`；后端类加载安全由 Spring 容器管控
- ❌ **禁止 SQL 注入**：用户输入的表名/字段名必须过白名单（`ColumnValidation.physicalColumnName()`）+ 参数化绑定（`PreparedStatement ?`）
- ❌ **禁止 open redirect**：前端路由守卫强制同源校验
- ❌ **禁止自创表前缀**：新表前缀必须落在 `sys_` / `sw_form_` / `sw_bpm_` / `sw_openapi_` / `sw_job_` / `sw_notify_` / `sw_storage_` / `sw_iot_` / `sw_knowledge_` / `sw_agent_` 枚举内
- ❌ **禁止用 FQCN 字符串选择实现**：破坏 `@Transactional`/AOP，引入安全风险

---

## 2. 前后端协作约定

### 2.1 契约先行 + 并行开发

前端不等后端就绪，拿契约和 mock 把页面/交互全推起来，后端 seam 点亮后零改动接真数据。

| 模式 | 前端命令 | 说明 |
|------|----------|------|
| 直连模式 | `pnpm dev` | 通过 `/api` 代理连接后端；未就绪端点显示「后端端点待上线」可读态 |
| Mock 模式 | `pnpm dev:mock` | 全 MSW mock，零后端依赖，用于肉眼验收 |

### 2.2 Seam（接缝）约定

- 后端未就绪的端点在前端标注 `// TODO(skeleton)`
- Seam 行为：直连模式下显示「后端端点待上线」可读态，不 mock 假数据
- 契约形状以后端 API 文档（Swagger）为准，前端通过 `pnpm gen:api-types` 生成类型

### 2.3 REFERENCE 字段约定（红线 🔒）

- **存 id 显示 value，绝不混淆**
- 提交入库存目标记录 **id**（对应后端 `ref_{name}_id` 列）
- UI 显示的是**显示名**（value），经 computed/display 字段获取
- v-model 实际值 = id，显示文案另走 display 通道
- `targetFormId` 存的是 **formKey**（业务标识，如 `dept_form`），**不是** form_id（UUID）

### 2.4 回执输出规范（硬约束 🔒）

执行代理（在 `Smart-WorkFlow/` 或 `Smart-WorkFlow-Web/` 中工作）执行完每个 Step 后，必须将执行回执和测试回执写入工作区统一目录，而非仅留在对话中。

#### 2.4.1 回执存放路径

```
product/<feature-name>/receipts/
├── step-N-<step-name>-execution.md   — 执行回执
└── step-N-<step-name>-test.md        — 测试回执
```

- `<feature-name>` 与 Step 所属功能名一致（如 `bpm-single-node-approval`）
- `<step-name>` 用简短英文 kebab-case（如 `backend-query-endpoint`）
- 后端执行代理写执行回执到该路径；前端执行代理也不例外，**前后端共用同一 `receipts/` 目录**
- 根目录规划代理验收后，可将已验收的回执归档到 `product/<feature-name>/passed/`（可选）

#### 2.4.2 回执内容

- **执行回执**：必须包含 `roles/executor.md` §8.1 要求的 12 项内容（Step 编号/名称、读取文件、修改文件及摘要、执行命令及输出、偏差说明、问题记录、未完成内容、风险、Git diff 摘要、建议测试）
- **测试回执**：必须包含 `roles/executor.md` §8.2 要求的 12 项内容（Step 编号/名称、测试环境、前置条件、执行命令、各测试项结果、通过/失败/跳过项、日志、验收标准对照、回归风险、最终结论）

#### 2.4.3 约束细则

- **写回执是 Step 执行的最后一步**，执行代理完成代码修改和测试后，必须将回执写入文件再结束会话
- **禁止仅口头汇报**：执行代理不得仅以对话形式报告结果而不写回执文件
- **禁止省略项**：回执中每项都必须填写，无内容填「无」而非整项删除
- **文件覆盖**：同一 Step 重新执行时覆盖之前的回执文件（保留最新记录即可）
- **根目录代理只在文件就位后验收**：根目录规划代理以回执文件为验收依据，不依赖对话摘要
- ❌ 违反此规范的执行回执视为不合格，退回重写

#### 2.4.4 前后端职责域与回执对齐

- 纯后端 Step 的执行回执只写后端改动（Java、Flyway、配置文件等），不涉及前端文件
- 纯前端 Step 的执行回执只写前端改动（Vue、TS、CSS 等），不涉及后端文件
- 涉及前后端联动的功能，后端和前端分别有各自独立的 Step，回执也分别写
- 测试回执同理：后端 Step 只附后端测试命令和结果；前端 Step 只附前端四连结果

---

## 3. 共用术语与概念

### 3.1 表单引擎核心概念

| 术语 | 说明 |
|------|------|
| **动态宽表** | 一个表单 = 一张物理表，一行 = 一次提交，不使用 JSON 列或 EAV |
| **nanoId** | 表单物理表名后缀，规则：首位强制小写字母 `[a-z]`，其余 `[a-z0-9]`，总长 ≤ 12 |
| **TABLE 关系** | 主表单内嵌子表（明细行），删除 → **CASCADE** 软删子表；独占、不可被引用、不递归 |
| **REFERENCE 关系** | 独立表单间引用，删除 → **RESTRICT**（有子引用则禁删父）；可被多表引用 |
| **definition** | 表单字段定义（JSONB），唯一字段真源，驱动建表和渲染 |
| **config** | 表单配置（JSONB），包含 definition + 样式（`sw_form_config`） |
| **snapshot** | 表单版本快照（JSONB），发布时写入（`sw_form_snapshot`） |
| **发布冻结** | 表单发布后表名/字段名永久不可改（唯二例外「加列/改长度」作为 v2 接缝，v1 不开） |
| **软删** | 逻辑删除（`deleted=1`），全平台一律软删，不物理 DELETE |
| **权限码** | `module:resource:action`（如 `system:dict:list`） |
| **角色 key** | `sys_role.code`（如 `admin`） |
| **数据范围** | 五档：本人 / 本部门 / 本部门及下级 / 自定义部门 / 全部 |

### 3.2 字段类型

当前启用 8 种字段类型：`TEXT` / `RICH_TEXT` / `NUMBER` / `DATE` / `BOOL` / `DICT` / `REFERENCE` / `TABLE`

- RADIO 不立类型 = DICT + renderAs
- 其余为占位类型 `enabled=false` 无行为

### 3.3 模块术语映射

| 中文 | 后端模块 | 前端模块 | 表前缀 |
|------|----------|----------|--------|
| 系统管理 | `sw-biz-system` | `modules/system` | `sys_` |
| 表单引擎 | `sw-biz-form` | `modules/form` | `sw_form_` |
| 流程引擎 | `sw-bpm` | `modules/workflow` | `sw_bpm_` + `ACT_*` |
| 通知 | `sw-basic-notify` | `modules/notify` | `sw_notify_` |
| AI 助手 | `sw-basic-agent` | `modules/agent` | `sw_agent_` |
| IoT | `sw-basic-iot` | `modules/iot` | `sw_iot_` |
| 开放接口 | `sw-biz-openapi` | `modules/openapi` | `sw_openapi_` |
| 知识库 | `sw-basic-knowledge` | N/A | `sw_knowledge_` |
| 存储 | `sw-basic-storage` | N/A | `sw_storage_` |
| 定时任务 | `sw-basic-job` | N/A | `sw_job_` |

---

## 4. 数据一致性与验证

### 4.1 校验责任分工

- **后端是真校验的唯一权威**：必填校验、字典值域校验（错误码 1401 / 1403）、字段类型校验（1402）
- **前端校验仅 UX 提示**：`required` 不拦死提交，真校验在后端
- 后端错误码映射为中文提示在前端 `error-code-map.ts` 中维护

### 4.2 定时任务与表单提交

- 定时任务（FLOW 类型）发起的流程**必须经过与手动表单提交相同的校验路径**
- 定时触发与手动提交汇入同一个校验+发起方法，不得各写一份
- FLOW 任务以 `job_id + 触发时间` 做幂等去重键

### 4.3 动态宽表裸 SQL 红线（🔒 反复踩，固化）

- 裸 JdbcTemplate 读写，**MyBatis-Plus 拦截器全部失效**
- `@TableLogic` 不生效 → 逻辑删除必须**手写** `WHERE deleted=0`
- `TenantLineHandler` 不生效 → 租户隔离必须**手写** `WHERE tenant_id=?`
- 每条裸 SQL 都须同时手写 `deleted` + `tenant_id` 两个条件，缺一即漏洞
- 列名一律过 `ColumnValidation` 白名单单出口；表名过 `TABLE_NAME_PATTERN` 正则；值一律 `?` 参数化绑定
- 分页手写 `SELECT COUNT(*)` + `LIMIT ? OFFSET ?`；查询 size 硬上限 200
- 若勘察发现动态宽表缺 `deleted` / `tenant_id` 列 → **停，报缺口**，不静默放过

### 4.4 删除语义（🔒）

同一 `@Transactional` 内按序：
1. RESTRICT 反查（删父前拦，带 `deleted=0 AND tenant_id=?`，自引用追加 `id!=?`）
2. CASCADE 软删 TABLE 子表
3. 软删主记录
4. 删不存在/已删一律返成功（幂等，REST DELETE 目标态语义）

---

## 5. 功能 ID 体系（跨项目共用）

功能清单使用 `Mxx-Fyy-zz` 编号体系，前后端共用：

| 模块编号 | 模块名称 | 功能数 | 明细数 | 后端落地 | 前端落地 |
|----------|----------|:---:|:---:|------|------|
| M01 | 组织架构 | 5 | 13 | `sw-biz-system` | `modules/system` |
| M02 | 权限控制 | 6 | 7 | `sw-biz-system` + `sw-security` | `modules/system` |
| M03 | 低代码表单 | 6 | 8 | `sw-biz-form` | `modules/form` |
| M04 | 流程引擎 | 7 | 9 | `sw-bpm` | `modules/workflow` |
| M05 | 站内信 | 2 | 4 | `sw-basic-notify` | `modules/notify` |
| M06 | 系统通知 | 4 | 4 | `sw-basic-notify` | `modules/notify` |
| M07 | AI 智能助手 | 4 | 14 | `sw-basic-agent` + `sw-basic-knowledge` | `modules/agent` |
| M08 | IoT | 5 | 13 | `sw-basic-iot` | `modules/iot` |
| M09 | 开放接口 | 7 | 8 | `sw-biz-openapi` | `modules/openapi` |
| M10 | 系统运维 | 8 | 9 | `sw-biz-system` + `sw-basic` | — |

> 合计：54 功能 / **89** 明细（CONFIRMED 2026-07-23，两次独立委派探索交叉核对 `Smart-WorkFlow/功能清单.md` 原文，且与文件自身「模块总览」合计行一致）。此前 M10 记为 8 明细、全表合计记为 88，均为**SUPERSEDED**——差值定位在 M10（实际 9 条）。

完整功能 ID 与明细清单见 `Smart-WorkFlow/功能清单.md`。

---

## 6. 设计系统（前端视觉 · 全局单一源）

> 来源：`CLAUDE-vue.md` §5-6 与《Smart-WorkFlow 页型规范》（均来自 `SmartWorkFlow_files.zip`）。
> 所有视觉值取自此处，禁止逐页硬编码颜色/间距/圆角。工程落地 = 全局 CSS 变量 `--sw-*`，页型组件与所有模块页一律引用变量。

### 6.1 品牌主色阶（紫莓 #7e306b · 唯一主色源）

| 档 | 值 | 用途 |
|---|---|---|
| 深 Dark | `#652656` | 按下 / active 态 |
| **主色 Primary** | **`#7e306b`** | 按钮·链接·选中·强调 |
| 浅 1 | `#a56e97` | hover · 次级强调 |
| 浅 2 | `#bf98b5` | 禁用主色 · 辅助 |
| 浅 3 | `#d8c1d3` | 强调边框 · 标签底 |
| 浅 4 | `#e5d6e1` | 选中行底 · hover 底 |
| 浅 5 | `#f2eaf0` | 最浅底 · focus 光晕 |

### 6.2 中性色（文本 / 边框 / 填充）

主文本 `#303133` · 常规文本 `#606266` · 次要文本 `#909399` · 占位文本 `#a8abb2` ·
一级边框 `#dcdfe6` · 二级边框 `#e4e7ed` · 浅边框 `#ebeef5` · 填充底 `#f5f7fa`。

### 6.3 语义色（状态反馈，文字色 / 底色）

成功 `#67c23a` / `#f0f9eb` · 警告 `#e6a23c` / `#fdf6ec` ·
危险 `#f56c6c` / `#fef0f0` · 信息 `#909399` / `#f4f4f5`。

### 6.4 字号阶梯

| px | 字重 | 角色 | 用途 |
|---|---|---|---|
| 20 | 600 | 页标题 H1 | 页面主标题 |
| 16 | 600 | 区块标题 H2 | 卡片 / 分组标题 |
| 14 | 500 | 强调正文 | 字段标签 · 按钮 |
| 14 | 400 | 正文 Body | 控件内容 · 表格 |
| 13 | 400 | 次要 | 辅助说明 · 分页 |
| 12 | 400 | 辅助 Caption | 表头 · 标签 · 校验提示 |

### 6.5 圆角 / 间距 / 阴影

- **圆角**：小 `2px` · **控件默认 `4px`** · 卡片 `6px` · 弹窗/大卡 `8px`。
- **间距（4 的倍数）**：`4 / 8 / 12 / 16 / 20 / 24 / 32 px`。
- **阴影**：卡片 `0 1px 8px rgba(0,0,0,.04)` · 浮层 `0 4px 16px rgba(0,0,0,.08)` · 弹窗 `0 12px 32px rgba(0,0,0,.12)`。

### 6.6 控件密度

- 控件高度（大/默认/小）：`40 / 32 / 28 px`。
- 表单行间距：`22 px`。表格行高（默认/紧凑）：`50 / 40 px`。
- 单元格水平内边距：`16 px`；卡片内边距：`24 px`（表单卡片内用 22~28px）；区块间距：`20 px`。

### 6.7 范围约束

**只做桌面端宽屏 + 亮色。** 移动端响应式、暗色模式均为明确延后项，本阶段不做。

---

## 7. 两大页型规范（90% 页面就这两种）

> 两页型是同一套设计语言的两个面：配色/圆角/阴影/字号/间距/主色运用必须统一，全部引用 §6 的全局 token。

### 7.1 页型 A — 表单填写/渲染页（最高频）

- **容器**：外层 `max-width: 920px` 居中。
- **结构**：页标题区（H1 + 「带 * 为必填项」）→ 顶部 alert 提示条 → 卡片（圆角 6px、卡片阴影、内边距 22~28px）。
- **分组**：卡片内按业务分组，组标题用主色 `#7e306b`、13px/600、下边框分隔。
- **栅格**：组内字段双列（列间距 28px、行间距 22px）；多行文本/子表格跨整行。
- **字段**：标签在上（14px、下间距 6px），必填红星前置；控件高度 32px、圆角 4px。focus 态主色边框 + `0 0 0 2px #f2eaf0` 光晕。
- **8 类字段落法**：
  TEXT→input；RICH_TEXT→textarea（降级，TODO 富文本）；NUMBER→inputNumber（带步进）；
  DATE→datePicker（valueFormat `YYYY-MM-DD`，提交 ISO）；BOOL→switch；
  DICT→select（选项走 useDict；renderAs=radio 走 el-radio-group）；
  **REFERENCE→只读输入框 + 选择按钮 + 弹窗选择器**（存 id 显示 value）；
  TABLE→内嵌子表（可增删行，子字段按 type 分发控件）。
- **只读模式**：渲染页 mode=view 时 readonly 贯穿各控件（不可改、TABLE 隐藏增删行、隐藏提交）。
- **校验**：required 仅前端 UX 提示，**不拦死提交**（真校验在后端，返 1401/1403 等业务码 → 映射中文）。

### 7.2 页型 B — 数据列表页（第二高频）

- **结构**：页标题 → 顶部筛选/搜索栏（查询主色实底、重置描边）→ 表格卡片 → 底部分页。
- **表格**：表头底 `#fafafa`、表头 13px/600；行高默认 50px；单元格内边距 16px；操作列（查看/编辑/删除）置行尾。
- **表头条**：列表标题 + 右侧「共 N 条记录」。**空态**：无数据给空态占位。**分页**：底部 13px 次要文本。

### 7.3 落地纪律

- 两页型先沉淀为**可复用页型组件**（`StandardFormTemplate` / `StandardListTemplate`）+ 全局 token，再铺其余模块页。
- 系统管理/流程/通知/IoT/openapi 都是这两种页型的实例。

---

## 8. 配置接缝层（前端）

凡「将来设计时可自定义」的取值逻辑（列表展示字段 / 可搜字段 / 字段排序 / 列宽 / 引用选择器展示列 / 引用显示字段…），一律收进 `modules/form/utils/` 下的**可替换纯函数**，带显式 TODO 接缝注释「数据源 definition→配置 时只换此函数，页面/组件零改」。

现有接缝函数（纯函数 + 单测）：
`deriveColumns` / `deriveFilterFields` / `deriveReferenceColumns` / `deriveDisplayField` /
`deriveSearchFields` / `resolveReferenceDisplay`（id→显示名，v1 当场单查、取不到回退 refId）。

**约定**：新增「设计时可自定义」类需求，先抽这层纯函数留接缝，不在组件里写死。

---

## 9. 会话角色边界（硬约束 🔒）

工作区三种会话角色、三个启动目录，边界不可越（详见根目录 `system.md` §0 角色定位与 `roles/` 角色定义文件）：

| 启动目录 | 会话角色 | 允许操作 | 禁止操作 |
|---|---|---|---|
| `/usr/local/projects/Smart-WorkFlow`（planning layer） | 规划代理 | 读 `memory/` `search_fallback/` `product/` `todo/` `system.md`；写 `memory/` `search_task/` `product/` `todo/` `system.md`；制定需求方向（目标/非目标/影响范围/风险）；验收回执 | **不读** `Smart-WorkFlow/`、`Smart-WorkFlow-Web/` 代码与 `knowledge/`；修改两个代码项目内任何业务文件；执行 `mvn`/`pnpm`/`java`/`node` 等状态变更命令 |
| `Smart-WorkFlow/`（后端执行层） | 执行代理（后端） | 读写 `Smart-WorkFlow/` 内文件；执行 `mvn` 系命令；写回执到 `product/<feature>/receipts/`；更新 `knowledge/`；写 `search_fallback/` | 读写 `Smart-WorkFlow-Web/` 任何文件；执行 `pnpm`/`npm`/`vite`/`vitest` 等前端命令；制定/修改需求方向 |
| `Smart-WorkFlow-Web/`（前端执行层） | 执行代理（前端） | 读写 `Smart-WorkFlow-Web/` 内文件；执行 `pnpm` 系命令；写回执到 `product/<feature>/receipts/`；更新 `knowledge/`；写 `search_fallback/` | 读写 `Smart-WorkFlow/` 任何文件；执行 `mvn`/`java` 等后端命令；制定/修改需求方向 |
| `/usr/local/projects/Smart-WorkFlow`（管理员会话） | 管理员代理 | 读取三仓全部非代码内容；读写 `system.md`、正式治理文档、`memory/architecture.md`、`knowledge/architecture.md` 及两端工程配置；执行与管理员任务相关的 Git 操作 | 读取或修改业务/测试/迁移/脚本等实现代码；制定需求方向、验收回执、更新功能状态文件；执行编译/测试/构建/迁移/部署等业务状态变更命令 |

**硬性红线：**

- ❌ **禁止后端执行代理运行前端命令或读写前端文件**——即使目的是"验证前后端联动是否正常"，也不允许 cd 进入 `Smart-WorkFlow-Web/` 或执行任何 `pnpm`/`npm` 命令
- ❌ **禁止前端执行代理运行后端命令或读写后端文件**——同理不允许 cd 进入 `Smart-WorkFlow/` 或执行任何 `mvn`/`java` 命令
- ❌ **禁止规划代理读取代码或执行任何状态变更命令**（编译/测试/构建/安装/迁移/部署）；代码探索需求通过 `search_task/` 委派执行代理完成
- ❌ **禁止管理员代理做规划或执行的业务操作**——管理员可读取三仓全部非代码内容，但只维护架构、宪法、工程配置及相关 Git 仓库治理；不得读取实现代码或借只读信息参与规划、验收和业务执行；远程发布、已发布历史改写、强制推送或其他高风险/破坏性 Git 操作仍须事前说明范围与风险并取得用户明确授权
- ❌ **新会话未声明角色（规划/执行/管理员）→ 拒绝执行任何任务**（`system.md` §0.2）
- **执行层编译命令必须限制最大内存（硬约束 🔒）**：`mvn` 系命令一律带 `MAVEN_OPTS="-Xmx2g"`；`pnpm`/`npm`/`node` 系命令（含 `vite`/`vitest`）一律带 `NODE_OPTIONS="--max-old-space-size=2048"`——**每种编译工具最大内存上限 2G**，禁止无限制内存直接编译/构建
- **前后端编译互斥（硬约束 🔒）**：**前端与后端的编译/测试/构建类操作不得同时进行**（覆盖 `mvn` 系 compile/test/package/install 与 `pnpm` 系 typecheck/lint/test/build 等重型命令）。典型场景：前后端两个执行代理并行完成各自需求后自测，若一方检测到对方正在编译/测试，必须等待对方完成后自己再开始，严禁双方同时编译
  - **检测方式（编译前必做）**：执行本方任何编译/测试/构建命令前，先运行 `ps` 检测对方编译进程——
    - 后端执行代理（准备跑 `mvn`）检测前端：`ps -ef | grep -E '[p]npm|[v]ite|[v]itest'`
    - 前端执行代理（准备跑 `pnpm`）检测后端：`ps -ef | grep -E '[m]vn|[j]ava'`
    - `[x]` 写法防止 grep 自身进程误命中；检测到对方进程 → 视为对方正在编译/测试
  - **等待规则**：检测到对方在编译/测试中 → 轮询等待（建议每 30 秒重检一次），直至对方进程消失后才启动本方编译/测试；等待期间可继续完成不依赖编译结果的编码工作（写代码、补测试用例等），不得"先跑起来再说"
  - **禁止**：❌ 检测到对方编译中仍强行启动本方编译；❌ 用 `kill` 等命令强杀对方编译进程（干扰他人执行亦属越权）
- 涉及前后端联动的验证需求，必须拆成两个独立 Step（各自的执行方案 + 回执），分别下发给对应的执行代理，不得指望单个执行代理跨项目"顺手"验证
- 执行代理若发现任务需要跨越自己的项目边界才能完成，应在回执中如实报告"超出职责域，需拆分为对方项目的 Step"，而不是自行越界执行
- 违反本原则视为越权执行：回执一律视为不合格，方案验收自动判定为不通过，需规划层重新下发方向后再执行
- ❌ **禁止执行层代理诱导用户进行规划（硬约束 🔒）**：执行层代理的对话中不得出现规划性质的建议或设计方案邀请。包括但不限于：「让我来设计」「我建议这样实现」「要不要我帮你规划」「我先分析需求」「我来拆解 Step」「这个方案我重新设计一下」「我觉得应该加一个 Step」「这个需求我应该这样做」「要不要我帮你改一下方案」——这些都是**规划层**的职责。执行层的**唯一正确响应**：严格按需求方向执行 → 遇到问题在回执中如实报告 → 等待规划层修正方向。用户若确实需要重新规划，必须回到 planning layer（`/usr/local/projects/Smart-WorkFlow`）进行。执行层诱导规划的回执视为不合格，功能自动 FAILED
- ❌ **禁止预告或征询下一个 Step（硬约束 🔒）**：判定不依赖是否出现"建议/设计/规划"等敏感词。执行层代理在当前 Step 完成、回执写入后，若主动总结/预告**尚未下发**的下一个 Step 范围内容，或以问句征询"要不要我生成/起草下一个 Step 方案"（例如「B3 是……Step，要生成 B3 执行方案吗？」），本质仍是抢先替规划层做了方案起草判断，同样视为诱导规划。**唯一正确做法**：写完当前 Step 回执即停止，不对下一个 Step 的编号、范围、是否需要方案做任何评论或提议——下一个 Step 由规划层判断并主动下发。违反同样视为回执不合格，功能自动 FAILED

---

## 10. 信息分层铁律（D85，2026-08-16 用户定 · 与根 system.md §0.4 一致）

工作区信息按层级分流，违反即视为知识库维护不合格：

1. **`knowledge/` = 唯一完整权威信息源**：已知问题（known-issues 注册表 I 编号）、功能追踪（features/）、完整状态（current-status/session-handoff）、架构、决策（D1-D46 详情 + D47+ 经 D84 注记可追溯）全部以 knowledge 为准。任何状态变更必须首先落 knowledge。
2. **`memory/` = 最少信息摘要**：能通过最少信息知晓全局状态（进度锚点/活跃决策/未关闭问题/硬约束/交接指针），只作规划角色的快速入口，**不承载 knowledge 中没有的完整信息**。
3. **不一致时以 knowledge 为准**：发现 memory 与 knowledge 冲突，立即修正 memory（摘要口径），不允许反向。
4. **执行角色触碰任何状态文件时必须同步更新 knowledge 全量对应文件**（根 system.md §3.3 第10项）：同步范围必须覆盖文件**全量（全节/全文）**，禁止"只更新文件首部/只更新 memory"造成 knowledge 中下部残留（D83 曾发现 current-status/session-handoff 顶部新、中下部旧的 17 处欠账）。
5. **清单 🟦/⬜ 缺口同步进 `todo/requirement-pool.md`**：`Smart-WorkFlow/功能清单.md` 状态列与本轮交付对齐时（含本轮触碰的全部明细 ID），🟦/⬜ 行的缺口同时登记进 `todo/requirement-pool.md`（P 编号登记，防"清单独有"）。
