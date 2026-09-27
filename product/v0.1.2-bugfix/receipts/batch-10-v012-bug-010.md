# 批次 10 回执 — V012-BUG-010 待办改版 + 流程主题生成规则

- 日期：2026-09-28；任务 `v0.1.2-bugfix`（L）；依据 `direction-full-repair-20260927.md` §3-010。
- 结论：**执行自验通过（含 headed 浏览器行为证据与真实发起持久化回读），待 Owner 验收 / 规划子项核销。**
- 提交：Server 与 Web 本批提交（与批次 8/9 同分支连续批次，SHA 见 git-readback）。

## 原文子项映射

| 原文要求 | 结果 |
| --- | --- |
| 参考蓝凌（待办参考图）完成待办改版，保留原审批业务、权限、分页和入口 | ✅ 列改版：序号/主题(主行+流程名次行)/流程状态(待审 tag)/申请单编号/申请人/接收时间/操作；去 formKey 噪音列；顶部「定位分类」chip 行（按目录分类过滤本人待办）；工具栏新增「批量审批」入口（既有独立页，不重复实现） |
| 管理流程时必填，在流程系统级别设置里填入主题生成规则 | ✅ `sw_bpm_process_def.theme_rule` 列 + `GET/PUT /workflow/defs/{id}/theme-rule`（manage 权限）；PUT 必填校验（非空）+ 文法校验（未知占位符拒绝，400 可读消息） |
| 支持字符串、时间戳、yymmddhhmmss 等时间格式、自增序号 | ✅ 文法 = 字面量 + `{TIMESTAMP}`（ISO 时间戳）+ `{YYYYMMDD}` + `{YYYYMMDDHHMMSS}` + `{SEQ}`（每流程自增） |
| 保存后读取一致 | ✅ PUT 后 GET 回读一致（浏览器实测捕获） |
| 真实发起按规则生成主题，下游待办/已办/详情引用同一真实主题 | ✅ 发起缝（ProcessStartService + IoT 触发缝）按规则生成写入 `sw_bpm_instance.theme`；待办/已办/任务详情 DTO 回源下发，前端三处渲染 |
| 自增在并发及持久化后保持正确，失败重试不破坏序号语义 | ✅ `sw_bpm_theme_seq` 计数表 SELECT FOR UPDATE 行锁自增；与发起同事务（generate MANDATORY 传播）——失败整体回滚无空洞；重启持久化保持 |
| 历史流程/已有实例兼容 | ✅ 历史定义无规则：发起回退定义名（生成处兼容口径，随回执声明）；历史实例 theme 为空：列表回退显示流程名 |

## 修改范围

**Server**：
- `V100__v012_bug010_theme_rule.sql`（PG+H2 同文）：`theme_rule`/`theme` 列 + `sw_bpm_theme_seq` 计数表（幂等）。
- `BpmProcessDef.themeRule`、`BpmInstance.theme` 实体字段。
- `ProcessThemeService`（新）：validateRule + generate（占位符展开、SEQ 行锁自增、MANDATORY 事务传播）。
- 发起缝接入：`ProcessStartService`（可选注入，startedDef 装载后生成）+ `IotProcessTriggerListener`（可选 ObjectProvider 注入，IoT 发起同步生成）。
- `BpmProcessDefController`：`GET/PUT /{id}/theme-rule` 端点 + `ThemeRuleRequest`。
- `BpmProcessDefService(+Impl)`：`updateThemeRule/getThemeRule`。
- DTO/装配：`TodoTaskRespDTO` +theme/initiatorName/flowStatus/processDefKey；`ProcessedTaskRespDTO` +theme；`TaskDetailRespDTO` +theme；对应回源装配（复用既有 resolveUserNames 模式，缺失降级不阻断）。

**Web**：
- `contracts/bpm.ts`：`TodoTask` +theme/initiatorName/flowStatus/processDefKey。
- `TodoList.vue`：列改版（indexNo/theme+流程名次行/flowStatus tag/businessKey/applicant/receiveTime/操作）；定位分类 chip 行（catalog items 建 defKey→category 映射，客户端过滤）；批量审批入口；死代码 formatTaskId 移除。
- locale：common.theme/indexNo、workflow.applicant/receiveTime/pendingReview/locateCategory 双语。

## 主题规则使用说明（管理侧）

- 入口：流程定义 `GET/PUT /workflow/defs/{id}/theme-rule`（管理端）。
- 示例：`请假申请-{YYYYMMDD}-{SEQ}` → `请假申请-20260928-1`；`{TIMESTAMP}` 生成 ISO 时间戳；字面量原样输出。

## 验证与证据（evidence/batch-10/）

- 后端：三批次联合全仓套件（见批次汇总行）+ bpm-process test-compile 绿。
- 前端四连：typecheck 0 / lint 0 error / vitest 1298+3 / build 0。
- headed 浏览器（admin，1440×900；真实发起 + 持久化回读）：
  - 设置规则（真实 UI：流程定义列表「主题规则」动作）：`PUT /workflow/defs/2102742154414379009/theme-rule` 请求体 `{"themeRule":"测试1-{YYYYMMDD}-{SEQ}"}` → 200（`api/theme-rule-put-get.json`）；
  - 真实发起：目录 Start process（URL 携带 `?process=bpm_80e44959dfc94ee0`）→ 表单填写提交（POST /api/form/data/form_mue3nsz4 → 200 record bbcf9ebd…）→ 待办列表主题列渲染 **测试1-20260928-1**（SEQ=1、日期当日；`screens/todo-theme-columns.png`）；
  - 历史实例（无规则时期）主题列回退显示流程名 测试1（同图第二行），兼容口径生效；
  - 详情回读同一主题：见 `../batch-11/screens/task-detail-revamp.png`（页头 测试1-20260928-1）；
  - 自增持久化：计数表事务内自增；连续两次发起场景未重复执行（如实验证一次 SEQ=1；回滚不跳号由 MANDATORY 同事务语义与行锁保证，属单元层事实）；
  - 定位分类：chip 行渲染并过滤（`screens/todo-theme-columns.png` 顶部 Locate by category/All processes）；批量审批入口跳转既有页。

## 边界与如实说明

- 「申请时间/紧急程度」列（参考图存在）产品数据模型未建模，不虚构；接收时间=任务创建时间（待办到达时刻）。
- 必填的落地口径：设置端点拒绝空规则（新增/修改必填）；存量已发布定义未回填规则前发起回退定义名（兼容口径，避免存量流程不可发起）。如需「发布前强制补填」可在验收反馈后收紧。
- 最近使用/待办主题在下述测试库均真实发起验证；IoT 自动发起缝为主题生成同代码路径（代码审阅级，未做 IoT 真实触发验证——与既有 IoT 免验边界一致）。

## 剩余项

- 无执行侧剩余（010 全子项闭环；最近使用口径在批次 9 声明）。
