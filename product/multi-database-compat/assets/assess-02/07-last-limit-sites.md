# B0 证据：129 处 `.last("LIMIT …")` 站点

共 129 处。

| # | 文件:行 | 片段 |
|---:|---|---|
| 1 | sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphDefServiceImpl.java:200 | `.last("LIMIT 1"));` |
| 2 | sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionLifecycleServiceImpl.java:153 | `.last("LIMIT 1"));` |
| 3 | sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionLifecycleServiceImpl.java:192 | `.last("LIMIT 500"))` |
| 4 | sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphSnapshotServiceImpl.java:55 | `.last("LIMIT 1"));` |
| 5 | sw-basic/sw-basic-iot/src/dev/java/com/sw/ck/iot/provider/LoopbackPeerProvider.java:105 | `.last("LIMIT 1"));` |
| 6 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/agentbridge/AgentExecutionOutcomeListener.java:76 | `.last("LIMIT 1"));` |
| 7 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceMqttDispatchService.java:71 | `.last("limit 1"));` |
| 8 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceMqttDispatchService.java:92 | `.last("limit 1"));` |
| 9 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotProcessTriggerFacadeImpl.java:32 | `.last("limit 1"));` |
| 10 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotEventRuleController.java:137 | `.last("limit 100")));` |
| 11 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java:134 | `wrapper.orderByDesc(IotMessageLog::getCreateTime).last("limit 200");` |
| 12 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java:146 | `wrapper.orderByDesc(IotPropertyRecord::getReportTime).last("limit 200");` |
| 13 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java:156 | `wrapper.orderByDesc(IotEventRecord::getOccurTime).last("limit 200");` |
| 14 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java:170 | `wrapper.orderByDesc(IotCommand::getCreateTime).last("limit 200");` |
| 15 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java:180 | `wrapper.orderByDesc(IotScriptExec::getCreateTime).last("limit 200");` |
| 16 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java:190 | `wrapper.orderByDesc(IotProcessTrigger::getCreateTime).last("limit 200");` |
| 17 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/ProcessTriggerRecoveryJob.java:98 | `.last("LIMIT " + MAX_BATCH));` |
| 18 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/ProcessTriggerRecoveryJob.java:129 | `.last("LIMIT " + MAX_BATCH));` |
| 19 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotCommandReservationMapper.java:22 | `.last("LIMIT 1"));` |
| 20 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotCommandReservationMapper.java:32 | `.last("LIMIT 50"));` |
| 21 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotCommandReservationMapper.java:41 | `.last("LIMIT 100"));` |
| 22 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mqtt/MqttDownlinkPublisher.java:70 | `.last("limit 1"));` |
| 23 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/ScriptEngineService.java:261 | `.last("limit " + Math.max(1, Math.min(limit, 200))));` |
| 24 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/ScriptHostFunctions.java:106 | `.last("limit 1"));` |
| 25 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/ScriptHostFunctions.java:168 | `.last("limit 1"));` |
| 26 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/ScriptHostFunctions.java:187 | `.last("limit 1"));` |
| 27 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotScriptService.java:65 | `.last("limit 1"));` |
| 28 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/MessageIngestService.java:179 | `.last("limit 1"));` |
| 29 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/MessageIngestService.java:365 | `.last("limit 1"));` |
| 30 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/RuleEngineService.java:389 | `.last("LIMIT " + limit));` |
| 31 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/CommandQueueServiceImpl.java:298 | `.last("LIMIT " + Math.max(1, limit)));` |
| 32 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/CommandQueueServiceImpl.java:313 | `.last("LIMIT " + Math.max(1, limit)));` |
| 33 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/CommandQueueServiceImpl.java:329 | `.last("LIMIT " + Math.max(1, limit)));` |
| 34 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java:96 | `.last("limit 1")` |
| 35 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java:112 | `.last("LIMIT 1"));` |
| 36 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java:161 | `.last("LIMIT 1"));` |
| 37 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java:206 | `.last("LIMIT 1"));` |
| 38 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java:329 | `.last("LIMIT 1"));` |
| 39 | sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/impl/JobLogServiceImpl.java:48 | `.last("LIMIT 1")` |
| 40 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/controller/NotifyTemplateController.java:181 | `.last("LIMIT 1")` |
| 41 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyDeliveryRecoveryServiceImpl.java:75 | `.last("LIMIT " + MAX_BATCH));` |
| 42 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyDeliveryRecoveryServiceImpl.java:100 | `.last("LIMIT " + MAX_BATCH));` |
| 43 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyDeliveryRecoveryServiceImpl.java:129 | `.last("LIMIT " + MAX_BATCH));` |
| 44 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyMessageServiceImpl.java:363 | `.last("LIMIT 1"));` |
| 45 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyRecordServiceImpl.java:239 | `.last("LIMIT 1"));` |
| 46 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyRoutingServiceImpl.java:124 | `.last("LIMIT 1"));` |
| 47 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyTemplateVersionServiceImpl.java:33 | `.last("LIMIT 1"));` |
| 48 | sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyTemplateVersionServiceImpl.java:72 | `.last("LIMIT 1"));` |
| 49 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormAppBundleService.java:238 | `.last("LIMIT 1"));` |
| 50 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormAppBundleService.java:241 | `.last("LIMIT 1"));` |
| 51 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormAppBundleService.java:361 | `.last("LIMIT 1"));` |
| 52 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormAppBundleService.java:2064 | `.last("LIMIT 1"));` |
| 53 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormAppBundleService.java:2074 | `.last("LIMIT 1"));` |
| 54 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormAppBundleService.java:2136 | `.last("LIMIT 1"));` |
| 55 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataDeleteService.java:290 | `.last("LIMIT 1"));` |
| 56 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataWritebackFacadeImpl.java:70 | `.last("limit 1"));` |
| 57 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataWritebackFacadeImpl.java:98 | `.last("limit 1"));` |
| 58 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormExtDataService.java:250 | `.last("LIMIT 1"));` |
| 59 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormExtDataService.java:257 | `.last("LIMIT 1"));` |
| 60 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormExtDataService.java:348 | `.last("LIMIT 1"));` |
| 61 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormFieldEnrichmentService.java:229 | `.last("LIMIT 1"));` |
| 62 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormSubmitService.java:350 | `.last("LIMIT 1"));` |
| 63 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/txn/port/FormTxnActionPortImpl.java:59 | `.last("LIMIT 1"));` |
| 64 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/txn/port/FormTxnActionPortImpl.java:125 | `.last("LIMIT " + Math.min(limit, 200)))` |
| 65 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/txn/service/TxnActionService.java:240 | `.last("LIMIT 1"));` |
| 66 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/txn/service/TxnReservationExpiryJob.java:58 | `.last("LIMIT " + MAX_BATCH));` |
| 67 | sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/job/OpenApiCallbackRecoveryJob.java:96 | `.last("LIMIT " + MAX_BATCH));` |
| 68 | sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/job/OpenApiCallbackRecoveryJob.java:136 | `.last("LIMIT " + MAX_BATCH));` |
| 69 | sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/job/OpenApiCallbackRecoveryJob.java:201 | `.last("LIMIT 1"));` |
| 70 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/ManagementTenantContext.java:72 | `return tenants.selectList(query.orderByAsc(SysTenant::getId).last("LIMIT 200"))` |
| 71 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SystemOrgScriptService.java:75 | `.last("LIMIT " + MAX_USERS));` |
| 72 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/TenantAdminService.java:223 | `.last("LIMIT 50"))` |
| 73 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/TenantAdminService.java:417 | `.last("LIMIT 1"));` |
| 74 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/TenantStatusAuditJob.java:41 | `.last("LIMIT " + MAX_BATCH));` |
| 75 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/PositionDelegateFacadeImpl.java:101 | `.last("limit 1"));` |
| 76 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/PositionDelegateFacadeImpl.java:161 | `.last("limit 1"));` |
| 77 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/PositionDelegateFacadeImpl.java:171 | `.last("limit 1"));` |
| 78 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/UserFacadeImpl.java:66 | `.last("LIMIT " + safeLimit));` |
| 79 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/UserFacadeImpl.java:97 | `.last("LIMIT " + safeLimit));` |
| 80 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/sso/SsoAuthService.java:878 | `.last("LIMIT 1"));` |
| 81 | sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/sso/SsoAuthService.java:1319 | `.last("LIMIT " + safeSize + " OFFSET " + (long) Math.max(page, 0) * safeSize);` |
| 82 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/config/DynamicBranchPortConfiguration.java:195 | `.last("LIMIT 1"));` |
| 83 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/config/DynamicBranchPortConfiguration.java:209 | `.last("LIMIT 1"));` |
| 84 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/config/DynamicBranchPortConfiguration.java:229 | `.last("LIMIT 1"));` |
| 85 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/config/DynamicBranchPortConfiguration.java:275 | `.last("LIMIT 1"));` |
| 86 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmCommandController.java:160 | `.last("LIMIT 1")` |
| 87 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmCommandController.java:204 | `.last("LIMIT 1")` |
| 88 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmMyInstanceController.java:103 | `.last("LIMIT " + pageParam.getPageSize()` |
| 89 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmMyInstanceController.java:315 | `.last("LIMIT 1")` |
| 90 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTaskOpinionDraftController.java:130 | `.last("LIMIT 1"));` |
| 91 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/WorkflowAttachmentController.java:119 | `.last("LIMIT 1")` |
| 92 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/WorkflowAttachmentController.java:175 | `.last("LIMIT 1")` |
| 93 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/WorkflowAttachmentController.java:255 | `.last("LIMIT 1"));` |
| 94 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/job/BpmInstanceStateSyncJob.java:76 | `.last("LIMIT " + MAX_BATCH));` |
| 95 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmIotReservationIntentRecorder.java:70 | `.last("LIMIT 1"));` |
| 96 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmIotReservationIntentRecorder.java:77 | `.last("LIMIT 1"));` |
| 97 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/notify/BpmNotifyLinkAuthorizer.java:63 | `.eq(BpmInstance::getProcessInstanceId, processInstanceId).last("LIMIT 1"));` |
| 98 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/notify/BpmNotifyLinkAuthorizer.java:73 | `.last("LIMIT 1"));` |
| 99 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/notify/BpmNotifyLinkAuthorizer.java:80 | `.last("LIMIT 1"));` |
| 100 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/notify/BpmNotifyLinkAuthorizer.java:90 | `.last("LIMIT 1"));` |
| 101 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:88 | `.last("LIMIT 1")` |
| 102 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:133 | `.last("LIMIT 1")` |
| 103 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:190 | `.last("LIMIT " + slice)` |
| 104 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:471 | `.last("LIMIT 200")` |
| 105 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:514 | `.last("LIMIT 200")` |
| 106 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:542 | `.last("LIMIT 1")` |
| 107 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:560 | `.last("LIMIT " + Math.max(1, limit)));` |
| 108 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/ResourceAssuranceReconcileJob.java:94 | `.last("LIMIT " + LIGHT_RELEASE_LIMIT)` |
| 109 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:102 | `.last("limit " + capped(limit)));` |
| 110 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:118 | `.last("limit " + capped(limit)));` |
| 111 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/ChildOrchestrationService.java:195 | `.last("limit 1"));` |
| 112 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/ChildOrchestrationService.java:227 | `.last("limit 1"));` |
| 113 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/CommandSyncWaiter.java:74 | `.last("LIMIT 1")` |
| 114 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/LightProcessClassifier.java:51 | `.last("LIMIT 1"));` |
| 115 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/NodeFormDataService.java:144 | `.last("limit 1"));` |
| 116 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/NodeFormDataService.java:166 | `.last("limit 1")));` |
| 117 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/ResourceAdmissionService.java:282 | `.last("LIMIT 1"));` |
| 118 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/TaskDeadlineScheduler.java:102 | `.last("LIMIT 50"));` |
| 119 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/TriggerExecutionService.java:648 | `.last("limit 1")));` |
| 120 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalActionServiceImpl.java:22 | `return lambdaQuery().eq(ApprovalActionRecord::getTaskId, taskId).last("LIMIT 1").one();` |
| 121 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalActionServiceImpl.java:37 | `.last("LIMIT " + limit + " OFFSET " + offset)` |
| 122 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalActionServiceImpl.java:55 | `.last("LIMIT 1")` |
| 123 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmCatalogServiceImpl.java:218 | `.last("LIMIT 1")` |
| 124 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmCopyQueryServiceImpl.java:92 | `.last("LIMIT 1")` |
| 125 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmUrgeServiceImpl.java:165 | `.last("LIMIT 1"))` |
| 126 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ResourcePolicyServiceImpl.java:99 | `.last("LIMIT 1"))` |
| 127 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/TxnBatchServiceImpl.java:102 | `.last("LIMIT 1"));` |
| 128 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/TxnBatchServiceImpl.java:194 | `.last("LIMIT 1"));` |
| 129 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/tool/AgentProcessQueryTool.java:67 | `.last("LIMIT " + limit);` |
