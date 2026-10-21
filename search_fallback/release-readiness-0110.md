# 0.1.10 发布就绪核查回执

2026-10-21 21:50｜Executor｜核查时点：本地三仓工作树、远程分支回读、版本源文件。

## 结论

0.1.10 修复候选已完整落在两仓 `bugfix/0.1.10`，可直接进入版本收敛、develop→main 合并与发布。应用导入导出仍无 L 方向与验收边界，保持未实现待决，不计入本次候选，也不据此宣称通过或延期。

## 1. 最新权威状态与修复集合

- 权威状态：`knowledge/current-status.md`（顶部仍为 0.1.10 PLANNING 0/1/6，待本次收口同步）；规划收口 `product/0.1.10-bugfix/receipts/owner-close-0110.md`；主方向 `product/0.1.10-bugfix/ready/direction-bugfix-0110.md`。
- 本轮实际修复：Web 22 提交、Server 6 提交，完整列表见 `product/0.1.10-bugfix/receipts/closeout-0110-01.md`。覆盖登录密码可见、流程设计器节点/会签/版本快照、表单工作台对齐、租户角色配置、数据列表与应用树组件化、分页/侧栏/操作列/详情弹窗收口、IoT 列表统一、应用中心两端统一。
- 自验：Web `vue-tsc`、ESLint（改动文件）、全量 Vitest 179 文件 1653 通过/3 跳过；关键页面已做可交互浏览器验证。Server 本轮改动已有 RoleDataScopeTest 及会签/流程定义单测，最终以 main CI 全量门禁为准。
- Owner 反馈：2026-10-21 逐项下达并以“提交并推送，结束”收口；随后下发 `direction-release-handoff-0110.md`。未将“结束”解释为对未实现项的验收。

## 2. Git 候选范围

| 仓库 | 分支 | HEAD | 相对 develop/main | 工作树 |
|---|---|---|---|---|
| Web | `bugfix/0.1.10` | `302fce1` | 领先 22、落后 0 | 干净 |
| Server | `bugfix/0.1.10` | `e4e2205` | 领先 6、落后 0 | 干净 |
| 根 | `develop-sw` | `371c1dbf` | 本地/远程一致 | 规划文档改动待提交 |

两仓远程同名分支已推送并回读一致。main/develop 当前仍指向 0.1.9 基线（Web `2ac1a71`、Server `2d6b8f1`）。

## 3. 应用导入导出

`receipts/app-bundle-io-blocked-01.md` 仍有效：应用级导入导出缺 L 方向，未实现。待决项：导出单元、冲突策略、权限点、租户隔离、是否含运行数据/附件。该项不进入 0.1.10 候选，发布不受其阻塞。

## 4. 版本与发布通道

- 生效版本源：Server `pom.xml` revision、Release workflow 断言、`check-version-identity.sh`、`build-prod.sh` 注释；Web `package.json`；根 `version.json`。当前均为 0.1.9，合并 main 前需收敛为 0.1.10。
- DB：versioned 终点保持 `V0.1.7`；本轮新增 `R__0.1.10_admin_password.sql`（超管种子口令 AdminP@ssw0rd），修改 `R__application_center_menu.sql`（应用管理顶级归位）。
- 发布通道：main push 触发两仓 `build-release.yml`；Server 构建 `bootstrap-0.1.10.jar`，Web 构建 `dist-<sha>.zip`。语义 Release `0.1.10` 需以 CI 成功制品建立 annotated tag 与版本化资产。UAT 走既有 SSH 通道（密钥可用，已连通）。

## 5. 验证与下一动作

- 已过且未变项直接引用既有证据；受候选影响的 Web 验证已执行，Server 由 main CI 全量门禁复核。
- 唯一下一动作：写入收口回执，执行版本收敛，合并 bugfix→develop→main 并推送，等待 CI；随后创建 0.1.10 tag/Release、部署 UAT、发布后同步。
