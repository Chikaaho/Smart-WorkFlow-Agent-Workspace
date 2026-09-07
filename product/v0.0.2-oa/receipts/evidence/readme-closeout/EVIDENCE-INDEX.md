# A8 两仓 README 收口 — 执行证据索引

2026-09-07；执行角色：Executor；唯一执行入口：`product/v0.0.2-oa/ready/direction-v0.0.2-oa-readme-closeout.md`。
本目录保存 A8 执行的生效证据，哈希清单见同目录 `SHA256SUMS.txt`（含两仓 README 最终全文，供验收方核验）。

| 文件 | 内容与用途 |
| --- | --- |
| `server-readme.diff` | Smart-WorkFlow-Server 工作树 README.md 相对基线 `4cba2114b43685e902531d3fbd34ede29bb46cd7` 的完整 diff（46 insertions / 98 deletions） |
| `web-readme.diff` | Smart-WorkFlow-Web 工作树 README.md 相对基线 `ef1fdc71d1e6b218ca13d177218d274da3c158c0` 的完整 diff（44 insertions / 103 deletions） |
| `link-and-scan-results.txt` | 本地链接静态检查、外部链接实际访问（HTTP 200）、敏感信息扫描（零命中）、Markdown 基础检查、两仓 `git diff --check`（均退出码 0）与本轮改动范围原始结果 |
| `SHA256SUMS.txt` | 本目录全部证据文件＋两仓 README 最终全文的 SHA-256 哈希清单（工具生成，已回读通过） |

## 身份记录（仅用于验收回执）

| 仓库 | 基线提交（HEAD） | README 工作树差异身份 |
| --- | --- | --- |
| Smart-WorkFlow-Server | `4cba2114b43685e902531d3fbd34ede29bb46cd7`（develop） | ` M README.md`，diff 全量见 `server-readme.diff` |
| Smart-WorkFlow-Web | `ef1fdc71d1e6b218ca13d177218d274da3c158c0`（develop） | ` M README.md`，diff 全量见 `web-readme.diff` |

两仓 README 最终全文位置：`Smart-WorkFlow-Server/README.md`、`Smart-WorkFlow-Web/README.md`
（工作区根目录下仓库内，未提交，保持工作树差异身份）。