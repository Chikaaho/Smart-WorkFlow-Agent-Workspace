# P60 / 0.1.0 Owner 范围纠正 03：双代码仓发布已授权

> 裁决角色：Owner / Planner 记录  
> 日期：2026-09-15  
> 前置：`planning-review-v0.1.0-oa-completion-02-main-readiness-not-ready.md`  
> 结论：**Workspace 退出 0.1.0 发布判定；Server/Web 合并、标签与 Release 已明确授权**

## 1. Owner 原始裁决

Owner 明确指出：`0.1.0` 与 Workspace 无关，发布只涉及 Server 与 Web 两个代码仓；合入 `main` 后应正常创建 `0.1.0` 标签与 Release。

该裁决纠正审查02中两处错误口径：Workspace 的分支关系、脏工作树、指纹和 manifest 不再构成 P60 第14条阻断；Server/Web `main` 推送触发自动 Release 是预期发布机制，不是风险或禁止事项。

## 2. 当前规划裁决

- P60 第1—13条继续通过或按既有 Owner 例外通过。
- 第14条尚需执行层形成 Server/Web 不可变候选、完成工程门禁、合并 `main`、创建精确标签并回读 Release，故当前仍为13/14，P60保持`IN_PROGRESS`。
- Workspace 不参与候选、合并、标签或 Release；不得为了本次发布修正或提交 Workspace 的 `release/0.1.0/MANIFEST.json`、R7脚本、规划证据或其他状态文件。
- 两仓当前 task-owned 已提交和未提交变更均可在核对归属后固化；Server 的 `application-local.yml` 冲突按安全配置与仓库既有约定解决，不得提交秘密或本机运行配置。

## 3. 授权边界

本轮已授权：

1. Server/Web 在各自 `develop` 固化本轮候选并推送 `origin/develop`；
2. 两仓以普通合并提交完成 `develop → main`，推送 `origin/main`；
3. 运行并等待既有 main 自动构建、测试、`build-<sha>` 标签与 Release；
4. 在两仓最终 main 提交创建并推送同名 annotated tag `0.1.0`（不加 `v` 前缀），并形成/回读版本 `0.1.0` 的 GitHub Release；
5. 对本轮候选、冲突解决、发布配置和非破坏性发布失败进行范围内修正与重试。

本轮不授权：Workspace Git 写动作；强推、历史改写、删除或移动既有远端标签；绕过分支保护；生产服务器 SSH 部署；夹带无关文件或秘密。

Owner 已对上述确定性发布动作完成一次性授权，执行期间不得再次请求“是否提交验证码/是否继续合并/是否创建标签或Release”。只有真实凭据缺失、MFA、真实人机验证、同名 `0.1.0` 标签已指向不同提交、分支保护实际拒绝或授权外破坏性动作，才允许按机器门禁报告阻塞。

## 4. 下一入口

唯一执行入口：

`product/v0.1.0-oa-completion/ready/direction-v0.1.0-server-web-main-release.md`

