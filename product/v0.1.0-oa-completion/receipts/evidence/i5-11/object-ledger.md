# i5-11 对象账本（G8-OWNER-HANDOFF 固化）

> 执行轮：iteration-11；执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-10.md`
> 本轮零业务代码修改；server 工作树 `486b1116eb6016024c8e1e4a00b50244af2f3cb5` 与 iteration-10 一致（增量仅在仓外 product 证据）。

## G8-HANDOFF-READBACK（[handoff-readback.raw](handoff-readback.raw)，工具机械生成）

- **样例字段级回读**（provider-config-example.yml）：
  - 系统 3 键各带 `__SET_ME__` 哨兵：`SW_SSO_CIPHER_KEY` / `SW_SSO_CALLBACK_BASE_URL` / `SW_SSO_CALLBACK_ALLOWLIST`（A1 段，行 15/19/23）。
  - 三 Provider 行模板逐行回读（A2 段，行 32—34）：WECOM/FEISHU/DINGTALK 均 `enabled=0`、`app_secret_enc=NULL`、app_id 占位、redirect_path='/workspace'；WECOM extra 含 agentId 占位。
  - 哨兵清单 7 项（A5 段）；app_secret_enc 相关行仅密文说明与 NULL（A4 段）。
  - 计数注记：文件内 `enabled=1` 命中 1 处为 §3「启用（enabled=1）时…」说明文字，非启用的行模板。
- **手册章节级回读**（owner-acceptance-handbook.md）：
  - 章节标题 §0—§6 全量（B1 段）。
  - 要素覆盖行（B2 段）：系统 3 配置键、HTTPS 回调路径与白名单、三 Provider 控制台项（授权回调域/重定向 URL）、启用顺序（enabled=0→enabled=1 与 fail-fast）、绑定（authorize/bind-candidate/bindings）、已绑定登录（authorize-login/ticket）、解绑（unbind）、失败恢复、清理与问题定位、安全红线、无 HTTP 管理端点事实。
- **飞书修改文件回读**（C 段）：`FeishuSsoProviderClient.java` 行 43/46 含 `response_type=code`。
- **回读秘密检查**（D 段）：`NO-HITS`。

## G8-HANDOFF-MANIFEST（[g8-handoff-manifest.sha256](g8-handoff-manifest.sha256)）

逐路径覆盖 5 类对象（工具生成、排除自身、非手抄），从工作区根 `sha256sum -c` 全部 OK、exit=0（[g8-handoff-verify.stdout](g8-handoff-verify.stdout)）：

| 对象 | 路径 |
|---|---|
| Owner 手册 | Smart-WorkFlow-aPaaS-server/docs/sso/owner-acceptance-handbook.md |
| 配置样例 | Smart-WorkFlow-aPaaS-server/docs/sso/provider-config-example.yml |
| 飞书修复 | Smart-WorkFlow-aPaaS-server/sw-biz/.../sso/FeishuSsoProviderClient.java |
| 回读证据 | product/.../evidence/i5-11/handoff-readback.raw |
| 最终指纹 | product/.../evidence/i5-11/g8-handoff-fingerprint.raw |

最终 tree 指纹：`486b1116eb6016024c8e1e4a00b50244af2f3cb5`（与 iteration-10 一致；manifest 校验后候选无漂移——证据文件在仓外 product，不改变 server tree）。

## 边界

- 未重跑 SsoAuthServiceTest / system-biz 回归 / 官方文档对照（审查 10 已锁定）；未修改业务实现；未外部调用；未写 I5 `PASSED/COMPLETED`。
- G8-WECOM / G8-FEISHU / G8-DINGTALK 真实链保持 `WAIT_OWNER_ACCEPTANCE`。
