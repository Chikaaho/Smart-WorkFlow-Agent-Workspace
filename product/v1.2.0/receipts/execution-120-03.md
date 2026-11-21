# 1.2.0 第三批执行回执（execution-120-03）

日期：2026-11-21｜执行（Executor）｜覆盖：E1-6 表单侧（收口阶段 2 全部实施项）｜自验通过，待规划验收

## 1. Git 事实

| 仓 | 提交 | 内容 | 远端回读 |
|---|---|---|---|
| Server | `6585a403` | E1-6：`FormGraphActionRules`（schema.graphActions 解析）+ `FormGraphActionService`（提交前/按钮执行、系统身份、FORM 业务关联）+ `FormGraphActionController`（按钮端点）+ 提交钩子 + pom（agent-api）+ `.last` 语料 138→139 | `6585a4030249` 一致 |
| Web | `120742c` | E1-6：`FormGraphActionsDialog`（设计器配置弹窗，声明驱动映射编辑）+ 设计器接线（toolbar/schema 回显/buildDefinition）+ `FormRender` 按钮渲染与出参回填 + form api + i18n | `120742c53ecc` 一致 |

## 2. E1-6 实现（表单「调用 Graph」服务端动作）

- **配置**：表单定义 JSON 根 `graphActions` 段（契约 `FormGraphActionConfig`，随定义版本化——与显隐规则/打印模板同一附加段模式）。动作 `{id, name, trigger: BEFORE_SUBMIT|BUTTON, graphDefId, graphDefVersion(固定版本), inputMappings[图入参←表单字段], outputMappings[表单字段←图出参], timeoutSeconds}`。设计器弹窗：已发布图下拉 → 版本下拉 → 绑定声明驱动映射行（参数/输出名从声明列选、字段从表单字段选，不手写）；含人工节点醒目告警；超时上限锁定 ≤ 图执行超时。
- **提交前**（BEFORE_SUBMIT）：`FormSubmitService.submitForm` 在字段校验后、写库前钩子执行——失败抛业务异常（1400 族→`R.fail`）**阻止提交并提示原因**；成功出参按映射回填进提交载荷随记录落库。字段校验按用户输入执行，图输出按映射直接回填（口径：图输出是服务端受信值）。
- **按钮**（BUTTON）：`POST /form/data/{formKey}/graph-actions/{actionId}`（权限 `form:data:submit`，body `{recordId?, fieldValues}`）→ 服务端执行 → 返回 `{field: value}` 回填映射；前端 FormRender 提交区渲染动作按钮，成功回填字段，**失败只提示、不清空已填内容**；幂等键 `form-graph:{formKey}:{actionId}:{recordId}`（编辑态重复点击去重）。
- **执行口径与流程侧一致**：系统身份（userId=0、username=form-graph-action、当前租户）经 `AgentGraphInvokePort.invoke`（FORM 来源、nodeId=动作 id、formRecordId、E1-7 关联落库）；入参字段缺失/空白直接拒绝并点名字段；智能体模块未装配时配置了动作则明确报错（fail closed）。全程服务端，不经前端脚本解释器。
- E1-7 表单侧回查（`listByFormRecord`）端口已具备；表单记录详情页展示属验收阶段 UI 增量，若规划需要可随 iso120 批次补（方向 E1-7 证据清单未单列表单详情区块，只要求 DB 关联列值——已具备）。

## 3. 验证

- Server：form-biz `-am` 全量 `mvn test` 绿（50+11+57；`.last` 语料门禁 139 绿）；compile BUILD SUCCESS。
- Web：typecheck 零错误；变更文件 eslint 0 error；form 模块 vitest **475/475 绿**（含既有设计器/渲染全部回归）。

## 4. 阶段 2 实施收口状态

| 项 | 状态 |
|---|---|
| E1-1~E1-4、E1-7、E1-8 | 已实现（回执 120-02 §2） |
| E1-6 | 已实现（本回执） |
| E2 | 已实现（回执 120-02 §3） |
| E1-3/E1-4/E1-6 语义待规划确认项 | 异常分支=CONTINUE+条件分流（120-02 §5-1）；business_source 存量 NULL 展示 DIRECT（120-01 §9） |
| E1-5 | 裁定前按发布拒绝实施（含子图递归）；**等 §3 问题 1 裁定**（推荐：本版维持拒绝，挂起回调另立项） |
| 阶段 3 iso120 | 未开始——浏览器证据（E1/E2/E3-1 全清单）+ 九库多库迁移证据 + Server 全量 `mvn test` + Web 四门禁；E1-5 裁定影响证据范围，随验收批次启动 |

七阶段：已完成 1；阶段 2（实施）**代码完成**，待规划对三份回执验收与两项裁决；未开始 5（3 验收、4 合并、5 发版、6 部署、7 结束）。

## 5. 自验结论

E1-6 完成，阶段 2 全部实施项代码落地并通过适用机器门禁，**自验通过，待规划验收与裁决**（E1-5 方案、异常分支口径、business_source 展示）。
