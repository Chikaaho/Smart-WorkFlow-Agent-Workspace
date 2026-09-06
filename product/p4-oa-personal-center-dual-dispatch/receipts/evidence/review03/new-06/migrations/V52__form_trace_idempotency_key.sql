-- P4：表单提交幂等键（草稿/命令重试场景防重复落表单数据）。
alter table sw_form_trace add column submit_idempotency_key varchar(128);
create unique index uk_sw_form_trace_idem on sw_form_trace (tenant_id, submit_idempotency_key);
