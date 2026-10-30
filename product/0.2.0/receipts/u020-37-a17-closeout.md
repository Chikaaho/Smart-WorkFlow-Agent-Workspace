# 0.2.0 执行提示37回执：A17 两条收尾核实与最终同步

2026-10-31｜Executor｜配套提示37（revision55）/审查36。只读核实+信息同步，零工程改动、零业务重跑。

## 一、A17 ①现行根路径交付（通过）

- 生效配置 `/etc/nginx/conf.d/chikaho.cn.conf`（10-16 版全文已读）：域名 HTTPS 块自 2026-10-15 R015-02 起根路径 `/` 挂载 `/opt/smart-workflow/web`；`/sw-server/`→127.0.0.1:8080；`/rs`、`/events` 及 agent 路径为 reasonix 共存（未动）；`8.166.112.85:80` IP vhost→5173 非域名入口。
- 实测（Host=chikaho.cn）：根页面 **200** 且加载 `assets/index-DMDsHDv8.js`＝本次 0.2.0 CI 制品（资产 200）；构建产物 API 基址 `sw-server/api`（request-CbWQB2t3.js 实据）；`/sw-server/api/actuator/health` **200 {"status":"UP"}**。
- Server 发布身份：已安装 jar sha256 `524cbf2f…`＝CI 制品、`build.version=0.2.0`（提示36实测，本轮未重复安装）。
- 更正：提示36回执「域名根路由由 agent 服务承载」系当时部分读取配置的误判，域名根路径一直挂载工作流 Web（审查36口径为准；历史回执原文不改，本条与 version.json/knowledge 已更正）。
- 未改 nginx/其他服务/数据；未登录重跑业务；无新增截图（按审查36不强制）。

## 二、A17 ②分支/版本/回纳与同步（通过）

- Server：origin/main `39dcedb7`（tag 0.2.0，CI 41097671140 success）、origin/develop `c25f5ea5`——最终修复 `befd32eb` **已回纳 develop**（merge-base --is-ancestor 通过），不做动作；develop 有效版本 `0.2.0-SNAPSHOT`。
- Web：origin/main `f5ec5a1`（tag 0.2.0，CI 41092067995 success）、origin/develop `3c1cfe2`——`eadd20b` 已回纳；develop package.json `0.2.0`。
- 同步：knowledge 追加提示37条目（含根路由误判更正）；version.json 补 develop 回纳事实与现行根路径实测；结论回传 `search_fallback/u020-release-final-readback-20261031.md`（2,310 B）；Planner 在途 memory/todo/ready 当前入口批一并纳入提交。

## 三、提交与保留

- 本批提交 `57e62f33`（32 件：knowledge、version.json、search_fallback/search_task 本题文件、Planner 摘要批 memory×7/todo/ready×15 等），task 分支与 develop-sw 均推送回读一致。
- 保留在途：Web `vite.config.ts`（保护）、`search_task` 另两份规划文件、`receipts/review-305-visual/` 图包、`.tmp-a03-schema.json`。
- 当前入口一致：已发布 0.2.0、A17 两条满足、整版 VERIFYING 待 Planner 终审；无"尚未合并发布/旧失败待核"残留。
