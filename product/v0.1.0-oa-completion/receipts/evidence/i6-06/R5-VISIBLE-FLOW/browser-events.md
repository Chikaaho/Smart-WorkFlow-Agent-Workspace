# R5 visible formal role-flow evidence

- Browser: Codex In-app Browser, visible tab 5; headless=false. Formal role actions were performed in the visible UI. The setup script was setup-only; the readback script/API was used only for deterministic setup/readback, not for role actions.
- Definition: `2099686286806409218`; process key `bpm_25abb15a82254bf6`; name `I6 R5 visible role flow 1789439195299`.
- Business key: `264cb225-8492-4f1d-a344-ee7c3d5ead38`; form key: `i6g1a_form_t100b`; instance: `f42ba34b-b0ac-11f1-b25f-00ffa7734675`; database instance id: `2099686432160014337`; final status: `APPROVED`.
- S1 visible workspace action: task `f4305e48-b0ac-11f1-b25f-00ffa7734675`, assignee user `10002`; clicked visible `审批通过`. Media: `browser-media/R5-s1-workspace.webp`.
- S2 visible workspace action: task `1b18d91f-b0ad-11f1-b25f-00ffa7734675`, original assignee `2099538680159641602`; clicked visible `委托`, target `2099538680528740353`, note `I6 R5 visible delegation`. Media: `browser-media/R5-s2-workspace.webp`.
- Delegatee visible workspace action: proxy `i6_r5_proxy_1789404003476`; clicked visible `审批通过`. Media: `browser-media/R5-delegatee-workspace.webp`.
- Admin visible instance trace showed the completed process and the two role trace rows: S1 `T100审批人`, S2 `I6 R5 second approver`. Media: `browser-media/R5-admin-flow-trace.webp`.
- No-rights identity `i6_r5_u0_visible_1789439195299` opened the fixed instance route visibly and reached `/403`; the same identity opened the original task route and the visible page showed `任务不存在`. Media: `browser-media/R5-U0-instance-403.png` and `browser-media/R5-U0-task-not-found.png`.
- Copy recipient `u3_100` opened visible `/workflow/my-cc`; the new flow appeared with form, process key, business key, node `n_copy`, `APPROVED`, `SUCCESS`, and copy time. The visible detail dialog showed the form snapshot, no active nodes, and the APPROVE/APPROVED plus DELEGATE/DELEGATED history. Media: `browser-media/R5-copy-readonly-trace.webp`.

## Media

- `browser-media/R5-s1-workspace.webp`
- `browser-media/R5-s2-workspace.webp`
- `browser-media/R5-delegatee-workspace.webp`
- `browser-media/R5-admin-flow-trace.webp`
- `browser-media/R5-copy-readonly-trace.webp`
- `browser-media/R5-U0-instance-403.png`
- `browser-media/R5-U0-task-not-found.png`
