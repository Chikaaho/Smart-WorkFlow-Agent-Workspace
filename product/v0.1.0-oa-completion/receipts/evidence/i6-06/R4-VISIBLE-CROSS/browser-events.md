# R4 visible cross-channel evidence

- Browser: Codex In-app Browser, visible tab 5; headless=false.
- Fixed message: `2099530783065350145`; `read=true`; `linkType=WF_PROCESS`; instance/link id `8c752756-b056-11f1-a6e0-00ffa7734675`; business `WF_APPROVED`; title `您的申请已通过`.
- PC `T100管理员` opened `/inbox`; the fixed row was visible as read and its `跳转` action was present. Media: `browser-media/R4-pc-positive-inbox.webp`.
- The same row was opened in a visible 375x800 H5 viewport. The detail page showed the same instance id, status `APPROVED`, initiator `10001`, form key `i6g1a_form_t100b`, and trace. Media: `browser-media/R4-h5-message-instance.webp`.
- H5 reload was performed visibly and the same detail remained readable. Media: `browser-media/R4-h5-refresh-instance.webp`.
- No-rights identity `u3_100` opened the fixed instance route in both visible PC and H5 flows; both ended at `/403` with `403 / 无权限访问`. Media: `browser-media/R4-pc-negative-403.webp` and `browser-media/R4-h5-negative-403.webp`.

## Media

- `browser-media/R4-pc-positive-inbox.webp`
- `browser-media/R4-h5-message-instance.webp`
- `browser-media/R4-h5-refresh-instance.webp`
- `browser-media/R4-pc-negative-403.webp`
- `browser-media/R4-h5-negative-403.webp`
