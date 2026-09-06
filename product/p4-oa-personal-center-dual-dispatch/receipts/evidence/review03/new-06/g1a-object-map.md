# G1a 对象映射（新入口链，最终运行时 backend-p4-final-05，进程 31852→于 03:05 启动）

| 对象 | 值 | 来源 |
|---|---|---|
| 用户 | biz=p4biz03 (2096313991404638209)；审批=admin(1) | fixtures03-run.out |
| 已发布表单 | p4_oa_biz_form_20260905b（formA） | 同上 |
| 入口 DOM | 我的草稿页"可发起的已发布表单"→业务表单行"发起"（无流程选择器） | evidence/04/browser-initiate-entry.png（review03/new-05 副本） |
| 草稿 | 2096319281688662017（formVersion=2，processDefKey=bpm_0809d9d64ff8463b，SUBMITTED） | API GET /workflow/drafts/{id}（本回执会话记录） |
| 父命令 | 2096319703472066561 DRAFT_SUBMIT/NORMAL/COMPLETED → result.recordId=3db5d007-c585-4e72-b17c-52dece5e1509 | API GET /workflow/commands/{id} |
| 子命令 | 2096319705544052738 FLOW_START（key 含业务记录 3db5d007——业务记录标识，非引擎实例 ID） | backend-p4-final-05.trimmed.log:136-141（review03/new-05 副本） |
| DB 实例 | 2096319707909640193（APPROVED） | API GET /workflow/my/instances |
| 引擎实例 | 0bef429e-a960-11f1-91c6-66ff24301f3c | 实例详情 processInstanceId |
| 引擎任务 | 0befb7db-a960-11f1-91c6-66ff24301f3c（节点 n_d1 重绑04终审，办理人 admin，已办结） | 实例详情 history |
| 终态截图 | browser-3db5d007-final.png（详情弹窗：业务单号/流程标识/已通过+流转记录） | evidence/04 |
| DOM 快照 | browser-3db5d007-dom.txt（列表行+详情弹窗完整 ARIA 树） | evidence/04 |

## 管理员待办路由同序列复现说明
原异常序列：admin 登录 → 落地 /dict → 在**后端/vite 进程重启过的旧标签页**中点击"待办任务" → 停留 /workflow/my-instances。
同序列干净复现（03:5x，vite 与后端均新会话）：admin 登录 → /dict → 展开 流程引擎 → 点击 待办任务 → **/workflow/todo 正常**（列表含 G1a新入口链任务 3db5d007 行，见回执会话记录与截图）；随后同页点击 我的已办 → /workflow/my-processed 正常（1 条重绑04终审记录）。
结论：菜单数据与路由注册无缺陷；异常出现于进程重启前后同一标签页的残留渲染状态（旧接口会话），刷新/重登即恢复。已按审查03 §3.3 如实说明。
