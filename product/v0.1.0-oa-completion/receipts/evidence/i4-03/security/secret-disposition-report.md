# I4 iteration-03 证据包秘密扫描与处置报告（G6a）

> 扫描对象：`receipts/evidence/i4-03/` 全部文件 + `receipts/evidence/i4-02/`（上一包处置后复扫）
> 扫描方式：grep 值模式（已知 secret 字面量、PEM 头、测试口令）+ 字段名模式（accessToken/password/secret）
> 时间：2026-09-13（回执 03 定稿前终扫）

## 1. i4-02 包处置（本轮已完成）

| 文件 | 命中 | 处置 |
|---|---|---|
| http/token-{admin,initiator,leader1,leader2,outsider}.json | 真实 JWT 原文 | 值替换为 `REDACTED sha256=<哈希> len=<长度> invalidated=true`；签发进程已终止、内存库销毁、TTL 900s 已过，三重失效 |
| http/i4-e2e2/3/4.mjs | dev 种子 secret 字面量 | 字面量替换为环境变量读取 + 原文 sha256 留痕注释 |

复扫：dev 种子 secret 原文字面量在 i4-02 内零命中。

## 2. i4-03 包终扫结果

| 命中 | 位置 | 工具判定 | 处置 |
|---|---|---|---|
| accessToken 字段 | 无（token 不落盘） | token-meta.json 仅存 sha256+长度 | 无需处置 |
| `secretSha256`/`secretLen` | g5b-signature-recompute.json、object-index.json | SHA-256 摘要与长度，不可逆 | 保留（即 G5b 要求的脱敏替代） |
| `password`/`secret` 字段名 | gate-*.log | 测试夹具字段名与 `password=***` 掩码输出；sys_user 参数为单向 bcrypt 哈希 | 保留（仅字段名/掩码/哈希） |
| `AKIDreal123`/`realSecret456`/`abc` | （i4-02）mvn 日志 | 测试夹具合成假值，不指向任何真实云账号 | 保留（工具判定：合成值） |
| `admin123`/`User@123` | http/i4-master.mjs | 仓库公知 dev 夹具默认口令，账号仅存在于一次性 H2 内存库 | 保留并在脚本头注释判定依据 |

## 3. 结论

- 可用凭据（真实 token、OpenAPI secret 原文）在本包内零保留；OpenAPI secret 以 SHA-256+长度参与 G5b 复算留痕。
- 全部命中均有上述工具判定，无未处置的真实凭据。
