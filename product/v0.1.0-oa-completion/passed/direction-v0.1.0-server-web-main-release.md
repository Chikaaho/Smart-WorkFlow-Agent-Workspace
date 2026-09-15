# P60 / 0.1.0 Server 与 Web main 发布收尾方向

> 日期：2026-09-15  
> 角色：Planner  
> 等级：L  
> 状态：PASSED（发布最终验收02确认）；P60 整体已由终态同步写为 `COMPLETED（待规划确认）`（回执 `receipts/terminal-sync-v0.1.0-oa-completion-01.md`）  
> 授权来源：Owner 2026-09-15 明确裁决“0.1.0只合两个代码仓，并创建标签与Release”

## 1. 发布目标与固定边界

本次只发布两个代码仓：

- `Smart-WorkFlow-aPaaS-server`：`develop → main`；
- `Smart-WorkFlow-aPaaS-Web`：`develop → main`。

Workspace 与 `0.1.0` 代码发布无关。本轮不得在 Workspace 执行 commit、push、merge、tag、Release、rebase、清理或历史改写；Workspace 的 main、R7跨环境指纹和 `release/0.1.0/MANIFEST.json` 均不是本次通过条件。两仓最终 main 完整 SHA 共同构成 `0.1.0` 的不可变版本身份，必须写入回执。

## 2. 连续执行顺序

Executor 按以下顺序连续执行，不在已授权步骤之间请求二次确认：

1. 读取两仓工程宪法，核对当前分支、远端、task-owned 已提交/未提交变更及秘密扫描；不得遗漏本轮 I1—I6 已验收实现与直接测试资产，不得夹带无关文件。
2. 在两仓 `develop` 分别形成候选提交，使用中文 Conventional Commit；推送 `origin/develop` 并回读远端包含关系。
3. 执行发布前门禁：Server 至少运行 `MAVEN_OPTS="-Xmx2g" mvn -B -ntp install`；Web 至少运行 `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build`。若仓库实际脚本入口不同，以工程宪法和 package 脚本为准并解释映射。
4. 分别从最新 `origin/main` 普通合并 `origin/develop`，保留合并提交。Server 的 `application-local.yml` 删除/修改冲突按安全配置与仓库约定解决，禁止把本机或秘密配置带入 main。禁止 squash、rebase、强推和绕过保护。
5. 推送两仓 `origin/main`，等待并回读 `.github/workflows/build-release.yml` 对应运行；自动生成的 `build-<sha>` 标签、Release 和产物应保留并记录。
6. 在两仓各自最终 main 提交创建 annotated tag `0.1.0`（不加 `v` 前缀）并推送。若同名本地或远端标签已存在且指向同一提交，按幂等结果回读；若指向不同提交，停止该标签写动作，不删除、移动或覆盖。
7. 确认两仓均存在以 `0.1.0` 为版本身份的 GitHub Release。既有自动机制未直接形成版本 Release 时，可使用当前可用的认证 GitHub UI/API/CLI创建；发布说明列明 Server/Web 完整 SHA、主要能力、既有 Owner 延期未验证边界及关联自动 `build-<sha>` 产物。不得把“未验证”写成“已通过”。
8. 回读远端 develop/main、tag对象与peeled commit、Actions结论、Release链接和资产身份；最后核对 Workspace 没有发生 Git 写动作。

## 3. 浏览器与确认纪律

- 正式流程若使用浏览器，必须使用可见浏览器；禁止无头浏览器充当正式发布或验收证据。
- 固定测试输入、既有配置值、已授权的提交/推送/合并/标签/Release动作不得中途请求用户再次确认。
- 只有真实秘密缺失、MFA、真实人机验证、同名标签异指、分支保护实际拒绝或授权外破坏性动作可形成`BLOCKED`；必须附真实工具结果。

## 4. 发布通过条件

以下事实必须全部可回读：

1. Server/Web 候选提交完整 SHA、父提交、文件清单、diffstat和剩余工作树归属；
2. 两仓发布前正式工程门禁通过，原始命令、计数与退出码齐全；
3. 两仓远端 `develop` 包含各自候选，远端 `main` 是包含候选的普通合并结果；
4. 两仓精确 annotated tag `0.1.0` 分别指向各自最终 main 提交；
5. 两仓 main 自动工作流成功，`build-<sha>` 标签、Release、构建产物及其对应关系可回读；
6. 两仓 `0.1.0` GitHub Release 可访问，版本说明与候选身份一致；
7. 无秘密、运行产物、无关文件、强推、历史改写或标签覆盖；
8. Workspace 零 Git 写动作，且其任何状态不参与本次版本通过判断。

## 5. 失败处理与回执

工程门禁、普通合并、Actions或Release在本方向范围内失败时，Executor应保留证据并继续进行非破坏性修正和重试，不得因确定性本地输入或已经授权的远程动作请求二次确认。只有§3列明的真实门禁条件成立才可停止。

提交执行回执：

`product/v0.1.0-oa-completion/receipts/release-v0.1.0-server-web-01.md`

状态使用`VERIFYING / EXECUTION_SUBMITTED`。Executor不得自行把P60写为`COMPLETED`、归档主方向或宣布规划验收通过；发布回执由Planner独立验收，验收通过后再下发P60整体终态同步方向。

**归档事实（2026-09-15）**：本方向已归档 `passed/`；发布回执已由发布验收 01 与最终验收 02（`receipts/planning-final-review-release-v0.1.0-server-web-02-passed.md`，PASSED，G14 核销、P60 整体 14/14）确认；最终发布身份 Server main `c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`、Web main `963df360ed18bc1c604652a13edb2a7ed0be8963`，两仓 annotated tag 与公开 Release 均为 `0.1.0`，main Actions 34946504087 / 34942666025 成功；迁移终点 V93。发布后不得重复发布或移动/重建 main、tag、Release。
