# be020 后端批次完成回执（契约交接 + F020 授权/契约清单 + J020 受控链）

2026-10-24｜Executor（后端）｜XL｜自验通过，待规划验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执是 0.2.0 后端执行会话首批交付的完成回执；行为与契约明细在 `receipts/backend/` 下三份回执，均为追加保留：

| 明细回执 | 内容 | Server 提交 |
| --- | --- | --- |
| `backend/be020-capability-contract-01.md` | 能力/契约盘点与前端对接事实（租户、数据源、表单定义/数据、流程节点能力、办理/加签/暂存）；原证据仍有效范围；真实剩余项清单 | `1b1f5f7`（基线快照） |
| `backend/be020-ext-datasource-grant-02.md` | 数据源授权主体 + 查询契约清单/启停实现（新表 `sw_bpm_ext_datasource_grant`、4 个新端点、错误码 1220、授权/停用语义、升级行为） | `5e70b47` |
| `backend/be020-controlled-chain-03.md` | 受控集成真实执行链集成证据（5 用例真实加密/池/执行器/外部库）；统一监听新旧配置副作用覆盖核查（结论：既有覆盖充分，无新增代码） | `6c03afb` |

## 实施与验证摘要

- 实际读取：`roles/executor.md`、`direction-parallel-020.md`、`execution-prompt-020-backend.md`、`direction-020.md`（F020/J020 段）、T020/F020/J020/W020/A16/基线等既有回执、`knowledge/current-status.md`（worktree `codex/0.2.0-delivery`）、Server 工程宪法。
- 实际修改：Server 19 文件（form-api 端口与错误码、form-biz 服务/控制器/DTO、bpm-engine 实体/mapper/服务/适配器/控制器/装配、H2+PG 迁移、5 个测试文件），全部在 Server 授权范围；根仓与 Web 未动。
- 验证（`MAVEN_OPTS=-Xmx2g`，exit 0）：form-biz 233/0/0/0、bpm-engine 175/0/0/0（基线 163+12 新增，无漂移）；迁移链真实 PG 12/0 + H2 1/0（21 条 apply，计数断言同步 20→21）；授权聚焦 6/0+4/0；受控链 5/0。命令原文 `/tmp/f020-grant-full-test.log`、`/tmp/f020-grant-migration.log`、`/tmp/f020-chain-engine-full.log`（本机留存，不提交）。
- Git：`5e70b47`、`6c03afb` 普通推送至 `origin/codex/0.2.0-tenant-form-flow`，`ls-remote` 回读同 SHA；工作树干净。根仓（worktree）仅新增本会话回执文档，不由后端 add/commit/push（前端集成负责人统一收尾）。

## 与验收边界对照

- direction-020 F020「数据源管理员可管理…授权…；设计人员仅能引用已授权的稳定数据源/查询标识」：授权模型 + 引用校验 + 可引用清单过滤已落地并有行为测试。
- 任务表受控数据源行「连接、授权主体、稳定查询标识、启停/只读/预览和安全配置可实际调用」：全部端点可调用；秘密不回显；预览无业务写副作用（受控链用例 2/4/5 为真实行为证据）。
- 任务表统一监听行：服务端语义逐项对照既有 TriggerExecutionServiceTest 覆盖（明细见 be020-03 表格），无未关闭缺口。
- 未宣称项：A03/A04/A05、U020 视觉、正式浏览器链、整版 PASSED/COMPLETED、P 核销、功能计数——均归规划/前端职责，后端不改写。

## 剩余与等待项（均非本侧可动作项）

1. 三份回执待 Planner 独立验收。
2. 节点库「起草/IoT指令/Agent」产品语义裁量（差距已报 be020-01）。
3. 富文本既有值格式与前端对齐后补契约。
4. 独立密钥版本化轮换是否需要（Planner 裁量；必要更新已支持）。
5. 前端消费 4 个新端点及既有契约对接（be020-01/02 已给签名与样例）。

## 遇到的问题与偏差

- Validator 实测不接受 `receipts/backend/` 子目录路径作为终态 receipt（契约 pattern `[^/]+\.md`），故本完成回执置于 `receipts/` 平级、明细留在 `backend/` 子目录；三份明细回执位置遵循 direction-parallel-020 的并行归属约定。
- 受控链测试首版两处断言与实现口径不符（写语句在校验阶段被拒不留执行审计；H2 保留字别名），已按实现真实语义修正测试，未改产品代码。
- 受控链测试以桩替代数据源登记解析与审计落库（理由：登记与审计已有控制器/审计单测覆盖，本测试聚焦执行链真实性）；已在 be020-03 记录为授权内常规决定。
