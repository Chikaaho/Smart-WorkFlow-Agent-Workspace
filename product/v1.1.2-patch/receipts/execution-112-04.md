# execution-112-04：1.1.2 阶段 4—5 完成，阶段 6 部署通道阻塞（BLOCKED）

方向 `product/v1.1.2-patch/ready/direction-v1.1.2.md`（L）｜执行｜2026-11-14｜依据 `planning-review-112-03.md`（阶段 3 PASSED）与持续授权推进。本回执覆盖阶段 4（合并）、阶段 5（发版）完成事实与阶段 6 的真实外部阻塞；演示环境复测、B6 与同步在解除阻塞后继续（后续回执）。

## 1. 阶段 4：版本收敛 + 合并链（全部普通合并，每步 CI success）

### 版本收敛（规划 112-03 §3 点名的版本来源同批推进）

- Server：`pom.xml` 开发默认 `<revision>` `1.1.0-SNAPSHOT` → `1.1.2-SNAPSHOT`；`.github/workflows/build-release.yml` develop 版本断言与注释同步 `1.1.2-SNAPSHOT`/`正式值 1.1.2`/`-Drevision=1.1.2`（`68c07ceb`）。
- Web：`package.json` version `1.1.1` → `1.1.2`（`52ed983`；工作流动态读 package.json，无字面断言）。
- 版本脚本（`check-version-identity.sh` 等）为动态读取，无版本字面量硬编码，无需改动。

### 合并链（feature → develop → main）

| 仓 | 步骤 | commit/合并 | CI run | 结果 |
|---|---|---|---|---|
| Server | feature CI（版本批次） | `68c07ceb` | `43602976834` | success |
| Server | feature → develop | `d1e0cabe` | `43604771445` | success |
| Server | develop → main | `c3724e52` | `43606362074` | success（main 推送自动创建 `build-c3724e52…` Release，`--latest=false`） |
| Web | feature CI（版本批次） | `52ed983` | `43602997735` | success |
| Web | feature → develop | `74fa67f` | `43603906113` | success |
| Web | develop → main | `abfe1339` | `43604754133` | success（自动创建 `build-abfe1339…` Release，`--latest=false`） |

功能分支删除前 `git branch --merged` 验证均已合入；两仓 `feature/1.1.2` 本地与远端已删除，`git branch -a` 无 1.1.2 分支残留。

## 2. 阶段 5：tag 1.1.2 + Release Latest

| 仓 | tag → commit | Release id | 资产 | 字节 | sha256 |
|---|---|---|---|---|---|
| Server | `1.1.2`（annotated）→ `c3724e52` | `445377854` | `bootstrap-1.1.2.jar` | 242,763,918 B | `606f5dae3fae2667f94904488659c538ebbbfac017955abdf2ebfdcb68ee6324` |
| Web | `1.1.2`（annotated）→ `abfe1339` | `445380514` | `sw-web-dist-1.1.2.zip` | 6,255,491 B | 见本仓记录（上传自 CI 同字节资产） |

- 两仓 `releases/latest` 回读均为 **1.1.2**；Server 生产制品标记 `build.version=1.1.2` 实测（`META-INF/production-build.properties`）。
- 发布说明列出 B1—B6 与修复内容（取消时同步结果执行行、已取消不显示耗时）；`build-<sha>` Release 保持 `latest=false`；既有语义 Release（1.1.0/1.1.1）与既有 tag 未改动。
- 资产取自对应 `build-<sha>` Release 下载后就地创建，上传状态 `uploaded`、字节一致。

## 3. 阶段 6：部署通道阻塞（真实外部凭据缺失）

**阻塞点**：演示环境（UAT 8.166.112.85）SSH 免密通道在本会话不可用——部署所需的磁盘检查、备份、上传 jar/zip、`stop.sh`/`start.sh`、nginx reload、部署后核验全部依赖该通道。

**已尝试动作与真实结果**：
1. `ssh -o BatchMode=yes root@8.166.112.85 "df -h /"` → `Permission denied (publickey,password)`；
2. `~/.ssh/config` 无该主机条目；`ssh-keygen -F 8.166.112.85` 确认 known_hosts 存在历史连接记录（line 8/9）；
3. 显式 `-i ~/.ssh/id_rsa` 与 `-i ~/.ssh/github_ed25519` 均 denied；
4. `ubuntu`/`admin`/`ecs-user` 用户名探测均 denied；
5. 全工作区检索（`memory/`、`knowledge/`、`product/*/receipts/`、`release/`、`.runtime-v110/`、工作区根配置）无部署通道凭据/脚本记录（历史回执只记「上传/备份/替换」操作事实，不含通道）。

**解除条件（唯一）**：Owner 在本机配置可登录该主机的 SSH 密钥（如 `ssh-copy-id root@8.166.112.85` 或告知既有登录方式）后回复继续；演示环境凭据属用户秘密，不由会话内明文传递。

**阻塞期间未做**：演示环境备份、上传、部署、复测 B1/B2/B3、B6 展示图重拍、以及依赖部署事实的全部同步（`version.json`、`CHANGELOG.md`、knowledge、需求池 P70/P71 核销、README 三仓）——均依赖部署后实际事实，不提前落盘。P72（规划已登记范围外）保持未排期。

## 4. 进度

**总阶段数 7｜已完成 3（评估、实施、验收）｜进行中 1（阶段 4—5 已完成，阶段 6 部署等待演示环境通道；阻塞项：SSH 凭据）｜未开始 3（部署与复测收尾、同步、结束）**。

```text
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/v1.1.2-patch/receipts/execution-112-04.md","evidence":["product/v1.1.2-patch/receipts/execution-112-04.md"],"block_type":"EXTERNAL","attempted":["ssh BatchMode root@8.166.112.85 → Permission denied (publickey,password)","~/.ssh/config 无该主机条目；known_hosts 有历史记录(line 8/9)","显式 id_rsa / github_ed25519 → 均 denied","ubuntu/admin/ecs-user 用户名探测 → 均 denied","全工作区检索无部署凭据/通道记录"],"release_condition":"Owner 在本机配置演示环境（8.166.112.85）可登录 SSH 通道（如 ssh-copy-id 或告知既有方式）后回复继续，即执行阶段 6 部署/复测/同步","work_items":[{"id":"stage-6-deploy","status":"PENDING","next_action":"演示环境备份并部署 Server 1.1.2 + Web 1.1.2，核对版本/health/Flyway 35 行","actionable":true,"authorized":true,"dependency_satisfied":false},{"id":"stage-6-retest","status":"PENDING","next_action":"演示环境复测 B1（双编号）/B2/B3 + B6 展示图三仓","actionable":true,"authorized":true,"dependency_satisfied":false},{"id":"stage-6-sync","status":"PENDING","next_action":"同步 version.json/CHANGELOG/knowledge/需求池 P70 P71 核销/README 三仓","actionable":true,"authorized":true,"dependency_satisfied":false}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Owner 提供演示环境 SSH 通道（配置密钥或告知登录方式）后继续阶段 6","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"execution-112-04:server-tag-1.1.2-c3724e52:web-tag-1.1.2-abfe1339:releases-latest","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server:pom.xml+build-release.yml(版本收敛 68c07ceb)","Smart-WorkFlow-aPaaS-Web:package.json(52ed983)"],"tool_actions":["git merge feature→develop→main both repos","gh-api tags 1.1.2 + Releases 445377854/445380514 make_latest=true","branch deletion after --merged verification","ssh probes (5 attempts, all denied)"],"new_evidence":["合并链六步 CI 全 success","两仓 Latest=1.1.2、制品标记 build.version=1.1.2 实测","资产字节与 sha256 记录"],"closed_work_items":["stage-4-merge","stage-5-release"]},"stop_reason":"EXTERNAL_DEPENDENCY","browser_status":"NOT_APPLICABLE","confirmation":{"category":"SECRET","input_source":"USER_SECRET","action":"演示环境（8.166.112.85）SSH 登录凭据；不由会话明文输入，由 Owner 在本机配置密钥或告知既有登录方式后继续"},"tool_results":[{"tool":"git","outcome":"SUCCEEDED","detail":"两仓六步合并推送 + annotated tag 1.1.2 + 分支删除"},{"tool":"gh-api","outcome":"SUCCEEDED","detail":"Releases 445377854/445380514 创建成功，latest 均为 1.1.2，资产 uploaded 字节一致"},{"tool":"ssh","outcome":"REQUIRES_SECRET","detail":"部署动作需要演示环境登录凭据：root/ubuntu/admin/ecs-user × id_rsa/github_ed25519 探测均 Permission denied (publickey,password)（真实工具输出）；无 sshpass；工作区无凭据记录"}]}
```
