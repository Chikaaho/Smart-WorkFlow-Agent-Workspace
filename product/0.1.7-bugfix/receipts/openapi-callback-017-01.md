# 0.1.7 追加缺陷修复回执：openapi 异步回调租户上下文（openapi-callback-017-01）

2026-10-18｜执行→规划。方向 `../ready/direction-openapi-callback-017.md`；核实来源 `../../search_fallback/p62-openapi-callback-product-gap.md`（P62 去向：9 项延期/6 项不合入的不受影响范围保持不变）。

## 1. 修复对象与提交

- 追加缺陷（L 级，后台租户隔离）：{@code @Async @TransactionalEventListener(AFTER_COMMIT)} 回调监听器在无请求线程身份时因租户行拦截器 fail-closed 抛错，导致提交后加速投递完全失效（生产 UAT 与制品 CI 日志均已实证，见核实回执）。
- 修复提交：`00e0a73`（分支 `fix/openapi-callback-tenant-017` → `develop` → `main` 三支同点；CI run 39125380917 = **success**（全量测试＋prod 打包＋制品门禁；原占位文字按验收记录消解后本次一并更正）。
- 变更摘要（2 产品文件＋2 测试文件，+525/−7；不含装置/迁移/无关项）：
  1. `OpenApiCallbackListener.onEvent` 入口按事件携带的权威租户还原系统执行身份（对齐 `BpmNotifyListener` 既有范式：set→try→finally clear），使租户行过滤保持生效而不再 fail-closed；事件缺失租户身份时拒绝处理（warn 日志，不查库不投递），不回退为全局查询。
  2. `OpenApiCallbackDeliveryService.record` 投递记录租户显式取事件租户（归属不依赖任何线程兜底填充）。
  3. 未改变恢复调度、重试、去重、失败可查、恢复重发语义。

## 2. 行为验证（旧失败条件被覆盖）

- **红基线（未修复代码上新增测试 3/3 红，证明用例判别原失败条件）**：监听器在无身份线程原样抛 `租户上下文缺失` fail-closed（错误复现）、两租户投递断言 0 命中（投递不发生）。
- **绿验证（修复后，本地真实 PostgreSQL 嵌入实例）**：
  - 单测 `OpenApiCallbackListenerTest` **4/0**（身份还原＋操作人注入＋用毕清理；操作人缺失兜底；缺失租户拒绝零查库零投递；非终态/缺业务ID/空事件不动）；openapi 模块合计 **14/0**（含既有 `OpenApiCallbackDeliveryServiceTest` 3/0、`OpenApiServiceTest` 7/0 回归）。
  - e2e `OpenApiCallbackAsyncTenantPgTest` **3/0**（33.98s）：
    - 真实事务提交后、无请求线程身份的异步链路完成投递：接收端恰好 1 次、成功落账、**投递发生时任务仍为 PENDING（判别投递方为即时监听器而非恢复调度）**；随后恢复调度关闭任务为 SUCCESS 且零重复投递（去重合同保持）。
    - 两租户（0/9001）各用所属应用与租户落账：互不触达、`跨租户行=0`、投递记录租户各自正确。
    - 缺失/无效权威身份（null 租户、不存在租户、非终态）拒绝处理：零落账零投递零残留，不退化为全局查询。
  - 受影响回归：CI 全量门禁 run `39125380917` 覆盖（含 Phase4 交付接缝/提交边界/通知等既有回归；本地因 Phase4 需工作区外 PG 凭据未跑，由 CI 承担）。
- 测试隔离性：接收端为本机受控 HTTP 服务（非真实外部用户）；未向真实外部投递、未使用线上数据改写。

## 3. 同版本覆盖发布（Owner 授权复核说明）

- **授权适用范围核对**：`owner-republish-017-authorization.md` 覆盖范围为"0.1.7 正式修复构建、对应 tag/Release 资产与既有 UAT 部署，执行方核实**最终已验证修复提交**"——本追加缺陷为当前修复列车的最终修复提交，授权适用；方向亦指示使用 Owner 已确定的 0.1.7 并核对说明。
- 覆盖前记录：tag `0.1.7` 对象 `065e1b75…`→提交 `c6a7c06`；Release 资产 `bootstrap-0.1.7.jar` sha256 `b016b5cc…`（218,033,795 B）；UAT 运行包同 `b016b5cc…`。仓库外恢复备份：`backup-pre-overwrite-017/bootstrap-0.1.7-c6a7c06-b016b5cc.jar`（另有原发布 309e9e1e 备份保留）。
- 执行：① 删除原资产（HTTP 204）→ 上传 CI 制品为 `bootstrap-0.1.7.jar`（HTTP 201，digest `sha256:d8b390c1…` 一致）→ 发布说明改写为第二次覆盖版（保留原发布与第一次覆盖全部历史事实）；② tag `0.1.7` force-with-lease 重指（原对象 `065e1b75…` → 新对象 `f72c11f…` → 提交 `00e0a73`）；③ UAT 备份轮转（`.bak`=b016b5cc 前一运行包、`.bak2`=a4f641d4 对照构建、`.bak3`=309e9e1e 原发布）→ 上传 `.new`（服务器端 sha256 一致）→ `./stop.sh` → 换包 → 显式加载 `server.env` 启动。
- 回读：运行包 `d8b390c1…`（218,034,381 B）、健康 `{"status":"UP"}`（/api/actuator/health）、`Started StarterApplication in 170.027 seconds`、本次启动（PID 2349711）ERROR 0、`pom.properties version=0.1.7`；Release 全新下载回验 sha256 与 digest 一致；tag ls-remote 回读 `f72c11f…`→`00e0a73`。**正式后端＝实际后端＝0.1.7 且绑定本次修复**（非仅显示版本变更）。
- 未重写无关分支历史；未覆盖他人变更（lease/精确引用）；前端 0.1.7（4e89249）与 DB 终点 0.1.7 未动。

## 4. 原始证据位置

- 红/绿基线：`sw-bootstrap/target/surefire-reports/TEST-com.sw.ck.bootstrap.openapi.OpenApiCallbackAsyncTenantPgTest.xml`（含 [OC-EV] 行）；`sw-biz/sw-biz-openapi/sw-biz-openapi-biz/target/surefire-reports/`（单测）。
- CI：run 39125380917（main=00e0a73）；CI 制品下载回验件与摘要值记录于 `E:/code/release-assets-017/`（执行侧本机）。
- 发布/部署回读：ssh 只读记录（tag ls-remote、资产 digest、UAT sha256/健康/启动行）于执行侧。
- 凭据约束遵守：未在新文档/回执/日志重复口令、散列或验证码材料。

## 5. 未解决项

1. 本回执待规划验收；接受后按列车交付链收口（发布后同步已完成项随本回执提交）。
2. admin 页面人工登录依赖独立保留（第 41 项 VERIFYING 不变），不影响本修复。
3. `fix/super-tenant-visibility` 分支按既定范围在第 41 项复核通过后清理；P62 原分支（16 提交：9 延期/6 不合入裁决保留）与 `fix/openapi-callback-tenant-017` 均保留待终态处置。
