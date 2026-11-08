# B0 证据：长度与类型边界

## 宽列（utf8mb4/AL32UTF8 最坏字节）

| 表.列 | 类型 | 最坏字节 | 文件 | 风险 |
|---|---|---:|---|---|
| sw_bpm_task_opinion_draft.comment | VARCHAR(20000) | 80000 | R__0.2.0_approval_opinion_draft.sql | Oracle VARCHAR2 超 4000 字节，需 CLOB 或缩短 |
| sw_bpm_node_function_audit.summary | varchar(2000) | 8000 | V0.2.0__baseline_seed.sql | Oracle VARCHAR2 超 4000 字节，需 CLOB 或缩短 |
| sw_storage_file.storage_url | VARCHAR(1024) | 4096 | V0.2.0__baseline_seed.sql | Oracle VARCHAR2 超 4000 字节，需 CLOB 或缩短 |
| sw_agent_graph_execution_request.error_message | VARCHAR(1000) | 4000 | V0.2.7__agent_execution_lifecycle.sql | 接近 Oracle 4000 上限 |
| sw_bpm_handover.scope_def_keys | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_iot_audit_record.detail | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_iot_device_command.payload | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_iot_device_command.result | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_iot_property_record.pre_value_json | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_iot_property_record.value_json | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_iot_script_exec.error | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_notify_template.variables_allowed | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sw_notify_template_version.variables_allowed | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sys_sso_audit_record.detail | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |
| sys_sso_provider_config.app_secret_enc | varchar(1000) | 4000 | V0.2.0__baseline_seed.sql | 接近 Oracle 4000 上限 |

## 索引键宽（粗估，按最坏字节）

| 表 | 索引 | 唯一 | 列与估算 | 合计字节 | 风险 |
|---|---|---|---|---:|---|
| sw_form_integration_invocation | uk_form_integration_invocation_identity | 是 | tenant_id=8, form_key=512, form_version=4, capability_id=256, phase=128, request_key=512, subject_id=8 | 1428 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用）；SQL Server 聚集索引上限 900（仅当设为聚集索引） |
| sw_bpm_task_form_data | idx_sw_bpm_task_form_data_instance | 否 | tenant_id=8, process_instance_id=256, node_key=800, round_no=8 | 1072 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用）；SQL Server 聚集索引上限 900（仅当设为聚集索引） |
| sw_bpm_consensus_vote | idx_sw_bpm_vote_node | 否 | tenant_id=8, process_instance_id=256, node_key=800 | 1064 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用）；SQL Server 聚集索引上限 900（仅当设为聚集索引） |
| sw_openapi_idempotency | uk_sw_openapi_idem | 是 | app_id=256, idem_key=800 | 1056 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用）；SQL Server 聚集索引上限 900（仅当设为聚集索引） |
| sw_iot_audit_record | idx_sw_iot_audit_lookup | 否 | tenant_id=8, action=256, object_type=256, object_id=512, action_time=8 | 1040 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用）；SQL Server 聚集索引上限 900（仅当设为聚集索引） |
| sw_bpm_child_batch | uk_sw_bpm_child_batch | 是 | tenant_id=8, batch_key=960 | 968 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用）；SQL Server 聚集索引上限 900（仅当设为聚集索引） |
| sw_form_txn_invocation | uk_sw_form_txn_inv_key | 是 | tenant_id=8, action_id=144, invocation_key=800 | 952 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用）；SQL Server 聚集索引上限 900（仅当设为聚集索引） |
| sys_sso_user_binding | uk_sys_sso_binding_external | 是 | provider=80, tenant_id=8, external_id=800, deleted=2 | 890 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sys_sso_provider_config | uk_sys_sso_provider_app | 是 | provider=80, app_id=800, deleted=2 | 882 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_iot_device_command | idx_iot_command_status_device | 否 | product_id=256, device_name=512, status=80 | 848 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_iot_message_log | idx_sw_iot_msg_topic | 否 | tenant_id=8, topic=800, create_time=8 | 816 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_action_ref | uk_sw_bpm_action_ref | 是 | tenant_id=8, command_key=800 | 808 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_command | uk_sw_bpm_command_logical | 是 | tenant_id=8, logical_command_id=800 | 808 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_form_binding | uk_sw_bpm_binding_active | 是 | tenant_id=8, form_key=800 | 808 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_trigger_exec | uk_sw_bpm_trigger_exec | 是 | tenant_id=8, exec_key=800 | 808 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_iot_topic | uk_sw_iot_topic | 是 | tenant_id=8, topic=800 | 808 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_knowledge_base | uk_sw_knowledge_base_name | 是 | tenant_id=8, name=800 | 808 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_notify_message | uk_sw_notify_msg_idempotency | 是 | tenant_id=8, idempotency_key=800 | 808 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_form_config | uk_sw_form_cfg_tname | 是 | table_name=800, deleted=2 | 802 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_command_effect | idx_sw_bpm_command_effect_logical | 否 | logical_command_id=800 | 800 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_process_def | idx_sw_bpm_proc_def_key | 否 | process_key=800 | 800 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_process_def | idx_sw_bpm_proc_def_form | 否 | form_key=800 | 800 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_form_config | uk_sw_form_cfg_tname | 是 | table_name=800 | 800 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_form_config | idx_sw_form_cfg_parent | 否 | parent_table=800 | 800 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_dynamic_branch | uk_sw_bpm_dyn_branch | 是 | tenant_id=8, process_instance_id=256, node_key=512, round_no=8, branch_index=4 | 788 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_dynamic_branch | uk_sw_bpm_dyn_branch | 是 | tenant_id=8, process_instance_id=256, node_key=512, branch_index=4 | 780 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_iot_device | uk_iot_device_product_device | 是 | product_id=256, device_name=512, tenant_id=8 | 776 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_bpm_dynamic_branch | idx_sw_bpm_dyn_branch_instance | 否 | process_instance_id=256, node_key=512 | 768 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_openapi_nonce | uk_sw_openapi_nonce | 是 | app_id=256, nonce=512 | 768 | MySQL 旧行格式/767 前缀下超限（5.7 默认 DYNAMIC 3072 可用） |
| sw_openapi_callback_task | uk_sw_openapi_cb_task | 是 | tenant_id=8, app_id=256, event=200, biz_ref=256 | 720 | — |
| sw_openapi_callback_log | idx_sw_openapi_cb_app | 否 | app_id=256, biz_ref=256, event=200 | 712 | — |
| sw_agent_graph_execution_request | uk_sw_agent_exec_req_idem | 是 | tenant_id=8, create_by=256, idempotency_key=400 | 664 | — |
| sw_notify_message | uk_sw_notify_msg_identity | 是 | tenant_id=8, event_type=160, biz_id=256, occurrence_no=8, recipient_id=8, channel=160 | 600 | — |
| sw_form_txn_action | uk_sw_form_txn_action_key | 是 | tenant_id=8, form_id=144, action_key=400 | 552 | — |
| sw_bpm_child_item | uk_sw_bpm_child_item | 是 | tenant_id=8, batch_id=8, item_key=512 | 528 | — |
| sw_bpm_communication | uk_sw_bpm_comm_instance_receiver | 是 | tenant_id=8, process_instance_id=256, task_id=256, receiver_id=8 | 528 | — |
| sw_bpm_node_function | uk_sw_bpm_node_func | 是 | tenant_id=8, func_key=512, func_version=4 | 524 | — |
| sw_form_integration_invocation | idx_form_integration_invocation_form | 否 | tenant_id=8, form_key=512, form_version=4 | 524 | — |
| sw_bpm_command | uk_sw_bpm_command_key | 是 | tenant_id=8, command_key=512 | 520 | — |
| sw_bpm_command_batch | uk_sw_bpm_command_batch_key | 是 | tenant_id=8, batch_key=512 | 520 | — |
| sw_bpm_command_batch_item | uk_sw_bpm_command_batch_item_key | 是 | batch_id=8, item_key=512 | 520 | — |
| sw_form_trace | uk_sw_form_trace_idem | 是 | tenant_id=8, submit_idempotency_key=512 | 520 | — |
| sw_iot_audit_record | idx_sw_iot_audit_correlation | 否 | tenant_id=8, correlation_id=512 | 520 | — |
| sw_iot_event_record | idx_sw_iot_event_correlation | 否 | tenant_id=8, correlation_id=512 | 520 | — |
| sw_iot_message_log | idx_sw_iot_msg_dedup | 否 | tenant_id=8, dedup_key=512 | 520 | — |
| sw_iot_process_trigger | uk_sw_iot_trigger_key | 是 | tenant_id=8, idempotent_key=512 | 520 | — |
| sw_iot_script_exec | idx_sw_iot_exec_correlation | 否 | tenant_id=8, correlation_id=512 | 520 | — |
| sw_bpm_urge_record | uk_sw_bpm_urge_cooldown | 是 | cooldown_key=512 | 512 | — |
| sw_iot_device_command | uk_iot_command_idempotent | 是 | idempotent_key=512 | 512 | — |
| sys_refresh_token | uk_srt_token_hash | 是 | token_hash=512 | 512 | — |
| sys_sso_auth_state | uk_sys_sso_state_value | 是 | state_value=512 | 512 | — |
| sw_notify_message | idx_sw_notify_msg_retry | 否 | tenant_id=8, event_type=160, biz_id=256 | 424 | — |
| sw_agent_model | idx_sw_agent_model_grp | 否 | tenant_id=8, group_key=400, sort=4 | 412 | — |
| sw_agent_model_config | idx_sw_agent_model_group | 否 | tenant_id=8, group_key=400, sort=4 | 412 | — |
| sw_form_def | uk_sw_form_def_form_key | 是 | tenant_id=8, form_key=400, deleted=2 | 410 | — |
| sw_notify_rule | uk_sw_notify_rule_code | 是 | tenant_id=8, rule_code=400, deleted=2 | 410 | — |
| sw_notify_template | uk_sw_notify_template_tenant_code | 是 | tenant_id=8, template_code=400, deleted=2 | 410 | — |
| sw_agent_graph_def | uk_sw_agent_graph_key | 是 | tenant_id=8, graph_key=400 | 408 | — |
| sw_agent_model | uk_sw_agent_model_tenant_name | 是 | tenant_id=8, name=400 | 408 | — |
| sw_agent_model_config | uk_sw_agent_model_name | 是 | tenant_id=8, name=400 | 408 | — |
| sw_agent_provider | uk_sw_agent_provider_name | 是 | tenant_id=8, name=400 | 408 | — |
| sw_form_txn_reservation | idx_sw_form_txn_res_record | 否 | tenant_id=8, form_id=144, record_id=256 | 408 | — |
| sw_bpm_ext_datasource | uk_sw_bpm_ext_ds_name | 是 | name=400, deleted=2 | 402 | — |
| sw_form_def | uk_sw_form_def_form_key | 是 | form_key=400, deleted=2 | 402 | — |
| sw_bpm_ext_datasource | uk_sw_bpm_ext_ds_name | 是 | name=400 | 400 | — |
| sw_bpm_process_template | idx_sw_bpm_tpl_category | 否 | category=400 | 400 | — |
| sw_notify_subscription | uk_sw_notify_sub | 是 | tenant_id=8, user_id=8, event_type=160, channel=160, deleted=2 | 338 | — |
| sys_sso_user_binding | uk_sys_sso_binding_digest_global | 是 | provider=80, external_digest=256, deleted=2 | 338 | — |
| sw_bpm_ext_datasource_grant | uk_bpm_ext_ds_grant | 是 | tenant_id=8, datasource_id=8, subject_type=64, subject_key=256 | 336 | — |
| sw_bpm_ext_datasource_grant | idx_bpm_ext_ds_grant_subject | 否 | tenant_id=8, subject_type=64, subject_key=256 | 328 | — |
| sw_iot_property_record | idx_sw_iot_prop_dev | 否 | tenant_id=8, device_id=8, property_id=256, report_time=8 | 280 | — |
| sw_bpm_consensus_vote | uk_sw_bpm_vote_task_actor | 是 | tenant_id=8, task_id=256, actor_id=8 | 272 | — |
| sw_bpm_process_favorite | uk_sw_bpm_process_favorite | 是 | tenant_id=8, user_id=8, process_key=256 | 272 | — |
| sw_bpm_task_opinion_draft | uk_bpm_opinion_draft_task_user | 是 | tenant_id=8, task_id=256, assignee_id=8 | 272 | — |
| sw_bpm_task_opinion_draft | idx_bpm_opinion_draft_instance | 否 | tenant_id=8, process_instance_id=256, assignee_id=8 | 272 | — |
| sw_form_ext_query | uk_sw_form_ext_query | 是 | tenant_id=8, query_key=256, query_version=4 | 268 | — |
| sw_agent_session | idx_sw_agent_session_user | 否 | tenant_id=8, create_by=256, deleted=2 | 266 | — |
| sys_user_group | uk_sys_user_group_code | 是 | tenant_id=8, group_code=256, deleted=2 | 266 | — |
| sys_user_group | idx_sys_user_group_name | 否 | tenant_id=8, group_name=256, deleted=2 | 266 | — |
| sys_workspace_card_type | uk_sys_workspace_card_type | 是 | tenant_id=8, type_code=256, deleted=2 | 266 | — |
| sw_bpm_action_ref | idx_sw_bpm_action_ref_instance | 否 | tenant_id=8, process_instance_id=256 | 264 | — |
| sw_bpm_branch_trace | idx_sw_bpm_branch_trace_instance | 否 | tenant_id=8, process_instance_id=256 | 264 | — |
| sw_bpm_child_batch | idx_sw_bpm_child_batch_parent | 否 | tenant_id=8, parent_instance_id=256 | 264 | — |
| sw_bpm_child_batch | idx_sw_bpm_child_batch_root | 否 | tenant_id=8, root_instance_id=256 | 264 | — |
| sw_bpm_child_item | idx_sw_bpm_child_item_target | 否 | tenant_id=8, target_record_id=256 | 264 | — |
| sw_bpm_communication | idx_sw_bpm_comm_task | 否 | tenant_id=8, task_id=256 | 264 | — |
| sw_bpm_copy_record | idx_sw_bpm_copy_instance | 否 | tenant_id=8, process_instance_id=256 | 264 | — |
| sw_bpm_sign_record | idx_sw_bpm_sign_task | 否 | tenant_id=8, task_id=256 | 264 | — |
| sw_bpm_task_deadline | uk_sw_bpm_deadline_task | 是 | tenant_id=8, task_id=256 | 264 | — |
| sw_bpm_task_form_data | uk_sw_bpm_task_form_data | 是 | tenant_id=8, task_id=256 | 264 | — |
| sw_bpm_trigger_exec | idx_sw_bpm_trigger_exec_instance | 否 | tenant_id=8, process_instance_id=256 | 264 | — |
| sw_iot_command | idx_sw_iot_cmd_flow | 否 | tenant_id=8, flow_instance_id=256 | 264 | — |
| sw_iot_command_reservation | uk_sw_iot_reservation_instance | 是 | tenant_id=8, process_instance_id=256 | 264 | — |
| sw_iot_connection | uk_sw_iot_conn_code | 是 | tenant_id=8, code=256 | 264 | — |
| sw_iot_device | idx_sw_iot_device_key | 否 | tenant_id=8, device_key=256 | 264 | — |
| sw_iot_device_command | idx_sw_iot_cmd_device | 否 | tenant_id=8, device_key=256 | 264 | — |
| sw_iot_device_command | idx_sw_iot_cmd_biz | 否 | tenant_id=8, approval_biz_id=256 | 264 | — |
| sw_iot_event_rule | uk_sw_iot_rule_code | 是 | tenant_id=8, code=256 | 264 | — |
| sw_iot_product | uk_sw_iot_product_code | 是 | tenant_id=8, code=256 | 264 | — |
| sw_iot_script | uk_sw_iot_script_code | 是 | tenant_id=8, code=256 | 264 | — |
| sw_bpm_instance | idx_sw_bpm_inst_process_inst | 否 | process_instance_id=256 | 256 | — |
| sw_bpm_instance_intervention | idx_sw_bpm_itv_instance | 否 | process_instance_id=256 | 256 | — |
| sw_bpm_node_function_audit | idx_sw_bpm_fn_audit_instance | 否 | process_instance_id=256 | 256 | — |
| sw_bpm_urge_record | idx_sw_bpm_urge_instance | 否 | process_instance_id=256 | 256 | — |
| sw_openapi_app | uk_sw_openapi_app | 是 | app_id=256 | 256 | — |
| sys_sso_audit_record | idx_sys_sso_audit_query | 否 | tenant_id=8, provider=80, event_type=160, create_time=8 | 256 | — |
| sys_tenant | uk_sys_tenant_creation_request | 是 | creation_request_id=256 | 256 | — |
| sys_role | uk_sys_role_tenant_code | 是 | tenant_id=8, code=200, deleted=2 | 210 | — |
| sys_user | uk_sys_user_tenant_username | 是 | tenant_id=8, username=200, deleted=2 | 210 | — |
| sys_role | uk_sys_role_tenant_code | 是 | tenant_id=8, code=200 | 208 | — |
| sys_dict_type | uk_sys_dict_type_code | 是 | code=200, deleted=2 | 202 | — |
| sys_tenant | uk_sys_tenant_code | 是 | code=200, deleted=2 | 202 | — |
| sys_user | uk_sys_user_username | 是 | username=200, deleted=2 | 202 | — |
| sys_dict_data | idx_sys_dict_data_dict_code | 否 | dict_code=200 | 200 | — |
| sys_dict_type | uk_sys_dict_type_code | 是 | code=200 | 200 | — |
| sys_role | uk_sys_role_code | 是 | code=200 | 200 | — |
| sys_tenant | uk_sys_tenant_code | 是 | code=200 | 200 | — |
| sys_user | uk_sys_user_username | 是 | username=200 | 200 | — |
| sw_notify_subject_binding | uk_sw_notify_subject_binding | 是 | tenant_id=8, user_id=8, provider=160, deleted=2 | 178 | — |
| sw_notify_channel_config | uk_sw_notify_channel | 是 | tenant_id=8, channel=160, deleted=2 | 170 | — |
| sw_notify_subject_binding | idx_sw_notify_subject_provider | 否 | tenant_id=8, provider=160, deleted=2 | 170 | — |
| sw_notify_rule | idx_sw_notify_rule_event | 否 | tenant_id=8, event_type=160 | 168 | — |
| sw_form_app_user | uk_sw_form_app_user | 是 | tenant_id=8, app_id=144, user_id=8 | 160 | — |
| sw_form_txn_invocation | idx_sw_form_txn_inv_time | 否 | tenant_id=8, action_id=144, create_time=8 | 160 | — |
| sw_form_txn_ledger | idx_sw_form_txn_ledger_action | 否 | tenant_id=8, action_id=144, create_time=8 | 160 | — |
| sw_form_app_dir | idx_sw_form_app_dir_app | 否 | tenant_id=8, app_id=144, deleted=2, sort_no=4 | 158 | — |
| sw_form_txn_action_version | uk_sw_form_txn_action_ver | 是 | tenant_id=8, action_id=144, version_no=4 | 156 | — |
| sw_form_app_scope | idx_sw_form_app_scope_app | 否 | tenant_id=8, app_id=144, deleted=2 | 154 | — |
| sw_form_def | idx_sw_form_def_app | 否 | tenant_id=8, app_id=144, deleted=2 | 154 | — |
| sw_bpm_resource_usage | uk_sw_bpm_resource_usage_scope | 是 | scope=64, scope_key=8, segment=80 | 152 | — |
| sw_form_c1_policy | uk_sw_form_c1_policy_form | 是 | tenant_id=8, form_id=144 | 152 | — |
| sw_form_txn_ledger | idx_sw_form_txn_ledger_res | 否 | tenant_id=8, reservation_id=144 | 152 | — |
| sw_agent_graph_execution_request | idx_sw_agent_exec_req_status | 否 | tenant_id=8, status=128, create_time=8 | 144 | — |
| sw_bpm_instance | idx_sw_bpm_inst_business_key | 否 | business_key=144 | 144 | — |
| sys_sso_user_binding | uk_sys_sso_binding_user | 是 | provider=80, tenant_id=8, user_id=8, deleted=2 | 98 | — |
| sw_bpm_authorize_rule | idx_sw_bpm_authorize_agent | 否 | tenant_id=8, agent_id=8, status=80 | 96 | — |
| sw_bpm_process_def_version | idx_sw_bpm_def_version_status | 否 | tenant_id=8, def_id=8, status=80 | 96 | — |
| sw_form_txn_reservation | idx_sw_form_txn_res_expire | 否 | tenant_id=8, status=80, expires_at=8 | 96 | — |
| sys_tenant_status_audit | uk_sys_tenant_status_audit_expiry | 是 | tenant_id=8, action=80, expire_time=8 | 96 | — |
| sys_sso_provider_config | uk_sys_sso_provider_config | 是 | tenant_id=8, provider=80, deleted=2 | 90 | — |
| sw_bpm_command_batch_item | idx_sw_bpm_command_batch_item_status | 否 | batch_id=8, status=80 | 88 | — |
| sw_bpm_instance | idx_sw_bpm_inst_tenant_status | 否 | tenant_id=8, status=80 | 88 | — |
| sw_bpm_process_template | idx_sw_bpm_tpl_scope | 否 | scope_type=80, scope_dept_id=8 | 88 | — |
| sw_bpm_task_deadline | idx_sw_bpm_deadline_due | 否 | run_state=80, due_at=8 | 88 | — |
| sw_iot_command_reservation | idx_sw_iot_reservation_status | 否 | status=80, due_at_utc=8 | 88 | — |
| sw_iot_device_command | idx_iot_command_expiry | 否 | expiry_time=8, status=80 | 88 | — |
| sw_iot_process_trigger | idx_sw_iot_trigger_recovery | 否 | status=80, next_retry_time=8 | 88 | — |
| sw_notify_message | idx_sw_notify_msg_delivery | 否 | tenant_id=8, delivery_status=80 | 88 | — |
| sw_openapi_callback_task | idx_sw_openapi_cb_task_due | 否 | status=80, next_retry_time=8 | 88 | — |
| sw_bpm_command | idx_sw_bpm_command_dispatch | 否 | status=8, channel=64, next_retry_at=8 | 80 | — |
| sw_bpm_resource_policy | idx_sw_bpm_resource_policy_status | 否 | status=80 | 80 | — |
| sys_post_delegate | idx_sys_post_delegate_source | 否 | tenant_id=8, source_post_id=8, status=64 | 80 | — |
| sw_bpm_approval_action | uk_sw_bpm_approval_task_actor_action | 是 | tenant_id=8, task_id=8, actor_id=8, action=8 | 32 | — |
| sw_agent_graph_execution_event | idx_sw_agent_exec_event_replay | 否 | tenant_id=8, execution_id=8, sequence_no=8, deleted=2 | 26 | — |
| sw_knowledge_chunk | idx_sw_knowledge_chunk_kb | 否 | tenant_id=8, kb_id=8, document_id=8, deleted=2 | 26 | — |
| sys_role_menu | uk_sys_role_menu_tenant | 是 | tenant_id=8, role_id=8, menu_id=8, deleted=2 | 26 | — |
| sys_user_group_member | uk_sys_user_group_member | 是 | tenant_id=8, group_id=8, user_id=8, deleted=2 | 26 | — |
| sys_user_post | uk_sys_user_post | 是 | tenant_id=8, user_id=8, post_id=8, deleted=2 | 26 | — |
| sys_user_role | uk_sys_user_role_tenant | 是 | tenant_id=8, user_id=8, role_id=8, deleted=2 | 26 | — |
| sw_agent_graph_execution_event | uk_sw_agent_exec_event_seq | 是 | tenant_id=8, execution_id=8, sequence_no=8 | 24 | — |
| sw_bpm_approval_action | uk_sw_bpm_approval_task_actor | 是 | tenant_id=8, task_id=8, actor_id=8 | 24 | — |
| sw_bpm_draft | idx_sw_bpm_draft_owner | 否 | tenant_id=8, create_by=8, form_key=8 | 24 | — |
| sw_bpm_process_favorite | idx_sw_bpm_process_favorite_user | 否 | tenant_id=8, user_id=8, update_time=8 | 24 | — |
| sw_iot_command | idx_sw_iot_cmd_dev | 否 | tenant_id=8, device_id=8, create_time=8 | 24 | — |
| sw_iot_event_record | idx_sw_iot_event_dev | 否 | tenant_id=8, device_id=8, occur_time=8 | 24 | — |
| sw_iot_script_exec | idx_sw_iot_exec_script | 否 | tenant_id=8, script_id=8, create_time=8 | 24 | — |
| sys_role_menu | uk_sys_role_menu_tenant | 是 | tenant_id=8, role_id=8, menu_id=8 | 24 | — |
| sys_user_role | uk_sys_user_role_tenant | 是 | tenant_id=8, user_id=8, role_id=8 | 24 | — |
| sw_agent_graph_snapshot | uk_sw_agent_graph_snapshot_ver | 是 | tenant_id=8, graph_def_id=8, def_version=4 | 20 | — |
| sw_bpm_process_def_version | uk_sw_bpm_def_version | 是 | tenant_id=8, def_id=8, graph_version=4 | 20 | — |
| sw_iot_script_version | uk_sw_iot_script_ver | 是 | tenant_id=8, script_id=8, script_version=4 | 20 | — |
| sw_iot_thing_model | uk_sw_iot_model_ver | 是 | tenant_id=8, product_id=8, model_version=4 | 20 | — |
| sw_notify_template_version | uk_sw_notify_tpl_ver | 是 | tenant_id=8, template_id=8, template_version=4 | 20 | — |
| sw_agent_graph_execution | idx_sw_agent_gexec_time | 否 | tenant_id=8, create_time=8, deleted=2 | 18 | — |
| sw_knowledge_document | idx_sw_knowledge_doc_kb | 否 | tenant_id=8, kb_id=8, deleted=2 | 18 | — |
| sys_user_group_member | idx_sys_user_group_member_group | 否 | tenant_id=8, group_id=8, deleted=2 | 18 | — |
| sys_user_group_member | idx_sys_user_group_member_user | 否 | tenant_id=8, user_id=8, deleted=2 | 18 | — |
| sys_user_post | idx_sys_user_post_user | 否 | tenant_id=8, user_id=8, deleted=2 | 18 | — |
| sys_user_post | idx_sys_user_post_post | 否 | tenant_id=8, post_id=8, deleted=2 | 18 | — |
| sys_user_post | idx_sys_user_post_dept | 否 | tenant_id=8, dept_id=8, deleted=2 | 18 | — |
| sw_agent_model | idx_sw_agent_model_provider | 否 | tenant_id=8, provider_id=8 | 16 | — |
| sw_bpm_action_ref | idx_sw_bpm_action_ref_exec | 否 | tenant_id=8, exec_id=8 | 16 | — |
| sw_bpm_child_item | idx_sw_bpm_child_item_batch | 否 | tenant_id=8, batch_id=8 | 16 | — |
| sw_bpm_command | idx_sw_bpm_command_deadline | 否 | status=8, deadline_at=8 | 16 | — |
| sw_bpm_command | idx_sw_bpm_command_resource_open | 否 | resource_released_at=8, status=8 | 16 | — |
| sw_bpm_handover | idx_sw_bpm_handover_users | 否 | from_user_id=8, to_user_id=8 | 16 | — |
| sw_bpm_participant_snapshot | idx_sw_bpm_participant_task | 否 | tenant_id=8, task_id=8 | 16 | — |
| sw_bpm_resource_reject_log | idx_sw_bpm_resource_reject_tenant_time | 否 | tenant_id=8, create_time=8 | 16 | — |
| sw_iot_event_rule | idx_sw_iot_rule_device | 否 | tenant_id=8, device_id=8 | 16 | — |
| sw_iot_process_trigger | idx_sw_iot_trigger_agent_exec | 否 | tenant_id=8, agent_execution_id=8 | 16 | — |
| sw_notify_message | idx_sw_notify_msg_recipient | 否 | tenant_id=8, recipient_id=8 | 16 | — |
| sys_post_delegate | idx_sys_post_delegate_dept | 否 | tenant_id=8, dept_id=8 | 16 | — |
| sys_refresh_token | idx_srt_user_tenant | 否 | user_id=8, tenant_id=8 | 16 | — |
| sys_role_dept | uk_sys_role_dept | 是 | role_id=8, dept_id=8 | 16 | — |
| sys_role_menu | uk_sys_role_menu | 是 | role_id=8, menu_id=8 | 16 | — |
| sys_tenant_status_audit | idx_sys_tenant_status_audit_tenant_time | 否 | tenant_id=8, occurred_at=8 | 16 | — |
| sys_user_role | uk_sys_user_role | 是 | user_id=8, role_id=8 | 16 | — |
| sys_user_workspace | uk_sys_user_workspace | 是 | tenant_id=8, user_id=8 | 16 | — |
| sw_agent_graph_debug_node | idx_genode_debug | 否 | debug_session_id=8, node_seq=4, deleted=2 | 14 | — |
| sw_agent_graph_execution_node | idx_sw_agent_genode_exec | 否 | execution_id=8, node_seq=4, deleted=2 | 14 | — |
| sw_agent_message | idx_sw_agent_msg_session | 否 | session_id=8, msg_order=4, deleted=2 | 14 | — |
| sw_form_app | idx_sw_form_app_tenant | 否 | tenant_id=8, deleted=2, sort_no=4 | 14 | — |
| sw_bpm_resource_policy | uk_sw_bpm_resource_policy_version | 是 | tenant_id=8, policy_version=4 | 12 | — |
| sys_user_group | idx_sys_user_group_status | 否 | tenant_id=8, status=2, deleted=2 | 12 | — |
| sw_agent_graph_debug_session | idx_gexec_debug_graph | 否 | graph_def_id=8, deleted=2 | 10 | — |
| sw_agent_graph_def | idx_sw_agent_graph_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_agent_graph_execution | idx_sw_agent_gexec_graph | 否 | graph_def_id=8, deleted=2 | 10 | — |
| sw_agent_graph_snapshot | idx_sw_agent_graph_snapshot_def | 否 | graph_def_id=8, deleted=2 | 10 | — |
| sw_agent_model | idx_sw_agent_model_td | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_agent_model_config | idx_sw_agent_model_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_agent_provider | idx_sw_agent_provider_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_agent_session | idx_sw_agent_session_cfg | 否 | agent_model_config_id=8, deleted=2 | 10 | — |
| sw_agent_tool_call_log | idx_sw_agent_tcl_session | 否 | session_id=8, deleted=2 | 10 | — |
| sw_agent_tool_external | idx_sw_agent_tool_external_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_agent_tool_external | idx_sw_agent_tool_external_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_agent_tool_internal | idx_sw_agent_tool_internal_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_job_info | idx_sw_job_info_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_job_log | idx_sw_job_log_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_knowledge_base | idx_sw_knowledge_base_tenant | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_notify_template | idx_sw_notify_template_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_storage_file | idx_sw_storage_file_tenant_deleted | 否 | tenant_id=8, deleted=2 | 10 | — |
| sw_agent_graph_debug_session | idx_gexec_debug_expires | 否 | expires_at=8 | 8 | — |
| sw_bpm_command_batch | idx_sw_bpm_command_batch_cmd | 否 | command_id=8 | 8 | — |
| sw_bpm_ext_sql_execution_audit | idx_sw_bpm_ext_audit_ds_id | 否 | datasource_id=8 | 8 | — |
| sw_bpm_ext_sql_execution_audit | idx_sw_bpm_ext_audit_operator_id | 否 | operator_id=8 | 8 | — |
| sw_bpm_ext_sql_execution_audit | idx_sw_bpm_ext_audit_create_time | 否 | create_time=8 | 8 | — |
| sw_bpm_handover_item | idx_sw_bpm_handover_item | 否 | handover_id=8 | 8 | — |
| sw_form_app_import_record | idx_sw_form_app_import_record_tenant | 否 | tenant_id=8 | 8 | — |
| sw_job_log | idx_sw_job_log_job_id | 否 | job_id=8 | 8 | — |
| sw_notify_send_attempt | idx_sw_notify_attempt_message | 否 | message_id=8 | 8 | — |
| sw_notify_template_version | idx_sw_notify_tpl_ver_template | 否 | template_id=8 | 8 | — |
| sys_dept | idx_sys_dept_parent_id | 否 | parent_id=8 | 8 | — |
| sys_menu | idx_sys_menu_parent_id | 否 | parent_id=8 | 8 | — |
| sys_sso_auth_state | idx_sys_sso_state_expire | 否 | expire_at=8 | 8 | — |
| sys_sso_user_binding | idx_sys_sso_binding_user_all | 否 | user_id=8 | 8 | — |
| sys_user | idx_sys_user_dept_id | 否 | dept_id=8 | 8 | — |

## 6. TEXT/JSONB 默认值

| 位置 | 写法 | 风险 |
|---|---|---|
| `V0.2.0__baseline_seed.sql:4415` `sys_workspace_card_type.metadata_json` | `text not null default '{}'` | MySQL 5.7 的 TEXT/BLOB/JSON 列不允许非 NULL 默认值；Oracle CLOB 默认值也受限。建议 MySQL 用 `VARCHAR(4000) NOT NULL DEFAULT '{}'`（该列是卡片元数据，长度有限），Oracle 用 `VARCHAR2(4000 CHAR)` 或改由应用写入默认值 |
| `V0.2.0__baseline_seed.sql` 1072/1074/1119/1124/1125 | `TEXT DEFAULT NULL` | MySQL 5.7 对 TEXT 的显式 `DEFAULT NULL` 可能拒绝；阶段 B 实测，必要时删除 `DEFAULT NULL`（隐式可空）或改 LONGTEXT |

## 7. 宽表行大小

- `sw_bpm_task_opinion_draft` 的 `VARCHAR(20000)` 在 utf8mb4 下约 80,000 字节，超过 MySQL 单行 65,535 字节上限；该列必须改 `LONGTEXT`，Oracle/达梦改 `CLOB`，SQL Server 改 `NVARCHAR(MAX)`。
- 其余表的宽列合计未超过 65,535 字节；`VARCHAR(1000)` 按 4,000 字节估算，属于 Oracle `VARCHAR2(1000 CHAR)` 的上限值。
