# 0.1.0 P53/P61 生产发布执行回执 01（阶段进度 + 远程授权阻塞报告）

> 角色：执行（Executor）　日期：2026-09-21　方向：`../ready/direction-v0.1.0-p53-p61-production-release.md`（XL，READY）
> 状态：候选未漂移已复核；本地与演示环境前置门禁全部完成；远程 Git/Release 写动按方向 §5/§9 待 Owner 精确授权，当前合法终态 `BLOCKED`。

## 1. 候选复核（方向 §3）

- 执行前重新 fetch 并回读：Server `origin/develop=d18e9a39c552918615be8b158dfe0cc278cb309f`、Web `origin/develop=039f987437ed6369c3c131631bd7622c6ae482e7`，本地=远端、工作树 clean、均 ahead 10 / behind 0——与锁定候选一致，快照未失效。

## 2. 发布前门禁（方向 §4）

| 门禁 | 结果 |
|---|---|
| Server 正式工程门禁 | `MAVEN_OPTS=-Xmx2g mvn -B test`：**1423 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS**（4 分 47 秒；原始输出 `evidence/release-gate-server-mvn-test.log`） |
| Web 正式工程门禁 | 四连 `typecheck/lint/test/build` 全部 **exit 0**；**134 files passed + 1 skipped；1217 tests passed + 3 skipped**（原始输出 `evidence/release-gate-web.log`） |
| 演示环境秘密 | `JWT_SECRET`、`SW_SSO_CIPHER_KEY` 服务器侧生成并注入 `/opt/smart-workflow/server/server.env`（mode 600）；输出仅存在性+指纹（jwt=c0d2cec61c80 / sso=7c2959175b26），明文未经过任何日志或回执 |
| 磁盘清理（§4.2，路径先回读归属） | 删除 `BOOT-INF`(149M 抽取残留)、`bootstrap.jar.bak/bak2/bak3`(441M)、`logs/backup/*`(467M)、`/tmp/sb.jar`；截断 3.8G 陈旧 `server.log`；磁盘 **92%→66%（可用 1.6G→6.4G）**。保留运行中 `bootstrap.jar` 与 `web/backup-20260907` 作回滚参照 |
| 日志轮转（§4.3） | 新增 `/etc/logrotate.d/smart-workflow`（daily + maxsize 100M + compress + rotate 7 + copytruncate，`logrotate -d` 校验通过）；停用旧 cron 行 `0 0 * * * /data/logs_backup.sh`（注释保留，脚本未删） |
| 发布材料修正（§4.4） | `version.json`（V92→V93、重登记口径）、`CHANGELOG.md`（V93+P53/P61 并入段落）、`DB-MIGRATIONS.md`（V93 行+真实模块路径）、`UPGRADE.md`（`SW_JWT_SECRET`→`JWT_SECRET`、+`SW_SSO_CIPHER_KEY`、V93 终点断言）、`CONFIG-CHANGES.md`（启动期 fail-fast 秘密表）、`RELEASE-NOTES.md`（P53/P61 用户可见说明）、`ROLLBACK.md`（V89—V93）、`docs/ops/production-ops.md`（健康路径 `/api/actuator/health`、server.env 变量清单、8080 监听事实、磁盘口径改实时核验） |
| MANIFEST 重生成 | `release/0.1.0/MANIFEST.json` 以最终候选 SHA、两仓门禁计数与环境门禁重生成；`ciAssets` 置 PENDING_PUSH，推送后回填 SHA-256 再建 Release |

## 3. 本地合并（方向 §5，未推送）

- Server：`git merge --ff-only origin/develop` → main `c15428f→d18e9a3`（105 files +4371/−511），工作树 clean。
- Web：`git merge --ff-only origin/develop` → main `963df36→039f987`，工作树 clean。
- 快进合并保留全部 10 提交历史，最终 main SHA = 锁定候选 SHA，无新提交夹带。

## 4. 演示环境巡检事实（只读，发布前基线）

- 运行身份：0.0.2 线手工 jar（154,752,595B，09-07），PID 托管无 systemd；DB `flyway_schema_history` max=**V58**；直连健康 `/api/actuator/health`=200；经 nginx `/sw-server/api/actuator/health` 无 Host 头实测 404（判定为 vhost 匹配问题，列入部署阶段带正式域名复测项）；`server.env` 原有 8 条 export 行未改动，仅追加。

## 5. 待 Owner 精确授权的远程写动（方向 §5/§9 全量对象）

1. **推送 main（普通推送，非强制）**：Server `main d18e9a39c552918615be8b158dfe0cc278cb309f` → `https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server.git`（fast-forward c15428f0…）；Web `main 039f987437ed6369c3c131631bd7622c6ae482e7` → `https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web.git`（fast-forward 963df36…）。
2. **删除旧 tag/Release 并重建**：Server tag `0.1.0`（对象 `ac37c6a29d9cd510ced34d90593e127820f782db`→`c15428f0…`）、Web tag `0.1.0`（对象 `ea196a43ab08f6127073d7a9a85c62f8f1f56530`→`963df36…`）；对应公开 Release「CH-aPaaS Server/Web 0.1.0」（Latest、仅源码、下载 0）。重建：annotated tag `0.1.0` + 公开 Release 指向新 main，正文含 SHA、CI 资产 SHA-256、V93 重建、P53/P61 内容与未验证边界。
3. **CI 资产化**：推送后 main Actions 生成 `build-<sha>` 资产（Server jar ≈209MB、Web dist zip），下载后 SHA-256 校验、回填 MANIFEST。
4. **演示环境部署与可见验收**：备份旧 jar+DB dump → 停服 → 重建本项目数据库（清空重建，完整迁移链至 V93，不载入 devseed V900—V903）→ 初始化演示管理员 → 部署 CI jar/Web dist → nginx 校验 → 正式浏览器验收（headless=false，留存制品/URL/视口/身份/对象/网络索引）。

**风险声明**：同名 tag 异指的修正必须删除重建（远程重写、非幂等）；旧 `0.1.0` Release 公开身份被替换。缓解：两 Release 下载 0、仅源码、从未部署，无外部下游依赖（探索回执 01 已核）。

## 6. 偏差与风险

- 探索回执记录"经 nginx 健康=200"，本轮无 Host 头实测 404——判定为 vhost 匹配问题，列入部署阶段带正式域名复测项，不构成阻塞。
- `gh` CLI 未安装；已验证 git credential 存在 PAT（用户名 Chikaaho，GitHub API Head /repos=200），Release/tag 删除重建走 REST API，凭据仅进程内使用、不落盘不回显。
- Workspace 19 个文件变更（发布材料+临时巡检脚本/门禁日志）未提交；门禁日志将归档 `evidence/production-release-01/`，临时文件在部署完成后清理；Workspace Git 提交由 Owner/Planner 决定。

## 7. Executor 结论

本地授权内工作全部完成且无剩余可独立执行项；远程写动按宪法与方向 §9 属用户确认路径（REMOTE_PUBLISH）。提交 `BLOCKED`，解除条件=Owner 对第 5 节四项的明确授权。

## 8. Owner 授权后执行记录（2026-09-21，指令「推送发布并测试验收」）

1. **推送 main**：Server `c15428f..d18e9a3 main->main`、Web `963df36..039f987 main->main`，普通推送非强制，双仓 origin/main 回读一致。
2. **CI**：Server run 35569219107、Web run 35569219967，均 completed/**success**；`build-<sha>` 资产生成。
3. **CI 资产校验**：Server `bootstrap.jar` 218,971,165 B sha256 `cce9efbe…24e0`；Web `dist-039f987….zip` 994,295 B sha256 `17814747…9beb`；本地下载与服务器落位双重 sha256 一致。
4. **tag/Release 重建**：旧 Release（388979846/388979873）API 删除 → 旧 tag 远程删除 → 新 annotated tag 推送（Server 对象 `c2583861…`、Web `250bfcb4…`，API 剥离校验均指向新 main）→ 新公开 Release（392753737/392753751，Latest、非 draft/prerelease）创建，正文含 SHA/CI 摘要/V93/P53/P61/边界与部署结论。
5. **演示环境部署**：旧 jar 备份 `bootstrap.jar.bak`（154,752,595B）→ 停服（PORT_FREE）→ 换 CI jar → DB dump 备份 `/data/backup/smart_workflow_20260921_1512.dump`（315K）→ 清空重建（owner=root）→ 启动期迁移 **V1→V93（0 failed）** → 本地健康 200、经 nginx 正确 vhost `/sw/`=200、`/sw-server/api/actuator/health`=200 `UP` → 启动日志 **0 ERROR、0 秘密泄漏** → 磁盘 68%（可用 5.9G）。
6. **过程偏差**：验证码 OCR 两次 2101（P61 标准错误响应 `auth.captcha_mismatch`+`eventRef`，本身构成 P61 证据）；API 登录链改由 Owner 已登录的可见会话完成，演示数据建立随即按 Owner 指令停止；nginx IP-vhost 502 为无关配置块，正确域名 vhost 全部 200。

## 9. 移交与结论（按 Owner 2026-09-21 指令收窄）

Owner 指令「结束吧,我自己测试验收,把 main 分支和 tag 以及 release 更新好就行」：发布身份（main/tag/Release）已全部更新并验证；正式浏览器验收由 Owner 亲自执行，执行侧不再推进。演示环境当前为全新 V93 库（无业务数据），回滚参照：`bootstrap.jar.bak` + `web.bak-20260921` + DB dump。

遗留清理项（不影响版本身份）：Workspace 根 `release-gate-*.log`（已归档至 evidence 副本）、`.release-staging\`、`.release-ssh-key`、`.release-recon*.sh` 待删除；服务器 `/tmp` 上传物已清。
