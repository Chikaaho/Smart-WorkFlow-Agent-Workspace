# R8 external availability actual result

- The real API availability probe returned HTTP 200 and application code 0.
- EMAIL is the only returned/configured channel in the local environment; it is tenant-enabled and has non-secret sender/config summary fields, but the local SMTP endpoint is not an Owner-provided external delivery account.
- SMS, FEISHU, DINGTALK, and WECHAT_WORK returned no configured channel row; their required external selection/credentials/account/recipient were not provided.
- The per-channel external delivery result is `EXTERNAL_BLOCKED`: no Owner-selected external provider, non-placeholder credentials, or test account/recipient was supplied for the five external delivery paths. The unblock conditions are to provide those channel-specific inputs, then rerun the real delivery and local readback.
