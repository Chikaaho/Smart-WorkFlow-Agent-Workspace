# 0.2.2 发布回执（第 1 次）：tag/Release、UAT 清理与升级、发布后同步

日期：2026-11-05。角色：Executor。依据：`planning-execution-prompt-close-022-03.md`（revision 16）第 3、4 步、方向 `ready/direction-022-close-release.md` 第 5、6 阶段。

## 一、发布：tag 与语义 Release

### 1. tag（两仓 main）

| 仓 | annotated tag | 指向提交 | 回读 |
|---|---|---|---|
| Server | `0.2.2` | `0bf4c938` | `git rev-parse 0.2.2^{commit}` = `0bf4c938898350c2513e4fdb1f3c6de6503cd007` |
| Web | `0.2.2` | `3bcd7c2` | `git rev-parse 0.2.2^{commit}` = `3bcd7c2c97d0ef1c5093d0c3b6d14820991fa9e6` |

### 2. 语义 Release

| 仓 | Release | 资产 | 大小 | sha256 | 对应 CI run |
|---|---|---|---|---|---|
| Server | 「CH-aPaaS Server 0.2.2」（id 434795600） | `bootstrap-0.2.2.jar` | 220,778,675 B | `c13eccd8c8aadcc672f93d337343bd83b4eba7496284c4e7e0b2fac8a73bf0da` | `41967257752` a2 success |
| Web | 「CH-aPaaS Web 0.2.2」（id 434797412） | `sw-web-dist-0.2.2.zip` | 6,191,084 B | `aa8d5832291acef5e31fd4e533a598f10a7470af055738c82ec0ad296e420033` | `41967357375` success |

- 两仓既有 `build-<sha>` Release 全部保留，未删除、未覆盖（含 `build-0bf4c938…` 的 `bootstrap-0.2.2.jar`、`build-3bcd7c2…` 的 `sw-web-dist-0.2.2.zip`）。
- Server 语义 Release 资产已实测 `build.version=0.2.2`；上传后服务器侧 sha256 与本地制品一致。

## 二、UAT 磁盘清理（Owner 已授权）

- 范围：`/data/reasonix/.reasonix-sessions`，**从最旧开始**删除 mtime ≤ 2026-10-28 的会话文件（10-23～10-28 批次），保留 2026-10-29 起全部会话、`.ckpt` 目录与 sqlite 活动库。
- 删除量：**69,881 个文件 / 3,584,911,964 B（约 3.34 GiB）**。
- 清理前：`/dev/vda3 20G 20G 0 100%`；清理后：**可用 2,715,918,336 B（df 显示 2.6G，87%）**。
- 清理后 0.2.1 后端 health 立即恢复 **`{"status":"UP"}`**（DiskSpaceHealthIndicator 恢复）。
- 未动：reasonix 程序与配置、2026-10-29 起最近会话、frp/ngrok 等 Owner 工具、其他目录。

## 三、UAT 升级（0.2.1 → 0.2.2）

### 1. 升级前检查

- **DB 备份可用性**：原 `/data/backup/smart_workflow_20261105_0430_pre022.dump`（1,340,515 B）实为带 SSH MOTD 前缀的纯文本 dump（178 CREATE TABLE / 178 COPY，可解析但非 custom archive），仅作历史保留；本轮新建干净 custom dump `/data/backup/smart_workflow_20261105_pre022_clean.dump`（661,324 B），`pg_restore -l` 列出 **178 个 TABLE DATA**，并在临时库 `sw_restore_verify_20261105` 完整恢复出 **178 张表**后 dropdb——**备份恢复演练通过**。
- **pgvector**：`postgresql-14-pgvector 0.8.7-1.pgdg22.04+1` 已安装；升级前以 DBA 在 `smart_workflow` 执行 `CREATE EXTENSION IF NOT EXISTS vector`，回读 `vector|0.8.7`。
- **备份**：后端 `bootstrap.jar.bak`（0.2.1，218,553,737 B）；前端 `web.bak-20261105_pre022`。

### 2. 制品上传与校验

| 制品 | 上传后校验 |
|---|---|
| `bootstrap-0.2.2.jar` | 220,778,675 B，sha256 `c13eccd8…73bf0da`（与本地/Release 一致）；`META-INF/production-build.properties` → `build.version=0.2.2` |
| `sw-web-dist-0.2.2.zip` | 6,191,084 B，sha256 `aa8d5832…4e420033`（与本地/Release 一致） |

### 3. 停服—替换—启动与回读

- 停止 0.2.1 进程 PID `3152438`（`stop.sh` 校验命令行后优雅停止），替换 jar 与 web 静态，`start.sh` 启动新进程 PID `3208758`；nginx `-t` 通过并 reload。
- 启动耗时：**Started StarterApplication in 173.794 seconds**（进程 180.541s），有界轮询 health 第 37 次（约 185s）转 UP。
- **health**：本机 `/api/actuator/health` = `{"status":"UP"}`；经 nginx `/sw-server/api/actuator/health`（Host: chikaho.cn）= `{"status":"UP"}`。
- **启动日志 ERROR 数：0**（以启动前日志行号切分启动段，`grep ' ERROR '` 计数为 0）。
- **Flyway 终点：`v0.2.6`**——依次应用 `0.2.2 f1 agent provider model` → `0.2.3 f1 stage2 graph snapshot` → `0.2.4 f1 stage2 execution node detail` → `0.2.5 f1 stage3 knowledge rag` → `0.2.6 f2 app bundle` + `R__application center menu`，`Successfully applied 6 migrations … now at version v0.2.6`；DB `flyway_schema_history` 回读 versioned 最高为 `0.2.6`。
- **vector**：`pg_extension` 含 `vector|0.8.7`；`information_schema.columns` 回读 `sw_knowledge_chunk.embedding|vector`。
- **页面可访问**：HTTPS 根 200，入口 `assets/index-D6vkuidr.js`（该静态资源 200）；旧入口行为不变。
- 换包后磁盘可用 **2.2G**（`/dev/vda3 20G 17G 2.2G 89%`）。
- 回滚资产保持可用：`bootstrap.jar.bak`、`web.bak-20261105_pre022`、clean dump。

## 四、Key（由 Owner 在页面录入，Executor 不迁移不代录）

UAT 库升级后 `sw_agent_provider` / `sw_agent_model` / `sw_knowledge_base` 均为空（0.2.1 无这些表）。Owner 需在 `/agent/model` 页面自行新建并录入 Key 的供应商：

1. **Chat/LLM 供应商**：OpenAI Chat 兼容端点（本地验证先例为 Command Code，模型 `deepseek/deepseek-v4.1-flash`）；也可按需配置 Anthropic 兼容端点的 DeepSeek 供应商。
2. **Embedding 供应商**：OpenRouter（`https://openrouter.ai/api/v1`，模型 `openai/text-embedding-3-small`，1536 维）——Command Code 不提供 Embeddings；知识库检索依赖此项。

Executor 未录入、未迁移任何 Key；全部回执/日志/提交/截图中无 Key 明文。

## 五、发布后同步（第 6 阶段覆盖矩阵）

先更新 knowledge，再更新受影响入口：

| 要求项 | 落点 | 状态 |
|---|---|---|
| 分支与提交 | `knowledge/current-status.md`、`session-handoff.md`、`features/0.2.2-integrated-release.md`、`memory/state.md`/`handoff.md` | ✅ Server develop `2b9482e1`/main `0bf4c938`；Web develop `c9f09f4`/main `3bcd7c2` |
| 正式版本 | 同上 + 两仓 README | ✅ 0.2.2（tag/Release 回读） |
| 开发版本 | `current-status.md`、`memory/state.md`、README | ✅ Server `0.2.2-SNAPSHOT`、Web `0.2.2` |
| 部署版本 | `current-status.md`、`memory/*`、`docs/ops/production-ops.md` | ✅ UAT 0.2.2（启动 173.794s、ERROR 0、health UP） |
| 制品 | 本回执、`docs/ops/production-ops.md`、README | ✅ 两仓资产名/大小/sha256 |
| 迁移终点 | knowledge、运维手册、README | ✅ `V0.2.6`（UAT 实测） |
| pgvector | knowledge、运维手册 | ✅ 0.8.7 + `embedding vector` |
| UAT 磁盘与 health | knowledge、memory、运维手册 | ✅ 清理 69,881 文件/3.58 GB，可用 2.6G→换包后 2.2G，health UP |
| 下一动作 | `current-status.md`、`session-handoff.md`、`memory/README.md` | ✅ Planner 第 7 阶段终态复核 |
| 两仓 README「当前发布版本」 | Server/Web `README.md` | ✅ 0.2.2 + 发布源/制品回读（commit `3c4942f0` / `9dd7e7b0`，已推送 main） |

文档提交 CI：Server `3c4942f0` → run **41972759051**；Web `9dd7e7b0` → run **41972801435**（推送后启动；结果为有界监控回读，见 §七）。

## 六、边界执行

- 任何 Key 未进入文件、提交、回执、日志或截图。
- 未改迁移历史；未清理本地库 `smart_workflow_f1v4b`（保持 v0.2.6）。
- 只操作本轮身份明确的进程（停 0.2.1 PID 3152438、起 0.2.2 PID 3208758）；未动 reasonix/frp/ngrok。
- 所有 CI/启动等待均有界、可观测（启动 ≤300s 轮询；CI 按 run 号回读）。

## 七、补记：文档提交 CI 回读

- Server 文档提交 `3c4942f0`（README 发布回读）：run **`41972759051` attempt 1 success**（main；全量测试与制品构建通过，自动生成 `build-3c4942f0…` Release，资产 `bootstrap-0.2.2.jar` 220,778,675 B）。
- Web 文档提交 `9dd7e7b0`：run **`41972801435` success**（自动生成 `build-9dd7e7b0…` Release，资产 `sw-web-dist-0.2.2.zip` 6,191,084 B）。
- 两次自动产物按「`build-<sha>` 保留」原则保留；随后将语义 Release「CH-aPaaS Server 0.2.2」（id 434795600）与「CH-aPaaS Web 0.2.2」（id 434797412）标记为 `latest`，回读两仓 `releases/latest` 均为语义 Release `0.2.2`（未删除、未覆盖任何 build 产物）。
