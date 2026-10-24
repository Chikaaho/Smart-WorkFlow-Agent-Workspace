# be020-02 数据源授权主体与查询契约清单/启停

2026-10-24｜Executor（后端）｜XL｜IN_PROGRESS｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本批是 be020-capability-contract-01 剩余项 1、2 的实现，承接 direction-020 F020 授权语义；不改变产品目标，不核销 P。

## 交付语义

direction-020：「设计人员仅能引用已授权的稳定数据源/查询标识」「数据源管理员可管理既有支持类型、启停、授权、预览及安全配置」。本批落地其中缺口的两个服务端事实：

1. **授权主体**：新增 `sw_bpm_ext_datasource_grant`（租户隔离，主体 `ROLE`+角色编码 / `USER`+用户 ID 字符串，与表单字段权限主体约定一致）。授权只约束**设计期引用**：契约登记（`POST /form/ext/query-contract`）与发布绑定校验（`validateBinding`）在引用未授权数据源时返回新错误码 `1220 EXT_DATASOURCE_UNAUTHORIZED`；已发布表单的运行期查询不回查授权，撤权只阻止新引用、不中断存量表单。数据源管理员（`workflow:datasource:manage`）旁路授权匹配但同样要求目标数据源存在。
2. **契约清单/启停**：新增契约清单与启停端点（见下表）。清单按当前登录主体的可引用集合过滤（管理员可见全部），每个 queryKey 只出最新版本，**不含 SQL 文本**（红线不变）；停用后设计预览/运行读取返回既有 `1213 EXT_QUERY_DISABLED` 语义，历史回看不受影响。

密钥轮换边界维持 be020-01 口径：`PUT /api/workflow/external-datasource/{id}` 非空密码即重加密（AES-256-GCM），独立密钥版本化轮换如需另行报 Planner。

## 新增/变化接口

| 方法/路径 | 权限 | 语义 |
| --- | --- | --- |
| `GET /api/workflow/external-datasource/{id}/grants` | `workflow:datasource:manage` | 授权主体清单 `[{subjectType: ROLE\|USER, subjectKey}]` |
| `PUT /api/workflow/external-datasource/{id}/grants` | `workflow:datasource:manage` | 整集合替换 `{grants:[{subjectType, subjectKey}]}`；空集合=全部撤销；数据源不存在/主体非法拒绝（USER 必须数字 ID，ROLE 编码 `[a-zA-Z0-9_-]{1,64}`；同键去重；单数据源上限 200） |
| `GET /form/ext/query-contracts?queryKey&enabled` | `form:design:save` 或 `workflow:datasource:manage` | 契约清单 `[{queryKey, queryVersion, datasourceId, outputFields:[{name,type}…], enabled}]`；按主体可引用集合过滤，管理员旁路 |
| `PUT /form/ext/query-contract/{queryKey}/status` | `form:design:save` | 契约启停 `{enabled: true\|false}`（作用于最新版本）；未知 key 返回 `1212 EXT_QUERY_NOT_FOUND` |
| `POST /form/ext/query-contract`（变化） | `form:design:save` | 语义新增前置校验：datasourceId 未授权 → `1220`（幂等复用版本路径同样受检） |
| 发布绑定校验（变化） | — | definition `dsBinding` 引用未授权数据源 → 发布拒绝 `1220` |

错误码登记：`1220 form.ext_datasource_unauthorized`（发布校验区间 1200-1299 内顺延，FormErrorCode 宪法 §5.2 口径）。

## 升级行为（兼容影响）

- 新增可重复迁移 `R__0.2.0_ext_datasource_grant.sql`（H2/PostgreSQL 逐字节一致，md5 `b87d92c0…`），只建表建索引，无数据回填。
- 上线后引用外部数据源的新契约登记/发布需数据源管理员先授权；**运行中已发布表单与历史回看不受影响**；已发布表单重新发布时如其数据源尚无授权，需先完成授权（fail closed，与「配置无法读取时拒绝」同口径）。
- 契约幂等语义不变：完全相同内容重复登记复用当前版本。

## 脱敏样例

授权替换（授予设计师角色 + 撤销其他）：

```json
PUT /api/workflow/external-datasource/9/grants
{"grants":[{"subjectType":"ROLE","subjectKey":"designer"},{"subjectType":"USER","subjectKey":"2113516345554395137"}]}
→ {"code":0,"msg":"success"}
```

未授权引用拒绝：

```json
POST /form/ext/query-contract
{"datasourceId":"8","queryKey":"asset_list","sql":"…","outputFields":[…]}
→ {"code":1220,"msg":"未授权引用该外部数据源","errorKey":"form.ext_datasource_unauthorized"}
```

契约清单（设计器视图，无 SQL 文本）：

```json
GET /form/ext/query-contracts
→ {"code":0,"msg":"success","data":[{"queryKey":"asset_list","queryVersion":1,"datasourceId":"9","outputFields":[{"name":"value","type":"string"},{"name":"display","type":"string"}],"enabled":1}]}
```

## 工程验证（命令原文落盘 /tmp/f020-grant-full-test.log、/tmp/f020-grant-migration.log，本机留存）

- 引擎聚焦：`ExternalDatasourceGrantServiceTest` 6/0（插入/软删/复活、主体与数据源校验、管理员旁路不查授权表、可引用集合分流）、`ExternalDatasourceControllerTest` 4/0（grants 委派与不存在拒绝）。
- form 模块全量：`MAVEN_OPTS="-Xmx2g" mvn test -pl sw-biz/sw-biz-form/sw-biz-form-biz,sw-biz/sw-bpm/sw-bpm-engine -am`，exit 0——form-biz **233 tests / 0 failures / 0 errors / 0 skipped**（含 G2 新增 4 例：未授权登记拒绝且零落库、清单授权过滤与 SQL 隐藏、启停改预览准入、绑定校验授权拒绝）、bpm-engine **170 / 0 / 0 / 0**（基线 163 + 本批 7，与 w020 回执基线吻合无漂移）。
- 迁移链：`FlywayFullChainPostgresTest` 12/0 + `I6G7UpgradeDrillH2Test` 1/0，真实 PostgreSQL 与 H2 全链 apply 21 条（计数断言 20→21、R__ 16→17 已同步），新表在两库建出且 validate/幂等通过。
- 编译：form-api/form-biz/bpm-engine `mvn -q compile`/`test-compile` exit 0。

## Git

- Server 提交 `5e70b47444424f27557c67c212c39ea58bb6b1db`（普通推送，远端 `origin/codex/0.2.0-tenant-form-flow` 回读同 SHA；18 文件 +918/-12）。前置快照 `1b1f5f7`（be020-01 可消费基线）。

## 边界与下一动作

- 授权校验落在服务端；设计器「数据源/契约选择只显示已授权项」的界面呈现由前端按 `GET /form/ext/query-contracts` 消费。
- 通知前端对接本批 4 个新端点；`/api` 前缀差异与 be020-01 一致。
- 继续本侧剩余：J020 受控集成真实证据链、统一监听副作用覆盖、富文本值格式对齐（待前端）、节点库三项差距（已报 Planner 裁量）。
