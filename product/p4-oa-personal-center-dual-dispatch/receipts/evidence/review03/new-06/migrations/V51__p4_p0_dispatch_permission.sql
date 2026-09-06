-- P4 阶段B：P0 同步优先通道专用调用权限（仅注册，不默认授权）。
-- 权限码 workflow:p0:dispatch（BPM 命令通道 P0 车道 + 同步有界等待）。
-- D2 边界：不得将所有管理员或所有登录用户自动视为紧急调用方——本迁移仅注册
-- 按钮权限（menu_type=2），不向任何角色（含 role_id=2 管理员）默认授予；
-- 授权由 Owner/管理员经既有角色治理显式操作。superAdmin 短路为平台既有语义，
-- 不构成本权限的默认发放。全部 NOT EXISTS 幂等，可重复执行。
-- 未授权调用 P0 通道返回 403（含一般管理员）。

INSERT INTO sys_menu (id, create_time, update_time, deleted, version, parent_id, name, title, hidden, menu_type, path, component, permission, icon, sort)
SELECT 312, current_timestamp, current_timestamp, 0, 0, p.id, 'WorkflowP0Dispatch', 'P0紧急流程调用', false, 2, '', '', 'workflow:p0:dispatch', '', 31
FROM sys_menu p
WHERE p.permission = 'workflow:def:view'
  AND p.deleted = 0
  AND NOT EXISTS (SELECT 1 FROM sys_menu m WHERE m.id = 312 AND m.deleted = 0);
