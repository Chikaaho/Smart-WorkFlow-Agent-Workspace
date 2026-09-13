# I4 iteration-04 证据包秘密扫描报告（G6a 复扫）

> 扫描对象：`receipts/evidence/i4-04/` 全部文件
> 扫描方式：值模式（已知 secret 字面量 / PEM 头 / 测试口令）+ 字段名模式（accessToken / password / secret）
> 时间：2026-09-13（回执 04 定稿前复扫）

| 命中 | 位置 | 工具判定 | 处置 |
|---|---|---|---|
| `admin123` / `User@123` | http/i4-r4.mjs | 仓库公知 dev 夹具默认口令，账号仅存在于一次性 H2 内存库（进程终止即失效）；脚本头部已注释判定依据 | 保留 |
| accessToken 字段 | 无 | token 全程不落盘（/tmp/i4-tokens 包外），包内无 token 原文 | 无需处置 |

## 结论

可用凭据零保留；R5 OpenAPI 链未在本轮重采（G5a/G5b 已于验收 03 锁定）；无未处置真实凭据。
