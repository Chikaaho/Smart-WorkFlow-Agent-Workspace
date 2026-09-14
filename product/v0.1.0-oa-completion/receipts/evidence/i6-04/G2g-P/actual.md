# G2g-P 实际结果（matrix-raw.log + 权限菜单种子 object-setup/seed-role-menus.sql）

## 正向
- 管理权限：u1(10001) 持 notify:rule:manage 创建规则成功（2099431290269544449 requiredFlag=1 强制规则）
- 无权管理：u3(10003) 创建规则 → 403「无权限」；规则列表（notify:rule:view 无菜单）对非超管恒 403，
  与「管理权限显隐」一致（如实登记：notify:rule:view 未登记为菜单权限码，见覆盖边界）
- 本人订阅：u3 GET /notify/subscriptions → 保存 EMAIL 停用 → 200 → 回读 enabled=false
- 强制站内信不可关闭：TODO_CREATED/IN_APP 停用 → 400「必须送达事件/渠道不允许关闭」且偏好不变（强制规则 I6G2G_REQ requiredFlag=1 生效）
- 他人订阅不可改：订阅接口仅作用登录本人（save 无 userId 形参）；u1 保存后 u3 偏好逐字节不变
- 可选渠道可调整：u3 EMAIL 停用被接受（G2g-C 链E 邮件停用投递矩阵相互印证）

## 反向
- u1 无法以任何参数改 u3 偏好（4b u3 偏好 u1 保存前后不变）
- 无伪造 recipientId/userId 的落库路径（服务端取 LoginUser）

## 覆盖边界
- notify:rule:view 未在任何菜单登记 → GET /notify/rules 对租户管理员 403（真实产品事实，已登记为知识项；
  管理 CRUD 本身（创建/启停）经 manage 权限证成立）——Web 规则管理页的可见性属 G4a 权限显隐核对范围
