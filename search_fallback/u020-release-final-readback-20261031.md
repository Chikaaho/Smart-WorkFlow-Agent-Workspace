# 0.2.0 发布收尾事实核实结论（search_fallback）

2026-10-31｜Executor｜配套 search_task/u020-release-final-readback-20261031.md（提示37/审查36）。

## ①当前根路径（Owner 现行入口）

- 生效配置＝`/etc/nginx/conf.d/chikaho.cn.conf`（2026-10-16 版，全文已读）：域名 HTTPS 块（chikaho.cn/www）自 **2026-10-15 R015-02** 起 `location / { root /opt/smart-workflow/web; try_files … /index.html; }`；`location /sw-server/ → 127.0.0.1:8080/`；`/rs`、`/events` 与 agent 动作路径反代 127.0.0.1:38784（reasonix 共存服务，未停止未改动）；`8.166.112.85:80` IP vhost → 5173（非域名入口）。
- 实测（Host=chikaho.cn，服务器本机）：`https://…/` **200**，根页面加载 `assets/index-DMDsHDv8.js`＝本次 0.2.0 CI 制品（该资产 **200**）；前端构建产物 API 基址＝`sw-server/api`（request-CbWQB2t3.js），`/sw-server/api/actuator/health` **200 {"status":"UP"}**。
- Server 发布身份：已安装 jar sha256 `524cbf2f…` 与 CI 制品一致、`build.version=0.2.0`（提示36安装时实测）；本次未重复安装/重启。
- 更正：提示36回执中「域名根路由由 agent 服务承载」为当时部分读取配置所致误判；域名根路径一直挂载工作流 Web（审查36口径为准，历史回执原文不改）。

## ②分支/版本/回纳

- Server：origin/main `39dcedb7`（tag 0.2.0）、origin/develop `c25f5ea5`，最终修复 tip `befd32eb` **已回纳 develop**（merge-base --is-ancestor 通过）；develop 有效版本 `0.2.0-SNAPSHOT`。
- Web：origin/main `f5ec5a1`（tag 0.2.0）、origin/develop `3c1cfe2`，`eadd20b` 已回纳；develop package.json `0.2.0`。两仓工作区与 origin 一致。
- 回纳无需动作：最终 Server 修复已在 develop；未做任何合并/推送以外的新工程动作。

## ③交付与同步

- 本批提交：knowledge 本条 + version.json（回纳事实与根路径实测更正）+ Planner 在途 memory/todo/ready 当前入口批 + search_task/search_fallback 本文件；远端回读见收尾回执。保留在途：`vite.config.ts`（保护）、search_task 另两份规划文件、receipts/review-305-visual 图包。
- 未核事实：无。未改 nginx/其他服务/数据；未重跑业务与全量检查。
