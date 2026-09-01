# R1 加载竞争 · 输入与环境

- 环境：真实后端 `sw-bootstrap`（dev/H2，PID 20652，含 V47 权限迁移与方法级鉴权）+ `pnpm dev` 直连。
- 延迟注入：本地中间人代理 `:8081 → :8080`（`delay-proxy.mjs`），对表单 A 的
  `GET /api/form/def/{A}` 与 `GET /api/form/def/{A}/definition` 人为延迟 12000ms；
  响应体全部来自真实后端，仅传输层延迟。vite proxy 指向 `:8081`。
- 对象：
  - 表单 A：`2e73e69e-2290-49b7-9459-1443e8bc722d`（formKey `p52_r_form_a_1788279969533`，PUBLISHED V2）
  - 表单 B：`ef79c4e5-c859-4a0d-ac1f-b89fc5b30e5f`（formKey `p52_r_form_b_1788279969775`，PUBLISHED V2）
- 账号：admin（真实登录：challenge → 人工读图验证码 → RSA-OAEP 密文）。
- 预期：页面在 A 的响应返回前已成功进入 B；A 迟到返回后 B 的身份、版本、画布、tab、URL 完全不变。
