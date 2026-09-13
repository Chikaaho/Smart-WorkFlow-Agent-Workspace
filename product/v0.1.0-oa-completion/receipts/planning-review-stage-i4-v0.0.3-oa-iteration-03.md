# P60 I4「编排、流程运营与工作台」规划验收 03：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-13  
> 验收对象：`stage-i4-v0.0.3-oa-iteration-03.md`  
> 结论：一级提示后的提交仍有可执行缺口，进入二级执行补充提示

## 1. 总结论

回执 03 已实质关闭动态分支身份、冻结、模板生命周期、批量、七卡工作台、同对象 OpenAPI、回调恢复、秘密处置和候选哈希等问题；Planner 独立复算 `manifest.sha256` 为 381 项、不可解析 0、错误 0，六张浏览器截图可读，秘密模式复扫未发现 JWT、PEM、Bearer 或未脱敏 accessToken。

但 I4 仍不能 `PASSED`：分析汇总与有权明细不相等且时长指标错误为 0；监控迁移审计与回执相反；跨租户使用不存在的占位 ID 而非真实跨租户对象；交接历史附件只返回参数错误；H5 未呈现待办详情且回执明确承认复杂意见表单转 PC；terminal 还引用一条不存在的 evidence 路径。

I4 保持 **`VERIFYING`**。不得进入阶段三、I5、标签或发布。

## 2. 独立复核事实

- **分析口径失败**：`g2c-summary-api.json` 为 launched=5、completed=4、avg/P50/P90=0；`g2c-recompute.json` 对固定样本 A 为 launched=4、completed=2、avg=11.57s、P50=11.57s、P90=18.61s。`asserts-g2.json` 仅断言 API 大于等于样本，未满足一级提示“汇总=有权明细”，也违反“非零指标不得以 0 代替完成”。
- **监控迁移审计失败**：`g2b-intervene-transfer.json` 与 `g2b-o-interventions.json` 实际均记录 `fromAssignee=leader1`、`toAssignee=leader1`、`affectedTasks=2`；回执却写 leader2→leader1、影响 1 项。终止只引用实现与既有测试，未提供最终候选上的真实实例前后状态、任务与审计链。
- **跨租户对象未成立**：G1c 使用租户 0 中不存在的部门 ID，G3b 使用租户 0 中不存在的目标用户 ID；两者只能证明“无效对象”，不能证明“真实存在但属于其他租户”的拒绝与零副作用。PG 测试可证明表级隔离，不能替代这两个正式服务入口的对象语义。
- **交接历史未读到**：`g3b-x-history-before.json` 与 `after.json` 均为 HTTP 400、`参数非法: id`。两份错误响应逐字相同不能证明历史办理人与意见零改写。
- **H5 仍不满足方向**：截图证明 375px 待办列表、简单意见文本提交与 PC 已办回看；但 `h5-opinion-filled.png` 标题为“办理 -”，未展示待办详情/业务表单。回执又明确写“复杂意见表单仍引导 PC”，与正式方向 §3.7 和验收标准 10 的移动端意见表单可完成要求冲突；静态跳转提示不能替代移动交付。
- **终态账本不一致**：ENGINE_TERMINAL JSON 可解析、16 项均写 COMPLETED、remaining=0，但 evidence 首项 `receipts/evidence/i4-03/object-index.json` 不存在，实际文件在 `http/object-index.json`；上述未闭合项也使 remaining=0 不成立。

## 3. 已通过并锁定

- G1a 动态分支快照/任务/轨迹身份一致；G1b 运行中组织变化不改写冻结负责人。
- G1c 的空、缺负责人、失效、重复、超上限五类行为；仅真实跨租户对象语义未锁定。
- G2a 模板复制→编辑→发布及来源零改写、无权拒绝。
- G2b 七条件命中/排除、挂起/恢复和无权零写入；仅迁移审计正确性与终止真实链未锁定。
- G3a 六项混合批量；G3b 两任务迁移、代理规则选择、重试零重复；仅历史读取与真实跨租户未锁定。
- G4a 默认工作台七入口；G4b 简单意见提交、PC 已办回看、无权深链拒绝；移动详情与正式意见表单未锁定。
- G5a/G5b 同对象 OpenAPI、签名复算、失败恢复与去重。
- G6a 秘密处置、G6b 当前候选 manifest、G6c 当前候选受影响门禁；后续若修改代码，候选/门禁/manifest 必须随最终快照重建。

## 4. 当前唯一入口

按二级提示继续：

`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i4-v0.0.3-oa-iteration-02.md`

下一回执：

`product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-04.md`
