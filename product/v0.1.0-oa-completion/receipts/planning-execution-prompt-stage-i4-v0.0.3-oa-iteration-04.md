# P60 I4 四级执行补充提示 04

> 日期：2026-09-13  
> 功能：P60 I4 / 当前交付迭代 `0.0.3`  
> 依据：`planning-review-stage-i4-v0.0.3-oa-iteration-05.md`  
> 当前唯一剩余范围：R5、R6

## 0. 诊断与替代关系

本提示替代三级提示 03，成为 I4 唯一执行入口。R1/R2/R3/R4 已通过并删除出待办。当前失败分类：R5 为证据对象不匹配与缺原始行为证据；R6 为终态/manifest 封装错误。更早提示与回执只作精确附件指针，不同时作为待办。

## 1. 唯一剩余原子账本

| 原子ID | 最新失败事实 | 正向完成条件 | 反向零残留 | 对象身份 | 唯一可接受证据 | 不可接受证据 | 下一动作 | 合法停止 |
|---|---|---|---|---|---|---|---|---|
| R5-h5-same-object-attachment | 浏览器业务键 `349f…` 与 HTTP 固定键 `bd355…` 不同；attachment.recordKey=null；两份下载原始文件不存在。 | 新建唯一对象 M：同一 businessKey/processInstanceId/taskId 在 H5 详情、提交、已办 DOM、API 最终回读逐字相等；附件 ATT 在提交前绑定 M 的真实表单记录，H5 详情可见附件元数据/入口；已认证 owner 下载成功，已认证 outsider 被对象权限拒绝。 | outsider 不能读取元数据/下载内容；失败请求不改变记录/附件关系；旧 `349f…`/`bd355…` 不得拼接。 | W、outsider、M 的 BK/PI/T、FK、ATT/storageKey/recordKey。 | 独立包中的 object-index、浏览器 DOM/截图、详情/提交/已办/API 回读、附件绑定持久化回读、owner/outsider 两份原始 HTTP（状态/响应头/安全摘要），逐字段 equality 表。 | 无 ID 的 `sameObject=true`、布尔下载摘要、recordKey=null、缺失文件、401 未认证、另一浏览器实例。 | 先固定 M/ATT，再仅重采 R5 同对象链；必要时修复附件绑定/展示。 | 浏览器或存储真实不可用且恢复/安全替代穷尽时按契约停止。 |
| R6-final-package-terminal | manifest 未包含回执 05；terminal 指向 failed=1 的中间断言。 | R5 关闭后固定 C4；manifest 包含回执 06与所有最终证据、排除自身、工具回读 bad/missing=0；terminal 只引用最终断言且所有路径存在，work_items/remaining 与事实一致。 | 不得把中间失败附件标成最终通过；正文、assert total/failed、manifest 项数和 terminal 逐字一致。 | C4、evidence i4-06、回执 06、最终 terminal。 | candidate、必要受影响门禁、manifest/verify、path validator、assert validator、terminal JSON。 | 沿用缺回执 manifest、引用 `failed>0` 文件、手工宣称全部存在。 | 最后执行机械收尾。 | R5 真实阻塞时保留非零剩余并按契约停止。 |

## 2. 两个独立证据包

- `evidence/i4-06/R5/`：README、object-index、same-object equality、H5 DOM/截图、API 最终回读、attachment-binding、owner-download-raw、outsider-download-raw、asserts-final。
- `evidence/i4-06/R6/`：candidate、受影响 gates、manifest/verify、path-validator、assert-validator、terminal-validator。

每个 README 只写：`原子ID → 原始位置 → 实际结果 → 边界`。原始响应单独落盘，秘密只保留哈希/长度，不保存 token 或附件敏感正文。

## 3. 锁定与禁止重验

- R1/R2/R3/R4、G1—G6 已通过子项全部锁定。
- R5 响应式布局、FK 可读显示、意见表单、必填拒绝可沿用 iteration-05 实图；只补同一对象和附件链。
- 若没有实现变化，R1—R4、Server 全套和 Web 全套均不得无影响重跑；有变化只跑实际受影响门禁并写明依赖。

## 4. 对象与生命周期

采集前登记 M 与 ATT 的 BK/PI/T/recordKey/storageKey，所有浏览器/API/持久化附件必须从这份索引取值。先绑定附件再打开详情；完成后保留只读结果，清理只限新对象并回读。浏览器身份必须可从页面和 API 同时确认。

## 5. 读取 / 修改 / 命令范围

| 维度 | 内容 |
|---|---|
| 允许读取 | 正式方向、验收 05、本提示；iteration-05 R5 图/DOM/object-index/asserts、缺失路径清单、R6 manifest/terminal；对应 R5 实现和配置。 |
| 允许修改 | 仅同对象采集或确证附件缺陷涉及的 Web/Server 代码、R5/R6 验证资产、新 evidence 与回执 06。不得改历史审查/附件和正式状态。 |
| 允许命令 | 真实 HTTP/浏览器/SQL 只读回读、精确受影响门禁、秘密扫描、SHA-256、路径/assert/terminal Validator。 |
| 顺序 | 建 M/ATT 索引 → 绑定并回读 → H5 同对象链 → owner/outsider 原始下载 → R5 自检 → C4/门禁 → R6 → 回执。 |
| 禁止 | 拼接不同对象、布尔摘要替原始响应、未认证负向替对象权限、recordKey=null、重验锁定项、推进 I5/阶段三。 |

## 6. 相对三级提示的变化

- 删除已通过 R1/R2/R3，并沿用 R4 锁定。
- R5 收敛为一个固定对象 M 与一个绑定附件 ATT，不再允许浏览器/HTTP 分别造对象。
- R6 新增 assert-validator：任何 terminal 引用的最终断言 `failed` 必须为 0。
- 提交条件从五包收敛为两包；两包全部自检为是才可提交。

## 7. 全部为“是”才允许提交

- [ ] H5 详情、提交、已办 DOM 与 API 回读的 BK/PI/T 全部等于 object-index？
- [ ] ATT.recordKey 等于 M.businessKey，详情可见附件元数据/入口？
- [ ] owner 与 authenticated outsider 两份原始 HTTP 文件真实存在，分别成功与对象权限拒绝？
- [ ] outsider 零元数据/零正文/零关系写入？
- [ ] R5 最终断言 failed=0，且不存在被 terminal 当成最终结果的 failed>0 文件？
- [ ] manifest 包含回执 06、排除自身、实际校验 bad/missing=0？
- [ ] terminal 只引用存在的最终文件，remaining 与事实一致？

## 8. 合法终态

下一回执固定为：

`product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-06.md`

状态保持 `VERIFYING / EXECUTION_SUBMITTED`。Executor 不得写功能级 `PASSED/COMPLETED`、不得进入阶段三；真实工具阻塞且替代路径穷尽时才按 terminal contract 报告 BLOCKED。
