# S2 · 时间线（2026-09-02，真实后端 + 真实 Flowable 部署）

| # | 时刻(约) | 动作 | 结果 |
|---|---|---|---|
| 1 | 11:44 | admin 登录（challenge→读图验证码→RSA-OAEP→/auth/login） | token 签发 |
| 2 | 11:44 | 创建流程 P（`S2发布流程P`，绑定已发布表单 `p52_s1_form_1788317569554`） | defId=`2094987379579838466`，初始图 3 元素（START→END） |
| 3 | 11:44 | `GET /workflow/defs/{pid}` 读取初始图 | 200 / code 0 |
| 4 | 11:44 | `PUT /workflow/defs/{pid}/graph` 原样保存该合法图 | 200 / code 0（admin 保存成功） |
| 5 | 11:44 | `POST /workflow/defs/{pid}/validate` | HTTP 200，错误列表 `[]`（6 类规则全过） |
| 6 | 11:44 | `POST /workflow/defs/{pid}/publish` | HTTP 200 / **code 0**；status=PUBLISHED、version=2、processKey=`bpm_94894fd65a9c40fc`、deploymentId 与 processDefinitionId 已回填 |
| 7 | 11:44 | 持久化回查 a：`GET /workflow/defs/{pid}/bpmn-xml` | HTTP 200 / code 0，BPMN XML 1641 字节（Flowable 部署产物可取回） |
| 8 | 11:44 | 持久化回查 b：`GET /workflow/defs?formKey=…` | 记录 status=PUBLISHED、version=2，与发布响应一致 |
| 9 | 11:44 | 创建流程 Q（`S2删除流程Q`） | defId=`2094987380657774593`；删除前列表 total=2 |
| 10 | 11:44 | `DELETE /workflow/defs/{qid}` | HTTP 200 / code 0（admin 删除成功） |
| 11 | 11:44 | 回查：`GET /workflow/defs/{qid}` | code 2010「流程定义不存在」 |
| 12 | 11:44 | 回查：列表计数 | 2 → 1（软删生效，记录数减少） |

证据文件：`requests.json`（#2-12 全量原始请求/响应）、`before-after.json`（关键值勾稽）。
