# G1a 索引：已结束实例节点状态一致（提示05 §3 A1/C1）

## §2 事实
- 被验证路径：浏览器 /workflow/my-instances → 详情 → GET /workflow/my/instances/{id} → BpmMyInstanceController.myInstanceDetail（真实实现：引擎历史 queryHistoryByProcessInstance + sw_bpm_approval_action 动作合并）；审批动作为真实 TaskActionService 落库。无替身。
- 场景输入：真实对象链——bizG(finalbizg) 经已发布表单 p4_oa_biz_form_final 发起 → NORMAL DRAFT_SUBMIT 完成 → FLOW_START → 实例 2096510901902077954 → 任务 2e3b92f8（最终终审，admin 经 POST /workflow/tasks/{id}/complete 真实审批）→ 实例 APPROVED。
- 结果判据：已办理节点 history[0].action=APPROVE、approvalResult=APPROVED、endTime、opinionData 齐备；页面"结果"不再显示"进行中"；未办理节点不伪造动作。

## 断言→原件→实际值→结论
1. 正向：API 读回一致 → browser-g1a-detail-dom.txt（API 段）→ `{"taskName":"最终终审","assigneeName":"系统管理员","action":"APPROVE","approvalResult":"APPROVED","endTime":"2026-09-06T16:09:11.188","opinionData":{"comment":"G1a 终审验证通过"}}` → 成立。
2. 正向：页面 DOM → browser-g1a-detail-dom.txt → 流转记录行 `最终终审 | 系统管理员 | 通过 | 通过 | G1a 终审验证通过 | 2026-09-06T16:08:44.932 | 2026-09-06T16:09:11.188`，且"流程已结束，无进行中的节点" → 成立。
3. 正向：视觉截图 → browser-g1a-detail-fixed-1680.png（办理时间列可见）、browser-g1a-detail-fixed.png → 结果绿标"通过"、非"进行中" → 成立。
4. 反向：未办理节点不伪造动作 → BpmMyInstanceControllerTest.myInstanceDetail_shouldMergeActionRecordsIntoHistory（副本＝工程源码，运行报告见 G8b 清单）→ 无 ACTION 记录节点 action/approvalResult/opinionData 均为 null，前端显示"-" → 成立。
5. 修复说明：缺陷根因为 myInstanceDetail 从不合并 ACTION 记录（前端对 null 结果显示"进行中"）；修复=按 taskId 合并动作记录（action/approvalResult/opinionData），前端补 RETURNED 与动作标签映射（MyInstances.vue）。历史审查04所指 3db5d007 旧对象已销毁，按提示03登记替代：本轮以同链路新对象 ea4f7f7e 全链重采。

## 边界
仅修详情映射与前端展示映射；不重证发起入口（L7/L14 已锁）。旧对象映射文件 PID 转录问题（PID31852 vs 原运行 PID39302）在 G8a 登记，不重拍浏览器。
