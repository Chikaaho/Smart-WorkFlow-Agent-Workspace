# 0.1.0 P53/P61 补丁演示环境正式发布方向

> 角色：规划（Planner）  
> 日期：2026-09-21  
> 等级：XL  
> 状态：READY（演示环境快速发布；远程 Git/Release 写入待精确授权）  
> 事实输入：`search_fallback/v0.1.0-p53-p61-production-release-readiness.md`  
> 探索审查：`receipts/planning-review-production-release-readiness-01.md`

## 1. 目标

将已验收的 P53 全局 UI/组件布局优化与 P61 用户提示语治理纳入正式 `0.1.0`：两仓正常合并至 `main`，由 main CI 生成不可变制品，校正现有未部署的 `0.1.0` tag/Release，并将演示环境的 Server、Web 与本项目数据库重建到统一版本身份。

最终必须同时成立：

- Server/Web `main` 包含锁定候选及 P53/P61；
- 两仓 annotated tag、Release、CI 资产与最终 main SHA 一致；
- 演示环境部署对应 CI 资产；
- 本项目数据库以完整迁移链重建至 V93；
- 登录、权限、核心 OA 流程、P61 提示语与 P53 关键界面可见可用；
- 磁盘、日志与启动配置满足稳定演示要求。

## 2. 范围边界

- 仅发布 Server、Web 与本项目应用数据库；不新增 P53/P61 之外的业务功能。
- Workspace 不参与代码版本 tag、Release 或部署制品身份。
- I5 三 Provider 与 I6 五外部通知渠道继续按已确认边界展示，不扩大本轮范围。
- 数据破坏范围仅限当前 Smart-Workflow 应用数据库或 schema；不得删除 PostgreSQL 集群、系统库、其他业务库或其他应用数据。
- nginx 仅维护 `/sw/` 与 `/sw-server/`；不得改变 `/`、`/events`、38784 应用、域名、证书或 DNS。
- 不强推 main，不 rebase/squash，不用服务器本地构建充当正式制品。

## 3. 锁定候选与失效条件

- Server：`develop=d18e9a39c552918615be8b158dfe0cc278cb309f`；
- Web：`develop=039f987437ed6369c3c131631bd7622c6ae482e7`。

两仓均相对当前 main ahead 10 / behind 0。执行开始前重新回读本地与远端；若候选 SHA、main、提交范围、工作树或迁移集合变化，本方向候选快照失效，Executor 停止远程写入并提交差异，不夹带新提交。

## 4. 发布前门禁

1. 为演示环境生成并注入高强度 `JWT_SECRET` 与 `SW_SSO_CIPHER_KEY`；秘密仅进入 mode 600 的受保护配置，证据只报告存在性和脱敏指纹。
2. 释放足够磁盘空间：可删除本项目陈旧日志、旧 jar 副本、旧 Web 目录、抽取残留与本轮明确识别的临时文件；删除前回读绝对路径、大小和归属，禁止触碰其他应用。
3. 为本项目日志建立轮转与保留上限，避免再次占满磁盘。
4. 修正发布材料中的 V92/V93、`SW_JWT_SECRET`/`JWT_SECRET`、旧候选 SHA 与测试基线冲突，以最终候选重新生成 manifest。
5. 两仓正式工程门禁通过；P53/P61 锁定证据仅在候选未变化且无反证时沿用，main 合并后完成发布影响范围回归。

## 5. 版本身份方向

最终版本号保持 `0.1.0`：

- 以普通合并方式将锁定 `develop` 合入各自最新 `main`，保留历史；
- 等待 main Actions 成功，由 `build-<最终SHA>` 生成 Server/Web CI 资产；
- 删除旧 `0.1.0` tag/Release，在最终 main 上重建两仓 annotated tag 与 Release；
- Release 正文列出两仓完整 SHA、CI 资产及 SHA-256、数据库重建至 V93、P53/P61 内容、演示环境部署结论及 Owner 延期未验证边界。

执行前必须把两仓远端、旧 tag 对象、旧 Release URL、最终 main SHA 与“公开版本身份被替换”的风险提交 Owner 精确确认。

## 6. 演示环境快速发布

- 正式输入仅使用两仓合并后 main CI 的 `bootstrap.jar` 与 Web `dist-<sha>.zip`，传输前后校验摘要。
- 停止 Smart-Workflow 后端，删除并重建其独占应用数据库或 schema，由完整生产迁移链从初始版本执行到 V93；不载入 devseed V900—V903。
- 使用项目支持的初始化方式建立可登录的演示管理员与最小演示数据；身份、租户、角色和权限均走正式产品链路。
- 部署新 Server 制品并以补齐后的安全配置启动；确认唯一进程、端口、V93 与日志稳定后再切换 Web 静态目录。
- Web 使用 CI dist 覆盖本项目静态目录；保持 `/sw/` 与 `/sw-server/api` 契约，执行 nginx 配置检查并按需 reload。
- 清理本轮临时上传物和不再使用的旧项目制品，使磁盘保留稳定演示余量。

## 7. 验收边界

### 7.1 版本与基础设施

- 两仓远端 main、annotated tag `0.1.0`、Release target、Actions 与 CI 资产逐项一致。
- 演示环境 Server jar 与 Web 目录指纹匹配最终 CI 资产。
- 应用数据库为全新 V93，Flyway 无 failed/pending/out-of-order；演示管理员可登录。
- `/sw/` 与 `/sw-server/api/actuator/health` 正常，后端进程唯一，日志无启动失败、迁移异常、持续 ERROR 或秘密泄漏。
- 磁盘空间和日志轮转达到可持续演示状态；其他应用路由与进程不受影响。

### 7.2 正式业务验收

正式浏览器验收来自用户可见、可交互会话，并保存 URL、视口、身份、对象、截图和网络索引。至少覆盖：

- `/sw/` 首屏、验证码、登录成功及安全失败提示；
- P61 中英文切换、关键认证/表单/流程提示，无原始诊断泄漏；
- P53 桌面与移动关键壳层、导航、表单、流程图/任务页布局与交互；
- 一条新建 OA 演示链的发起、办理、查询与结果回读；
- 页面刷新与静态资源加载，无旧 chunk、404 或前后端版本错配。

## 8. 失败恢复与停止条件

- main/CI/tag/Release 任一未收敛，不进入演示环境发布。
- 秘密缺失、磁盘仍不足、数据库目标无法与其他应用明确隔离时停止。
- 数据库重建或迁移失败时，保留错误日志，修正授权内问题后重新创建本项目数据库并从头执行迁移。
- Server/Web 验收失败时重新部署同一已验证 CI 候选；候选本身存在缺陷则停止并提交证据，不临时改服务器源码。
- 遇到 MFA、分支保护拒绝、权限不足或授权外对象时如实 `BLOCKED`；其余授权内问题持续收敛。

## 9. 授权边界

Owner 已授权演示环境内本项目数据库清空重建，以及为快速发布清理本项目陈旧日志、旧制品和临时残留；执行者必须先验证绝对路径与对象归属。

远程 Git/Release 写入仍需最终确认，精确范围为：

1. Server `origin/develop@d18e9a39c552918615be8b158dfe0cc278cb309f → origin/main` 普通合并与推送；
2. Web `origin/develop@039f987437ed6369c3c131631bd7622c6ae482e7 → origin/main` 普通合并与推送；
3. 两仓旧 annotated tag `0.1.0` 与对应公开 Release 删除，并在合并后最终 main SHA 上重建；
4. 使用新 CI 资产部署演示环境并完成可见验收。

## 10. 回执要求

执行回执写入：

`product/v0.1.0-p53-p61-production-release/receipts/production-release-01.md`

回执按“候选与门禁、main/CI、tag/Release、环境清理、数据库重建、Server/Web 部署、正式浏览器验收”提供行为证据；秘密仅报告存在性与脱敏指纹。Executor 只能提交 `VERIFYING / EXECUTION_SUBMITTED`，不得自行宣布发布 `PASSED/COMPLETED`。
