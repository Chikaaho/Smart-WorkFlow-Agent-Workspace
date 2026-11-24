# 1.2.0 第十七批执行回执（execution-120-17）——T2 补拍与 T4② 真实抄送

日期：2026-11-25｜执行（Executor）｜依据 `planning-execution-prompt-120-05.md`

## 1. Git 事实

| 仓 | 提交 | 时间 | 内容 |
|---|---|---|---|
| Web | `3f7f43a` | 2026-11-24 23:29:13 | T4② 工作台抄送行标题补流程名（`use-workspace-data` 经显示名解析器回填 `processName`） |
| Server | `34c43e98` | 2026-11-24 20:11:58 | 未变（本轮无 Server 代码改动） |

本轮两仓工作区均干净；未提交两个子仓 gitlink。截图全部晚于对应修复提交（逐张时刻见 §2/§3）。

## 2. T2 补拍（运行中来源=流程）

**运行 Server 的构建口径**：`mvn -DskipTests package` 于 23:29–23:33 从干净 HEAD `34c43e98` 构建（构建前 `git status` 干净），jar 部署到 `.iso120/run`，23:52 以 `--spring.profiles.active=dev` 启动 18093。重启时原进程环境变量（`SW_CIPHER_KEY`/`JWT_SECRET`）随进程丢失，按 README 口径重新生成仅本机开发值注入；库内 `sw_agent_model_config=0`，无存量密文受影响。

**发起口径**：表单提交的发起目标由 `sw_bpm_form_binding` 的唯一 active 绑定解析（`FlowStartPortImpl.acceptFlowStart` 要求恰一个），不取 URL 参数。T4 发布使 form_risk 的 active 绑定指向了新流程，因此本轮临时用 SQL 把 active 绑定切到 `bpm_ae4b6570c8e043b6`（E1-4失败策略对照，发布版 GRAPH_EXEC 绑 `E1-4超时图v2` v2、超时 25s），测后立即恢复（见 §5）。

实例 00:07:16 经 form_risk 表单提交发起，受理 `2125259972703604737` 创建即写入 `result_execution_id=2125259972904931329`（RUNNING 期间即已关联），20.2s 后 SUCCESS。

证据（1280×900，系统管理员，`/agent/executions/list`，均晚于 `34c43e98` 约 4 小时）：

| 图 | sha1 | 拍摄时刻 | 画面 |
|---|---|---|---|
| `T2cc-source-process-running.png` | `8f116ce` | 2026-11-25 00:07:36 | 按「流程」筛选：首行 来源=流程、`E1-4超时图v2`、状态「运行中」；底部分页栏「共 97 条」同屏 |
| `T2cc-source-direct-no-process.png` | `6eb49a5` | 2026-11-25 00:07:51 | 按「直接调用」筛选：「共 17 条」，全部为「已中断」旧行，无运行中/流程行 |

运行结束后回查：`2125259972703604737 → SUCCESS（20209ms）`，`business_source=PROCESS` 保持。

## 3. T4② 真实抄送

### 3.1 120-16 空态根因（结论：夹具数据错误，非产品缺陷）

`sw_bpm_copy_record` 夹具行 `2125090000000000001` 的 `process_instance_id` 写的是 `c174d83c-a4c2-4b86-a2f9-69b52e178c90`——这是 E4-1 实例的 **business_key**，真实实例 ID 是 `f6ac3749-e7be-11f1-9852-a2509ca88e6b`（由 `sw_bpm_approval_action` 12:33/12:35 两条记录回查确认）。于是：

- 列表 JOIN `i.process_instance_id = c.process_instance_id` 落空 → `formKey/processDefKey` 为 NULL → 行标题「-」；
- 详情 `eq(processInstanceId, c174d83c…)` 查不到实例 → `formData/history/progress` 全空 → 「无表单数据」「暂无审批历史」。

产品代码路径本身正确。该夹具行已删除（§5），不得再作为证据。

### 3.2 附带修复（`3f7f43a`）

排查中发现真实缺陷：工作台抄送行标题取 `rowTitle` 首选 `processName`，但 `CopyItemVO` 不含该字段，真实数据下标题会退到 formKey（显示 `form_risk`），仍不是流程名。修复：`use-workspace-data.ts` 加载抄送列表后对每行经 `useWorkflowDisplayNames` 解析并回填 `row.processName`（行标题与业务动态两处同时生效）；普通用户无设计权限时解析器自动回退目录事项名。

### 3.3 真实链路取证

1. 通知配置：租户 0 经管理 API 建 `wf_copy_created_inapp`（模板 `2125256560133984257`，事件 `COPY_CREATED`/渠道 `IN_APP`，保存即发布 RELEASED 快照）。管理端表单未暴露事件/渠道字段，故走同一管理 API；无此模板时抄送投递会记 FAILED。
2. 流程：设计器「新建流程」建 `T4抄送验证`（`bpm_e91a9b1f16b44162`，def `2125256716669603842`），画布结构 START→主管审批（FIXED_USER admin）→抄送E4CC用户（COPY FIXED_USER 999910，非办理人）→END；参与人字段设计器面板不支持编辑（`PARTICIPANT_PANEL_NODE_TYPES` 仅 APPROVAL/CONSENSUS），故用设计器自身的保存接口 `PUT /workflow/defs/{id}/graph` 写入草稿，「发布」按钮走设计器真实发布（校验+冻结 v3，alert「发布成功」）。
3. 实例：流程中心目录「发起」→ 表单提交（城市=T4CC抄送验证、评分=88）→ 实例 `e197d487…` → 管理员同意 → 抄送节点投递：抄送记录 `2125257916903247874`（接收人 999910，`delivery_status=SUCCESS`，tenant 0）。
4. 接收人视角（登录 `e4cc_user`，口令为种子同款、仅本机）：

| 图 | sha1 | 拍摄时刻 | 画面 |
|---|---|---|---|
| `T4cc2-tab-real.png` | `d79f2f0` | 2026-11-24 23:59:55 | 工作台「抄送 1」页签：行标题「T4抄送验证」（流程名），时间 23:59，按钮「查看」 |
| `T4cc2-detail-real.png` | `f59d41c` | 2026-11-25 00:00:12 | `my-cc?copyId=2125257916903247874` 自动打开「抄送详情」：表单数据 城市=T4CC抄送验证 / 评分=88，流转记录「主管审批 · 已同意」——与实例一致，无任何假空态 |

两图均晚于 Web `3f7f43a`（23:29:13）。工作台「业务动态」同步显示「T4抄送验证 抄送 · 已通过」，标题为流程名。

## 4. GATE-final

T4② 改了 Web 代码 → Web 在最终提交 `3f7f43a` 上重跑四项；Server 无改动，沿用 `execution-120-16.md` §6 在 `34c43e98` 的计数（agent 93 / form-biz 59 / bpm-engine 74 / bpm-process 62，合计 288，0 失败），不重复重跑。

Web（commit `3f7f43a`）：

| 项 | 命令 | 结果 |
|---|---|---|
| typecheck | `npm run typecheck` | EXIT 0 |
| lint | `npm run lint` | EXIT 0 |
| test | `npm run test` | 245 files passed / 1 skipped；2130 tests passed / 3 skipped |
| build | `npm run build` | EXIT 0，built in 3.94s |

## 5. SQL 直接写入与环境动作（披露）

| 动作 | 方式 | 用途与恢复 |
|---|---|---|
| 删除夹具抄送行 `2125090000000000001` | SQL DELETE | 根因 §3.1；该行不得再作证据；保留 `e4cc_user` |
| 通知模板 `wf_copy_created_inapp` | 管理 API（租户配置） | 使抄送投递走真实站内信通道；非测试数据 |
| `T4抄送验证` 草稿图（含参与人） | 设计器保存接口 PUT graph | 参与人无设计器 UI；发布/发起/审批/投递均为真实产品路径 |
| form_risk active 绑定切换 | SQL（T4↔E1-4） | T2 发起需要；测后已恢复为 T4（`2125257535636819970` active=t） |
| `SW_CIPHER_KEY`/`JWT_SECRET` 重生成 | 环境变量（临时文件，用后删） | 旧进程环境丢失；本机开发值 |
| 误发实例 `adeaa781`（T4 第二条） | 绑定解析误解所致，已按正常流程同意收尾 | 实例 APPROVED，产生第 2 条抄送记录（不影响已取证据） |

## 6. 环境与清理

- 只连本机 5432 `sw_iso120`；Redis 56379；Server 18093；Web 5275。未连 MySQL 或其他用户服务。
- 测试结束态：`sw_agent_graph_execution` 无 RUNNING；form_risk active 绑定=T4 抄送验证；`风控审批流` 草稿已还原为已发布 v8 内容（本轮误改已撤销，未发布过该流程）；18888 工具服务已停止；临时脚本/日志/密钥文件（`/tmp/t_*`、`/tmp/g_*`、`/tmp/rebuild-srv.*`）已删除；回执不写口令。
- 保留夹具：E1-3 常量图、E4-1 流程与实例、`T4抄送验证` 流程与实例、`e4cc_user` 及 2 条真实抄送记录。

## 7. 自验结论

T2 补拍与 T4② 完成：T2 运行中来源=流程且共 N 条同屏（晚于最终 Server 提交）；T4② 根因=夹具把 businessKey 写进 process_instance_id（产品无缺陷），附带修复工作台抄送行标题（`3f7f43a`），真实流程产生的抄送在接收人侧能看到与实例一致的表单与流转记录。阶段 3 出口条件满足，**待规划验收后进入阶段 4 合并**。
