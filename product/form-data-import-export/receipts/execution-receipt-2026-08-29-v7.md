# 执行回执（v7 - 三级零裁量：S1—S4 核销）

> 日期：2026-08-29
> 依据：`planning-execution-prompt-form-data-import-export-3.md`
> 本回执为追加，不覆盖任何历史回执。L1—L15 未重验，前端 typecheck/lint/test/build 未重跑。

## 第一节 S1—S4 承接矩阵

| 剩余编号 | 状态 | 证据 |
|---|---|---|
| S1 TABLE 父子表往返 | ✅ | 本回执 R-S1 |
| S2 查询筛选导出 | ✅ | R-S2 |
| S3 Mock 权限一致 | ✅（差异已消除） | R-S3 |
| S4 编辑成功 + 后端全量门 | ✅ | R-S4 |

## 提交前零裁量门禁自检（全部为"是"才提交）

| 门禁 | 结论 |
|---|---|
| S1 父子表合法往返全部断言为真，非法子行主子表零新增 | 是 |
| S2 列表与导出匹配集合完全相同，筛选外零记录 | 是 |
| S3 Mock 三身份分别为 401/403/成功，与真实模式同义 | 是 |
| S4 PUT 真正成功且 id 不变 | 是 |
| 后端根 `mvn test` 退出码 0、Failures=0、Errors=0 | 是（947/0/0/0，exit 0） |
| 新执行回执与独立测试回执均已追加 | 是（本回执 + test-receipt-2026-08-29-s1-s4.md） |
| L1—L15 未重验，前端四门禁未重跑 | 是 |
| 未写功能 `COMPLETED`、未核销 P32、未改功能数/清单/knowledge/memory/方向位置 | 是 |
| 执行回执终态合法且 Validator 退出码 0 | 是（见 R-S4.6） |

## R-S1 独立证据包：TABLE 父子表往返

固定输入：已发布表单 `p32_table`（主 `order_no`/TEXT 必填；TABLE `items` 子字段 `product`/TEXT 必填 + `qty`/NUMBER）。模板两 sheet：`模板[['订单号'],['order_no']]`、`items[['数据行号','产品','数量'],['__row_no','product','qty']]`。

1. **合法导入**（主 sheet 2 条父记录，items sheet 3 条子记录：行号1×2、行号2×1）：
   响应 `{"totalRows":2,"successCount":2,"errorCount":0,"successIds":["a6c1dba7-…","5f34f451-…"]}`
2. **查询两条父记录 + 详情子行归属**（逐字段值）：
   - `SO-A002` items=`[('显示器',1.0)]`
   - `SO-A001` items=`[('键盘',2.0),('鼠标',3.0)]`
   → 子行不串父。
3. **导出解析**：主 sheet `[['订单号'],['SO-A002'],['SO-A001']]`；items sheet `[['数据行号','产品','数量'],[1.0,'显示器',1.0],[2.0,'键盘',2.0],[2.0,'鼠标',3.0]]`
   → 数据行号 1↔导出主行1（SO-A002）、2↔SO-A001，父子关系可完整还原。
4. **非法子行**（product 必填缺失）：`{"successCount":0,"errors":[{"rowNum":3,"message":"字段 'items' 第 1 行必填子字段 'product' 缺失"}]}`；
   导入后主表 total 仍为 2，A001 子行仍 `[(键盘,2),(鼠标,3)]` → **主表与子表均零新增**（整批事务回滚）。

修复记录：该用例曾暴露真实缺陷——子字段 required 未参与校验（非法子行曾落库成功）。已在 `FormFieldValidator` 补齐 TABLE 子行必填/类型同口径校验（1401/1402），并修复后回归。

## R-S2 独立证据包：查询筛选导出

固定输入：`p32_filter` 表单（city/code），授权身份导入 4 行：`[杭州 HZ-1][宁波 NB-1][杭州 HZ-2][温州 WZ-1]`。

- 筛选请求（页面/API 同参）：`{"pageNum":1,"pageSize":100,"filters":[{"field":"city","op":"EQ","value":"杭州"}]}`
- 列表返回：`total:2`，记录 `[(杭州,HZ-2),(杭州,HZ-1)]`
- 导出文件逐行值：`[['城市','编号'],['杭州','HZ-2'],['杭州','HZ-1']]`
- **正向**：列表与导出恰为同一组 2 条匹配记录（HZ-1/HZ-2）。
- **反向**：文件中无宁波/温州记录；未退化为全量导出（4→2）。

## R-S3 独立证据包：Mock 权限一致（差异已消除）

实现：mock 层新增身份/权限闸 `p32AccessGate`（未登录→401；已登录无 `form:data:*` 权限→403；超管/持权→放行），admin 会话权限对齐 V43 按钮种子。

三身份同请求逐字段结果（vitest `form-import-export-mock.spec.ts`，10/10 通过）：

| 身份 | 请求 | Mock 业务码/消息 | 与真实后端口径对照 |
|---|---|---|---|
| 未登录（无 token） | GET template | `code=401, message='未认证', data=null` | 真实 401 `未认证` ✅ 同义 |
| 普通无权限（user，空权限） | POST import | `code=403, message='无权限', data=null` | 真实 403 `无权限` ✅ 同义 |
| 有权限（admin，V43 权限） | POST export | `code=0`，真实 xlsx Blob（PK 头 + xlsx MIME） | 真实 200 ✅ 同义 |

反向断言：不再存在"Mock 无身份维度/所有身份都成功/只隐藏按钮但请求成功"——三个 handler（template/import/export）均经闸校验，页面侧按钮由同一 `form:data:*` 权限驱动（L12 已锁定），页面反馈与请求结果一致。

## R-S4 独立证据包：成功编辑与后端全量门

**1. PUT 成功编辑**（真实 HTTP，路由为 v5 修复后单一 `/api` 前缀）：
- 请求：`PUT /api/form/data/p32_filter/{recordId}` body `{"data":{"city":"杭州","code":"HZ-1-EDITED"},"version":0}`
- 响应：`{"code":0,"msg":"success","data":null}`
- 更新前后逐字段：before `杭州 HZ-1 version=0` → after `杭州 HZ-1-EDITED version=1`；**id 不变**（`d0eb041f-…` 前后一致）。
- 回归测试：新增 `FormDataUpdateControllerTest.updateData_happyPath`（PUT 路由委托 + R.ok，1/1 通过）；既有 `FormDataUpdateServiceTest`（含 `updateSuccess` 主表整量更新+version+1）14/14 通过。

**2–4. 后端根最终门（仅执行一次）**：
- 互斥检测：`ps aux | grep …` 计数 0。
- `MAVEN_OPTS="-Xmx2g" mvn test` → **退出码 0**；`TOTAL tests=947, failures=0, errors=0, skipped=0`；`BUILD SUCCESS`（全模块含 sw-bootstrap）。
- Flyway 阻塞修复（允许范围"Flyway 全链契约/迁移前置"）：`FlywayFullChainPostgresTest` APP_LOCATIONS 补齐缺失的 `db/migration/iot/{vendor}`（H2 侧已有，PG 缺失导致 V42 引用的 `sw_iot_device` 不存在）；两个全链测试的计数/终点版本断言更新为覆盖 V42/V43（43/42/11/10/7 等精确值）。迁移脚本本体未改动。修复后 `FlywayFullChainH2Test` 14/14、`FlywayFullChainPostgresTest` 11/11。

**5. 独立测试回执**：`product/form-data-import-export/receipts/test-receipt-2026-08-29-s1-s4.md`（含 S1—S4 可定位测试名、精确计数、全量门输出）。

**6. 终态**：`EXECUTION_SUBMITTED` + `feature_status: VERIFYING`，末行 JSON 已送公共 Validator，退出码 0。

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","feature_status":"VERIFYING","receipt":"product/form-data-import-export/receipts/execution-receipt-2026-08-29-v7.md","evidence":["S1 TABLE 2父3子导入/详情归属/导出行号还原/非法子行原子拒绝主子表零残留(修复子行必填校验缺陷)","S2 同筛选参数列表与导出恰为HZ-1/HZ-2两条无筛选外记录","S3 Mock三身份401未认证/403无权限/200成功与真实同义(vitest 10/10)","S4 PUT真实编辑成功id不变version0→1+控制器回归测试1/1","S4 Flyway修复: PG测试补iot location+计数契约更新后25/25","S4 后端根mvn test退出码0: 947 tests failures=0 errors=0 skipped=0 BUILD SUCCESS","独立测试回执test-receipt-2026-08-29-s1-s4.md已追加","SWF_TERMINAL经公共Validator退出码0"],"attempted":["TABLE子行必填类型校验修复与往返验证","筛选导出同参取证","mock权限闸p32AccessGate与admin权限种子","PUT真实编辑+FormDataUpdateControllerTest","Flyway全链测试location与计数契约修复","后端根最终全量门一次执行"]}
