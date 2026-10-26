# 0.2.0 真实消费与跨仓链路补证（批次 53）

2026-10-26｜Executor｜XL｜PG dev（smart_workflow_dev）+ 可见浏览器真实运行；承接 44—52 读取记录、方向 `direction-ui-completion-020.md` 与授权集成边界探索。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。

## 一、环境与稳定对象

- 后端 `bootstrap-dev.jar`（Server `862fc95` + 本批修复）`--spring.profiles.active=dev` @8080，PG 18.4；前端 Vite @5175；PG/Redis 容器为外部既存设施保持运行。
- 登录：t100admin（用户 9001，租户 100）；无角色负向用户 t100nobody（9101）。
- 新对象（租户 100）：
  - 业务表单 `u020_opinion_business`（id `67cb848d-a744-49ea-b8ab-c7e185407f5d`），发布至 v3。
  - 意见链流程 `U020 意见链流程`（defId `2114575639041306626`，processKey `bpm_c7e349db7e1445c6`）；审批节点意见表单 `U020_OPINION/v1`，字段 comment(TEXTAREA)/assignee(USER)/attachments(TEXT)/amount(NUMBER)；后补 `nodeForm=u020_opinion_business` 并发布 v2 以验证节点表单回写。
  - 版本脚本表单 `u020_version_probe`（id `9220c908-917c-42b9-83f8-8d42fec1f54d`），快照 v2 脚本前缀 `v1:`、v3 前缀 `v2:`；旧草稿 id `2114581778864828418`（formVersion=2）。
  - 子流程父表单 `u020_subflow_parent`（id `c4e4c06f-a571-420a-a902-2411b4b83482`）与父流程（defId `2114582361919201281`，processKey `bpm_ad4403b7da5744b0`），发布 v4；子流程目标为上条 U020 流程。

## 二、意见 USER、附件与催办真实消费

- **非法主体拒绝**：实例 `36bfd672-d0f6-11f1-9a07-00ff9e2a8dfb` 提交跨租户人员 `["92101"]`（租户 9002），审批命令 `2114575922978910210` 终态 FAILED，原因“审批意见不合法”；任务保持 RUNNING，无审批写入。
- **正向审批**：实例 `75b3dda2-d0f6-11f1-9a07-00ff9e2a8dfb` 提交 `assignee:["9101"]`、附件引用与金额 100，命令 `2114576481781837826` COMPLETED，actionRecordId `2114576484122259457`；实例 APPROVED。
- **历史回读**：任务详情 `approvalHistory[0].opinionData` 精确返回 `assignee:["9101"]` 与附件 `{storageKey,name}`；PG `sw_bpm_approval_action` 同值冻结，`opinion_form_id=U020_OPINION`。
- **附件文件流**：上传返回 storageKey `2026/10/26/4084f68a-aaff-4fb9-9ab5-ce3a0da4ebaf.txt`；受控下载 HTTP 200、51 B、sha256 `832ed3be51fb40a0e6d9b85a7113865fcbb3d9cdcf6eda0a989dfd3809be0d0f`，与上传原文逐字节一致。
- **附件拒绝**：同记录不存在的 storageKey → `code=403`“无权访问该意见附件”；actionRecordId 不存在 → `code=404`；无角色用户 t100nobody 下载合法引用 → `code=403`。HTTP 均为 200 包装，按业务 code 判定。
- **催办**：发起人向非参与人 9101 催办 → `REJECTED`“催办接收人不在当前实例合法待办范围”（记录 `2114576765761384449`）；t100nobody 越权 → `code=403`“仅发起人或当前待办参与人可催办该实例”；向待办人 9001 催办 → `ACCEPTED`（记录 `2114576801668820993`），站内信 `2114576801652043778` 事件 TASK_URGE、接收人 9001、渠道 IN_APP、投递 SUCCESS，正文含留言。

## 三、工作台配置弹窗（273:1600）

- 打开首页“布局”入口出现居中“配置工作台”弹窗，含组件库/画布/恢复默认/取消/确定；确定经 `PUT /system/workspace/layout` 200 落库，`custom=true` 且卡片几何保存；取消后活动卡可见性保持原值（未落库）；恢复默认经 `DELETE` 200，`custom=false`。
- 旧全屏路由 `/workspace/edit` 仍可达，含恢复默认/保存配置/退出编辑与组件库。
- 依据设计属性把弹窗收敛为 1120px 宽、`max-height:min(704px,90vh)`、垂直居中、仅画布区内部滚动；实测 1120×704，页脚 y=831 在 1920×1080 视口内，body client 590 / scroll 1080。
- **宿主截图**：本批实际尝试 `tab.screenshot()` 返回 `browser screenshot activity capture failed for guest`；正式 PNG/像素门槛未取得，不冒称 A03—A05 通过。

## 四、A12 旧/新发布表单脚本运行隔离

- 旧草稿（formVersion=2）打开 `/form/form-render/u020_version_probe?mode=draft&draftId=2114581778864828418`：输入 `old`，输出 `v1:old`，证明运行 v2 冻结快照脚本。
- 新填报（最新 v3）：加载即输出 `v2:`，输入 `new` 后输出 `v2:new`，证明新对象使用最新脚本。
- 新增 `GET /form/def/by-key/{formKey}/versions/{formVersion}/definition`（不要求设计权限，仍校验可见范围）；`FormRender` 先按草稿 formVersion 装载冻结定义，快照缺失才回退最新。
- 旧实例只读查看不执行写脚本的既有边界保持不变；本批以旧草稿运行证明不追溯最新版本。

## 五、原子流程合法目标：发布→运行→等待→回写

- 父流程 v1→v4 均为真实发布；触发动作 `TASK_SUBMITTED` 目标 U020 子流程，等待节点 `SUBFLOW_WAIT` 引用 `act_subflow_node_approval`。
- 发布/运行链：父实例 `329a1d86-d0fd-11f1-888e-00ff9e2a8dfb`（businessKey `66e3ca29-5e89-4669-a563-8fd5e290691b`）父任务通过后，子实例 `3cf68d0a-d0fd-11f1-888e-00ff9e2a8dfb` 真实创建（发起人 9001）；子任务完成后批次 SETTLED 1/1、子项 WRITTEN，等待节点 APPLIED，父实例最终 APPROVED。
- 回写链：父实例 `53c0fba5-d0ff-11f1-83ba-00ff9e2a8dfb`（businessKey `d58771f8-7a48-4ae7-87cf-1a631b70fdec`）子任务携带 `nodeFormData.title=回写来源标题` 完成后，子项 `writeback_json={"main":{"childNote":"回写来源标题"}}`，父表单 `childNote` 实际变为“回写来源标题”，父实例 APPROVED；子流程结束站内信 PROCESS_APPROVED 投递 SUCCESS。
- 配置边界：回写结果节点必须是子流程已绑定节点业务表单的节点；子表单需声明 `sourceInstanceId/sourceBusinessKey` 才能接收派发上下文（本批在目标表单 v3 显式声明）。

## 六、本批发现并修复的真实缺陷

1. **P64 动作命令键超长（PG 128）**：`sw_bpm_command.command_key` 上限 128，原拼接键含实例+触发器+任务+动作+项可达 156，导致 PG 事务中止、子流程无法派发。改为 SHA-256 定长 71 字符（`TriggerExecutionService.actionCommandKey`），动作意图/命令/子项幂等键同步收敛。
2. **表单 trace 幂等键超长**：`sw_form_trace.submit_idempotency_key` 上限 128，子流程表单提交沿用长命令键失败。改为 commandKey SHA-256 68 字符（`OrchActionStartCommandHandler.formIdempotencyKey`）。
3. **系统派发发起人错位**：调度线程上下文用户 1（租户 0）被写成子流程发起人，`requireActiveInitiator` 在租户 100 拒绝。现在 `submitOnBehalfOf` 以记录归属人/源实例发起人为提交人；自动发起系统操作人仅在目标租户内有效时使用，否则回退源发起人（`ProcessStartService`）。
4. **等待节点结束未同步实例状态**：父流程经等待节点结束无任务完成事件，`sw_bpm_instance` 停留 RUNNING。唤醒后按引擎活跃节点核对，已结束则收敛 APPROVED（`ChildOrchestrationService.syncParentStatusIfEnded`）。
5. **全量类型检查残留**：本批对 `field-scripts`/`form-events` 的字段联合类型、`RichTextControl` execCommand 参数、`rich-text` DOM 泛型、`FormPreview.spec`/`InstanceFlowPanel`/`ProcessSettings` 的类型与格式问题做了收敛，使干净 `vue-tsc -b` 通过。类型收敛中唯一的行为值修正：流程设置监听草稿的非法 `unmatchedDisposition:'KEEP'` 改为 `IGNORE`（无分支监听不产生未匹配阻断）。

## 七、机器验证

- Web 四连 exit 0：typecheck 0、eslint 0/0、vitest **219 文件通过/1 跳过（220）**、**1899 测试通过/3 跳过（1902）**、build **4.39s**。提交钩子仅执行 eslint --fix/prettier，提交后复跑 typecheck + lint 仍 exit 0。
- Server 聚焦 8 类共 **90 通过/0 失败**：`FormDefinitionControllerAuthorizationTest` 8、`FormSubmitServiceTest` 9、`OrchActionStartCommandHandlerTest` 9、`ChildOrchestrationRootChainRaceTest` 1、`ChildOrchestrationServiceTest` 28、`ProcessStartServiceTest` 7、`TriggerExecutionServiceChildDispatchTest` 4、`TriggerExecutionServiceTest` 24；Maven exit 0。
- 原始日志留本机：`/tmp/web-fourgate-60.log`（build 4.39s）、`/tmp/web-typecheck-57.log`、`/tmp/server-focused-final-53.log`；浏览器与 PG 数据留本地，不回显令牌或秘密。

## 七之补充：Git 回读

- Web `ea9a61a`（`codex/0.2.0-ui-tenant-form-flow`，已推送，远端同 SHA）。
- Server `4063f8e`（`codex/0.2.0-tenant-form-flow`，已推送，远端同 SHA）。
- 根回执/覆盖矩阵/知识当前状态由本文件提交后回读关联；不预填本文件自身提交 SHA。

## 八、剩余边界（如实）

- **正式像素 A03—A05/258 画框**：宿主截图捕获失败（上述实际错误），无新 PNG/diff；新侧栏独立像素参考仍属规划输入准备。
- **授权集成**：已回传 `search_fallback/0.2.0-authorized-integration-boundary-20261026.md`；结论是既有受控 HTTP 执行层可桥接，但需最小授权映射与执行端口的产品裁决，本批未实现新 Provider。
- **通知重复结束事件**：沿用既有 `NotifyFacadeIdempotencyIntegrationTest`（H2 3/0）与身份路径；本批未新增 PG 结束事件重放，未改变身份路径。子流程结束站内信在 PG 有新投递成功行。
- **A12 旧实例只读**：旧实例查看态不执行写脚本，未强行运行写事件；旧草稿运行自身版本已证明。
- 0.2.0 仍 IN_PROGRESS；未核销 P、未晋级基线；A17 合并/发布等待规划独立验收。

## 九、证据位置

- 本地证据根：`C:/Users/hjxch/.codex/evidence-020/real-joint/`（登录辅助、请求/响应 JSON、上传/下载文件、版本定义、父/子流程命令与对象快照）。
- 本批回执与覆盖矩阵：`product/0.2.0/receipts/real-consumption-53.md`、`u020-design-coverage.md`；知识状态追加见 `knowledge/current-status.md`。
