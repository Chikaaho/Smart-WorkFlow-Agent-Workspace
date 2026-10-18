# 第41项返修复核补充回执 04（G1—G3）

2026-10-18｜执行→规划。方向 `../ready/direction-reopen-041-review-followup.md`；复核缺口 `planning-review-reopen-041-01.md`；Owner 同版本覆盖授权 `owner-republish-017-authorization.md`。已有成功结果锁定（01—03），本回执仅补 G1—G3。

## 1. 结论

- **G1 唯一超管边界：核实成立＋一处真实缺口已修复**。既有防线（可引用证据）：①角色创建拒绝保留编码（`SysRoleServiceImpl.create`：`"superadmin".equals(code)` 抛"不可创建内置超管角色"）；②用户保存绑定按 code 过滤并抛错（`SysUserServiceImpl.updateRoleIds` 过滤 superadmin，多出即抛"只能绑定启用的普通角色"）→ 任何账号无法经 API 绑上超管角色；③内置超管角色 assertMutable 不可改删；④租户行过滤隔离角色管理。**真实缺口**：角色更新可把一个**已绑定**普通角色改名为 code=`superadmin`——编码查重 `getByCode` 走租户过滤，看不到 0 租户的 superadmin 角色（uk 为 (tenant_id,code)），改名后成员重登即取得跨租户旁路。**修复（提交 `c6a7c06`）**：`SysRoleServiceImpl.update` 与 create 同等拒绝保留编码；`UserDetailsProviderImpl` 超管判定叠加超级租户 0 约束（其它租户漂移绑定不旁路，含直改库情形）。**线上数据证据**（只读 SQL）：code=superadmin 角色全库恰 1 条（id=1、tenant 0、built_in=true、启用、未删）；绑定恰 1 条（role 1→user 1=admin@tenant 0，正常未删）；tenant 0 恰 1 用户。当前与规则层面均满足"仅这一个用户"。
- **G2 合规验收路径：已切换并部分完成**。摘要穷举方法已按复核停用，不留存/不回传秘密、摘要或破解材料。改用**用户已登录且获授权的会话**（demo_a_hq_1，上轮授权验证的存活会话）在**终态构建**（b016b5cc 部署后）复验：`/system/user` 共 14 条（仅本租户）、`/system/dept` 仅本租户 7 节点树——隔离未削弱；**视觉制品本轮已取得**（上轮工具限制已消除，见 §4）。admin 半边需一次登录：浏览器已停留在 `https://chikaho.cn/login`（新验证码已加载、表单就绪），按方向等待 Owner 人工完成验证码登录，随后补验 admin 用户/部门页（29 条/15 节点）并留存视觉证据。此前经摘要穷举登录取得的 29/15 接口结果仅作已发生事实记录，不据此判正式浏览器验收通过。
- **G3 发布身份：同版本覆盖已执行并回读**（Owner"版本号不变，覆盖"）。详见 §3；覆盖后**正式后端＝实际后端＝0.1.7**，同一制品（`c6a7c06`·`b016b5cc…`）绑定本次修复，非显示版本变更；前端 0.1.7（`4e89249`）与 DB 终点 0.1.7 未动（无新迁移需求）。

## 2. 目标身份/环境

| 对象 | 覆盖前 | 覆盖后（本回执时点） |
| --- | --- | --- |
| tag `0.1.7` | 5af1329（标签对象 b6a69bd3） | **c6a7c06**（新标签对象 065e1b7；force-with-lease 绑定操作前远端值） |
| Release `CH-aPaaS Server 0.1.7` 资产 | `bootstrap-0.1.7.jar` 218,033,508 B sha256 `309e9e1e…`（CI build-5af1329 产物） | **`bootstrap-0.1.7.jar` 218,033,795 B sha256 `b016b5cc…`**（CI run 39115050365 = build-c6a7c06 产物） |
| UAT `/opt/smart-workflow/server/bootstrap.jar` | a4f641d4…（0.1.7-SNAPSHOT e2fe50f 修复构建） | **b016b5cc…**（与 Release 资产同一 CI 制品；`build.version=0.1.7`） |
| CI（main） | run 39111840667（e2fe50f）failure＝P62UpgradeGatePgTest 领取竞态 | **run 39115050365（c6a7c06）success**；后续文档提交 f58e3ae 另触发 run，结果以 Actions 页为准（纯文档，不影响制品绑定） |
| 前端 / DB | 0.1.7 / 0.1.7 | 不变（`4e89249` / 终点 0.1.7，无新迁移） |

## 3. 行为结果（本轮动作与验证）

1. **G1 修复与测试**（分支 fix/develop/main 均至 `c6a7c06`，后随文档提交至 `f58e3ae`）：`RoleMenusContractAndSecurityTest` **14/0**（新增"PUT /system/role 改名 superadmin 被拒、code 不变"用例）、`UserDetailsProviderDataScopeTest` **14/0**（新增"非 0 租户绑定 superadmin 编码角色不旁路"用例）。
2. **正式构建**：`REVISION=0.1.7 scripts/build-prod.sh` 本地 **BUILD SUCCESS**（全量测试＋prod 打包＋制品门禁；`build.version=0.1.7`；218,036,255 B sha256 `2bd1875c…`；P62UpgradeGatePgTest 本地 2/0——同代码基 CI 失败为环境竞态的对照证据）。正式资产最终取 CI 制品（与原发布"制品=CI 构建产物"同源），本地制品为对照。
3. **CI**：推送后 run `39115050365`（c6a7c06→main）**success**，自动发布 `build-c6a7c06…` Release（资产即 b016b5cc 制品，下载回验 sha256 一致）。e2fe50f 的 run `39111840667` failure 诊断为 `P62UpgradeGatePgTest.upgradeConsumesLegacyTypesKeepsHistory`"命令未被领取"断言，日志同窗存在后台 command-dispatcher 与嵌入式 PG 重启竞态；该提交仅改租户旁路、无因果路径，登记 `todo/p62-upgrade-gate-test-claim-race.md`（时序族先例 p63）。
4. **0.1.7 覆盖**：删除原资产（HTTP 204）→ 上传 CI 制品为 `bootstrap-0.1.7.jar`（HTTP 201，digest 一致）→ 发布说明改写（保留原 5af1329·309e9e1e 历史事实＋覆盖记录）→ **全新下载回验** sha256 `b016b5cc…` 一致；`git ls-remote` 回读 tag 065e1b7→c6a7c06。
5. **UAT 部署**：备份轮转（`.bak`=a4f641d4、`.bak2`=309e9e1e、`.bak3`=217870418 B 旧包）→ 上传（服务器端 sha256 一致）→ `./stop.sh` → 换包 → 显式加载 `server.env` 启动 → 健康 `{"status":"UP"}`、`Started StarterApplication in 179.196 seconds`、本次启动（PID 2345095）ERROR 0、运行包 `build.version=0.1.7`。
6. **G2 合规复验（终态构建）**：demo_a_hq_1 会话经重启仍存活；用户页 14 条、部门树仅本租户；截图 2 张成功留存（系统页）。登录页截图连续 3 次 surface 超时（工具间歇性，与上轮 4 次同型），以 DOM 快照为证（账号/密码/验证码表单与新验证码图就绪），不冒充视觉证据。
7. **入口同步**：knowledge/current-status、session-handoff、memory 四件、需求池、根 README/CHANGELOG、ops §8、Server README/功能清单焦点行；登记 `todo/p62-upgrade-gate-test-claim-race.md`。

## 4. 原始证据位置

- 视觉：`product/0.1.7-bugfix/evidence/reopen-041/g2-demo-user-14-final-build.png`、`g2-demo-dept-final-build.png`（本机留存，不入库）。
- 构建/接口：`E:/code/release-assets-017/build-017-official.log`、`pre-release.json`、`post-release.json`、`build-release.json`、`upload-resp.json`、`verify-017-download.jar`（下载回验件）、`ci-e2fe.log`（失败诊断）。
- 代码：`SysRoleServiceImpl.java`（update 保留编码拒绝）、`UserDetailsProviderImpl.java`（SUPER_TENANT_ID 约束）、`RoleMenusContractAndSecurityTest.java`、`UserDetailsProviderDataScopeTest.java`。
- 线上只读 SQL/服务器核验：ssh 会话记录于执行侧（superadmin 角色与绑定唯一性、sha256、健康、启动行）。
- 凭据约束遵守：全程未在新文档/回执/日志重复口令值、散列或验证码材料。

## 5. 未解决项

1. **admin 半边合规验收**：待 Owner 在已停留的 `chikaho.cn/login` 人工完成验证码登录；随后执行方补验 admin 用户/部门页（29/15）与视觉证据。在此之前第 41 项保持 VERIFYING，不判整项验收通过。
2. **规划复核 `reopen-041-04`**（含本轮 G1 修复口径、覆盖后身份与 G2 剩余路径），及上轮遗留的可选裁定项（前端用户/部门列表是否补"租户"列、跨租户写是否需二次确认）。
3. f58e3ae（纯文档）触发的 main CI run 结束状态以 Actions 页为准。
