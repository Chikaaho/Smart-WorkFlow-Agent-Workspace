# 0.2.0 批次84：无权拒绝、脚本应用保存、节点保存发布与图表配置

2026-10-27｜Executor｜任务03（唯一入口）｜0.2.0 IN_PROGRESS（1/1/5）

按更新后的任务03（读取82—83）继续：无权操作拒绝、节点保存发布、脚本应用保存，以及图表/目录/非空应用原缺口。已证版本脚本运行不重做；移动不验。

## 一、无权操作拒绝（权限树剩余边界）

使用 53 已登记的合法负向身份 t100nobody（userId 9101，无角色；dev 夹具与 t100admin 同一口令，固定验证码 1234），未自授权限：

- 登录成功，落地 `/workspace`，页头显示「无角色用户」，待办 0。
- 直接访问 `/system/role` → 前端 `/404`。
- 以该身份调用角色菜单端点：`getRoleMenus(2114297251898707969)` → 403「您没有执行该操作的权限，请联系管理员分配相应权限」；`updateRoleMenus(2114297251898707969, ['2','4','223','353'])` → 同 403。
- 管理员随后回读该角色权限仍为 `['353']`，未被越权修改。
- 证据：families-78/negative/01-nobody-landing.png、02-nobody-role-page.png；接口结果见本回执记录。

## 二、脚本编辑器应用保存与回读

- 对象：form_mvqgwn7r 的 field_1（发布态），脚本内容 `#获取字段值(field_1)`。
- 在脚本弹窗点「应用」→ 字段面板显示该脚本 → 保存 → 定义回读 `script: {code: "#获取字段值(field_1)"}` → 重新加载设计器并打开脚本弹窗，textarea 值为同一代码。
- 清理：将 textarea 清空 → 应用 → 保存 → 定义回读 field_1 无 script，恢复无脚本状态。
- 证据：families-78/script-apply/01-applied-panel.png、02-saved.png、03-reloaded-dialog.png、04-restored.png。

## 三、节点配置保存发布（审批源 + 字段权限）

在授权 dev 对象上完成，不发布生产定义：

1. 新建并发布审批意见表单「审批意见验证-83」（id `0d662736-bac2-4c78-bdba-b7b933b282be`，formKey `form_comment83_mvql28hc`，字段 opinion）。
2. 新建流程定义「节点保存验证-83」（id `2115038365978984450`，processKey `bpm_6a76ae27de4b47bf`），节点库插入审批节点。
3. 打开「选择审批人」，选择「租户100管理员 t100admin」→ 已选 1 人 → 保存（草稿已保存）→ 发布（发布成功：图、节点配置、表单与函数版本已冻结），定义列表状态 PUBLISHED，v2。
4. 回读图：`node_1` 类型 APPROVAL，config.participant = `{strategy:"FIXED_USER", value:["9001"]}`；节点与 START/END 之间两条边存在。
5. 字段权限：同一审批节点切「字段属性」，取消「编辑」勾选 → 保存 → 发布 → 回读 `fieldStates.opinion = {required:false, editable:false, hidden:false}`。
- 证据：families-78/node-save/03-approval-inserted.png、04-approver-checked.png、05-saved.png、06-published.png、07-field-perm-panel.png、08-field-perm-set.png、09-field-perm-published.png。
- 未重复 53 的版本/函数链；未把预览运行当作已应用（应用/保存/发布分别有独立结果）。

## 四、图表与配置（部分补采）

- `/workspace/config` 添加「柱状图」，关联表单改为 A03 资产采购表单（1 条真实记录），预览渲染「记录数 1」及对应柱条（分类为「引用目标记录-8…」）。
- 「多指标与坐标轴」面板实际展开，字段包括 X 轴/维度、分组系列、指标字段、统计方式、坐标轴（左轴/右轴）、呈现方式、单位、颜色、添加指标。
- 本轮未点保存，工作台布局未变更；未造数。
- 证据：families-78/charts/02-bar-added.png、05-chart-with-data.png、07-chart-data.png、06-picker-selected.png。
- 仍缺：其他图型（折线/饼/雷达等）逐类渲染、第二个指标实际右轴/单位的执行结果、HEX 透明度、列表分页/滚动、重置草稿/保存失败。

## 五、目录浮层与非空应用卡（具体条件保留）

- 目录浮层：当前菜单投影无目录子层；新建目录需同时给当前角色授予新菜单权限，属自行增权，未做。保留该具体条件，不把空态当通过。
- 应用卡：应用中心真实空态、应用管理列表 403；无合法非空应用可消费，未造应用或自授权限。

## 六、变更与门禁

- 本批无源码变更；82 的四门禁结果继续适用：typecheck/lint 通过，226 文件 1947 测试通过/3 跳过，build 3.95s。
- dev 测试对象：审批意见表单 0d662736…、流程定义 2115038365978984450、节点配置与字段权限、图表预览未保存。
- 证据在 E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/negative、script-apply、node-save、charts。

## 七、结论

无权负向、脚本应用持久化、节点审批源与字段权限保存发布均已取得实际结果；图表柱状渲染与多指标面板取得真实状态，其他图型/轴单位执行仍列具体缺口；目录/应用卡按权限条件保留。不宣称整页/整族通过，A17 仍依赖整版验收。
