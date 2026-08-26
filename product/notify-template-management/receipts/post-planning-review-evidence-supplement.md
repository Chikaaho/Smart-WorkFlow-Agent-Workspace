# 补证回执 — P36 规划审查缺口 G1—G4 核销（2026-08-26）

> 审查对象：`planning-review-20260826.md`（VERIFYING）
> 本回执为追加补证，不覆盖 `completion-receipt.md`；已锁定项 A1、A3、A4、A5、A6、A7 未重验、未改动产品语义
> 回执口径更正：原完成回执末尾「9/9 项」为笔误，方向 §8 实际为 **11 项**验收边界（A1—A11），以本回执第五节矩阵为准

---

## G1 — 停用/删除后的预览拒绝

**原缺口**：仅有发送拒绝证据，缺预览拒绝的直接行为证据。

**实际动作**：采用最小改码方案。方向 §8 标准 2 要求「停用或删除模板不能继续**预览**或发送」，而原实现 preview 端点按提交内容渲染、不查模板可用性——属实现与方向的偏差。修复：
- `NotifyTemplateService` / `NotifyTemplateServiceImpl` 新增 `previewByCode(code, variables)`：先 `requireEnabledByCode`（与发送链同源）再渲染；
- `NotifyTemplateController` 新增 `POST /notify/templates/{code}/preview`（权限同 `notify:template:view`）；
- 既有 `/preview` 纯内容端点保持不变（管理页编辑草稿场景），两处 JSDoc 注明语义边界；
- Mock handler 同步新增同路径拒绝逻辑（404 同消息）；evidence spec 追加 3 用例。

**原始行为输出**（命令真实执行）：
```
cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-basic/sw-basic-notify/sw-basic-notify-biz test
Tests run: 16 -- NotifyTemplateIntegrationTest   （原13 + 新增G1用例3：停用拒/删除+不存在拒/启用渲染正确且零落库）
Tests run: 12 -- NotifyTemplateSecurityIntegrationTest
Tests run: 10 -- NotifyControllerIntegrationTest
Tests run: 3  -- NotifyMessageIntegrationTest
模块合计 Tests run: 41, Failures: 0, Errors: 0, Skipped: 0
```
副作用断言：停用/删除代码预览被拒前后 `sw_notify_message` 计数相等（零通知残留），模板行状态未被预览改变。

**是否修改文件**：是（上列 4 个后端文件 + handlers.ts + evidence spec）；已锁定项测试断言逐字未动（16 = 原 13 + 新 3，原 13 全部保留通过）。

**核销结论**：✅ 已核销。按代码预览路径下停用/删除/不存在模板均 NOT_FOUND 拒绝，行为证据完整。遗留口径说明（不构成缺口）：纯内容预览仍可渲染任意提交文本，属编辑场景设计边界，已在代码注释与本回执双处声明。

---

## G2 — 权限、菜单与路由真实可达性

**原缺口**：仅结构证据（注解/seed/按钮显隐），无真实身份链。

**实际动作**（Sub Agent 执行 + 父代理复验 surefire 输出一致）：

### Part A 后端三类身份真实请求链（走完整 Spring Security 过滤链：JwtAuthenticationFilter → JWT → LoginUserLoader → @EnableMethodSecurity → 真实 "ss" PermissionService Bean）

新建 `sw-basic-notify-biz/src/test/java/com/sw/ck/notify/controller/NotifyTemplateSecurityIntegrationTest.java`：

```
命令：MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-basic/sw-basic-notify/sw-basic-notify-biz test -Dtest='NotifyTemplateSecurityIntegrationTest'
输出：Tests run: 12, Failures: 0, Errors: 0
```

| 身份 | 操作 | 实测结果（原始响应） |
|---|---|---|
| 未认证（无 token） | POST 创建/toggle/DELETE/send/GET 列表 | HTTP 401，body `{"code":401,"msg":"未认证"}`；数据零变化 |
| 仅 notify:view（普通通知用户，userId=5） | 同上全部管理操作 | HTTP 403，body `{"code":403,"msg":"无权限"}`；目标行 enabled/deleted 未变、零落库 |
| 持 notify:template:manage 非超管（userId=7） | 创建/toggle/DELETE/send | HTTP 200 code=0；创建落库 tenant_id=100/create_by=7；send 渲染落库 title=`你好 张三` bizType=SYSTEM |
| GET 列表 view 权限映射 | userId=5（仅 notify:view）→403；userId=8（仅 notify:template:view）→200 total=2 |

pom 净变更：无（临时加 spring-security-test 经 stash 对照证实非必需后 revert；agent 先例 pom 亦未声明）。

### Part B 前端菜单→路由→守卫行为链

新建 `src/router/notify-template-access.evidence.spec.ts`（importOriginal 保留 buildRoutesFromMenu 真实实现）：

```
命令：NODE_OPTIONS="--max-old-space-size=2048" pnpm vitest run src/router/notify-template-access.evidence.spec.ts
输出：Test Files 1 passed, Tests 9 passed (9)
回归：src/router/ 目录 4 文件 28 tests → 5 文件 37 tests 全通过（+9 零失败）
```

实测值：V38 形态菜单树生成 `notify/inbox` 与 `notify/template` 路由，component 解析到磁盘上的 NotifyHome.vue / NotifyTemplateList.vue 组件对象（白名单命中，unknown component warn=0 次）；目录 redirect=`notify/inbox` 且随 sort 变化跟随；按钮节点（menuType=2）不产路由。
**守卫机制如实报告**：guard.ts 只做登录态判断，不消费 meta.authority——有 token 即放行路由；前端权限的真实防线是 Part A 的后端 @PreAuthorize（前端 hasPerm 仅 UX 显隐）。meta.authority 与菜单 permission 字符串一致（`notify:template:view`）。

**是否修改文件**：新增两个 spec 文件 + G4 节所述 typecheck 最小修复（afterAll 导入 + 显式类型断言，运行时语义不变）。生产源码零修改。

**核销结论**：✅ 已核销。未认证/普通用户/授权非超管三类身份的后端请求链 + 前端菜单→路由→守卫链均有真实执行输出。

---

## G3 — Mock 行为与真实契约等价

**原缺口**：无 Mock handler 执行输出。

**实际动作**：新建 `src/foundation/mock/notify-template-handlers.evidence.spec.ts` 直接调用 `dispatchMock` 执行真实 handler。

```
命令：NODE_OPTIONS="--max-old-space-size=2048" pnpm vitest run src/foundation/mock/notify-template-handlers.evidence.spec.ts
输出：Test Files 1 passed, Tests 16 passed (16)   （初版13 + G1同步追加3）
回归：src/foundation/mock/ 10 files/148 tests → 11 files/164 tests 全通过
```

场景级实际输出与真实契约对照（code + message 关键词）：

| 场景 | Mock 实际输出 | 对照 |
|---|---|---|
| 分页列表 | code=0，total=3，id 降序 | 一致（orderByDesc(id)） |
| 新建合法 | code=0 返回新 id；列表 +1 | 一致 |
| 重复代码 | code=400「模板代码已存在」 | 一致（requireCodeAvailable→PARAM_ERROR） |
| 编辑改 templateCode | code=400「模板代码不可变更」 | 一致 |
| 正常编辑 | code=0；详情五字段全更新 | 一致 |
| 停用→发送 | toggle code=0；send code=404「模板不存在或未启用」 | 一致（requireEnabledByCode→NOT_FOUND） |
| 停用代码预览（G1 后） | code=404 同消息 | 一致（新 previewByCode 同构） |
| 预览缺变量 | code=400「缺少变量」 | 一致（TemplateRenderException→PARAM_ERROR） |
| 预览非法占位符 ${1abc} | code=400「非法占位符」 | 一致 |
| 合法渲染→发送→收件箱 | preview title/content 与 messages 列表落库内容**逐字一致**，bizType=SYSTEM | 一致（同一渲染函数） |
| DELETE 不存在 id | code=0 幂等，种子数不变 | 一致（@TableLogic） |
| 失败原子性 | send 缺变量 code=400；前后消息数相等、无 `${` 半成品 | 一致 |

已知同构差异如实记录：内容式 preview 不校验模板启用态（真实后端 renderPreview 同样只校验非空）——Mock 与真实行为完全一致；模板可用性检查在按代码预览与发送两条路径闭合（G1）。

**是否修改文件**：新增 evidence spec（handlers.ts 的 G1 同步见 G1 节）。

**核销结论**：✅ 已核销。12 类场景均有 dispatchMock 真实执行输出并与后端契约逐项对照。

---

## G4 — 迁移与编译互斥的可复现原始证据

**原缺口**：H2/PG 全链未附命令；互斥检测无原始快照。

### 迁移全链实际命令与输出（本轮真实重跑）

```
① cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-bootstrap test -Dtest='FlywayFullChainH2Test'
   → exit 0；surefire: Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
   （日志含一处 ERROR 行系 P24 负例用例 flyway_p24_conflict 的预期 assertThrows 输出，非失败）

② cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-bootstrap test -Dtest='FlywayFullChainPostgresTest'
   → exit 0；surefire: Tests run: 10, Failures: 0, Errors: 0, Skipped: 0
   （tail 原文：「Successfully applied 38 migrations to schema "public", now at version v38」）
```

可复算：38 条迁移 = V37 前 37 条 + 本轮 V38；H2/PG 双方言镜像。

### 编译互斥原始进程快照（两组，带时间戳原文）

快照 A（后端门禁前检查前端进程）：
```
2026-08-26 11:08:45
PS_EXIT=1        ← ps aux | grep -E "pnpm|vite|npm" | grep -v grep 无任何输出行
```
随后后端 `mvn -q -pl sw-basic/sw-basic-notify/sw-basic-notify-biz compile` → exit 0。

快照 B（前端门禁前检查后端进程）：
```
2026-08-26 11:09:07
PS_EXIT=1        ← ps aux | grep -E "[m]vn " | grep -v grep 无任何输出行
```
随后前端 `pnpm typecheck` → 首跑 exit 2（两处 TS 错误位于 G2 新增 evidence spec 文件：缺 afterAll 导入、隐式 any 索引），最小修复（补导入+显式断言，不改运行时语义，该 spec 9 用例复验通过）后复跑 → exit 0。

父代理复验记录（本回执撰写前）：`pnpm typecheck` exit 0；`mvn -q -pl sw-basic/sw-basic-notify/sw-basic-notify-biz test` 后 surefire 显示 41/0/0/0；`pnpm vitest run src/foundation/mock/ src/router/ src/modules/notify/` → 19 文件 225 用例全过；lint --fix 后 0 error 0 warning。

**是否修改文件**：G2 evidence spec 的 typecheck 修复（2 处，见上）。

**核销结论**：✅ 已核销。迁移链有可复现命令+原始计数；互斥有带时点的双向原始快照及紧随的门禁执行。

---

## 补证期间的新增计数汇总（§4.1 第 7 条增量来源说明）

| 计数项 | G1 前 | 补证后 | 增量来源 |
|---|---|---|---|
| NotifyTemplateIntegrationTest | 13 | 16 | G1 新增 3 用例 |
| NotifyTemplateSecurityIntegrationTest | — | 12 | G2 新建（全新文件） |
| notify-biz 模块合计 | 26 | 41 | 上两项 + 既有 10+3 |
| notify-template-handlers.evidence.spec | — | 16 | G3 新建 13 + G1 同步 3 |
| notify-template-access.evidence.spec | — | 9 | G2 新建 |
| src/foundation/mock 目录 | 148 | 164 | +16（evidence spec） |
| src/router 目录 | 28 | 37 | +9（access spec） |

全量基线影响说明：本轮补证新增 1 个后端测试文件（12）+ 3 个用例 + 2 个前端 spec 文件（25 用例），均为补证专用；若规划要求刷新全量基线数字，需在阶段三终态同步中以实际全量重跑输出为准（本轮按审查约束未重跑全量 855 口径，仅在受影响范围内回归）。

## 五、11 项验收边界最终矩阵（更正原「9/9」口径错误）

| 编号 | 结论 | 依据 |
|---|:---:|---|
| A1 同租户唯一/跨租户隔离 | PASSED·锁定 | 原回执（未重验） |
| A2 CRUD 闭环+停用删除不可预览发送 | ✅ 本轮补齐 | G1：发送拒绝（原有）+ 按代码预览拒绝（新增 3 用例行为输出） |
| A3 替换正确/预览=落库 | PASSED·锁定 | 原回执 |
| A4 落库前拒绝零残留 | PASSED·锁定 | 原回执；G3 失败原子性场景再次印证 |
| A5 额外变量无效/防注入 | PASSED·锁定 | 原回执 |
| A6 历史稳定 | PASSED·锁定 | 原回执 |
| A7 直发与既有链路不回归 | PASSED·锁定 | 原回执；补证期间既有 10+3 用例持续全绿 |
| A8 权限/菜单/路由真实链 | ✅ 本轮补齐 | G2：三身份 401/403/200 原始响应 + 菜单→路由→守卫 9 断言 |
| A9 Mock 与真实等价 | ✅ 本轮补齐 | G3：dispatchMock 16 用例执行输出 + 12 场景对照表 |
| A10 迁移/门禁/互斥可复现 | ✅ 本轮补齐 | G4：双链命令+38 条输出 + 两组带时点快照 |
| A11 只核销 P36/M05-F02-01 | 范围纪律维持 | 本回执仍未核销编号、未动基线登记、主方向仍在 ready/；待规划 PASSED 后按阶段三协议执行 |

## 六、自检矩阵（executor §4.2 第 12 条）

| 自检项 | 结果 |
|---|:---:|
| 四个缺口各自形成独立证据包（动作/输出/断言/反向排除/修改文件） | 是 |
| 测试计数与命令输出逐字一致 | 是（各节引用 surefire/vitest 原文） |
| 已锁定项未重验、产品语义未变 | 是（A1/A3-A7 断言逐字保留并通过） |
| 无「检测为空」类无原始行汇总词 | 是（G4 附 PS_EXIT 快照原文） |
| 功能状态未自行推进（无 COMPLETED/P36 核销/基线登记/方向移动） | 确认 |
| 更正原回执 9/9 口径为 11 项 | 是（本回执开头声明） |

---

**G1—G4 全部核销完毕，功能保持 VERIFYING·待规划复核**
