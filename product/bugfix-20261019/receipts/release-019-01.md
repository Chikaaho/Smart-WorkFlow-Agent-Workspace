# 0.1.9 发布回执：判断脚本 worker 修复发布链（Server/Web 成对）

- 日期：2026-10-19
- 版本：**0.1.9**（Owner 2026-10-19 明确确认版本号，并授权完整发布链：develop→main→tag/Release→UAT 部署→流程 v5→复验）
- 批次范围：`product/bugfix-20261019/bug-ledger.md` 的 BF20261019-01/02/03（判断脚本 worker 修复）
- 阶段：总 7 阶段（§3.0）＝1 评估完成、2 执行完成、3 验收同步完成、4 develop→main 完成、5 发版完成（本文回执）、6 发布后同步进行中、7 未开始

## 1. 代码与版本事实

| 项 | Server | Web |
|---|---|---|
| 修复分支 | `fix/bpm-script-worker-launch`（`b18697e`＋`6d7f951`，已推送并删除远端分支） | 无（本轮无前端代码变化） |
| develop 合并 | `8f9f4be`（merge bugfix） | — |
| 版本收敛 | `ed5277b`（`pom.xml` `<revision>`＝0.1.9-SNAPSHOT＋CI 断言＋`build-prod.sh` 注释＋`check-version-identity.sh` pom/workflow/develop 三模式 PASS） | `3953f3e`（`package.json` 0.1.9） |
| main 合并 | `96ab6d0` | `3c43a3c` |
| CI | run `39270156052` attempt1 **failure**＝既有 `P63ReservationBoundaryPgTest` 预约窗口时序族（与 0.1.8 attempt1 同族）→ attempt2 **success** | run `39270322491` **success** |
| 制品 | `bootstrap.jar` **218,047,647 B sha256 `d32a82c75062b2d49170ab2c5043514c2c34aec9e587603cdca7485472853d5f`**，`META-INF/production-build.properties` `build.version=0.1.9` | `sw-web-dist-0.1.9.zip` 1,346,615 B sha256 `bee21c4e51901c2bb247e12ce05008e50b889ef178f8c71611b8e27a64da5798` |
| annotated tag | `0.1.9` → `96ab6d0` | `0.1.9` → `3c43a3c` |
| 公开 Release | `CH-aPaaS Server 0.1.9`（latest=true）；CI 侧 `build-96ab6d0b…` Release 资产 `bootstrap.jar` 218,047,647 B | `CH-aPaaS Web 0.1.9`，资产 `sw-web-dist-0.1.9.zip` 1,346,615 B |
| 版本化资产 | `bootstrap-0.1.9.jar` 上传重试中（GitHub 资产上传对大文件 408 超时，见 §4） | 已就位 |

版本身份一致性：CI 采用版本、制品内 `build.version`、tag/Release 名称三者均为 0.1.9；两仓 `releases/latest` 均指向 0.1.9。

## 2. UAT 部署（0.1.8 → 0.1.9 就地升级，2026-10-19 23:20—23:25）

| 步骤 | 事实 |
|---|---|
| 备份 | `bootstrap.jar.bak-20261019_232116-0.1.8`（218,042,791 B） |
| 替换 | 上传 0.1.9 制品并核验 sha256＝`d32a82c7…`；`build.version=0.1.9`；218,047,647 B |
| 移除旧绕行 | `server.env` 中 `SW_BPM_SCRIPT_WORKER_CLASSPATH` 行删除（计数 0）；211 MB 手工解包目录 `app/` 删除——UAT 自此走**自动拉起**路径（BF20261019-01 的验收面） |
| 重启 | 23:21:34 停服替换启动；`Started StarterApplication in 210.185 seconds`（23:25:11.986）；约 9 分钟停机（含冷启动） |
| 健康 | `GET /sw-server/api/actuator/health` → `{"status":"UP"}` |
| 启动段日志 | 末段 ERROR 计数 **0** |
| worker 拉起实证 | 日志 `P64 判断 worker 启动: (heap cap 128m, codeSource=jar:nested:/opt/smart-workflow/server/bootstrap.jar/!BOOT-INF/lib/sw-bpm-engine-0.1.9.jar!/, launch: source=fat-jar, mainClass=…PropertiesLauncher, classpath=/opt/smart-workflow/server/bootstrap.jar)` —— **BF20261019-01 在 UAT 真实形态下已修复**（无需解包、无需环境变量覆盖） |

## 3. 流程 v5 发布（UAT 灾备演练，graphVersion 7）

以管理员会话（`demo_a_hq_1`，验证码人工识读）执行本机脚本 `sw-scriptfix-e2e-20261019/uat-v5-config.mjs publish`：

- `PUT /workflow/defs/2111818829082963970/graph` → `{"code":0}`；`POST …/validate` → `{"code":0,"data":[]}`；`POST …/publish` → `{"code":0}`，`deploymentId=bdfd8e2d-cbd1-11f1-b53f-00163e0d142f`，graphVersion **7** PUBLISHED。
- 发布后回读（`GET /workflow/defs/{id}`）确认：
  - `variables=[{varId:var_drill_depts,type:DEPT_SET,source:MAIN_FORM,sourceField:field_drill_depts,aggregation:UNION}]`
  - `triggers=[{triggerId:tg_supervisors,event:PROCESS_START,script:"… #获取流程变量('var_drill_depts') … #获取分管领导(\"\" + d) … #设置流程变量('deptSupervisors', out.slice(0)) …"}]`
  - `node_2` 名称「分管领导审批（脚本解析）」、`participant={"strategy":"EXPRESSION","value":"variables.deptSupervisors"}`（**v4 的 `DEPT_LEADER ["91001"]` 写死配置已替换**）

## 4. 未完成项与如实披露

- **版本化资产**：首次发布制品（`d32a82c7…`）的版本化资产未落地；覆盖轮制品（`9e4b5629…`）的 `bootstrap-0.1.9.jar` **已发布**（218,048,244 B，GitHub 资产摘要一致，见 `receipts/republish-019-01.md`）。历史事实：`gh release create` 携带资产会在上传 408 时回滚删除 Release，故改为「先建 Release，再单独 `gh release upload`」；经本机代理上传多次 408 超时，改直连后完成。
- **UAT 端到端复验未通过，原因已定位为独立缺陷 BF20261019-04**（预热预算硬编码 5s），详见 `bf20261019-script-worker-02.md`；修复已上 develop（`8f6020e`），发布需 Owner 确认版本。
- CI attempt1 失败为既有 `P63ReservationBoundaryPgTest` 时序族（登记在案，未改断言），attempt2 全绿后发布；本回执不主张「本地全量全绿」。
