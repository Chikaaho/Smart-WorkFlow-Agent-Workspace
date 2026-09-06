# P4 当前方向 API / 浏览器行为证据

## 证据边界

- 时间：2026-09-05 16:47—17:01（Asia/Shanghai）。
- 环境：本机 loopback，Spring `dev` profile，H2；仅使用临时调试认证开关，未写入仓库、浏览器持久存储或正式凭据。
- 本证据对应当前干净启动夹具，不引用重启前已被清空的 H2 数据。
- 用户身份：普通业务用户与流程执行用户为同一租户 `tenantId=0`；所有返回均已去除认证密钥。

## 夹具与契约

| 对象 | 值 |
| --- | --- |
| 已发布表单 | `p4_oa_published_form_20260905` |
| 表单 ID | `11c5d5ee-f27e-4272-97a1-0e819254f7dc` |
| 有效表单版本 | `2` |
| 系统解析流程 | `bpm_f8fb300ae34844ba` |
| 普通业务用户 | `2096158369950339074` |
| P0 执行用户 | `2096158370415906818` |
| P0 权限 | `workflow:p0:dispatch` |

## G1b：可见范围持久化、过滤与恢复

1. 管理员调用 `PUT /api/form/def/11c5d5ee-f27e-4272-97a1-0e819254f7dc/visibility`，请求 `{"userIds":["2096158369950339074"]}`，返回 `code=0`。
2. 普通业务用户 `GET /api/form/def/published` 返回该已发布表单；P0 执行用户同接口返回空数组。
3. P0 执行用户读取 `GET /api/form/def/by-key/p4_oa_published_form_20260905` 返回 `code=1000`、`表单不存在`，未泄露不可见表单。
4. 管理员以 `{"userIds":[]}` 恢复全租户可见，返回 `code=0`；随后 P0 执行用户可再次取得该表单，管理员按 key 回读 `visibilityScope=null`。

## G5a/G6a/G6b：P0 真实链路与权限拒绝

### P0 允许路径

- P0 执行用户创建草稿：`POST /api/workflow/drafts`，返回草稿 `2096158464624168961`，服务端回填 `processDefKey=bpm_f8fb300ae34844ba`。
- 提交：`POST /api/workflow/drafts/2096158464624168961/submit?channel=P0`，返回 `commandId=2096158464913575937`、`status=COMPLETED`、`duplicated=false`。
- 命令回读：`result={"status":"SUBMITTED","recordId":"cfb08ba5-1536-4aa2-8d0c-84fbef87bc00"}`；流程实例回读为 `RUNNING`，`processDefKey=bpm_f8fb300ae34844ba`，业务键与结果记录一致。
- P0 待办完成后，命令 `2096158564008202241` 为 `COMPLETED`，流程实例回读为 `APPROVED`，待办为空，处理记录为 `APPROVE/APPROVED`。

### 普通业务用户 P0 拒绝路径

- 普通业务用户创建有效草稿 `2096158617640767490`。
- `POST /api/workflow/drafts/2096158617640767490/submit?channel=P0` 返回 HTTP `403`，消息为 `缺少 P0 调用专用权限: workflow:p0:dispatch`。
- 草稿回读保持 `status=EDITING`、`commandId=null`；没有产生可消费命令。

## G1a/G2a：普通用户从已发布表单发起，流程由系统解析

浏览器地址为 `http://localhost:5173/workflow/my-drafts`，通过真实 DOM/AX 操作完成：

1. 点击“新建草稿”，弹窗仅显示“表单”下拉框与“填写”按钮；可见提示为“审批流程由系统根据已发布表单的有效绑定自动解析”，没有流程选择器。
2. 选择 `P4已发布业务表单（p4_oa_published_form_20260905）`，进入 `/form/form-render/p4_oa_published_form_20260905?mode=draft`。
3. 填写申请人、金额、事由并保存，再从“我的草稿”点击“提交”；成功 toast 为 `提交成功`，页面回到 `/workflow/my-drafts`。
4. 浏览器提交草稿 `2096159088501723138` 回读：`formKey=p4_oa_published_form_20260905`、`formVersion=2`、`processDefKey=bpm_f8fb300ae34844ba`、`status=SUBMITTED`、`commandId=2096159190150680578`、`lastError=null`。
5. 命令回读为 `DRAFT_SUBMIT/NORMAL/COMPLETED`，结果为 `{"status":"SUBMITTED","recordId":"255a8848-4f7d-41be-b53a-f22b8c9245d6"}`；流程实例回读先为 `RUNNING`，正常审批完成后为 `APPROVED`，待办为空，处理记录为 `APPROVE/APPROVED`。

## G2a：必填校验与零残留

- 浏览器新建并保存一个空草稿 `2096161660616708098`，回读 payload 为 `{"applicant":"","amount":0,"reason":""}`、`status=EDITING`、`commandId=null`。
- 编辑该草稿点击真实“提交草稿”按钮，页面显示 `请完善必填项后再提交` 与 `此字段为必填项`；未进入提交 API/命令链路。
- 金额 `0` 保持合法数值，不被通用空值判断误报；缺失的是必填申请人。

## 结论

当前行为已证明：普通用户只能从可见的已发布表单进入，前端不选择流程，后端按唯一有效绑定解析并快照流程标识；P0 入口及消费前权限门禁保持；流程中心完整页面/分类/双视角仍不在本轮实现范围。
