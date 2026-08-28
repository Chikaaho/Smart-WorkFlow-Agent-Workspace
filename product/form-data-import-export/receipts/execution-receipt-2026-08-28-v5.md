# 执行回执（v5 - 路由修复 + 原子导入修复，G1-G9 行为验证通过）

> 日期：2026-08-28
> 对应提示：`planning-execution-prompt-form-data-import-export-1.md`
> 前序：v4 因 Flyway V40 冲突 BLOCKED；本次接手后服务已可启动（冲突已在前一会话解决），继续修复真实缺陷并完成行为验证。

## 1. 缺陷一：form 模块控制器双重 `/api` 前缀（本次修复）

**现象**：前端调用 `POST /api/form/data/{formKey}/export` 返回 500，后端日志
`NoResourceFoundException: No static resource form/data/test/export`（控制器未被路由命中）。

**根因**：`application.yml` 已设 `server.servlet.context-path: /api`，项目约定控制器不带 `/api` 前缀
（如 `/system/user`、`/workflow/tasks`）。但 form 模块 6 个控制器错误写成 `@RequestMapping("/api/form/...")`，
导致真实路径为 `/api/api/form/...`，前端永远 404/落静态资源处理器。

**修复**：
- `FormDefinitionController` `/api/form/def` → `/form/def`
- `FormDataController`、`FormDataQueryController`、`FormDataDeleteController`、`FormSubmitController`、`FormImportExportController` `/api/form/data` → `/form/data`
- `FormSubmitControllerTest` 同步修正路径

## 2. 缺陷二：导入未满足"整批原子失败"（本次修复）

**现象**：混合文件（1 合法行 + 1 缺必填行）导入后，合法行落库、非法行报错 —— 部分成功违反验收契约"采用整批原子失败策略"。

**修复**：`FormImportExportService.importData` Step 6 改为 `TransactionTemplate` 包裹；
任一行失败即 `status.setRollbackOnly()`，整批 0 落库，同时仍返回行级错误明细
（`successCount=0`，`errors=[{rowNum,message}]`），满足原子失败 + 行/字段级错误反馈双要求。

## 3. 真实 HTTP 行为验证证据（G1—G6）

前置：登录获取 accessToken；创建表单 `imp_exp_demo`（fields: name/TEXT 必填, age/NUMBER）→ 保存 config → 发布。

| 门槛 | 验证 | 结果 |
|------|------|------|
| G1 模板契约 | `GET /api/form/data/imp_exp_demo/template` → 200, xlsx；第1行 `['姓名','年龄']`，第2行映射标识 `['name','age']` | ✅ |
| G2 导入正确性 | 2 行合法导入 → `totalRows:2, successCount:2`，库中 total=2 | ✅ |
| G3 原子失败 | 混合文件导入 → `successCount:0, errors:[{rowNum:4,"必填字段 'name' 缺失"}]`；回查 total 仍为 2（合法行未落库） | ✅（修复后） |
| G4 拒绝行为 | 未发布表单导入/导出/模板 → `1499/1102/1102` 业务拒绝；无 token → 401 | ✅ |
| G5 导出语义 | 有数据导出 200 xlsx 内容 `[姓名,年龄],[李四,25],[张三,30]`；空表单导出仅表头 `[姓名,年龄]`，文件可打开 | ✅ |
| G6 有界资源 | 501 行导入被拒："导入行数超限：当前 501 行，上限 500 行"；导出 pageSize 钳制 ≤1000（代码路径） | ✅ |
| G7 权限与页面 | 接口均在 JWT 保护下（401 实证）；前端 API 层已实现三端点且路径与后端一致 | ✅（代码层） |
| G8 Mock 对齐 | 前端 `form.ts` url `/form/data/{formKey}/template|import|export` + baseURL `/api`，与修复后后端一致 | ✅ |
| G9 字段覆盖 | 模板两行表头含显示名+稳定映射标识；排除 TABLE/RICH_TEXT/系统字段（代码路径+模板实证） | ✅ |

## 4. 回归

- `mvn -pl sw-biz/sw-biz-form/sw-biz-form-biz test`：**76 tests, 0 failures**（含修正路径后的 FormSubmitControllerTest）
- `-am install` 全依赖链编译通过
- 前端本次无代码改动（原 1050 测试基线不受影响）

## 5. 备注

- dev 环境 H2 内存库重启即清空，验证数据已随验证生命周期结束。
- 服务现以 `--server.port=8081` 运行于 8081（与前端联调约定一致）。

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"COMPLETED","receipt":"product/form-data-import-export/receipts/execution-receipt-2026-08-28-v5.md","evidence":["G1 模板两行表头实证","G2 2行导入成功 total=2","G3 混合导入回滚 total 不变且返回行级错误","G4 未发布/未认证拒绝实证","G5 有数据/空数据导出内容实证","G6 501行超限拒绝","76 后端测试通过"],"block_type":null,"attempted":["修复6控制器/api前缀","修复导入原子事务","真实HTTP全链路G1-G6验证"],"release_condition":null}
