# P53 视觉回归 34 项失败账本（提示09 R2a）

来源：`evidence/p53-review-08/final-gates/visual-verify-workers1.log`（37 passed / 34 failed / 17 skipped）。
34 个失败实例归并为 11 个根因组；类别口径=提示09 §3。处理全部完成后最终单worker全套为 **71 passed / 0 failed / 17 skipped（exit 0）**，见 `visual-final-workers1.log`。

| 组 | 失败实例（log块号） | 类别 | 根因 | 处理 | 证据 |
|---|---|---|---|---|---|
| G1 | 1,12,23（baselines 工作台壳三区） | 1过期定位 + 2快照漂移 | `.workspace__greeting` 类名在 review-04..07 设计还原中变更为 `.wsd-hero__greeting`；topbar/sidebar/main 三区快照为 review-03 时代像素 | 定位改 `.wsd-hero__greeting`；shell-topbar/shell-sidebar/workspace-main ×3视口 快照经核对后更新 | family-a node01 PASS；visual-final-workers1.log |
| G2 | 2,13,24（baselines 管理端壳三区） | 2快照漂移 | 管理端壳视觉在 review-05/06 重新对齐设计稿（深色顶栏等），旧快照未随更 | admin-topbar/admin-sidebar/admin-main ×3视口 经核对后更新（首轮定向更新因测试行号偏移 :43→:44 漏匹配，二轮补齐） | family-a node04 PASS |
| G3 | 3,14,25（families 01 工作台） | 1过期定位 + 2快照漂移 | 同 G1（greeting/stat 类名）；fam01-topbar/sidebar/main 旧像素 | 定位与 `.wsd-stat` 计数更新；fam01 三区快照经核对后更新 | family-a node01 PASS |
| G4 | 4,15,26（families 05 门户） | 2快照漂移 | 门户 hero/服务卡重设计后旧基线未随更 | fam05-main ×3视口 经核对后更新 | family-a node05 PASS |
| G5 | 5,16,27（families 21-26 流程中心） | 2快照漂移 | 目录页重设计后旧基线未随更 | fam21-main ×3视口 更新 | family-a node21 PASS |
| G6 | 6,17,28（families 02 数据列表） | 2快照漂移 | 实例列表重设计后旧基线未随更 | fam02-main ×3视口 更新 | family-b node02 PASS |
| G7 | 7,18,29（families 任务详情） | 2快照漂移 + 1过期断言 | fam03-main 旧像素；审批列表 tab 断言 `.el-table__row,.el-empty` 不匹配当前 el-table 空态（mock 种子待办无历史 → `.el-table__empty-text`） | fam03-main ×3视口 更新；断言改 `.el-table__empty-text` | family-b node03 PASS |
| G8 | 8,19,30（families 27 发起流程） | 2快照漂移 | 表单渲染页 node27 设计还原后旧基线未随更 | fam27-main ×3视口 更新 | family-a node27 PASS（review-08 重采） |
| G9 | 9,20,31（families 表单设计器） | 1过期定位 | 字段清单入口改为「设置下拉 → menuitem 字段清单」（FormDesigner onSettingsCommand） | 点击链改 `.designer__settings` click + menuitem | FormDesigner.vue:575-585 |
| G10 | 10,21,32（shell 工作台） | 1过期断言 + 1过期定位 | 品牌框左缘 24→25（1px 设计对齐漂移）；greeting/stat 类名同 G1 | 几何断言改设计容差 ≤2px（方向 §4.7 同口径）；类名更新 | family-a node01 PASS |
| G11 | 11,22,33（shell 进入后台） | 1过期断言 | 管理端主导航左缘 240→241（1px 漂移） | 同上容差化 | family-a node04 PASS |
| G12 | 34（shell 工作台 @375） | 1过期定位 | 同 G1 类名漂移 | 定位更新 | WorkspaceHome.vue:499 |

## 汇总

- 类别1（过期定位/断言）：19 个实例（G1/G3 定位部分、G7 断言、G9、G10、G11、G12）——全部改为当前稳定语义定位/设计容差断言；生产行为由锁定证据证明正确，未改生产实现。
- 类别2（合法快照漂移）：42 个快照文件更新（14 区域 × 3 视口，逐区清单见 `snapshots-sha256-before/after.txt`），每区域经机器核对（对应 family 节点对锁定设计 PASS）+ 代表性差异图人工复核（fam01-topbar diff=整条旧顶栏、actual 与 node01 锁定运行时一致）；非批量无审查更新。
- 类别3（状态fixture漂移）：0；类别4（真实产品缺陷）：0（src 402 文件零变化证明 `src-zero-change-proof.txt`）；类别5（测试不适用）：0。
- skip 保持 17 项不变，均有既有视口/状态依据（375 桌面页面族不适用=方向 §4.5；mock 待办无已完成历史的意见弹窗以真实后端记录采证），未新增 skip。
