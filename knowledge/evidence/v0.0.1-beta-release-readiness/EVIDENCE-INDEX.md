# v0.0.1-beta 发布就绪核验 · 原始证据索引

> 会话角色：执行；任务：`search_task/v0.0.1-beta-release-readiness.md`
> 核验日期：2026-08-30。本目录为原始日志与关键输出，压缩结论在 `search_fallback/v0.0.1-beta-release-readiness.md`。

## 1. 三仓 Git 事实（采集时间 2026-08-30）

| 仓库 | 分支 | HEAD | remote | 工作区 | v0.0.1* tag 本地/远程 |
|---|---|---|---|---|---|
| 根知识仓（Smart-WorkFlow-Knowledge） | main | 2186184 | git@github.com:Chikaaho/Smart-WorkFlow-Knowledge.git | M memory/{decisions,handoff,state}.md；D search_task/verify-three-repository-readme-refresh.md；?? search_task/.archive/、search_task/v0.0.1-beta-release-readiness.md | 无/无 |
| 后端 Smart-WorkFlow | develop | a7e9a54 | git@github.com:Chikaaho/Smart-WorkFlow.git | 干净；与 origin/develop 同步 | 无/无 |
| 前端 Smart-WorkFlow-Web | develop | d8df94f | git@github.com:Chikaaho/Smart-WorkFlow-Web.git | 干净；与 origin/develop 同步 | 无/无 |

`git ls-remote --tags` 三仓均返回空（仅 "From ..." 行，无引用行）。

## 2. 质量门原始日志（本目录）

| 文件 | 命令 | 退出码 | 关键结果 |
|---|---|---|---|
| backend-mvn-test.log | `MAVEN_OPTS="-Xmx2g" mvn test`（后端根） | 0 | 12 模块汇总：**Tests run: 955, Failures: 0, Errors: 0, Skipped: 0**；BUILD SUCCESS 01:05 min；含 `FlywayFullChainH2Test`（Tests run: 15, F0 E0 S0）与 `FlywayFullChainPostgresTest`（Tests run: 12, F0 E0 S0，zonky 嵌入式真 PostgreSQL 17.5） |
| fe-typecheck.log | `NODE_OPTIONS=--max-old-space-size=2048 pnpm typecheck` | 0 | vue-tsc 无错误 |
| fe-lint.log | 同上 `pnpm lint` | 0 | eslint 无错误 |
| fe-test.log | 同上 `pnpm test`（无后端） | 1 | 2 failed（K1-live ECONNREFUSED:8080）+ 3 skipped（tool-real-permission-rejection 探活失败整组跳过）；1055 passed / 1060 |
| fe-test-live2.log | 同上 `pnpm test`（后端+Redis 在线） | 1 | **1 failed / 1059 passed / 1060 / 0 skipped**；唯一失败：`tool-production-menu-chain-live.spec.ts > 普通用户（tooluser/user123）` 登录失败"用户名或密码错误"。`grep -r tooluser` 两仓仅出现在该 spec 注释中，后端无 seed/迁移/夹具创建该账号 → 干净 H2 库上必然失败 |
| fe-build.log | 同上 `pnpm build` | 0 | vue-tsc -b && vite build 成功 |
| fe-dev-server.log | `pnpm dev` | — | VITE v8.1.0 ready 338ms，:5173，无错误输出 |
| backend-dev-boot.log | `mvn spring-boot:run -Dspring-boot.run.profiles=dev` + 随机 SW_CIPHER_KEY | — | H2 新库 **44 migrations 全链成功（v44）**，Tomcat :8080 `/api`，Started 10.469s |
| backend-boot-no-cipherkey.log | 同上但 `env -u SW_CIPHER_KEY` | 1 | **Application run failed**：`AesGcmCipher: AES cipher key must not be null or blank. Set SW_CIPHER_KEY...`（经 bpmVerificationRunner→externalDatasourceServiceImpl→agentAesGcmCipher 依赖链） |

## 3. 干净启动 / Redis 依赖实测

- 无 Redis（6379 refused）：登录 `POST /api/auth/login` HTTP 200 code 0，但随后**所有**带合法 Bearer token 的受保护请求（/auth/menus、/system/auth/menus、/agent/tool/internal）均 `{"code":401,"msg":"未认证"}`；后端日志栈 `RedisConnectionException: Unable to connect to localhost:6379`。
- `redis-server --daemonize yes` 启动后：`/agent/tool/internal` 立即恢复 `{"code":0,...}`。
- 后端 README 环境要求写明「Redis（可选）」「dev 默认 H2 不强制」；本地启动段未提 SW_CIPHER_KEY 与 Redis → 实测两者均为硬依赖（B2/B3）。

## 4. 完整业务链跨对象标识矩阵（全部真实页面 + 真实后端，2026-08-30 00:40–00:55）

| 对象 | 标识 | 证据 |
|---|---|---|
| 管理者账号 | admin / admin123（V4 seed，明文注释"仅 dev"） | 登录跳转 /dict |
| 部门 | Beta验证部 / beta_verify_dept | 部门管理列表行 + "创建成功" |
| 角色 | Beta业务角色 / beta_user_role（勾选 低代码+流程引擎 菜单树） | 角色列表第 3 行 |
| 业务用户 | betauser / Beta业务员 / Beta@12345（绑定 Beta验证部 + Beta业务角色） | 用户列表第 2 行；重登录成功 |
| 表单 | Beta请假申请表；formDefId `087473dd-675d-4f3f-885b-16dee721d088`；formKey `beta请假申请表`；字段 field_1→"请假事由" | 设计器发布"发布成功"；流程创建弹窗表单选择器显示"已发布" |
| 流程定义 | Beta请假审批流程；processKey `bpm_ffefd3ddc8574dc6` v1；单节点审批人=admin（"保存成功，图校验通过"） | 列表状态 草稿→**已发布**；发布后 编辑/发布/删除按钮禁用 |
| 表单提交 | 提交"E2E验证-事由A" → toast「提交成功，流程已发起」，跳转 /workflow/instances | FormRender 真实页面 |
| 业务单号/宽表记录 | `78cef8f1-ea36-4f19-8661-c4be1ff61546`（=submitForm 返回 id=businessKey） | 流程监控行 |
| 流程引擎实例 | `9a7aaa1f-a3c9-11f1-9590-66ff24301f3c` | 实例详情"基本信息" |
| 待办任务 | taskId 尾号 `24301f3c`，admin 待办列表出现「通过/驳回」 | 待办任务页 |
| 审批动作 | admin 点「通过」→ 确认框「审批确认：确认审批通过此任务？」→ toast「审批通过」；待办清空 | 待办任务页 |
| 最终状态 | 实例状态 运行中→**已完成**；admin 已办留痕（起 00:49:30.079 / 止 00:52:50.033） | 流程监控 + 已办任务 |
| 发起人勾稽 | betauser **退出重登录**后流程监控仍见该实例"已完成"；详情含流转记录：审批节点/审批人=系统管理员/已完成/00:49:30.078→00:52:50.035；流程图 Start→审批→End | 实例详情 DOM 全文 |

## 5. 越权与安全

- betauser token → `POST /api/system/user/page`、`POST /api/system/role/page`：**403 无权限**（I53 修复在真实链成立）。
- 无 token → `GET /api/bpm/defs/page`：**401 未认证**。
- 敏感信息扫描（secret/password/api_key/token 正则，排除测试与 ${} 占位）：两仓无硬编码命中；JWT secret 为 `CHANGE-ME` 默认值（生产由环境变量注入，README 已注明）；种子密码 admin123 注释标明仅 dev。
- 浏览器控制台：IAB 无法直接导出 console；整链无 vite 报错、无错误遮罩、无白屏/404；成功/失败提示与后端真实返回一致（403/401/发布状态禁用均验证）。此为受限替代证据，非逐条 console 采集。

## 6. 观察项补充事实

- 业务用户菜单仅有 低代码（概览/表单设计）+ 流程引擎；**无任何"填写/数据管理"菜单项**，填写需直接访问 `/form/form-render/{formKey}`（FormRender 提交后跳 /form/data 才进入数据页）。
- formKey 由表单名自动生成，本例为中文 `beta请假申请表`，URL 需编码。
- Playwright locator 对部分 el-button 的 actionability 点击超时（自动化环境问题，JS click 正常、真实用户路径正常），不作为产品缺陷证据。

---

## 7. 修复轮证据（2026-08-30 下午，方向 direction-v0.0.1-beta-release-blockers）

| 文件 | 内容 | 结果 |
|---|---|---|
| backend-mvn-test-after-fix.log | 过滤器首版修改后 `mvn test` | 955/0/0/0，BUILD SUCCESS |
| backend-install.log | `mvn install -DskipTests`（spring-boot:run 从 ~/.m2 取依赖，必须 install 后新代码才生效） | 退出码 0 |
| backend-boot-final.log | 最终修复版干净启动（新 H2 + SW_CIPHER_KEY） | 44 迁移 + 启动成功 |
| fe-typecheck-after.log / fe-lint-after.log | spec 修改后 typecheck / lint | 退出码均 0 |
| fe-test-final.log | 后端+Redis 在线，前端全量 `pnpm test` | **Test Files 110 passed (110)；Tests 1060 passed (1060)；0 failed 0 skipped**，退出码 0 —— B1 在全新 H2 库由 spec 内置前置独立复现 |
| backend-mvn-test-final.log | 最终代码状态后端全量回归 | 955/0/0/0，BUILD SUCCESS，退出码 0 |

### B3 行为正反验证（backend-boot-final.log 会话，curl 实测）

- Redis 停机（`redis-cli shutdown nosave`）→ 登录成功后 `GET /api/auth/menus` → **HTTP 503** `{"code":503,"msg":"登录上下文装载失败（认证基础设施未就绪，非账号或权限问题）: Unable to connect to Redis"}`（修复前为 401 未认证）。
- `redis-server --daemonize yes` 恢复 → `GET /api/agent/tool/internal` → **HTTP 200 code 0**。
- 无 token → `GET /api/auth/menus` → **HTTP 401 未认证**（401 契约不受影响）。
- 中间发现：`spring-boot:run` 依赖解析自 `~/.m2`，首次验证跑的是旧 sw-security jar；以 `mvn install -DskipTests` 修正后重验（证据 backend-install.log）。

### 修复轮修改文件清单

- 后端 `Smart-WorkFlow`（develop @ a7e9a54，未提交）：
  - `sw-framework/sw-security/src/main/java/com/sw/ck/security/filter/JwtAuthenticationFilter.java`（B3：装载异常直写 503 并终止过滤链，附根因消息）
  - `README.md`（B2/B3：环境要求+本地启动补 SW_CIPHER_KEY 必需、Redis 必需、就绪检查与排障指引）
- 前端 `Smart-WorkFlow-Web`（develop @ d8df94f，未提交）：
  - `src/modules/agent/views/tool-production-menu-chain-live.spec.ts`（B1：ensureTooluserFixture 幂等前置——PUT 角色2菜单 [212,213]、创建/重置 tooluser、fixture 自证登录）
- 根知识仓（main @ fe5ffa2，未提交）：`README.md`（快速开始补第 3 步前置指引）。memory/*.md、todo/requirement-pool.md、search_task/.archive 为规划角色改动，非本轮执行产物。
