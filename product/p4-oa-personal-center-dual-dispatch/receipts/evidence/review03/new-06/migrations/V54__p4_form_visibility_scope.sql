-- P4: 业务发起可见范围。空值表示当前租户内全部用户。
ALTER TABLE sw_form_def ADD COLUMN visibility_scope TEXT;
