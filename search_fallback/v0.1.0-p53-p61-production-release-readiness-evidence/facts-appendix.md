# 附件：0.1.0 P53/P61 生产发布现状原始事实清单

本文件保存回执正文裁掉的可复核明细。回执：`search_fallback/v0.1.0-p53-p61-production-release-readiness.md`。

## A 两仓 develop 相对 main 的 10 个提交（`git log --oneline main..develop`，短 SHA）
Server（新→旧）：
`d18e9a3` chore(hygiene) 运行期上传产物移出版本库 · `385d92a` docs(state-hygiene) README/功能清单/AGENTS 对齐 · `fa96290` merge(p53) P61 服务侧与 P53 功能清单同步合入 develop · `6698b8c` docs(p53) 功能清单当前焦点同步 P53 COMPLETED 与总数 45 · `42cbc86` fix(p53) 登录验证码位图配色对齐设计令牌 · `c29f4ba` docs(state-hygiene) 版本口径与功能清单收敛 0.1.0 · `742adb8` feat(p61) 用户可见提示语范围纠偏（中文目录术语收口）· `f55300b` feat(p61) 用户可见错误码与提示语人性化——服务侧 · `0514c1f` docs(system) 功能清单收敛 P60 COMPLETED 并切换 P61 入口 · `47c8b86` docs(system) 功能清单同步 0.1.0 发布身份与整体终态（V93）

Web（新→旧）：
`039f987` chore(hygiene) 人工复核截图存档移出版本库 · `a2f7210` chore(hygiene) 移除误入库会话转储 · `efe54be` docs(state-hygiene) 前端入口说明与代理入口对齐 · `fc37608` merge(p53) 全局 UI 与组件布局优化合入 develop（保留 P61 八值）· `29d90e8` feat(p53) 全局 UI 与组件布局优化——设计还原收口与视觉回归基线 · `674bad9` docs(state-hygiene) 版本口径收敛 0.1.0 并修正对仓链接 · `d110ed8` feat(p61) 用户可见提示语范围纠偏——兜底文案与服务端修订对齐 · `e882cb5` feat(p53) 设计还原 fixture 管线与壳层设计校准 · `c5bc126` feat(p53) 全局 UI 设计令牌与组件布局还原 · `381ef74` feat(p61) 用户可见错误码与提示语人性化——UI 侧

两仓合并提交拓扑：Server `fa96290` 的第一父为 `0514c1f`、第二父分支顶端 `6698b8c`（feature/p61-...）；Web `fc37608` 的第一父为 `e882cb5`（实为 develop 侧）、第二父 `29d90e8`。两仓 develop 与各自 origin/develop 同 SHA。

## B 全部 Release 与资产（GitHub 公开回读）
| 仓 | tag | 类型 | Release 标题 | 发布时间(UTC) | 资产（名 / 大小 / sha256） |
|---|---|---|---|---|---|
| Server | `0.1.0` | annotated（对象 `ac37c6a2…82db` → `c15428f…3148`） | CH-aPaaS Server 0.1.0 | 2026-09-15T08:30:38Z | 仅 Source code (zip/tar.gz)；正文登记「Server main c15428f…3148 / Web main 963df36…8963 / 迁移终点 Flyway V93」 |
| Server | `build-c15428f0002f6bb0ceeff05c7cbcf842bd3d3148` | lightweight | CH-aPaaS-Server 0.1.0 build c15428f… | 2026-09-15T08:21Z | `bootstrap.jar` 209 MB sha256 `46f220bec98fc2c057868ecc14826890b5561c33bc4723ef5348d396e7986750`（上传 08:26:10Z） |
| Server | `build-20fffc1ddec13ea665fc388f4243c6e063974883` | lightweight | CH-aPaaS-Server 1.0.0-SNAPSHOT build 20fffc1… | 2026-09-07T12:01Z | `bootstrap.jar` 148 MB sha256 `d1ad946b36b9f77451246ba44908d93c853eeec7cb8b4d2a325f48ca70953459` |
| Web | `0.1.0` | annotated（对象 `ea196a43…6530` → `963df36…8963`） | CH-aPaaS Web 0.1.0 | 2026-09-15T08:30:41Z | 仅 Source code；正文登记双仓 main SHA |
| Web | `build-963df360ed18bc1c604652a13edb2a7ed0be8963` | lightweight | CH-aPaaS-Web 0.1.0 build 963df36… | 2026-09-15T07:37Z | `dist-963df360ed18bc1c604652a13edb2a7ed0be8963.zip` 854 KB sha256 `286c6090721d574532af21aee9babecd4a3b519649ffa6ad79023bab5cda98c5`（上传 07:40:31Z） |
| Web | `build-4ed9fdbfaaaf4e7be469201e2d0297c319a37c35` | lightweight | CH-aPaaS-Web 0.0.0 build 4ed9fdb… | 2026-09-07T12:02Z | `dist-4ed9fdb…zip` 802 KB sha256 `0677e2faae9dfe30b77342fa1fd4f849cf5c69e8b650e26fa8b890c84e917d1c` |

- 两仓 `0.1.0` Release 均为 `Latest`，页面无 `Pre-release`/`Draft` 标记；资产页仅渲染 Source code，未出现下载计数行（GitHub 仅在非零时渲染）。
- 两仓 `0.1.0` Release 均无构建资产；构建资产只在 `build-<sha>` Release 上。
- 历史 tag：Server/Web `0.0.2`（annotated，2026-09-07）、`v0.0.1`、`v0.0.1-beta`；另有 `build-6ab9ae5…`（Server）/ `build-4c044c6…`、`build-0bf6e89…`（Web）。

## C Actions 回读
| 仓 | run | 关联提交 | 结果 |
|---|---|---|---|
| Server | `34946504087` | `c15428f`（ci(server): main 自动门禁补充 Redis 服务） | completed · Success |
| Web | `34942666025` | `963df36`（Merge remote-tracking branch 'origin/develop'） | completed · Success |
两 run 页面标题与提交一致；`build-release.yml` 在工作流页可见。触发条件：`on.push.branches=[main]`（推 tag 不触发）。

## D 远端只读核验命令清单（全部 exit 0，无写操作）
`Get-ChildItem/git status/git branch -avv/git tag -l/git worktree list/git rev-list --left-right --count/git log/git ls-remote/git diff --stat`；`git ls-tree`、`git show --stat`；GitHub 公开页面 `releases.atom`、`releases/tag/*`、`releases/expanded_assets/*`、`actions/runs/*`（HTTP 200 存档于本目录 `github/`）。远端核验经 `ssh`（BatchMode，命令：hostname/date/uptime/df/free/ls/stat/sha256sum/ss/systemctl is-active/nginx -t/grep/head/tail/du/cat/ps/`/proc/<pid>/environ` 键名/curl/psql SELECT/du -sh/find -maxdepth），无任何写、重启、迁移或配置变更。

## E 生产目录与文件明细
- `/opt/smart-workflow/`：`server/`（`bootstrap.jar` 154,752,595 B、`bootstrap.jar.bak` 154,353,632 B、`bak2` 154,355,142 B、`bak3` 154,358,866 B、`start.sh` 1380 B、`stop.sh` 1743 B、`server.env` 1994 B mode 600、`server.pid`、`logs/`、`uploads/`（空）、`BOOT-INF/`（08-30 抽取残留：classes/lib/classpath.idx/layers.idx））；`web/`（`index.html` 932 B、`assets/` 519 文件、`backup-20260907/` 245 文件）。
- `logs/`：`server.log` 3,827,186,892 B（09-21 13:37 仍在增长）；`logs/backup/server_20260918.log` 0 B、`server_20260919.log` 0 B、`server_20260920.log` 486,985,728 B、`server_20260921.log` 2,117,632 B。`/etc/logrotate.d/` 无 smart-workflow 条目。
- 服务：nginx/redis-server/postgresql@14-main 均 active；`nginx -t` 通过；监听 443/80/22/1883(mosquitto)/5433(postgres，127.0.0.1 与 127.0.1.1)/6379(redis，本地)/7890(mihomo)/3897(nginx)/38784(reasonix)/8080(java，`*:8080`)。
- nginx：`conf.d/chikaho.cn.conf`（+ `.bak`、`.bak-20260831`）；443 段含 `/sw`（alias web 目录，index index.html）、`/sw-server/`（proxy_pass `http://127.0.0.1:8080/`）、`/` 与 `/events`（→`127.0.0.1:38784`）；80 段含一条 `/`→`127.0.0.1:5173`（5173 未监听）与一条 301→https。`sites-enabled/default` 为 Ubuntu 默认站点，与本项目无关。
- 服务器工具链：`git`、`mvn`(=/usr/local/bin/mvn)、`node`、`java`、`psql` 均存在；`/opt/apache-maven-*`、`/opt/node-*`、`/opt/maven`。

## F 版本投影与迁移一致性（三仓）
- `version.json`：`0.1.0` / 迭代 `0.0.3`；`flywayEndpoint` 写 H2 V92、PG V92；rules 要求 tag/Release 须经授权后创建。
- `release/0.1.0/MANIFEST.json`：生成于 2026-09-14，候选 SHA 为 **旧值**（server `e941d74`、web `0a746e3`、workspace `9929dba`，标 clean）；`flyway` 写 H2 V92/PG V92；`gates` 记 Server 1361 tests、Web 1185+3。
- `release/0.1.0/DB-MIGRATIONS.md`：声明终点 V92（V89—V92 明细）；`release/0.1.0/UPGRADE.md` 同样以 V92 为终点、要求注入 `SW_JWT_SECRET`（实际键名为 `JWT_SECRET`）。
- `CHANGELOG.md` 与 `knowledge/current-status.md`：0.1.0 发布身份与迁移终点 **V93**；Server main `c15428f…`、Web main `963df36…`；Actions `34946504087`/`34942666025`；验证基线 Server 1362/0/0/0、Web 1185+3；P53 为第 45 个正式功能。
- 实际迁移：`git ls-tree` 比对 main 与 develop 的 `db/migration/**` 完全一致（208 项），最高为 `notify/{h2,postgresql}/V93__i6_notify_flag_boolean_closure.sql`；V900—V903 属 `devseed/h2`（生产不装载）。P53/P61 引入 **0 个** 迁移与 **0 个** 新环境变量占位。

## G 本目录证据文件
- `github/`：Server/Web `0.1.0` 与 `build-*` Release 页面、`expanded_assets` 片段、`releases` 列表页 HTML 存档。
- `remote-readonly-probe.sh`、`remote-readonly-probe3.sh`…`probe7.sh`：远端只读探测脚本（可复跑）；`remote-readonly-probe-output.txt`／`-probe2-output.txt`：输出（`server.env` 值已按行脱敏为 `[REDACTED]`）。
- `known_hosts_probe`：本次连接采集的主机公钥（ED25519）。
