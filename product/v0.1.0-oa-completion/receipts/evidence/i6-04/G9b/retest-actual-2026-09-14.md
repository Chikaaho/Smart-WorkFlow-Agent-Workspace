# G9b 最终门禁复测实际结果

> 采集日期：2026-09-14；本文件是对 completion-04 的追加证据，不改写既有回执或既有原始流。

## Server

- 工作目录：`Smart-WorkFlow-aPaaS-server`。
- 命令：`MAVEN_OPTS=-Xmx2g mvn test`。
- 原始文件：`stdout.log`、`stderr.log`、`exit-code.txt`；另保留同一轮的 `server-test.*` 副本。
- `exit-code.txt` 为 `0`；`stdout.log:27177` 为 `INFO] BUILD SUCCESS`。
- 从当前 stdout 中按 Maven 模块汇总行（排除带 `-- in` 的类级行）聚合，得到 `Tests run: 1361, Failures: 0, Errors: 0, Skipped: 0`；通知 I6 关键模块行包含 `stdout.log:621`（G1c）、`stdout.log:664`（通知闭环）以及 `stdout.log:19314`、`stdout.log:19505`（G7b 升级链）。

## Web

- 四条独立命令均以 `NODE_OPTIONS=--max-old-space-size=2048` 运行，四份 exit-code 均为 `0`。
- `web-typecheck.stdout.log`：vue-tsc 完成；`web-lint.stdout.log`：eslint 完成。
- `web-test.stdout.log:5-6`：`130 passed | 1 skipped`，`1185 passed | 3 skipped`。
- `web-build.stdout.log`：生产构建完成；构建 stderr 中仅保留依赖工具的非致命提示，进程 exit 仍为 `0`。

## 开发环境固定验证码

- `Smart-WorkFlow-aPaaS-server/sw-bootstrap/src/main/resources/application-dev.yml:6` 与 `application-local.yml:6` 均为 `test-mock: true`；生产配置保持关闭。
- `object-setup/login-fixed-captcha.stdout.log:1-3` 记录真实 challenge→login 流仅为：`FIXED_CAPTCHA_LOGIN_EXIT=0`、`status=200 code=0 msg=success`、`accessToken.len=212`；未记录密码、验证码之外的秘密或 token 内容。

## 结论

G9b 当前门禁证据为 Server 1361/0/0/0 BUILD SUCCESS，Web 四门 exit 0；浏览器既有 PC/H5 截图链继续作为 G4a/G4b 证据，不再重复抓图。固定验证码开关已在 dev/local 配置和实际 dev 进程中生效。G5b 的真实 Provider 成功链仍需 Owner 提供外部凭据与选型。

## 终态契约回读

`G8a/terminal-input.json` 为本轮机器终态输入；`terminal-validator.stdout.log`、`terminal-validator.stderr.log` 与 `terminal-validator.exit-code.txt` 分离保存，validator exit 为 `0`。输入账本将 G5b 标为 dependency 未满足且不可执行，其余原子无 actionable 项，故终态为 `EXECUTION_SUBMITTED` 等待 Planner。
