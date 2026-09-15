# R8 external availability object ledger

- API object: `GET http://127.0.0.1:8080/api/notify/channels` under the real T100 administrator session; output contains no token, password, phone, or provider secret.
- Source configuration object: `sw.notify.channels.<CHANNEL>` in `NotifyChannelProperties` and the startup validator; values are represented only as `PRESENT` or `ABSENT`.
- SMS: required keys `provider`, `endpoint`; no production SMS adapter class; Owner provider selection, account, credentials, and recipient are ABSENT.
- EMAIL: keys `host`, `port`, `starttls`, `from`, `username`, `password`; `EmailNotifyChannelAdapter` class PRESENT and conditional system configuration PRESENT; the active local SMTP endpoint is local-only; Owner external provider, account, credentials, and recipient are ABSENT.
- FEISHU: keys `app-id`, `app-secret`; `FeishuNotifyChannelAdapter` class PRESENT but effective configured adapter is ABSENT because the channel is not enabled; Owner app/account, credentials, and recipient are ABSENT.
- DINGTALK: keys `app-key`, `app-secret`, `agent-id`; `DingtalkNotifyChannelAdapter` class PRESENT but effective configured adapter is ABSENT because the channel is not enabled; Owner app/account, credentials, and recipient are ABSENT.
- WECHAT_WORK: keys `corp-id`, `corp-secret`, `agent-id`; `WeComNotifyChannelAdapter` class PRESENT but effective configured adapter is ABSENT because the channel is not enabled; Owner app/account, credentials, and recipient are ABSENT.
- No MINIO/COS storage configuration is used as a substitute for notification-channel availability.
