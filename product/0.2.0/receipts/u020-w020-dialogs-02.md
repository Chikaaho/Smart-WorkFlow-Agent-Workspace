# 0.2.0 统一执行·盘点缺口整改批次 02（驳回/退回/催办弹窗 + 守门对账）

2026-10-25｜Executor｜U020/W020 分支实施（授权：direction-unified-020.md + 盘点差距清单第 3 项）

## 批次范围

按设计原图（272-1746 驳回申请、273-2001 退回申请、273-2025 催办）补齐三处专用弹窗形态，并把催办留言做成了真实端到端能力（服务端接受、随站内通知送达并留痕）。实施中全量测试发现分支既有 7 项 bootstrap 守门失败（经 stash 干净 HEAD 复验确认为早期 0.2.0 批次遗留，与本批无关），按守门口径一并修复。

## 一、三弹窗与催办留言（Web `c15a6bc`）

- **驳回申请弹窗（550px）**：`TaskDetail.vue` 驳回由直接提交改为专用弹窗——「驳回原因」单行输入（可选），确认后 `use-task-approval` 以 `skipConfirm` 直提 REJECT；原因并入意见 comment（无结构化意见表单时写入 opinionComment，有结构化表单且 comment 为空时写入 opinionData.comment，不覆盖用户已填内容）。审批必填预检在开弹窗与确认两处保持。
- **退回申请弹窗（550px）**：退回目标下拉从审批区内联移入弹窗（placeholder 选择已通过节点 + 说明行「将退回到所选人工节点的最新已办轮次」），操作区保留单一「退回」按钮；RETURN 语义与 returnTargetNodeId 契约不变。
- **催办弹窗（480px）**：说明「将向当前待办人发送催办提醒」+「催办留言」textarea（可空，maxlength 200）；「更多」菜单催办改开弹窗，确认走原实例解析链并携带留言。
- locale 新增中英 11 键；`MyInstances` 直发催办入口保持原语义（无留言参数）。

## 二、催办留言服务端（Server `39d4d54`）

`POST /workflow/my/instances/{id}/urge` 接受可空 body `{message}`（旧无 body 调用不变）：留言 trim、空白视为无、>200 字 PARAM_ERROR 拒绝；随站内通知内容（"…；留言：X"）送达全部待办人并进入催办留痕明细。BpmUrgeServiceTest 新增 3 例（留言进通知与留痕、超长拒绝零副作用、空白与旧语义一致），7/7 通过。

## 三、bootstrap 守门对账（Server `ee1bb3b`，7 项既有失败修复）

全量首跑（干净树同样失败，stash 复验证据 /tmp/preexisting-check.log）发现并修复：
1. 迁移计数 ×3：`R__u020_user_group_menu`（0.2.0 用户组菜单，来自 64bc62e/d951016）使全新库 20→21、R__ 16→17、衔接对账 7→8——FlywayFullChainH2Test / I6G7bOldBaselineUpgradePostgresTest / ApplicationCenterLegacyUpgradeTest 计数与说明同步。
2. 错误码目录 ×2：EXT_DATASOURCE_UNAUTHORIZED(1220) 常量 188→189、唯一数值码 183→184，补目录 §2 行。
3. 双语文案 ×1：`error.form.ext_datasource_unauthorized` 补 zh-CN + en-US。
4. Optional 契约守门 ×1：`ExtDatasourceGrantPort` 两方法 boolean/Set → `Optional<Boolean>`/`Optional<Set<Long>>`（适配器 Optional.of 包装，form 侧 orElse(false)/orElseGet(Set::of)，语义不变），两个测试夹具同步新签名。

## 验证

- Web 四连全绿：typecheck 0；lint 0/0；**1844 通过/3 跳过**（TaskDetail 36/36，驳回/催办两用例改为弹窗流）；build 3.44s。
- Server：`mvn -q compile` 0；聚焦 7 守门+催办 0 失败；`mvn install -DskipTests` 0；`mvn test -pl form,bpm,openapi,bootstrap` **BUILD SUCCESS、0 失败**（bootstrap 281/0/32 跳过沿既有）。notify 模块在本次全量出现 I6G1a/b/c 三个 boot 用例偶发失败（runs 1/2 同码全绿、隔离复跑 3/3 通过、与本批零依赖），如实记录不掩盖。
- 原始日志本机留存：/tmp/server-full-test{,2,3}.log、server-tail.log、gate{1..4}.log、formcheck.log、notifycheck.log。

## Git 事实

Web `14ef300..c15a6bc`、Server `6995f88..ee1bb3b` 均已推送并回读一致；两工作树除受保护 vite.config.ts（Web）外干净。三处弹窗进入像素对照队列（A03 口径），不冒称视觉通过。

## 与方向对照

差距清单 6 项中第 3 项（驳回/退回/催办弹窗）关闭实现；剩余：审批校验提示样式、通知/高级配置编辑化、富文本（待规划语义）。另发现并修复的守门漂移属分支实施质量问题，非新范围。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
