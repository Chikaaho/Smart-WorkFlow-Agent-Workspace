# F2 正式浏览器验收 · 网络调用索引

> 第 1 轮按「本机留存」约定未提交；F2-G3（planner-convergence revision 9）明确要求本工件入
> `receipts/assets` 并提交，自第 2 轮起随根仓提交。

会话：ZCode IAB headless=false 1440×900；前端 http://127.0.0.1:5174，后端 http://127.0.0.1:8080/api。
每行：阶段 · 方法+端点 · 会话身份 · 结果 · 佐证（截图/DB/接口回执）。
1. 登录链 · GET /auth/challenge + POST /auth/login · 各会话 · 200 token · login.mjs（challenge→RSA-OAEP）
2. A 导出 · GET /form/app/manage/bundle/992ec4cc-0b41-4d1a-b1bf-f038b8c0e2b0/export · demo_a_hq_1 管理员 · 200 9030B · f2-a-export-success.png；crm_bundle.json
3. A 卡片菜单 · 页面数据 GET /form/app/manage/list · demo_a_hq_2（无 export）· 200 · f2-a-no-export-menu.png（无导出项）
4. A 页面级负权限 · GET /form/app-manage · demo_a_hq_2 · 200（seed 修复后） · f2-a-no-permission.png（修复前 403 存证）
5. A 接口级负权限 · GET /form/app/manage/bundle/{appId}/export · demo_a_hq_2 · 403 common.forbidden（req-119eb567…） · curl 回执
6. A 接口级负权限 · POST /form/app/manage/bundle/preview · demo_a_hq_2 · 403 common.forbidden（req-4f1b5249…） · curl 回执
7. B 预检 · POST /form/app/manage/bundle/preview · demo_b_hq_1 · 200 清单+外部引用匹配 · f2-b-import-preview.png；tamp_prev.json
8. B 冲突拒绝 · POST /form/app/manage/bundle/confirm（opinion key 已占用）· demo_b_hq_1 · BUNDLE_OPINION_KEY_CONFLICT 结构化拒绝 · f2-b-import-key-conflict-rejected.png
9. B 确认导入 · POST /form/app/manage/bundle/confirm · demo_b_hq_1 · 200 报告（created 映射+clearedRefs） · f2-b-import-report.png、f2-b-import-report-v2.png；DB sw_form_app_import_record
10. B 二次导入 · POST /form/app/manage/bundle/confirm · demo_b_hq_1 · 200 「CRM 客户管理-导入」 · f2-b-import-second.png；app 24b29ac5
11. B 导入记录 · GET /form/app/manage/bundle/import-records · demo_b_hq_1 · 200 · f2-b-import-records.png
12. B 逐个发布 · 表单/动作/流程发布接口 · demo_b_hq_1 · 全 PUBLISHED · f2-b-all-published.png；DB sw_form_def/sw_bpm_process_def
13. B 建记录+审批 · 记录提交/流程发起/同意（初审 92101、复核 ROLE demo_admin）· demo_b_hq_1 · APPROVED · f2-b-record-new.png、f2-b-approval-done.png
14. B 动作调用 · /form/txn-action 调用对话框 · demo_b_hq_1 · SUCCEEDED qty_reserved=5 · f2-b-action-invoked.png；DB sw_form_txn_reservation
15. ⑦ 篡改回滚 · POST preview 200 + POST confirm 500 · demo_b_hq_1 · 500 后 DB app=2/def=9/imp=2 不变 · tamp_prev.json/tamp_conf.json；psql 快照
16. ⑨ 往返一致 · GET /form/app/manage/bundle/24b29ac5-8be2-4150-b3e8-8907a66cab9b/export · demo_b_hq_1 · 200 7925B · bundle_b2.json；python 对比脚本

## 第 2 轮（F2-G1/G2/G3，2026-11-04～05）

17. G1-B 冲突拒绝 · POST /form/app/manage/bundle/confirm（newKey=op_form 已占用）· demo_b_hq_1 · code=1902 form.bundle_opinion_key_conflict（errorKey+冲突 key）→ 对应项行内提示+确认置灰 · f2-g1-key-taken-inline-hint.png
18. G1-B 唯一 key 成功 · POST /form/app/manage/bundle/confirm（newKey=op_form_g1fresh）· demo_b_hq_1 · 200 报告「CRM 客户管理-导入2」 · f2-g1-unique-key-import-success.png；DB sw_form_app 3d8fcf85
19. G2-C 登录链 · GET /auth/challenge + POST /auth/login · demo_c_hq_1（演示集团C，目标库 smart_workflow_f2_g2）· 200 token · 会话
20. G2-C 预检 · POST /form/app/manage/bundle/preview · demo_c_hq_1 · 200：dict_lead_source REUSE / dict_cust_level CREATE / 数据源·角色·分类命中 / 仅 FIXED_USER 置空 · f2-g2-preview-crossenv.png
21. G2-C 确认导入 · POST /form/app/manage/bundle/confirm · demo_c_hq_1 · 200 报告（1 字典新建+1 契约落库+仅 FIXED_USER 置空） · f2-g2-import-report.png；g2_report.json（sw_form_app_import_record）
22. G2-C 零补配发布 · POST /form/def/{id}/publish ×3（线索/客户档案/商机）· demo_c_hq_1 · 200 全 PUBLISHED v2（发布日志 Datasource bindings validated）· DB sw_form_def；server_g2.log
23. G2-C 字典下拉 · 新建记录页渲染 + GET 字典项（dict_lead_source → 目标预置项）· demo_c_hq_1 · 下拉展开=广告投放/自然流入（目标租户项，非包内展会/转介绍） · f2-g2-dict-dropdown.png

## 第 3 轮（F2-G4，2026-11-05）

24. G4-C 登录链 · GET /auth/challenge + POST /auth/login · demo_c_hq_1（目标库 smart_workflow_f2_g4，Flyway 25 迁移 → v0.2.6）· 200 token（UI 登录，验证码固定 1234）· 会话；server_g4.log
25. G4-C 预检 · POST /form/app/manage/bundle/preview · demo_c_hq_1 · 200：dict_lead_source 同编码复用 / dict_cust_level 缺失新建 / 数据源·角色·分类（销售管理×2 流程）命中 / 仅 FIXED_USER 置空 · DOM 快照（会话记录）；页面截图未产出（IAB 渲染面故障，见 f2-03 回执如实报告）
26. G4-C 确认导入 · POST /form/app/manage/bundle/confirm · demo_c_hq_1 · 200 报告：createdDictTypes=[dict_cust_level/客户等级/2 项]、reusedDictTypes=[dict_lead_source]、matchedCategories=[销售管理]×1（两流程命中去重后单条）、clearedRefs=[FIXED_USER] · f2-import-report-sample-v2.json；DB sw_form_app_import_record 4a6e9f66 report_json 与下载文件逐字段零差异；appId 0723d403
27. G4-C 下载报告 · 页面「下载报告」Blob（URL.createObjectURL 页内拦截取原文）· demo_c_hq_1 · 与页面报告展示内容一致（字典区：新建 dict_cust_level 客户等级·2 项 / 复用 dict_lead_source 线索来源） · f2-import-report-sample-v2.json（3012B）

## 第 4 轮（F2-G4 返工：汇总行口径 + 截图，2026-11-05）

28. G4-C 登录链 · GET /auth/challenge + POST /auth/login · demo_c_hq_1（同名重建临时库 smart_workflow_f2_g4，Flyway 25 迁移 → v0.2.6）· 200 token · 会话；server_g4_r2.log
29. G4-C 预检 · POST /form/app/manage/bundle/preview · demo_c_hq_1 · 200：dict_lead_source 同编码复用 / dict_cust_level 缺失新建 / 数据源·查询·角色·分类（销售管理×2）命中 / 仅 FIXED_USER 置空 · **f2-g4-preview.png**
30. G4-C 确认导入 · POST /form/app/manage/bundle/confirm · demo_c_hq_1 · 200 报告：顶部「字典 新建 1 · 复用 1」+ 字典区（缺失新建 dict_cust_level 客户等级·2 项 / 同编码复用 dict_lead_source）同框 · **f2-g4-report.png**；DB sw_form_app_import_record 1f609bde report_json 四字段与 f2-import-report-sample-v2.json 完全一致（appId 2d0d689a）
