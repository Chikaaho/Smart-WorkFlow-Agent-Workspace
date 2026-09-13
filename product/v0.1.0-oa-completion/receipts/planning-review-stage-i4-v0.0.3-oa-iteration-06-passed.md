# P60 I4「编排、流程运营与工作台」规划验收 06：PASSED

> 验收角色：规划（Planner）  
> 日期：2026-09-13  
> 验收对象：`stage-i4-v0.0.3-oa-iteration-06.md`  
> 版本口径：成熟 OA 目标 `0.1.0`；当前交付迭代 `0.0.3`  
> 结论：R5、R6 通过；I4 十二项验收标准全部通过

## 1. 总结论

回执 06 已关闭验收 05 仅剩的 R5、R6 缺口。浏览器、HTTP、持久化与结果查询现在绑定同一业务对象；附件与该对象建立可回读关系，并具有已认证 owner 成功、已认证 outsider 对象权限拒绝的原始响应。最终候选的断言、路径、terminal 与 manifest 也已机械闭合。

验收 01—05 已锁定的 R1—R4 及 R5 既有通过项继续有效，不重复取证。结合本轮复核，I4 正式判定 **`PASSED`**，主方向移入 `passed/`。P60 仍为 **`IN_PROGRESS`**；I4 仅进入阶段三终态同步，尚未登记为 `COMPLETED（规划已确认）`。

## 2. R5 独立复核

| 核对项 | 独立复核结果 | 结论 |
|---|---|---|
| 同一对象身份 | `object-index.json` 固定 BK=`0f870b17-d72a-4209-9912-22de59733fba`、PI=`7c646895-af22-11f1-95b7-00ffa7734675`、T=`7c6468a2-af22-11f1-95b7-00ffa7734675`；`equality-table.json` 将 H5、API、提交与结果查询逐字段勾稽 | 通过 |
| 附件绑定 | storageKey=`2026/09/13/4474496a-f286-48eb-a8c6-829c8ba33655.txt`，recordKey 与同一 BK 相等；记录回读、H5 文件名元数据与下载入口一致 | 通过 |
| owner 正向下载 | `owner-download-raw.json` 为已认证 w 请求，HTTP 200、octet-stream，正文长度 60，SHA-256 与上传内容一致 | 通过 |
| outsider 反向下载 | `outsider-download-raw.json` 为已认证 outsider 请求，同一对象路径返回业务 403“无权访问该记录附件”，无附件正文 | 通过 |
| H5 可用性与终态 | 375px 详情无主体横向溢出，显示可读外键、附件与正式意见表单；同一 entity `2098975821552160769` 从 RUNNING 回读为 APPROVED | 通过 |
| 最终断言 | `R5/asserts-final.json` 共 17 项、失败 0 | 通过 |

## 3. R6 独立复核

| 核对项 | 独立复核结果 | 结论 |
|---|---|---|
| 候选绑定 | C4 固定 Server HEAD=`c18d074f4c9f85c5baf65af222e159437fb1e509`、Web HEAD=`192e0647a8f1b1e2b270d4ea13e87854b247fcc7`，并记录本轮 `MobileWorkspace.vue` 工作树哈希 | 通过 |
| 受影响门禁 | Web lint/typecheck/test/build 均 exit 0，测试 1183 passed + 3 skipped；Server 无本轮实现变化，沿用验收 05 已锁定的 523/0 | 通过 |
| manifest | 从 workspace root 独立复算 184 项，bad=0、missing=0、无法解析=0、自身未列；回执 06、最终证据、candidate 与 terminal validator 均在清单内 | 通过 |
| terminal 路径 | 18 条 evidence 路径全部存在，missing=0 | 通过 |
| 断言引用 | terminal 只引用 `R5/asserts-final.json`，该文件 17/0；未引用失败的中间断言 | 通过 |
| 机器终态 | terminal validator exit 0；2 个 work item 均 COMPLETED，remaining_actionable_count=0，功能状态仍为 VERIFYING | 通过 |

## 4. 十二项验收标准最终裁决

1. 动态并行冻结、异常集合处理与单次汇聚：通过（前轮锁定）。
2. 静态条件出口、默认出口与类型错误回归：通过（前轮锁定）。
3. 模板分级授权、复制编辑发布与历史不变：通过（前轮锁定）。
4. 监控检索、干预、审计与越权零变化：通过（R2及前轮锁定）。
5. 分析指标复算、穿透一致与数据范围：通过（R3及前轮锁定）。
6. 批量审批逐项结果、意见限制与零重复推进：通过（前轮锁定）。
7. 流程交接选择性迁移、历史不变与越权零迁移：通过（R2及前轮锁定）。
8. 外部应用发起、查询、签名回调、重试、防重放与权限：通过（前轮锁定）。
9. 多身份工作台同一对象、权限与状态一致：通过（前轮锁定，并由 R5 同对象链补强）。
10. PC/H5 发起、待办、意见、附件/外键回显与结果查询：通过（R5）。
11. H2/PostgreSQL 同迁移身份与历史兼容：通过（R1及前轮锁定）。
12. Server/Web 门禁及候选、身份、对象、原始结果和封装证据：通过（R6及前轮锁定）。

## 5. 状态与下一入口

- I4：`PASSED`，主方向归档至 `product/v0.1.0-oa-completion/passed/direction-stage-i4-orchestration-process-operations-workbench.md`。
- P60：保持 `IN_PROGRESS`；I1— I3 保持 `COMPLETED（规划已确认）`；I5—I6 未开始。
- 正式功能数保持 44；清单保持 ✅46/🟦22/⬜22；P60、P4、P34、P35、P47及其他开放编号均不核销。
- 唯一下一入口：`product/v0.1.0-oa-completion/ready/direction-stage-i4-terminal-sync.md`。

Executor 只执行 I4 终态机械同步、任务归属提交/推送与远端回读，并提交同步回执。Planner 全文复核通过后，才确认 I4 `COMPLETED` 并形成 I5 正式阶段方向。
