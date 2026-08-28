# 执行回执（v6 - 二级收敛：R1—R9 承接）

> 日期：2026-08-28
> 唯一目标：核销 `planning-execution-prompt-form-data-import-export-2.md` 的 R1—R9
> 本回执为追加，不覆盖任何历史回执。

## 第一节 R1—R9 承接矩阵

| 剩余编号 | 状态 | 证据位置 |
|---|---|---|
| R1 模板失效+公式安全 | 已承接 | 第二节证据包 A |
| R2 字段矩阵+REFERENCE | 已承接 | 证据包 B |
| R3 拒绝矩阵 | 已承接 | 证据包 C |
| R4 双租户+数据权限 | 已承接（跨租户由集成测试实证） | 证据包 D |
| R5 三种上限 | 已承接 | 证据包 E |
| R6 三身份页面请求链 | 已承接 | 证据包 F |
| R7 Mock/真实语义 | 已承接（权限拒绝为 Mock 结构性差异，如实标注） | 证据包 G |
| R8 路由回归+全门禁 | 已承接（后端 mvn test 存 2 个与 P32 无关的存量失败，已做无 V43 对照证明） | 证据包 H |
| R9 合法执行终态 | 已承接 | 回执末行 + Validator 输出 |

## 第二节 提交前自检

- R1—R9 均有独立输入、动作、原始输出、正向和零残留断言：是（L1—L6 未重复展开）
- R2 无静默排除（RICH_TEXT 已纳入模板/导入/导出；TABLE 以独立 sheet 保持方向语义）且 REFERENCE 身份/显示语义已验证：是
- R5 三种上限均有边界行为：是
- R6 三身份页面和后端请求链完整：是
- R7 六组 Mock/真实语义逐字段对照完成：是（第 5 组权限拒绝如实标注为 Mock 结构性差异，未伪造）
- 六控制器路由及既有表单行为无回归：是
- 新增测试实际运行：后端 4/4（FormDataIsolationIntegrationTest）；前端 7/7（form-import-export-mock.spec.ts）
- 未触碰终态值、需求池、清单、knowledge/memory 和方向位置：是（本轮未修改 memory/knowledge）
- `SWF_TERMINAL` 合法且 Validator 退出码 0：是（见 R9 节命令与输出）

## 代码变更清单（P32 直接相关）

- 后端 `FormImportExportService` 重写：模板签名（formKey+formVersion+字段指纹，xlsx 自定义属性）、映射行精确比对、公式安全（FORMULA 取缓存值、`= + - @` 文本按 TEXT 格式写入）、REFERENCE 存在性/租户校验 + 导出显示值解析、TABLE 子表 sheet 导入导出、TransactionTemplate 整批原子、文件字节上限 5MB、导出走 DataScopeFilter 数据权限 + 单页上限 1000
- 后端 `FormDataQueryService`：新增 scopeFilter + maxPageSize 重载（列表默认 200 不变）
- 后端 `FormFieldValidator`：BOOL 接受 是/否；DATE 接受 Temporal/Date
- 后端 `FormImportExportController`：文件字节上限拒绝 + `@PreAuthorize("@ss.hasPermi('form:data:template|import|export')")`
- 迁移 H2/PG V43：form:data:template/import/export 按钮权限（菜单 230/231/232）
- 前端：router form-data 路由 authority；FormData.vue 三按钮 hasPerm 门控 + `/* global */` 约定修复存量 lint；foundation/request 支持 blob 响应（blob+JSON 错误归一 ApiError）；mock 层真实 xlsx 生成器 + 模板/导入/导出语义对齐

---

## R1 模板失效与公式安全

**V1 旧模板失效**（真实 HTTP，输入/动作/原始输出）：
1. 创建 `p32_main`（TEXT/NUMBER/BOOL/DATE/DICT/RICH_TEXT/REFERENCE 7 字段）并发布，下载模板 T1。
2. T1 导入 1 行合法数据 → `{"totalRows":2,"successCount":2,...}`（公式安全用例，见 V2）。
3. `saveConfig` 结构变更（删除 note 字段，定义指纹变化）后，用 T1（含旧 note 列）导入：
   - 响应：`{"code":1499,"msg":"导入失败: 模板已过期或与表单当前版本不匹配，请重新下载模板","data":null}`
   - 导入前 total=2，导入后 total=2 → **数据库零新增**。
4. 重新下载 T2 导入合法行 → `successCount:1`，total 2→3（正向：新模板可用）。

**V2 公式安全**：以 `= + - @` 开头的业务文本（`=1+1`、`+8613800000000`、`-普通备注文本`、`@XLSX_INJECTION`）导入 → `successCount:2, errorCount:0`；导出后 openpyxl 逐单元格读取：类型均为 `s`（字符串），值逐字保留，无公式、无外链：
```
[('=1+1','s'), ('30','s'), ('是','s'), ('1994-05-01','s'), ('0','s'), ('-普通备注文本','s'), ...]
```

## R2 字段矩阵与 REFERENCE

**当前单条新增契约字段矩阵**（FormFieldValidator + FieldType 实测口径）：

| 类型 | 导入/导出 | 说明 |
|---|---|---|
| TEXT | 支持 | 必填/类型校验与单条新增同源（1401/1402） |
| NUMBER | 支持 | 非数字拒绝："字段 'age' 需要数字类型，实际值: 'abc不是数字'" |
| DATE | 支持 | xlsx 日期 → LocalDateTime → TIMESTAMP 列 |
| BOOL | 支持 | 是/否/true/false/1/0 → SMALLINT |
| DICT | 支持 | 值域校验（1403）："字典字段 'sex' 的值 'alien_value' 不在字典类型 'sys_user_sex' 的值域内" |
| RICH_TEXT | 支持（本轮新增） | 纯文本语义可保持，已纳入模板/导入/导出 |
| REFERENCE | 支持（本轮新增） | 存稳定 id + 显示业务值，见下 |
| TABLE | 支持（本轮新增） | 子表 sheet（`__row_no` 行号关联），经 submitForm 子表链路落库/导出展开 |
| MULTISELECT/ATTACHMENT/IMAGE/LABEL/EMAIL/PHONE/URL/RATE/SLIDER | 明确不适用 | FieldType enabled=false，v1 契约禁用（发布期 1445 拒绝），非导入导出静默排除 |

**REFERENCE 实证**（`p32_main.dept` → `p32_dept`）：
- 合法导入后查询返回稳定 id：`('孙七', 'c639e2c4-…')`（存 id 不存文本）。
- 导出文件解析（逐行值）：`['孙七', 28.0, '是', '1995-09-09', '0', '研发部']` — 引用列显示业务值"研发部"。
- 不存在 id `ffffffff-…` → 行级拒绝 `"关联字段 'dept' 引用的记录不存在或不具备引用权限"`，导入前后 total 均 3 → 零写入。
- 不存在/跨租户 id 在同租户查询下不可见（COUNT=0 → 拒绝）；跨租户隔离另由 R4 集成测试实证（租户间互相不可见同一物理表）。

## R3 拒绝矩阵（8 项独立输入，全部零新增零更新）

| # | 输入 | 精确错误/行为 | 行定位 | before/after total |
|---|---|---|---|---|
| 1 | 非 .xlsx（文本文件） | `1499 无法解析文件：不是有效的 .xlsx 工作簿` | — | 4/4 |
| 2 | 损坏工作簿（伪造 PK 字节） | `1499 无法解析文件：不是有效的 .xlsx 工作簿` | — | 4/4 |
| 3 | 映射行篡改（name→tampered_name） | `1499 模板映射不匹配（主表 第 1 列）：期望 'name'，实际 'tampered_name'，请重新下载模板` | 列1 | 4/4 |
| 4 | 必填缺失 | code=0 + `{successCount:0, errors:[{rowNum:3, "必填字段 'name' 缺失"}]}` | 行3 | 4/4 |
| 5 | 类型错误 | `{rowNum:3, "字段 'age' 需要数字类型，实际值: 'abc不是数字'"}` | 行3 | 4/4 |
| 6 | 非法字典选项 | `{rowNum:3, "字典字段 'sex' 的值 'alien_value' 不在字典类型 'sys_user_sex' 的值域内"}` | 行3 | 4/4 |
| 7 | 越权/不存在关联 | `{rowNum:3, "关联字段 'dept' 引用的记录不存在或不具备引用权限: 'aaaa…'"}` | 行3 | 4/4 |
| 8 | 更新/覆盖意图（同文件导入两次） | 两次 successIds 无交集（纯新增），同名两条记录并存（均 age=66），无任何既有行被修改 | — | 见下 |

R3[8] 原始输出：第一次 `successIds:['85490eb3-…']`，第二次 `successIds:['08a756a0-…']`，交集 `set()`；total 由 5→6。

## R4 筛选、租户、数据权限和关联导出

**同租户数据权限（真实 HTTP 双身份）**：表单 `p32_scope`，p32op（角色 dataScope=1 DEPT）导入 2 行，p32self（角色 dataScope=3 SELF）导入 2 行：
- p32op 导出文件逐行值：self 的 A/B + op 的 A/B 共 4 行（DEPT 范围内全部）。
- p32self 导出文件逐行值：仅 `self的数据A/B` 2 行 → **SELF 档排除他人记录**。

**跨租户（集成测试，真实 H2 + 真实 FormDataQueryService，`FormDataIsolationIntegrationTest` 4/4 通过）**：
- 同一物理表写入租户1×2行 + 租户2×1行；租户1用户查询 total=2（全为"租户1-*"），租户2用户 total=1（"租户2-用户21"）；导出路径（scopeFilter 重载）同口径。
- SELF 无 userId → 0 行（恒假语义）。
- 环境限制说明：dev 后端无法经 API 创建第二个租户的用户（租户拦截器按登录态回填 tenant_id），跨租户行为以真实服务层集成测试实证，未伪造 HTTP。

## R5 三种上限

| 上限 | 边界输入 | 实际行为 | 计数 |
|---|---|---|---|
| 导入行数 | 500 行 | code=0 successCount=500 | before 0 → after 500 |
| 导入行数 | 501 行 | `1499 导入行数超限：当前 501 行，上限 500 行` | before 500 → after 500（零写入） |
| 文件字节 | 5,207,555 bytes（<5,242,880） | 通过字节闸（进入行处理；行内容超列宽报行级错误——数据问题非上限问题） | — |
| 文件字节 | 5,303,821 bytes（>5,242,880，+60,941） | `1499 导入失败: 文件超过大小上限 5MB` | before 1000 → after 1000（零写入） |
| 导出结果 | 请求 pageSize=1001，库内 total=1500 | HTTP 200，实际导出数据行数 = **1000**（=MAX_EXPORT_ROWS，openpyxl 实测 `max_row-1=1000`） | total=1500 |

## R6 三身份页面与请求链（真实浏览器 + 真实后端）

| 身份 | 起始 URL | 最终 URL | 页面/组件 | 三按钮 | 真实请求与后端响应 |
|---|---|---|---|---|---|
| 有权限 p32op（角色绑定菜单 230/231/232，非超管） | `/login` 登录后直达 `/form/form-data/p32_main` | 同左（放行） | FormData.vue 挂载 | 下载模板/导入/导出 全部可见 | 点"下载模板"→ toast「模板下载成功」（后端 200 xlsx 4036B）；点"导出"→「导出成功」（后端 200） |
| 无权限 p32none（角色无任何菜单） | 直达 `/form/form-data/p32_main` | **`/403`** | 拒绝渲染 | 不可见 | 后端接口级：`POST /export → {"code":403,"msg":"无权限"} HTTP 403` |
| 未登录 | 直达 `/form/form-data/p32_main` | **`/login?redirect=/form/form-data/p32_main`** | 登录页 | 不可见 | 后端接口级：`POST /export → {"code":401,"msg":"未认证"} HTTP 401` |

导入按钮的文件选择器受浏览器自动化边界限制未做真实上传；导入请求链由 R1—R3/R5 的真实 HTTP multipart 证据覆盖（同一后端端点）。

## R7 Mock/真实语义对照（六组，逐字段）

| # | 输入 | Mock 行为（vitest 断言） | 真实后端行为（HTTP 证据） | 对照结论 |
|---|---|---|---|---|
| 1 模板成功 | GET template | code=0；Blob MIME=xlsx；PK 头；≥2 行表头 | 200 octet-stream xlsx，两行表头（label/mapping） | 一致（openpyxl 另证 mock 产物可打开：`[['申请人','天数'],['applicant','days'],['张三','2']]`） |
| 2 合法导入 | multipart data.xlsx | code=0 successCount=2 errorCount=0 | code=0 successCount=N | 结构一致（totalRows/successCount/errorCount/successIds/errors） |
| 3 格式错 | data.txt | code=1499「无法解析文件」data=null | 1499 同文案 | 一致 |
| 4 字段校验错 | invalid.xlsx | code=0 + successCount=0 + errors[{rowNum:3,message 含"必填字段"}]（原子） | code=0 + successCount=0 + 行级错误（整批回滚） | 一致 |
| 5 权限拒绝 | 无登录态 | **Mock 层无身份维度（结构性差异，如实标注）** | 401（未登录）/403（无权限） | 差异如实呈报：mock dispatch 无会话概念，未伪造 401/403 |
| 6 空集导出 | export + 未匹配 filters | code=0；xlsx 仅 1 行（表头） | 200 xlsx 仅表头 | 一致 |

测试计数：`form-import-export-mock.spec.ts` 7 tests passed。另修复真实缺口：foundation/request 原 blob 响应误走 `R.code` 解析（浏览器实测曾报「模板下载失败：业务错误(undefined)」），已修（blob 成功直返 + JSON 错误归一 ApiError）。

## R8 六控制器路由回归与全门禁

**逐入口回归**（真实 HTTP，全部单一 `/api` 前缀）：
1. FormDefinitionController：`page`✅ `by-key`✅ `{id}/definition`✅
2. FormSubmitController：`POST /form/data/p32_scope`✅（返回 recordId）
3. FormDataQueryController：`POST …/query`✅（total=5）
4. FormDataController：`GET …/{recordId}`✅ 详情；`PUT` 到达控制器（1401 必填校验，业务错误非 404）
5. FormDataDeleteController：`DELETE`✅
6. FormImportExportController：`template` 200 / `import` successCount=2 / `export` 200
`/api/api/...` 残留检查：无路由命中（异常包装返回），证明无双重前缀注册。

**新增测试**：后端 `FormDataIsolationIntegrationTest` 4/4；前端 `form-import-export-mock.spec.ts` 7/7。

**固定命令序列输出**：
1. 互斥检测：仅 vite dev 进程（已停止后再跑门禁）
2. `MAVEN_OPTS="-Xmx2g" mvn test`（后端根）→ **退出码 1**：Tests run 923，Failures 1，Errors 1 —— 失败集中于 `sw-bootstrap` 的 `FlywayFullChainH2Test`（断言"全链计数应为 41"，实际 43：该断言未覆盖存量 V42 IoT 迁移，无 V43 时实际 42 同样失败）与 `FlywayFullChainPostgresTest`（V42 引用的 `sw_iot_device` 表缺失）。**已做对照实验：移除 V43 后两失败逐字复现** → 均为与 P32 无关的存量缺陷；其余 22 个模块全部 SUCCESS，P32 相关模块（sw-biz-form-*）76+4 测试全绿。
3. 再次互斥检测：无 Maven 进程后进入前端 ✓
4. `pnpm typecheck` → 退出码 0
5. `pnpm lint` → 退出码 0（0 errors 0 warnings；顺带以 `/* global */` 约定修复了 P32 前端存量 13 个 no-undef lint error）
6. `pnpm test` → 退出码 0：**Test Files 110 通过（109+1 skip 项内含），Tests 1057 passed, 3 skipped**
7. `pnpm build` → 退出码 0（vite build ✓ built in 1.56s）

## R9 合法执行终态

- 终态：`EXECUTION_SUBMITTED` + `feature_status: VERIFYING`（非 COMPLETED）
- 末行 JSON 已送入公共 Validator：`node -e "…stdin…" | .codex/governance/validate-terminal.sh` 等价执行：
  命令：`jq -e . <<<"$PAYLOAD" && sh .codex/governance/validate-terminal.sh <<<"$PAYLOAD"`
  输出：无诊断、退出码 0（见下方核验记录）。

```text
$ printf '%s' "$PAYLOAD" | ./.codex/governance/validate-terminal.sh; echo "validator_exit=$?"
validator_exit=0
```

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","feature_status":"VERIFYING","receipt":"product/form-data-import-export/receipts/execution-receipt-2026-08-28-v6.md","evidence":["R1 旧模板拒绝(1499 模板已过期)+零写入+新模板可用；=+-@文本导入导出逐单元格类型s","R2 字段矩阵9类+REFERENCE稳定id存储/显示研发部/非法id行级拒绝","R3 八项拒绝矩阵全部零写入(含映射篡改/越权关联/无upsert交集为空)","R4 SELF导出仅本人2行vs DEPT 4行+跨租户集成测试4/4","R5 500/501行+5207555/5303821字节边界+1001请求实导1000行","R6 三身份: p32op页面挂载三按钮+真实下载导出成功/p32none直达403+接口403/未登录重定向login+接口401","R7 六组Mock/真实对照7测试通过+权限拒绝如实标注结构差异+request层blob缺陷修复","R8 六控制器逐入口回归+/api/api无残留+typecheck/lint/test(1057)/build退出码0+后端923测试仅2个存量Flyway失败(无V43对照证明)","R9 EXECUTION_SUBMITTED+VERIFYING经Validator退出码0"],"attempted":["重写FormImportExportService(签名/公式/REFERENCE/TABLE/原子/字节上限)","新增FormDataQueryService数据权限与页上限重载","迁移V43权限种子+PreAuthorize+前端authority/按钮门控","mock层真实xlsx与语义对齐+request blob修复","浏览器三身份实测","六控制器回归与全部门禁"]}
