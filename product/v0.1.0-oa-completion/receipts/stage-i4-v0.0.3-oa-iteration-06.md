# I4 执行回执 06（四级提示 04：R5/R6 收敛，v0.0.3 迭代候选 C4）

> 角色：执行（Executor）
> 日期：2026-09-13
> 唯一执行入口：`planning-execution-prompt-stage-i4-v0.0.3-oa-iteration-04.md`（四级提示）
> 验收依据：`planning-review-stage-i4-v0.0.3-oa-iteration-05.md`（VERIFYING）
> 上轮回执：`stage-i4-v0.0.3-oa-iteration-05.md`
> 版本口径：成熟 OA 目标 `0.1.0`；当前交付迭代 `0.0.3`
> 自验结论：**自验通过（R5 同一对象闭环 + 附件授权链逐项归档；R6 机械收尾工具回读通过），提交 `VERIFYING / EXECUTION_SUBMITTED`，待规划验收**
> 证据包：`receipts/evidence/i4-06/`（R5/R6 两独立包 + `http/` 服务端原始响应目录，README 按 原子ID→原始位置→实际结果→边界 单页）
> 登录口径：本机 dev test-mock 验证码固定 1234

## R5 同一对象 M + 绑定附件 ATT（独立包 `evidence/i4-06/R5/`）

- 原始位置：服务端原始 HTTP 在 `../http/`（`m-submit.json`、`m-submit-instances.json`、`m-record-readback.json`、`m-record-readback-final.json`、`m-task-detail-readback.json`、`m-instance-history.json`、`att-upload.json`、`r5-fk-ref-submit(-instances).json`、`asserts-r5.json` 13/13、`asserts-r5b.json` 4/4）；浏览器原始 DOM/截图在本目录 `r6-h5-m-detail.{txt,png}`、`r6-h5-m-initiated.{txt,png}`、`r6-h5-m-processed.{txt,png}`（viewport 375x812）；下载原始响应 `owner-download-raw.json`、`outsider-download-raw.json`；`object-index.json`、`equality-table.json`、`asserts-final.json`（**17 项 0 失败**）。
- 采集口径修正：对象索引（`http/object-index.json`）先固定 M 与 ATT 后，浏览器/API/持久化回读全部从同一索引取值；不再存在浏览器与 HTTP 分炉造对象。
- 实际结果（同一对象 M，BK `0f870b17-d72a-4209-9912-22de59733fba` / PI `7c646895-af22-11f1-95b7-00ffa7734675` / T `7c6468a2-af22-11f1-95b7-00ffa7734675`）：
  - H5 详情（375px）业务单号逐字等于 M.businessKey；待办列表标题即 M.taskId；提交响应 data = M.businessKey；API 任务详情回读 businessKey/processInstanceId 与 M 相等；结果查询「我发起的」行 entity id `2098975821552160769` 与 API `/workflow/my/instances` 行同一对象且状态 APPROVED（办理后），`equality-table.json` 逐字段对照。
  - 附件 ATT：`w` 上传（storageKey `2026/09/13/4474496a-f286-48eb-a8c6-829c8ba33655.txt`）→ 随 M 提交绑定（代码 1218 校验按 storageKey 字符串数组契约通过）→ 持久化回读记录列 attachment 逐字等于 `[storageKey]`（recordKey=M.businessKey）；**H5 详情显示附件文件名元数据与下载入口**（本轮 `MobileWorkspace.vue` 补 ATTACHMENT/IMAGE 详情回显，Web 四门 0）。
  - 下载授权正反向（原始响应含 status/headers/长度/SHA-256）：owner（w，记录发起人）200 octet-stream 且正文哈希/长度与上传内容一致；已认证 outsider 403（`无权访问该记录附件`，非 401 未认证）；失败请求零记录/关系写入。
  - FK 可读回显沿用已锁定样式：详情显示「关联协作单 = I4-r6 关联协作单目标」。
- 横向溢出：详情页 scrollWidth=375==clientWidth、结果查询页同（evaluate 实测，无主体横向溢出）。
- 边界：仅重采同一对象 M 链路与附件授权链；iteration-05 已锁定的 375px 布局、意见表单、必填拒绝、R1—R4 未重验。为证完整生命周期，M 经 H5 正式意见表单办结（APPROVED）；本轮新增业务数据全部保留只读。

## R6 最终候选 C4（独立包 `evidence/i4-06/R6/`）

- 原始位置：`candidate.txt`（C4：server/web HEAD + 本轮唯一代码改动 MobileWorkspace.vue 的 worktree SHA-256）、`gate-web-four-gates.txt`、四份原始日志、`manifest.sha256`（工具回读）、`manifest-verify.txt`。
- **代码变化说明**：本轮唯一实现变化 = `Smart-WorkFlow-aPaaS-Web/src/modules/workflow/views/MobileWorkspace.vue`（附件元数据/下载入口回显）；Server 无代码变化（R1—R4 锁定，不重跑）。
- 门禁（C4 上全部 exit 0）：Web 四门 lint=0 / typecheck=0 / test=0（128 文件，1183 passed + 3 skipped）/ build=0；Server 无实现变化不重跑（沿用验收 05 锁定的 523/0）。
- manifest：workspace root 相对路径、GNU `*` 标记；**包含本轮回执 06 与全部 i4-06 最终证据**，不含 manifest 自身；工具 `sha256sum -c` 回读 OK=184、BAD=0（数字见 `manifest-verify.txt`）；正文/附件/terminal 三处计数一致。
- assert validator：`R5/asserts-final.json` total=17、failed=0，terminal 仅引用该最终断言；早前中间失败附件（首轮 1218 重试产生的覆盖前日志）已不被引用。
- terminal：terminal JSON 内 evidence 路径在本回执定稿前逐条存在校验（`path-validator.txt`，missing=0），validate-terminal.pl（或 ps1）exit 0。

## 与四级提示的替代/偏差

- ATT 值形态：后端契约即 storageKey 字符串数组（FormFieldEnrichmentService.enrichFiles 按字符串校验），采集与其一致；H5 详情同时兼容带名对象数组。无其他偏差。

## 终态

R5/R6 全部以逐字相等与正反向行为证据闭合、R6 机械收尾工具回读一致。提交规划验收；未移动方向、未写功能级 PASSED/COMPLETED、未核销 P 编号、未创建标签。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-06.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/README.md","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/object-index.json","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/equality-table.json","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/asserts-final.json","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/owner-download-raw.json","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/outsider-download-raw.json","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/r6-h5-m-detail.png","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/r6-h5-m-detail-dom.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/r6-h5-m-processed.png","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R5/r6-h5-m-processed-dom.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/README.md","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/candidate.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/gate-web-four-gates.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/assert-validator.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/path-validator.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/terminal-validator.txt","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/manifest.sha256","product/v0.1.0-oa-completion/receipts/evidence/i4-06/R6/manifest-verify.txt"],"feature_status":"VERIFYING","work_items":[{"id":"R5-h5-same-object-attachment","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"同一对象 M（BK/PI/T）+ 绑定附件 ATT（H5 附件元数据/入口 + owner 200/outsider 403 原始响应）+ 结果查询同对象，asserts-final 17/0，待规划验收"},{"id":"R6-final-package-terminal","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"C4 候选 + Web 四门 0、manifest 含回执 06 工具回读 bad=0、terminal 全部引用最终断言/存在的路径，待规划验收"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 按 stage-i4-v0.0.3-oa-iteration-06.md 与四级提示 R5/R6 完成条件复验并裁决 I4 是否 PASSED","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i4-v0.0.3-iter06-2026-09-13-r5-same-object-attachment-r6-c4","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-Web/src/modules/workflow/views/MobileWorkspace.vue（ATTACHMENT/IMAGE 详情元数据与下载入口回显，兼容 storageKey 数组）","product/v0.1.0-oa-completion/receipts/evidence/i4-06/*","product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-06.md","knowledge/current-status.md"],"tool_actions":["固定对象索引后仅重采同一对象 M 链路（HTTP submit/detail/instance + H5 375px DOM + 结果查询）","附件上传→提交绑定→持久化回读→owner 200/outsider 403 原始下载（哈希/长度核对）","H5 正式意见表单办结 M → 结果查询 APPROVED 与 API 同对象","Web 四门 lint/typecheck/test/build 全 0；Server 无实现变化不重跑","manifest 重建含回执 06，工具回读 bad/missing=0"],"new_evidence":["R5 详情 DOM 业务单号=0f870b17… 等于 HTTP 固定 M（equality-table 逐字段）","ATT recordKey=M.businessKey：记录列 attachment=[storageKey] 逐字回读 + 详情可见附件入口","owner-download-raw.json（200 octet-stream sha256 一致）/ outsider-download-raw.json（403 对象权限拒绝）","asserts-final.json 17 项 0 失败（仅引用最终断言）","manifest 工具回读 bad=0 且包含回执 06"],"closed_work_items":["R5-h5-same-object-attachment","R6-final-package-terminal"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"node-http","outcome":"SUCCEEDED","detail":"i4-r6.mjs 服务端链 r5 13/13 + r5b 4/4 全绿"},{"tool":"browser","outcome":"SUCCEEDED","detail":"375px H5 详情/发起/结果查询 DOM+截图，业务键逐字等于 M，无横向溢出"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"lint=0 typecheck=0 test=0（1183 passed+3 skipped）build=0"},{"tool":"sha256sum","outcome":"SUCCEEDED","detail":"manifest 工具回读 bad/missing=0"}],"browser_status":"OPERABLE"}
