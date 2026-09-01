# R5 时间线与原始结果（脚本 p52-r5.mjs，全部原始响应存 requests.json）

| # | 主体 | 请求 | 结果 |
|---|---|---|---|
| 0 | — | GET /workflow/defs/{defId}（admin，before） | name=R系列审批流程P，version=1，elements=3 |
| 1 | rlimited | PUT /workflow/defs/{defId}/graph（篡改名称为"被篡改"+新图） | **HTTP 403** `{"code":403,"msg":"无权限"}` |
| 2 | rlimited | POST /workflow/defs/{defId}/publish | **HTTP 403** `{"code":403,"msg":"无权限"}` |
| 3 | rlimited | DELETE /workflow/defs/{defId} | **HTTP 403** `{"code":403,"msg":"无权限"}` |
| 4 | — | GET /workflow/defs/{defId}（admin，越权尝试后回查） | name=R系列审批流程P（未变），version=1（未变），elements=3（未变）——**零副作用** |
| 5 | admin | PUT /workflow/defs/{defId}/graph（合法保存） | **HTTP 200** `{"code":0}`（对照成功，落库） |
| 6 | admin | POST /workflow/defs/{defId}/publish | **HTTP 200** 信封 `{"code":2000,"msg":"图缺少开始节点"}`——**通过权限网关**（非 403），被业务图校验拦截（与本权限证据无关） |

注：admin 发布路径的网关放行另由 `BpmProcessDefControllerAuthorizationTest`（真实 Method Security）的 create/publish 有权过网关 + 无权 403 用例固化；流程删除的有权对照以 admin delete 于开发过程验证（本表保留 limited 403 + admin save/publish 网关对照）。
