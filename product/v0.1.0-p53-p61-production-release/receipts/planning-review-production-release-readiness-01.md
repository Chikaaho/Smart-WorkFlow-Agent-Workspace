# 0.1.0 P53/P61 正式生产发布探索审查 01

> 角色：规划（Planner）  
> 日期：2026-09-21  
> 审查对象：`search_fallback/v0.1.0-p53-p61-production-release-readiness.md`及其事实附件  
> Owner 环境裁决：目标为演示环境，本项目数据可清空并重建  
> 结论：探索 PASSED；允许形成正式方向，不代表授权执行远程 Git 写入

## 1. 规划裁决

探索已回答候选提交、现有 tag/Release、生产运行身份、SSH/运维入口、数据库版本、配置、容量、健康检查和部署对象。无需继续探索；本任务进入正式发布规划。

Owner 已明确 P53/P61 属于正式 `0.1.0` 发布前补丁，目标环境为演示环境，可对本项目数据库执行清空重建等快速发布操作。版本方向锁定为：两仓最终 `main`、annotated tag `0.1.0`、GitHub Release、CI 构建资产和演示环境运行制品共同指向包含 P53/P61 的同一轮候选；本项目数据库以全新迁移链重建至 V93。

现有旧 `0.1.0` tag/Release 未部署且无构建附件，但删除和重建仍属于公开远程版本身份变更。执行前必须按最终 main SHA 列明精确对象并由 Owner 授权。

## 2. 锁定事实

- 当前候选：Server `develop=d18e9a39c552918615be8b158dfe0cc278cb309f`，Web `develop=039f987437ed6369c3c131631bd7622c6ae482e7`；各自相对 `main` ahead 10 / behind 0，工作树 clean。
- 旧发布身份：Server `0.1.0→c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`；Web `0.1.0→963df360ed18bc1c604652a13edb2a7ed0be8963`。两 Release 为公开 Latest、非 draft/prerelease、仅源码。
- 演示环境仍运行 0.0.2 线手工制品，应用数据库 Flyway 终点 V58；尚未部署任何 `0.1.0` CI 制品。
- P53/P61 无新增迁移和生产环境变量；完整 `0.1.0` 迁移终点为 V93。
- 环境缺 `JWT_SECRET`、`SW_SSO_CIPHER_KEY`，新后端会启动期 fail-fast；必须在启动前补齐。
- 磁盘 91%、仅约 1.8G 可用，日志约 7.9G 且无 logrotate；发布前须清理本项目陈旧日志、旧制品与抽取残留，并建立轮转。
- 正式健康路径为 `/sw-server/api/actuator/health`。
- 发布材料存在 V92/V93、`SW_JWT_SECRET`/`JWT_SECRET`、旧候选 SHA 冲突，须以最终候选重新生成。

## 3. 风险裁决

1. 旧 tag/Release 与新 main 异指不得带入正式上线。
2. 数据清理仅限本项目应用数据库或 schema；不得影响 PostgreSQL 集群、其他数据库或其他应用。
3. 生产制品必须来自合并后 main 的 CI 资产并校验摘要，不使用服务器本地构建。
4. 登录、认证、安全启动、数据库重建和真实业务链通过前，不得仅凭 Actuator `UP` 宣布成功。
5. `/sw/` 与 `/sw-server/` 属本项目；nginx `/`、`/events` 及其 38784 应用不在本次范围。

## 4. 后续入口

正式方向：

`product/v0.1.0-p53-p61-production-release/ready/direction-v0.1.0-p53-p61-production-release.md`

该方向允许对演示环境内本项目数据库、日志和旧制品执行明确范围的快速重建/清理。两仓 main 推送及 `0.1.0` tag/Release 删除重建仍须在执行前列出最终 SHA 与 URL，并取得精确授权。
