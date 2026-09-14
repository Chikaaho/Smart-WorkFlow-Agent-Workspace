# G3d-R 实际结果（matrix-raw.log + tpl-raw.log + DB 回读 db-backread.txt）

## 正向
- 同名资源双租户共存：T100/T200 同 rule_code=I6G3D_R、同 template_code=I6G3D_TPL 各建一行（db 回读 tenant 100/200）
- 伪造 tenantId 不生效：T100 会话显式传 tenantId=200 建规则 → 落库 tenant_id=100（db-backread.txt I6G3D_FORGE）

## 反向
- 跨租户管理读取：T100 管理员 GET T200 规则详情 → 403（带权限码语义，不泄露内容）
- 跨租户管理变更：PUT/DELETE/toggle T200 规则 → 404「通知规则不存在」（不泄露存在性）
- 跨租户模板详情：T100 读 T200 同名模板 → 404；本人（T200）读自己 → 200
- 订阅/偏好对他人不可见（G2g-P 同源；sendMessage/伪造路径在 G3d-A → 404）

## 覆盖边界
- 模板直发绑定走模板码 + 调用方租户（直发响应经现有规则链的情侣对象在 G2e-T 已封）、本包聚焦管理资源矩阵
