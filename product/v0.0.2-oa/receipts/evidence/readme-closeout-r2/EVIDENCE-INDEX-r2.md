# A8 两仓 README 收口 — 修正轮 r2 执行证据索引（验收05 D1—D4）

2026-09-07；执行角色：Executor。依据：`planning-review-v0.0.2-oa-05.md`（A8 未通过，D1—D4）、更新后 `product/v0.0.2-oa/ready/direction-v0.0.2-oa-readme-closeout.md`。本目录为 r2 修正轮证据；r1 证据（`readme-closeout/`）保留原样作为历史。哈希清单见同目录 `SHA256SUMS.txt`（含两仓 README 最终全文与两仓 Logo 资源）。

| 文件 | 内容与用途 |
| --- | --- |
| `server-readme-r2.diff` | Smart-WorkFlow-Server 工作树 README.md 相对基线 `4cba2114b43685e902531d3fbd34ede29bb46cd7` 的最终完整 diff（包含 D1 快速开始删除、D3 版本文案、D4 Logo 引入） |
| `web-readme-r2.diff` | Smart-WorkFlow-Web 工作树 README.md 相对基线 `ef1fdc71d1e6b218ca13d177218d274da3c158c0` 的最终完整 diff |
| `server-readme-render.png` | Server README 实际渲染全页截图（headless Chrome，1920×4990；脚本断言 Logo 以 444×468 原尺寸从相对路径加载、展示宽 180 等比） |
| `web-readme-render.png` | Web README 实际渲染全页截图（1920×4852；同一断言通过） |
| `link-scan-render-r2.txt` | 标题清单、技术操作词扫描（零命中）、本地链接检查、Logo 相对路径与哈希对照、渲染实证输出、外部链接 HTTP 200、两仓逐字核对、敏感扫描、Markdown 检查、`git diff --check`（均退出码 0）、身份记录与影响说明 |

## 原始 Logo 与两仓资源 SHA-256 对照（同源保证）

```
f5194ac671c42957f46797228e9ffd827f996a8c289c04f83297c9d58d48552e  /Users/chikan/Downloads/135208.PNG（Owner 原图）
f5194ac671c42957f46797228e9ffd827f996a8c289c04f83297c9d58d48552e  Smart-WorkFlow-Server/docs/images/ch-apaas-logo.png
f5194ac671c42957f46797228e9ffd827f996a8c289c04f83297c9d58d48552e  Smart-WorkFlow-Web/docs/images/ch-apaas-logo.png
```

三处字节一致（同一视觉源文件）。两仓 README 均以相对路径 `docs/images/ch-apaas-logo.png` 展示，无本机绝对路径。

## 最终全文位置

`Smart-WorkFlow-Server/README.md`、`Smart-WorkFlow-Web/README.md`（工作区内仓库工作树，未提交，保持工作树差异身份）。

## 渲染截图核对要点（程序化断言，非目视）

- 两仓渲染各含唯一图片：src=`docs/images/ch-apaas-logo.png`、alt=`CH-aPaaS Logo`、naturalWidth=444、naturalHeight=468（与 Owner 原图一致，证明相对路径真实加载）、displayed=180（等比缩放，无拉伸裁切）。
- 渲染脚本：`/tmp/a8render/render.js`（marked 解析 + puppeteer-core 连接本机 Chrome，file:// 打开仓库根临时 render.html 后整页截图；临时 HTML 已删除，不留在两仓工作树）。