INSERT INTO sys_role_menu (id, create_time, update_time, deleted, tenant_id, version, role_id, menu_id)
SELECT 2000000 + r.base_id * 1000 + row_number() OVER (), now(), now(), 0, r.tenant_id, 0, r.role_id, m.id
FROM sys_menu m
JOIN (VALUES (100, 1001, 1), (100, 1002, 2), (200, 2001, 3), (200, 2002, 1)) AS r(tenant_id, role_id, base_id) ON true
WHERE NOT EXISTS (SELECT 1 FROM sys_role_menu x WHERE x.tenant_id = r.tenant_id AND x.role_id = r.role_id AND x.menu_id = m.id AND x.deleted = 0);
