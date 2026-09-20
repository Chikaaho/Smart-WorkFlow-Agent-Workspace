# R3 visible admin evidence

- Browser: Codex In-app Browser, visible tab 5; headless=false.
- PC routes exercised: `/notify/template`, `/notify/channel`, `/notify/rule`, `/notify/record`.
- Identity: `T100管理员`; the fixed local/dev/test CAPTCHA configuration was used for login.
- Record under test: `2099530803114123265`; recipient `10001`; title `您的申请已通过`; business `WF_APPROVED`; channel `EMAIL`; final status `FAILED`.
- The record log was opened visibly and showed the record identity, channel, status, and mail delivery failures. The pre-retry visible log snapshot is `browser-media/R3-admin-record-log.webp`.
- The visible retry action was executed once. The UI toast was `重发结果：FAILED`; API readback showed the same business record and the delivery-attempt count changed from 8 to 9. The post-retry record page is `browser-media/R3-admin-record-after-retry.webp`.
- Template, channel, and rule pages were each opened visibly. The final visible rule state for `I6_R6_COPY_1789402118501` was enabled after the off/on update; no duplicate retry was performed.
- The no-rights identity `u3_100` opened `/notify/record` visibly and was routed to `/403` with `403 / 无权限访问`.

## Media

- `browser-media/R3-admin-template.webp`
- `browser-media/R3-admin-template-preview.webp`
- `browser-media/R3-admin-channel.webp`
- `browser-media/R3-admin-rule.webp`
- `browser-media/R3-admin-record-log.webp`
- `browser-media/R3-admin-record-after-retry.webp`
