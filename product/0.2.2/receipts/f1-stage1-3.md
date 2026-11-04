# F1 阶段 1 剩余缺口闭环回执（第 3 轮）

- 执行入口：`product/0.2.2/receipts/planning-execution-prompt-f1-stage1-01.md`
- 上游锁定项（f1-stage1-2.md §1 a–d、§2 四修复）本轮未重验，仅复用结论
- 验证环境：本地 Docker PG 18（专用验证库 smart_workflow_mig，含 0.2.1 基线 + V0.2.2 迁移）；server 以 sidecar 本地安全配置运行，端口 8080；web 为 vite dev（5174，headful 用户可见浏览器）
- 安全约束执行情况：真 key（Command Code 93 位）只进本地 HTTPS 请求体/AES-GCM 密文落本地库，未进 git/种子/迁移/回执/日志/截图；**验收后已 DROP smart_workflow_mig 库、删除全部本地验证资产（含密文与 RSA sidecar）**
- 代码状态：server `feature/0.2.2-agent` @ `e29f721a`（本轮推送）；web `65b30fa`（无新改动）

## G1 旧数据迁移 ✅

0.2.1 结构库预置旧表三行（9001 openai→Command Code 真 key、9002 ollama、9003 other）+ 引用旧 id 9101/9102 的已发布 graph + 带消息会话 9201，执行 V0.2.2 迁移后：

| 断言 | 结果 | 证据 |
|---|---|---|
| ① 三行迁为供应商+模型；ollama 补 `/v1`；other 停用；id 原样 | ✅ 9001 OPENAI_CHAT 启用、9002 OPENAI_CHAT `http://localhost:11434/v1`、9003 停用；id 均原样 | 迁移后 SQL 查询输出（原 server.log 记录段） |
| ② 不改 graph_json 真实执行成功 | ✅ execute 9101 → `success`，output=`MIG-OK-1`（多次复跑 1.7–3.2s） | HTTP 响应 + execution 行 |
| ③ 会话详情返回原消息 | ✅ GET `/api/agent/conversations/9201/messages` 返回 verify-old-message-1 / verify-old-reply-1 | HTTP 响应 |
| ④ 引用停用行返回可读错误 | ✅ execute 9102 → HTTP 400，msg=`供应商已停用： verify-other`，errorKey=`agent.model_unavailable` | HTTP 响应 |

- H2 双库验证：独立 H2 库（h2mig）RUNSCRIPT 0.2.1 基线 + seed + V0.2.2，迁移结果与 PG 一致（9002 补 `/v1`、9003 置 FALSE）。原始输出在中途清理时随验证目录删除，结论以本轮过程记录为准；PG 侧逐条断言均在会话轨迹中有原始输出。

## G2 前端两级管理浏览器走通 ✅

用户可见浏览器（headful）走通，URL `http://localhost:5174/agent/model`，视口 1440×900，密钥全程脱敏（表格列仅显示掩码，编辑弹窗显示 `已配置：st****-2`）：

1. 新建供应商（OPENAI_CHAT、API 地址、API Key 已填）→ 保存成功，列表不显示任何 key 明文（截图 assets/g2-e1-provider-created.png）
2. 新建模型弹窗：所属供应商下拉成功列出启用供应商并选中（本轮修复 §缺陷-1 后选项正常加载）→ 填名称/模型名称/能力 CHAT → 保存成功，行出现在模型表
3. 行内「测试」→ 弹窗 `测试结果：服务可达 / 模型调用成功 / 117 ms`（截图 assets/g2-e2-model-test-ok.png）
4. 编辑供应商**密钥留空**保存 → 再测连通 → 仍 `服务可达`（密钥保留语义生效）
5. 改错密钥保存 → 测试 → `网络不可达 / 鉴权失败（HTTP 401）：请检查 API Key 或权限 / 12 ms`（截图 assets/g2-e3-wrong-key-401.png）

偏差（如实记录）：
- 连通性目标为本地回环桩 `http://127.0.0.1:9998/v1`（成功/429/401 三态可控），非真实外部端点。原因：G1 迁移验收后原供应商真 key 密文随 cipher key 一次性清理不可复用；安全约束禁止将真 key 写入任何持久文件。三态断言（成功/留空/错密钥 401）语义与真实端点一致。
- 首个供应商标识 `verify-ui-p` 因软删唯一约束占用名称，重建使用 `verify-ui-p2`；功能断言不受影响。
- 登录为验证目的临时将 admin 密码重置为弱口令（仅存在于已 DROP 的 mig 库），生产库未触碰。

## G3 门禁 ✅

| 项 | 结果 |
|---|---|
| sw-basic-agent 全量测试 | 328/328 绿（`Tests run: 328, Failures: 0, Errors: 0, Skipped: 0`，BUILD SUCCESS），受影响模块=sw-basic-agent 全模块 |
| V0.2.2 迁移 PG | ✅（smart_workflow_mig，见 G1） |
| V0.2.2 迁移 H2 | ✅（见 G1） |
| Web typecheck / lint / vitest / build | ✅ 0 错 / 0 错 / 1999 passed + 3 skipped / build ✓ 4.25s（本轮无 web 代码改动，沿用本会话早前结果） |

## G4 启停校验 ✅

- 停用模型 9001 → execute + debug 均拒：`模型已停用： verify-cc-openai`
- 停用供应商 → 均拒：`供应商已停用： verify-cc-openai`（errorKey `agent.model_unavailable`，可读原文透出——本轮 §缺陷-2 修复后）
- 恢复启用 → execute 重新 `success`（MIG-OK-1）

## G5 多密钥轮换 ✅

- 本地 429 桩（9998）：stub-key-1 → 429，stub-key-2 → 200 `ROTATION-OK`；p1/p2 同组 `verify-rot-group`（优先级 1/2，冷却 60s）
- 图执行：execute `verify-rot-graph` → `success`，output=`ROTATION-OK`；m1 `locked_until=+60s`、m2 未锁
- 调试：debug 会话 step → out=`ROTATION-OK`，m1 再次锁定——图执行与调试均完成轮换

## G6 旧组件移除 ✅

- 全仓 pom 依赖树 0 命中 `spring-ai-openai` / `spring-ai-ollama`（仅 knowledge 模块保留 pgvector 向量存储）
- application.yml 无 `spring.ai` 默认配置（注释确认为移除）
- 服务以新 jar 健康启动（`Started StarterApplication in 16.7s`）

## 本轮修复缺陷（均含回归）

1. **PG boolean 查询类型不匹配（12 处）**：`.eq(enabled, 1)` 在 PG boolean 列报 `42883/23505` 类错误——G2 供应商下拉空（无数据）即由此起（server.log 208125 行 AgentProviderMapper 报错）。全部改为布尔字面量 `true`（provider/model/tool 内外部配置共 10 处主路径 + 此前 runtime 1 处）。回归：sw-basic-agent 328/328；G2 下拉/列表/编辑全链路复验。
2. **停用拒绝不可读**：handler 以 `text(errorKey, message)` 解析，目录内 key 覆盖可读 message → 改用非目录 `agent.model_unavailable` 透出原文。回归：G4 全套。
3. **chatWithRotation 落地后测试桩失效（79 处红）**：mock 不执行真实方法 → 6 个测试文件补委托桩（thenAnswer 回 acquire 打桩）。回归：328/328。

## 清理清单（已执行）

- DROP DATABASE smart_workflow_mig（含全部 verify-* 数据、旧结构三行、真 key 密文、admin 临时弱口令）
- 停止 server(8080) / vite(5174) / 429 桩(9998) 进程
- 删除本地验证资产目录（含 sidecar RSA 私钥、AES 密文、seed、日志、截图工作副本；G2 证据已提前复制至 receipts/assets）
- 密钥终扫：仓库（排除 target）真 key 前缀/桩 key/验证 digest 均 0 命中

## 限制与偏差

- G1③④ 与 H2 侧的原始控制台输出随验证目录清理删除；断言结果在本会话轨迹有完整记录，库已按要求 DROP，无法复查（如需可重建同规模环境复验）。
- G2 连通目标为本地桩（理由见 G2 偏差段）；真实端点三格式连通已在第 2 轮锁定项中验证，本轮未重验。
