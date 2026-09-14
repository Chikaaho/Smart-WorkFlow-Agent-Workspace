# G4a 实际结果（截图索引 + 网络索引 + visibility/g4a 脚本）

## 正向（PC 真实后端、无 Mock）
- 分页列表：/inbox 22 条→服务端分页 10/page（shot-01）
- 未读/单条已读/全部已读：未读 35 → 标记已读 → 全部已读 → 未读 0（shot-03 列表全部"已读"）
- 删除：行删除真实落库（sw_notify_message deleted=1，u1 仅 1 行）
- 深链：跳转按钮 → 服务端 /notify/inbox/{id}/link 鉴权通过 → 监控列表 focus → 实例详情抽屉
  （21bca43c 抄送链实例：发起人 T100管理员/状态已完成/流转记录审批人，shot-04）
- 偏好页：订阅偏好真实渲染 u1 停用的 EMAIL 订阅 + 强制站内信提示（shot-05）
- 权限显隐：u3 未授权路由 /inbox → 404 页面不可达（shot-06）；管理页（规则/渠道）未出现在 u3 菜单

## 反向（负向）
- 修复前深链：authorizer 缺失 → 所有合法跳转 fail-closed「无权访问该业务对象」（浏览器 alert 截图为证，见 command.txt）
- 修复后越权仍拒绝：BpmNotifyLinkAuthorizer 对无记录对象返回 false → 「无权访问该业务对象」；
  跨租户（G4b shot-04）与 u3（G3d-A API 矩阵）fail closed

## 覆盖边界
- 监控列表在 data_scope 修正后可见实例行；流程图渲染对部分新 key 显示"未找到流程定义"（defs by-key 缺
  G6a 新建定义的目录项）——抽屉基本信息/流转记录完整，属既有监控页展示边界，不属通知收口范围
- 跨用户撤权（受理后撤角色）由 G3d/G6b 权限矩阵与 fail-closed 深链覆盖
