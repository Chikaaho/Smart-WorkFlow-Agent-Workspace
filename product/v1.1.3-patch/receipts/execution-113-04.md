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

## 4. 其他登记

- 1.1.3 Server README（9f38d22b 随 CI 修复带入）本地配置段已改为「application-local.yml 不入库 + README 内联模板」口径。
- `I5SsoCipherRuntimeDiagTest` 仍处注释态（fc809905 因 d53c7fb6 启动回归注释；583f1a38 已修该回归，恢复用例属治理收尾，不在本补丁范围，登记待办）。
- 服务器 `server.env` 当前仅含 5 个 `SW_NOTIFY_CHANNELS_EMAIL_*` 变量；凭据类变量（PG/JWT/CIPHER/RSA 等）由服务器会话层注入，机制文件未定位（避免触碰凭据内容），Owner 裁决 A/B 时可顺带指明设置位置。
