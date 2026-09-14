# P60 I6 通知与版本收口 追加勘误回执 04-S1

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 唯一执行入口：`planning-execution-prompt-stage-i6-notification-version-closure-02.md`
> 承接回执：`completion-stage-i6-notification-version-closure-04.md`
> 性质：追加证据与版本投影勘误；原回执及其历史证据保持不变。
> 结论：授权内原子已无可执行项；G5b 仍为唯一外部未验证项。阶段保持 `VERIFYING`，P60 保持 `IN_PROGRESS`，提交规划验收。

## 1. 本次追加动作

1. 完成 Server 最终 `mvn test` 原始流留存并回读 `BUILD SUCCESS`、1361/0/0/0。
2. 完成 Web typecheck、lint、test、build 四门原始流留存，四项 exit 0；测试结果为 1185 passed + 3 skipped。
3. 对 `evidence/i6-04/` 的 20 个原子目录逐一检查，均具备 `command.txt`、`stdout.log`、`stderr.log`、`exit-code.txt`、`objects.md`、`actual.md` 六项必需文件；浏览器原有截图/URL/viewport/network 索引不重复抓取。
4. 回读开发环境固定验证码配置：`application-dev.yml:6`、`application-local.yml:6` 的 `ch.dev.test-mock: true`；当前 8080 进程为纯 `dev` profile。真实登录原始结果只保留状态码与 token 长度，未落盘凭据或 token。
5. 将版本材料从旧的 V90 投影统一修正为现行 V92：`version.json`、`CHANGELOG.md`、`release/0.1.0/{UPGRADE,ROLLBACK,CONFIG-CHANGES,DB-MIGRATIONS}.md`；V91 主体绑定与 V92 布尔兼容迁移路径按仓库实际文件回读。
6. 重新生成候选 `release/0.1.0/MANIFEST.json` 及 G8a 快照；三仓 SHA、门禁计数、V92 终点和 G5b 外部边界均以工具读取结果为准。

## 2. 原子账本追加裁决

| 原子 | 当前状态 | 追加证据 | 说明 |
|---|---|---|---|
| G1a、G1c-E、G2e-V/T、G2f-R/J、G2g-C/P、G3d-R/A、G3e-I、G3f | DONE（待规划验收） | 各原子目录六项标准文件；既有实际结果不变 | 追加动作只补齐证据封装，不改变行为结论 |
| G4a、G4b | DONE（待规划验收） | 各原子目录；既有 PC/H5 截图及索引 | 不重复验证码操作和截图，避免无价值图片增长 |
| G5a-I | DONE（待规划验收） | `G5a-I/` 六项标准文件 | V91 主体绑定和最小暴露边界已锁定 |
| G5b | EXTERNAL_UNVERIFIED | `G5b/actual.md`、`G5b/exit-code.txt`、可用性检查原始流 | Owner 尚未提供五渠道凭据与短信 Provider 选型；EMAIL 失败/重试链已实测，成功链不能代称 |
| G6a、G6b、G7b | DONE（待规划验收） | 各原子目录六项标准文件 | 同对象事件/身份/数据库回读结论不变 |
| G9b | DONE（待规划验收） | `G9b/retest-actual-2026-09-14.md`、Server/Web 原始门禁流 | 当前最终门禁为 Server 1361/0/0/0 + Web 四门 exit 0 |
| G8a | CANDIDATE_READY（待规划验收） | `release/0.1.0/MANIFEST.json`、`G8a/`、版本材料 | 版本投影已与 V92 现行迁移身份对齐；无标签、无 Release、未推送 |

## 3. 固定验证码配置边界

- 开关仅在纯 `dev`/`test` profile 且 `ch.dev.test-mock=true` 时生效；生产配置保持 `false`，由现有 fail-closed 代码路径守护。
- 当前开发服务以 `dev` profile 运行，故本轮本地 HTTP 登录可使用固定验证码 `1234`，不需要人工读图。
- 该配置只服务本地开发/测试取证，不构成生产能力，也不改变 G5b 的外部 Provider 成功链结论。

## 4. 版本投影与候选边界

- 现行迁移终点为 H2 V92（92 条）/ PostgreSQL V92（90 条实际迁移身份），与 `G7b` 与 `G9b` 原始门禁流一致。
- Server HEAD：`e941d74ffb3e5388e1b3ac3efb234d4634436aea`；Web HEAD：`0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6`；本轮没有新增业务代码或迁移代码。
- 候选 manifest 不创建标签、不创建 Release、不执行远端推送；发布动作仍需 P60 整体验收、终态同步及 Owner 明确授权。

## 5. 自验结论

自验通过，待规划验收。除 G5b 外，授权内工作项为 0；不得由 Executor 将 I6/P60 标记为 `PASSED` 或 `COMPLETED`。下一动作是 Planner 回读本追加回执、独立证据包、V92 版本投影和候选 manifest，并裁决 G5b 外部边界。
