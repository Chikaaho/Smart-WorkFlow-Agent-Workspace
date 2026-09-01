# R1 结论

- **正向断言**：页面在 A 的身份/definition 响应返回之前（B 请求于 start=2768ms、33ms 完成）已成功进入并完整渲染表单 B（`beforeLate`：URL=…/ef79c4e5…，identity=`p52_r_form_b_… | 已发布 | V2`）。
- **迟到零覆盖断言**：A 的迟到响应（dur=10006ms）返回后（afterLateT=16:31:23Z），B 的以下状态逐项不变（`before-after.json` before/after 对比）：
  - URL：`/form/designer/ef79c4e5-…`（不变）
  - 身份区：`p52_r_form_b_1788279969775 | 已发布 | V2`（不变）
  - 标题输入框：`R系列对照表单B`（不变）
  - 组件状态：formId=ef79c4e5…、status=PUBLISHED、activeTab=design、rejected=false、loading=false（全部不变，未出现 A 的任何数据或拒绝态）
- **反向断言**：迟到后页面未出现 A 的 formKey（p52_r_form_a_…）、未出现 A 的标题（R系列主表单A）、未触发 A 的拒绝态/加载态。
- 截图：`after-late-b-identity.png`（迟到返回后工作台显示 B）、`form-a-opened.png`/`form-b-opened.png`（同一浏览器同环境 A/B 身份基线对照）。
- **结论：R1 通过。**
