# P57 BPM 节点扩展 E1-E7 执行补证回执

- 对应审查：`product/p57-bpm-node-extension/receipts/planning-review-p57-bpm-node-extension-02.md`
- 对应执行提示：`product/p57-bpm-node-extension/receipts/planning-execution-prompt-p57-bpm-node-extension-01.md`
- 执行角色：Executor
- 执行级别：XL
- 执行日期：2026-09-02
- 当前功能状态：`VERIFYING`
- 合法终态：`EXECUTION_SUBMITTED`
- 原始输出附件：`product/p57-bpm-node-extension/receipts/attachments/execution-output-e1-e7-20260902.txt`

## 1. 固定上下文与边界

- Server 工作目录：`/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server`，HEAD：`04963259f589b1985495662e3f29ab00bfb92607`。
- Web 工作目录：`/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web`，HEAD：`6384f86a3f2f2410b2db7e4d24c09334f7a4505f`。
- 本轮没有 commit、push、远程部署或生产数据库迁移；未覆盖既有工作树改动。
- 只新增 P57 隔离 profile/fixture、P57 Web workflow 逻辑、G6 原始输出测试和本回执/附件；没有把 `P57_VERIFY` 加入正式生产 translator 目录，也没有触及 P58。

## 2. E1：隔离扩展真实应用链

已修复并验证到真实重建应用启动阶段：

- 新增 `P57_VERIFY` profile-only translator/delegate，显式使用 `p57-evidence` 才装配；非法重复、非法类别、缺能力三种 profile-only fixture 同样不会进入默认 profile。
- Web 编辑器已根据真实能力接口决定中间节点；在能力清单包含 `P57_VERIFY` 时组装 `START → P57_VERIFY → END` 并提交 `message` 配置，默认仍保留 APPROVAL 路径。
- 重新执行 `mvn -pl sw-bootstrap -am -DskipTests package`，真实 boot jar 构建成功；隔离应用以 `SPRING_PROFILES_ACTIVE=dev,p57-evidence` 启动，日志显示两个 profile、`4 translators`、端口 `8080`，健康检查 HTTP `200`。
- 正式 translator 目录扫描未发现 `P57_VERIFY/P57_INVALID/P57_MISSING`，默认资源配置未引用 `p57-evidence`。
- 未认证访问隔离夹具和节点能力 API 均为 HTTP `401`，证明夹具未形成认证旁路。

真实前端登录后的能力识别、配置、保存、发布、启动和可观察结束仍未完成；因此 E1 只记为“启动与代码修复已完成，产品链待真实认证验收”，不记通过。

## 3. E2：双租户普通授权

已新增 `P57EvidenceController` 的隔离夹具：

- 固定租户 `57001/57002`、角色 `57101/57102`、用户 `57201/57202`，用户名带 `p57_` 前缀；创建和清理按固定 ID 精确操作。
- 两个角色各只授予 `workflow:def:view`，接口返回的权限描述也只包含该系统权限，不创建业务数据。
- 创建和清理均受真实 `@PreAuthorize` 保护；控制器只在 `p57-evidence` profile 下装配。

真实普通用户登录和两个租户的能力 API HTTP `200`、逐字段响应对照尚未执行，原因是当前浏览器真实认证停在验证码输入；没有伪造 token。因此 E2 未通过。

## 4. E3：发布失败、启动失败与零写入

本轮完成了失败入口的实现留痕和隔离 Spring 启动错误输出留档：

- `P57_INVALID` profile 输出 `节点类别非法：P57_INVALID.NOT_A_CATEGORY`。
- `p57-invalid-duplicate` profile 输出 `节点类型重复：START`。
- `p57-invalid-missing-capability` profile 输出 `节点缺少必要能力：P57_MISSING，需要 [DESIGN, TRANSLATE, RUNTIME, CONFIG_VALIDATE]`。
- 三次输出均出现 `Application run failed`；原执行会话在错误输出后受控中断，观察到退出码 `130`，不是自然退出码，故不将其包装成 E3 完成证据。

真实应用的预留节点、未知节点、缺审批人、未知审批人类型、非法审批配置五类独立 publish 请求，以及每类请求前后的部署/版本/相关表原始计数，仍未执行；E3 未通过。

## 5. E4：真实设计器与 fail-closed

- Web 全量测试、typecheck、lint、build 均通过；能力清单解析失败、畸形响应、必要字段缺失的阻断逻辑已保留在生产 workflow 代码中。
- 真实浏览器访问 `http://127.0.0.1:5173/workflow/defs` 后到达 `/login?redirect=/workflow/defs`，DOM 显示用户名、密码、验证码和登录按钮。
- 未绕过或代解验证码，因此没有伪造登录后设计器成功保存、接口失败/畸形/缺字段的网络和 DOM 证据。

E4 未通过，唯一当前阻塞是需要真实用户在浏览器登录页面完成验证码认证。

## 6. E5：现有审批主链

本轮后端 Engine/Process 相关回归继续通过，且既有正式能力目录仍是 START、APPROVAL、END；但没有用后台测试或不同实例拼接替代真实页面链路。

真实页面/API 的同一流程定义 ID 下 `设计 → 保存 → 发布 → 发起 → 待办 → DESIGNATED 审批 → 结果/轨迹` 尚未执行；skeleton 兼容入口也未在本轮真实认证态重新勾稽。E5 未通过。

## 7. E6：graph_json 原始值与边界

新增 G6 测试并重跑成功：

- 固定输入：`p57_graph_json` 定义，包含 `opaque` 配置和 `style` 字段。
- 原始 JDBC 查询值、服务层回读值与输入逐字节一致，输出为 `P57_GRAPH_BYTE_EQUAL=true,DB_SERVICE_BYTE_EQUAL=true`。
- 稳定报告：`Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/target/surefire-reports/TEST-com.sw.ck.bpm.process.service.impl.GraphJsonPersistenceIntegrationTest.xml`，tests=1、failures=0、errors=0、skipped=0；原始值位于该 XML 的 `system-out`。
- 新增隔离应用的 `/api/p57-evidence/storage/{id}` 只读原始表、服务回读和 P57 相关表清点；该真实认证接口本轮尚未调用。

E6 的固定输入/DB/服务回读已通过；当前环境实际存量 census 和外部环境存量边界仍需在真实认证后通过该只读接口复核，因此 E6 整包暂不记通过。

## 8. E7：原始输出与测试结果

原始摘录已固定到附件，且 Surefire XML 可定位：

- `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am test`：Engine `33`、Process `72`，退出码 `0`，`BUILD SUCCESS`。
- `NODE_OPTIONS="--max-old-space-size=2048" pnpm test`：`116 passed | 1 skipped` 文件，`1103 passed | 3 skipped` 测试，退出码 `0`。
- `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`：退出码 `0`。
- `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint`：退出码 `0`，当前为 `0` warning。
- `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`：`1832 modules transformed`、`built in 2.19s`，退出码 `0`；仅依赖侧 annotation warning。
- Server/Web `git diff --check`：无输出，退出码 `0`。
- G1、G6、鉴权未认证结果和三次非法启动错误的原始摘录均在附件；G2、E3 HTTP 失败矩阵、E4、E5 的未执行状态也明确标注，未用摘要冒充行为证据。

## 9. 当前结论

本轮已完成可自动执行的修复：隔离 profile-only 扩展、能力驱动的 P57 编辑器路径、可清理双租户普通用户夹具、原始 `graph_json` 输出和稳定证据附件。当前真实应用和前端服务仍保持运行，等待真实认证后继续 E2–E5/E6 的 HTTP、DOM、持久化和同 ID 业务链验收。

由于真实认证尚未完成，本回执不写 `PASSED`/`COMPLETED`，不移动到 `passed/`，不核销 P57；当前合法终态保持 `VERIFYING / EXECUTION_SUBMITTED`。

## 10. 认证后续行为补证（2026-09-02T23:31+08:00）

本节为认证完成后的追加记录，不覆盖前述历史结论。当前真实应用与前端服务未重启，当前浏览器身份为系统管理员；本节所有 ID 和响应均来自当前 H2 实例。

### E1 / E4：真实页面到运行轨迹

- 表单工作台真实 DOM 显示 `P57 验证表单`、`p57_验证表单`、`已发布`、`V2`；发布提示为 `发布成功`。
- 流程定义真实 DOM 显示：`P57 能力扩展验证流程`、`bpm_55cab2eeb80849dd`、`p57_验证表单`、`1`、`已发布`；发布提示为 `发布成功`。
- 编辑弹窗真实 DOM 显示：`开始 → 隔离验证节点 → 结束`、验证消息 `p57-real-app-observed`；保存提示为 `保存成功，图校验通过`。
- 真实 `GET /api/workflow/defs/node-capabilities` 返回 4 个能力项；其中 `P57_VERIFY` 逐字段为：`displayName=隔离验证节点`、`category=TASK`、`topology=1/1/1/1`、必填配置 `message:string:minLength=1`、`version=p57-evidence-v1`、`design/save/publish/run=true`、`systemManaged=true`、`deletable=false`。
- 真实表单填写页提交 `p57-runtime-observed`，返回记录 ID `9b343216-2b2a-45f9-8c18-167066dea421`，页面随后显示 `提交成功，流程已发起`。
- 同一业务单号进入流程监控，实例 ID 为 `4b6de97a-a6e2-11f1-a6fe-66ff24301f3c`。实例详情真实接口返回 `activeNodeIds=[]`，流转记录包含 `node_middle / serviceTask / 隔离验证节点` 和 `node_end / endEvent / End`，证明执行到达结束事件。
- 该实例详情中的业务状态仍为 `RUNNING`；本记录不把“运行时已无活跃节点”包装成业务状态已通过，状态语义缺口保留给后续裁决。

### E2：双租户夹具真实写入回执

真实认证态调用创建夹具接口返回 `200` 对应的前端成功回执：用户 `57201/57001/p57_tenant_a_user` 与 `57202/57002/p57_tenant_b_user` 均只授予 `workflow:def:view`。两个普通用户各自重新登录并请求能力接口的浏览器认证链仍未执行；未伪造 token，因此 E2 仍不记通过。

### E3：非法注册启动

本轮重新启动三个隔离非法 profile，均在注册表装配阶段输出 `Application run failed` 及对应的非法类别、重复类型、缺少能力错误。Spring 关闭钩子未在限定窗口内自然结束，观察到的是超时而非自然非零退出码；因此 E3 的自然退出要求、五类真实 publish 失败请求及逐类原始计数仍不记通过。

### E6：当前实例原始存储与已部署 BPMN

对流程定义 ID `2095170361199505410` 的真实只读验收接口返回：`byteEqual=true`、`p57ProcessDefRows=1`、`p57BindingRows=1`、`p57FlowableDefinitionRows=1`。`rawGraphJson` 与 `serviceGraphJson` 均包含 `START → P57_VERIFY(message=p57-real-app-observed) → END`；已部署 BPMN 返回 `serviceTask`、`flowable:delegateExpression="${p57VerificationNodeDelegate}"`、`node_end` 和两条 sequenceFlow。外部环境存量仍未验证，按原边界保留。

### 收口验证

- 临时开发验收入口已从 Web 路由和源码删除。
- Web `typecheck`、`lint`、`build` 均再次通过；构建为 `1832 modules transformed`、`built in 1.21s`，仅保留依赖侧 annotation warning。
- 后端健康检查仍为 `UP`，数据库为 H2、Redis 为 `UP`。

当前仍保持 `VERIFYING / EXECUTION_SUBMITTED`：E1 的隔离节点真实设计、发布、启动、结束轨迹与 E4 的正常设计器路径已补齐；E2 普通用户双登录、E3 真实失败矩阵/E3 自然退出、E5 APPROVAL 主链和实例业务状态闭合仍未写成通过结论。

清理回执：认证态调用 `DELETE /api/p57-evidence/fixture/ordinary-users` 返回 `{"cleaned":true,"fixture":"p57-evidence-rbac"}`；本轮创建的双租户普通用户夹具已清理。
