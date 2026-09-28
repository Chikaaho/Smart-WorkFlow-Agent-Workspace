# 0.1.2 发布规划复核

2026-09-28；结论：发布交付 PASSED，终态文档同步待执行。依据 release-20260928.md 全文及本次独立读取 GitHub 公开 Release、CI 和 expanded_assets 页面。

## 核对结果

- 两仓 develop→main 快进、源分支范围、annotated tag 对象及最终 refs，采用执行回执记录的实际 Git 命令结果；规划未运行 Git，不将其称为独立实时 refs 核验。
- Server 公开 Release 0.1.2 指向 fd704ff；Web 指向 5368e6c。两者公开可访问并显示正式 Latest。
- CI 36396145288（Server，fd704ff）与 36396187465（Web，5368e6c）实际页面均为 Status Success，与回执候选一致。
- 公开 expanded_assets 实际列出 bootstrap-0.1.2.jar、sw-web-dist-0.1.2.zip；GitHub 公开摘要分别为 a4d59613d662b42b03e9256ac8476d7b707fa675e4dc7f497aef2f11dd61c876、703fd2c43bc87003de9669658303452fbbe8a8a08860eaca7f5217381cadadbc，与执行下载计算值逐字一致。未再次下载二进制。
- 本地测试 1586/0/0/0 与 Web 1301+3 为执行回执的实跑结果；本轮独立证据为对应 CI 成功，不冒称重新计算 /tmp 测试日志。
- 版本构建链与正式 marker 0.1.2 采用执行制品检查记录；开发默认 SNAPSHOT 与正式产物版本分开记录。
- 本轮未部署，生产迁移未执行。V012-CODE-001 与外部渠道验证继续独立跟踪。

公开核对入口：
- https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/tag/0.1.2
- https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/releases/tag/0.1.2
- https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/actions/runs/36396145288
- https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/actions/runs/36396187465
- 两仓 releases/expanded_assets/0.1.2（资产名及公开 sha256）
GitHub API 读取工具返回 Internal Error，改用公开 Release/CI/资产页面完成核对；不把 API 失败当成发布失败。

## 文档澄清

回执 §9 “V97→V102 增量迁移”应明确为“生产当前 V96，待部署应用 V97—V102，终点 V102”，与其余段落统一。仅转录澄清，不触发重新构建/迁移。发布材料与 knowledge 位于 Planner 直接读取边界之外，由终态同步回执提供可回读快照供核对。

主方向移至 passed；下发 direction-terminal-sync-20260928.md。发布交付通过不自动代替终态文件复核；当前唯一下一动作为终态同步，无业务返工、无重新发布。
