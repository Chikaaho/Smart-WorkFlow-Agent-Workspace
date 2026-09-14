-- i6-04 对象铺设（前置种子，非验收行为断言；固定 ID，验收后保留在 run 库）
-- 同名资源双租户矩阵：T=100 与 T=200
INSERT INTO sys_tenant (id, create_time, update_time, deleted, tenant_id, version, name, code, status)
VALUES (100, now(), now(), 0, 0, 0, 'T100租户', 'tenant-100', 0),
       (200, now(), now(), 0, 0, 0, 'T200租户', 'tenant-200', 0);
-- 同名角色（code 相同，租户不同）
INSERT INTO sys_role (id, create_time, update_time, deleted, tenant_id, version, name, code, sort, status, data_scope, built_in)
VALUES (1001, now(), now(), 0, 100, 0, '管理员', 'tenant-admin', 1, 0, 2, false),
       (1002, now(), now(), 0, 100, 0, '审批人', 'approver', 2, 0, 1, false),
       (1013, now(), now(), 0, 100, 0, '无权用户', 'no-auth', 3, 0, 1, false),
       (2001, now(), now(), 0, 200, 0, '管理员', 'tenant-admin', 1, 0, 2, false),
       (2002, now(), now(), 0, 200, 0, '审批人', 'approver', 2, 0, 1, false);
-- 同名用户（T100: U1=10001 admin100 / U2=10002 approver100 / U3=10003 noauth100；T200: 20001/20002）
INSERT INTO sys_user (id, create_time, create_by, update_time, update_by, deleted, tenant_id, version, username, password, real_name, sex, status, is_admin)
VALUES (10001, now(), 1, now(), 1, 0, 100, 0, 'u1_100', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', 'T100管理员', 0, 0, 1),
       (10002, now(), 1, now(), 1, 0, 100, 0, 'u2_100', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', 'T100审批人', 0, 0, 0),
       (10003, now(), 1, now(), 1, 0, 100, 0, 'u3_100', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', 'T100无权', 0, 0, 0),
       (20001, now(), 1, now(), 1, 0, 200, 0, 'u1_200', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', 'T200管理员', 0, 0, 1),
       (20002, now(), 1, now(), 1, 0, 200, 0, 'u2_200', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', 'T200审批人', 0, 0, 0);
INSERT INTO sys_user_role (id, create_time, update_time, deleted, tenant_id, version, user_id, role_id)
VALUES (110001, now(), now(), 0, 100, 0, 10001, 1001), (110002, now(), now(), 0, 100, 0, 10002, 1002),
       (110003, now(), now(), 0, 100, 0, 10003, 1013), (210001, now(), now(), 0, 200, 0, 20001, 2001),
       (210002, now(), now(), 0, 200, 0, 20002, 2002);
