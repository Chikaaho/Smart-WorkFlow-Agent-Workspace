# execution-113-04：1.1.3 阶段 4—6（合并、发版完成；部署受阻报告）

方向 `product/v1.1.3-patch/ready/direction-v1.1.3.md`｜执行｜2026-11-19 ~ 11-20｜依据 `planning-execution-prompt-113-03.md`（阶段 4—6 持续授权）。**阶段 4、5 完成；阶段 6 部署遇生产凭据迁移前置，已立即回滚恢复服务，阻塞点报告如下，待 Owner 裁决。**

## 1. 阶段 4：合并（完成）

两仓 `feature/1.1.3`（含全部已验收提交）→ develop → main 普通合并，版本号同批更新：

- Server：feature（5f19d2d4、6770ff7b、583f1a38）并入 develop（688d9dd7），`pom.xml`/`build-release.yml` 版本断言收敛 1.1.3-SNAPSHOT（ce24e283，仿 68c07ceb 先例）；并入 main（5884d800）。
- Web：feature（169df9d、97a33b6、bb32650）并入 develop，`package.json` 版本 1.1.3（9f684ef）；并入 main（05b9739）。

### CI 修复链（4 轮，全部先在 develop 修好再合并，单独提交披露）

| 轮 | run | 结果 | 根因与修复 |
|---|---|---|---|
| 1 | 44549164929 | failure 4m45s | d53c7fb6 字段注入改造把 `NotifyChannelConfigServiceImpl.adapters`（List\<NotifyChannelAdapter\>）改成必注——零渠道 Bean 环境启动失败（构造器时代空列表合法）。修复 c9d01a53：`required=false` + 空兜底 |
| 2 | 44551135824 | failure 4m42s | 同族第二处：`NotifyFacadeImpl.adapterList`（其 initAdapters 本有 null 兜底）。修复 ca5ae88e：`required=false` |
| 3 | 44553646768 | failure 7m28s | 全量扫描后批量修复：`ParticipantResolverRegistry`（resolver/adapter 两 List，unique* 已 null 兜底）、`CommandDispatcher.handlerList`（BatchInvokeCommandHandler 带 @ConditionalOnProperty）、`SsoProviderClients.clientList` 三处统一恢复空集合语义（bb648d84，develop 侧 c6b6ea1d） |
| 4 | 44557230817 | failure 13m39s | 测试门禁与打包**全部通过**，败在制品门禁：生产 jar 含 `application-local.yml`——fc809905（11-18）把它放回 `src/main/resources` 违背 Phase 6B（local 专属资源不得入 prod 制品）。修复 9f38d22b：回退不入库（恢复 .gitignore），本地模板改由 README 内联承载（43 行最小模板 + 开发密钥生成指引）；本地 clean 打包 + check-prod-artifact.sh 验证负向清单 0 FAIL 后提交 |
| **终** | **44562168036** | **success 15m23s**（Server） | 全量测试门禁 + prod 打包 + 制品门禁全过，`build.version=1.1.3` |

- Web main CI：**44549244089 success**（4m58s）。
- 分支清理：两仓 `feature/1.1.3` 经 `merge-base --is-ancestor` 确认合入 main 后删除（远程+本地）。

## 2. 阶段 5：发版（完成）

| 仓 | commit（tag 指向） | tag | Release ID | 制品 | 字节数 | sha256 |
|---|---|---|---|---|---|---|
| Server | 54b2657b | 1.1.3 | 451609872（Latest） | bootstrap-1.1.3.jar | 244,202,620 B | `11474a42f442f909d655af8f65a21b4f91f026acebd3b273de47e32f7a111782` |
| Web | 05b9739 | 1.1.3 | 451512760（Latest） | sw-web-dist-1.1.3.zip | 6,345,438 B | `5044bad2d2ce5a7af67366bb8a5fb96b19854e0dfd5317ad51f545fd2253d14e` |

- 发布说明：B1—B4、E2 全列出，注明 `583f1a38` 修复 11-19 治理批次引入的无流程引擎 Bean 启动回归（未随历史 Release 上线）与 CI 修复链；Web 端注明 B3/B4/E2 与配套关系。
- Server 制品 `build.version=1.1.3`（production-build.properties 实读）；Web 入口 `assets/index-ANXgpRi9.js`。
- 其他 tag 与 Release 未动；CI 自动产物 `build-<sha>` 保留。

## 3. 阶段 6：部署（受阻，已恢复，待裁决）

### 3.1 已完成步骤（按 §8/§9）

- 巡检：磁盘 5.6G 可用（≥3G ✓）、原版本 1.1.2、health 200。
- 备份：DB `/data/backup/smart_workflow_20261120_0058_pre113.dump`（1.4 MB，pg_dump -Fc）；后端 `bootstrap.jar.bak-pre113`；前端目录 `web.bak-pre113`。
- 上传校验：两制品远端 sha256 与 Release 资产**逐字节一致**（11474a42… / 5044bad2…）。
- Web 未替换（web 目录原样，入口仍 `index-DsUInUfT.js`）；1.1.3 制品暂存服务器 `bootstrap.jar.113-rolledback` 与 `/tmp/sw-web-113.zip`，本地 `/tmp/rel113/`。

### 3.2 Server 启动失败与立即回滚

`stop.sh → 换包 → . server.env → start.sh` 后约 80s 日志报 `Application run failed`：

```
Caused by: java.lang.IllegalStateException: 登录 RSA 私钥未配置：必须提供
sw.security.login.rsa-private-key-file（如环境变量 SW_LOGIN_RSA_PRIVATE_KEY_FILE 指向的
PKCS#8 PEM 文件），不允许默认私钥上线
```

**根因**：fc809905（11-18，login 私钥路径化）是破坏性配置变更——生产运行环境现持内联变量 `SW_LOGIN_RSA_PRIVATE_KEY`（1.1.2 口径），1.1.3 改为只认文件路径且 fail-fast。该部署前置**未在方向、审查记录或提示 113-03 中出现**。回滚执行 §8.1 步骤 6：`stop → bootstrap.jar.bak-pre113 换回 → start`。

**回滚后核验（当前状态）**：health 200、`build.version=1.1.2`、Flyway 35 行不变、Web 原样（入口 index-DsUInUfT.js）、nginx -t 通过、根路径 200。服务已恢复到部署前状态。

### 3.3 阻塞点：生产登录 RSA 私钥迁移（需 Owner 裁决）

1.1.3 上线前置 = 把现以内联环境变量形态存在的生产登录 RSA 私钥（PKCS#8 PEM 正文）落为服务器本地文件（建议 `/etc/smart-workflow/login-rsa.pem` 或同级 600 权限路径），并在启动会话环境提供 `SW_LOGIN_RSA_PRIVATE_KEY_FILE` 指向它。按 0.2.2 先例（供应商/模型 Key「Executor 不迁移、不代录，任何 Key 不进入文件/日志/回执」）与手册 §12（server.env 高敏感），**私钥落盘属凭据操作，执行方不代做**。请 Owner 二选一：

- **A（推荐）**：Owner 亲自完成私钥文件落盘与变量设置（一行：`SW_LOGIN_RSA_PRIVATE_KEY_FILE=/path/login-rsa.pem`），完成后知会，执行方继续部署 1.1.3（jar 已在服务器，几分钟内完成换包启动与核对）。
- **B**：Owner 明确授权执行方迁移（并指定目标路径）；执行方届时仅做「环境变量值 → 600 文件」的搬运，不在任何输出/回执中回显私钥内容。

**注意**：私钥本体是既有的（1.1.2 在用），不是新生成——新生成会使用户旧令牌/已发挑战失效，需 Owner 确认不重置。后续若 Owner 亦要求轮换，另行评估影响面。

### 3.4 部署成功后的剩余步骤（回执 §3.3 裁决后继续）

Web 替换（zip 已传服务器 `/tmp/sw-web-113.zip`，备份已就绪）→ 演示环境复测 B1—B4、E2（视口截图，头部与证明区同框）→ 旧数据行按裁决口径列行、改 INTERRUPTED、回读 → 文档同步（version.json/CHANGELOG/knowledge 含 P74 条目/需求池 P72、P73 核销与 B4 记录/两仓 README）→ 阶段 7 清理隔离环境、memory 记一行。

## 4. 阶段 6 续：Owner 授权方案 B 后的部署与复测（2026-11-20 追记）

### 4.1 RSA 私钥迁移（方案 B，Owner 2026-11-20 授权「你自己上去搞吧，不行就生成一套新的」）

- server.env 实有 17 个变量（先前 §3.3 的「会话层注入」判断有误：最初 grep 漏了 export 前缀形式），私钥即内联于 server.env 的 `SW_LOGIN_RSA_PRIVATE_KEY`。
- 迁移：从运行中 1.1.2 进程 `/proc/<pid>/environ` 提取该值（裸 base64 DER + 字面换行转义、无 PEM 包头）→ 组装标准 PKCS#8 PEM → `/etc/smart-workflow/login-rsa.pem`（600，目录 700）→ openssl 解析校验 **Private-Key: (2048 bit, 2 primes)**。值全程服务器侧处理、未在任何输出回显。
- server.env：该行替换为 `export SW_LOGIN_RSA_PRIVATE_KEY_FILE=/etc/smart-workflow/login-rsa.pem`（内联值移除；备份 server.env.bak-pre113，600）。**未生成新密钥**（Owner 的兜底授权未动用，既有私钥继续有效）。

### 4.2 部署成功（先 Server 后 Web）

- Server：stop → `bootstrap.jar.113-rolledback` 换回 → `. server.env` → start → **health 200 {"status":"UP"}、build.version=1.1.3、Flyway 35 行、启动段 ERROR 0**（日志轮转后独立计数）。
- Web：zip 解压替换 `/opt/smart-workflow/web`（备份已在 §3.1）→ nginx -t/reload → 根 200、入口 `assets/index-ANXgpRi9.js`。

### 4.3 演示环境复测（B1—B4 + E2，API + 无头浏览器视口截图）

- **旧数据行**：按裁决口径查询「parent_execution_id 非空 + WAITING_HUMAN + 所属受理行已终态」→ **0 行**，无需改数。另有 1 行 parent 为空的 2026-11-13 顶层 WAITING_HUMAN 历史行（#2121178715751251970），不在口径内未动，登记待规划决定。
- **B1**：新造 8s 超时执行——等待期 API 状态 WAITING_HUMAN，恢复后同受理两行 SUCCESS；DB 对账该受理**恰 2 行**（父 2123469418061688833 + 子 2123469418174935042），无假等待行。截图 `prod-b1-child-detail.png`（子行详情头部编号+受理号+轨迹，视口 1600）。
- **B2**：受理号、执行编号各取消一次——两行 CANCELLED、轨迹人工节点 **CANCELLED**（API 断言）。截图 `prod-b2-child-trajectory.png`。
- **B3**：2400 宽视口列表截图 `prod-b3-time-column.png`。
- **B4**：图定义列表「更多→执行历史」→ URL 过滤父图 → total 3 全为该图。截图 `prod-b4-entry.png`。
- **E2**：父行详情点「View child execution #2123469418174935042」（演示环境 locale 为英文）→ URL 切换为子行详情 `…/detail/2123469418174935042`。截图 `prod-e2-click-switch.png`。父行详情头部同时可见受理号 #2123469417633869825（Accepted 标记）。
- 截图经无头 Chromium（服务器本地访问 nginx）拍摄并存 `.iso113/evidence/prod-*.png`；登录走真验证码（逐轮识别后填入）。

### 4.4 事故披露：apt 连带卸载 PostgreSQL（已恢复，数据无损）

装 Chromium 依赖时 `apt-get --fix-broken install` 把 **postgresql-14、postgresql-contrib、postgresql-14-pgvector 连带移除**（apt history 实录），01:36 PG 关闭、health 短暂 DOWN（druid 连接失败，日志 ERROR 约 6.7k 行）。发现后同版本装回 postgresql-14（14.24）与 postgresql-14-pgvector（0.8.7-1.pgdg22.04+2）、pg_ctlcluster start：**health 恢复 UP、vector 扩展 0.8.7 在、Flyway 35 行、数据完好**（sw_agent_graph_execution 40 行：26 SUCCESS/10 CANCELLED/3 FAILED/1 WAITING_HUMAN〔即 §4.3 口径外历史行〕）。数据目录全程未受影响，无数据丢失。

### 4.5 补充：本机可见会话 formal 取证（2026-11-20 追记）

第 4.3 节截图由服务器侧无头 Chromium 拍摄（本机到演示环境 80/443 被网络阻断）。后按 Owner 指引把 `chikaho.cn` 加入 FlClash 覆写脚本 `DIRECT_SUFFIXES`（`371953190754586624.js`，订阅更新不覆盖）并重启 FlClash，直连恢复（直连 TLS 200/169ms、走系统代理 200/58ms）。随后在本机 ZCode 内嵌浏览器（可见交互会话，非无头）登录演示环境（真验证码），补拍 4 张 formal 截图：

- `formal-b4-entry.png`：图定义列表「更多→执行历史」入口 → URL `?graphDefId=2123469415276670977` 过滤，3 行全部为该图（2 已取消 + 1 成功）。
- `formal-e2-click-switch.png`：父行详情点「查看子执行 #2123469418174935042」→ URL 切换为子行详情 `…/detail/2123469418174935042`，同一画面内子行编号、受理号 #2123469417633869825（Accepted）、人工任务「已超时」、轨迹 开始→人工处理→结束 全部「成功」。
- `formal-b2-child-trajectory.png`：已取消执行详情——头部「已取消」、人工任务「已关闭」、轨迹 `#2 子图 已取消`，无「等待人工」。
- `formal-b3-time-column.png`：2400 宽视口列表，「发生时间」列前三个值 `2026-11-20 01:32:54`、`01:32:47`、`01:32:16`，格式 `yyyy-MM-dd HH:mm:ss` 无 T 无微秒。

B1 的子行详情证据由 formal-e2-click-switch.png 同框覆盖（同一执行、头部与轨迹完整可见）。本机 /etc/hosts 已恢复原状（验收使用的 FlClash 直连规则按 Owner 要求保留）。

## 5. 其他登记

- 1.1.3 Server README（9f38d22b 随 CI 修复带入）本地配置段已改为「application-local.yml 不入库 + README 内联模板」口径。
- `I5SsoCipherRuntimeDiagTest` 仍处注释态（fc809905 因 d53c7fb6 启动回归注释；583f1a38 已修该回归，恢复用例属治理收尾，不在本补丁范围，登记待办）。
- 服务器 `server.env` 当前仅含 5 个 `SW_NOTIFY_CHANNELS_EMAIL_*` 变量；凭据类变量（PG/JWT/CIPHER/RSA 等）由服务器会话层注入，机制文件未定位（避免触碰凭据内容），Owner 裁决 A/B 时可顺带指明设置位置。
