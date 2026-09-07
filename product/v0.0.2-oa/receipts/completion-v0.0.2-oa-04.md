# v0.0.2 OA 完善 — 执行回执 04（R2 缺口修复，自验提交规划验收）

2026-09-07；执行角色：Executor。唯一执行入口：`planning-execution-prompt-v0.0.2-oa-02.md`；规划验收依据：`planning-review-v0.0.2-oa-03.md`；正式方向：`../ready/direction-v0.0.2-oa.md`。本回执仅提交 `VERIFYING / EXECUTION_SUBMITTED`，不自判 `PASSED / COMPLETED`，不推进 A8、阶段三或发布。

## 1. 本轮范围与源码对象

本轮只处理 R2a/R2b：抄送列表的流程实例精确筛选，以及相同 `createTime` 下的稳定分页。Server 当前基线为 `4cba211`，Web 当前基线为 `ef1fdc7`；改动仍在工作树，未提交、未推送。

| 对象 | 实施内容 |
|---|---|
| Server `CopyRecordMapper.java:40-42,74-76` | 在列表与 count SQL 中增加 `processInstanceId` 等值条件；`ORDER BY c.create_time DESC, c.id DESC` 保留为稳定总序 |
| Server `BpmCopyQueryServiceImpl.java:49-64` | 精确实例参数与关键字分别规范化，分别传入 count/select，保证 total 与 records 使用同一过滤条件 |
| Server `BpmCopyController.java:28-35` | 暴露可选 `processInstanceId` 请求参数并传入服务层 |
| Server `CopyRecordMapperIntegrationTest.java:61-93` | 固定两条同时间夹具；覆盖精确命中、不存在实例、page1/page2/page3、重复读取与无重漏 |
| Server `schema-copy-h2.sql` | 为 R2 定向集成测试提供与实体列一致的 H2 抄送表 |
| Web `oa.ts:140-156` | 将 `processInstanceId` 纳入抄送列表请求参数 |
| Web `MyCc.vue:27-67,145-149` | 增加流程实例 ID 精确筛选输入、查询与重置传递 |
| Web `foundation/mock/handlers.ts` | mock 列表实现精确实例筛选，并用 `id DESC` 处理同时间排序 |

锁定的 A1/A2/A4/A5/A6、其他 A3 链路与既有工程门禁未重做；本轮没有修改其实现路径。

## 2. R2a/R2b 行为证据

生效证据包：`evidence/gap-round4/`；唯一生效 API 原始流：`api-r4-final.txt`；索引：`EVIDENCE-INDEX.md`；哈希：`SHA256SUMS.txt`。`shasum -c SHA256SUMS.txt` 回读结果为 2/2 OK。

### R2a 精确实例筛选

- `api-r4-final.txt:9-15`：`GET /api/workflow/my/copies?...&processInstanceId=live-pi-a`，HTTP 200，响应只含 `live-pi-a`，`total=1`。
- `api-r4-final.txt:17-23`：不存在实例 `live-pi-missing`，HTTP 200，`records=[]`，`total=0`。
- `api-r4-final.txt:57-62`：同路径未认证控制请求 HTTP 401，安全链仍生效。
- `CopyRecordMapperIntegrationTest.java:61-73`：数据库层再次断言 exact hit=1、missing=0，且返回记录只属于目标实例。

### R2b 同时间稳定分页

本轮 file-H2 夹具的两条记录为 `990001/live-pi-a` 与 `990002/live-pi-b`，两者 `createTime` 均为 `2026-09-07T15:51:00`。

- `api-r4-final.txt:25-31`：page1=`990002/live-pi-b`，HTTP 200，`total=2`。
- `api-r4-final.txt:33-39`：page2=`990001/live-pi-a`，HTTP 200，`total=2`。
- `api-r4-final.txt:41-47`：page3 `records=[]`，HTTP 200，`total=2`。
- `api-r4-final.txt:49-55`：重复 page1 仍为 `990002/live-pi-b`。
- `CopyRecordMapperIntegrationTest.java:76-93`：同时间固定数据在 Mapper 层断言 `id DESC` 顺序、第三页为空、重复读取一致、两页合并无重漏。

## 3. 工程验证

### Server

- 定向：`MAVEN_OPTS='-Xmx2g' mvn -pl sw-biz/sw-bpm/sw-bpm-process -am -Dtest=CopyRecordMapperIntegrationTest -Dsurefire.failIfNoSpecifiedTests=false test`；`CopyRecordMapperIntegrationTest` 2 tests，0 failures，0 errors，0 skipped，退出码 0。
- L 门禁：`MAVEN_OPTS='-Xmx2g' mvn -q compile` 退出码 0；随后 `MAVEN_OPTS='-Xmx2g' mvn -q test` 退出码 0。回读 Surefire 报告：181 reports，1156 tests，0 failures，0 errors，0 skipped。
- 为复核独立 `sw-bootstrap` 的 HTTP 运行产物，执行 `MAVEN_OPTS='-Xmx2g' mvn -q -DskipTests install` 后再启动 dev profile；真实服务绑定 `127.0.0.1:18080`，验证完成后已干净停服，停服后健康请求无法连接。

### Web

`NODE_OPTIONS='--max-old-space-size=2048' pnpm typecheck && pnpm lint && pnpm test && pnpm build` 退出码 0：typecheck 通过；lint 通过且无告警；Vitest `124 passed | 1 skipped` 文件、`1168 passed | 3 skipped` 用例；build 通过。build 仅保留既有第三方 `@vueuse/core` PURE annotation warning，不影响退出码或本轮文件。

## 4. 证据卫生、边界与提交结论

- API 原始流只保留必要方法、路径、HTTP status、完整响应体与非敏感对象字段；调试认证只在 loopback + dev + 显式开关下使用，未将 RSA 私钥、摘要密钥、正式 token 或 Cookie 写入证据包。
- 证据使用一次性 file-H2 与正式种子用户/租户/角色加载链；临时服务已停止，临时数据库不属于仓库。
- 历史回执与历史证据文件保留原样；本轮验收仅以 `gap-round4` 原件和当前源码/测试为准。
- 当前剩余可执行修复项：0。仍需 Planner 独立复核 R2a/R2b 及本回执，之后由规划侧决定是否改变状态；Executor 不自行改变 `VERIFYING`。

## 5. 执行提交

R2a/R2b 已完成实现、定向测试、Server/Web 工程门禁和真实 HTTP 复核；提交 `VERIFYING / EXECUTION_SUBMITTED`，等待 Planner 独立验收。
