# v0.0.2 最终发布规划验收 01（PASSED）

2026-09-07；Planner。审查对象：

- `../passed/direction-v0.0.2-oa-release.md`；
- `release-v0.0.2-oa-01.md`；
- `evidence/release-v0.0.2-oa-01/ui-login-page.png`。

## 1. 裁决

**PASSED。v0.0.2 发布完成并经规划确认。**

本裁决只确认本次发布方向，不改变已于阶段三确认的业务功能数、清单计数、P 编号或测试基线。

## 2. 验收对照

| 验收边界 | 证据与判断 | 结果 |
|---|---|---|
| 只发布两个代码仓库 | 回执仅记录 Server/Web 的提交、分支、标签、Actions、Release 与服务器部署；工作区无发布提交 | PASSED |
| 两仓 `develop → main` | Server 远端 develop=`a5113b815170654a0ca3390cd284dd1ead6be55c`、main=`20fffc1ddec13ea665fc388f4243c6e063974883`；Web develop=`9495a114d528fa8c4a4c122b7b788e7bd9f0a5d7`、main=`0bf6e8925059e4c254328c5d1643ebd8c1a2943e`；均给出双父合并关系和远端回读 | PASSED |
| 精确标签 `0.0.2` | Server annotated tag peeled 到 `20fffc1d…`；Web annotated tag peeled 到 `0bf6e892…`；均等于各自最终 main，无移动、覆盖或 `v` 前缀 | PASSED |
| README 与 Logo | 两仓 README/Logo 已进入最终 main；Logo SHA-256 与 Owner 原图同源，README 与 A8 已验收快照一致 | PASSED |
| 自动发布与产物 | 两仓 `Build & Release (main)` 均 completed success；分别生成 `build-<sha>` Release 与后端 JAR、前端 ZIP 资产 | PASSED |
| 服务器实际生效 | 后端产物上传后哈希一致、生产迁移 V47→V58、健康状态 UP、线上 challenge 端点生效；前端新 bundle 返回 200，线上登录页与动态验证码实际渲染，随附截图可见 | PASSED |
| 工作区保持干净边界 | 工作区无新提交、推送、标签或 Release；本地 main 身份未变，本轮只追加本地规划回执与证据 | PASSED |

## 3. 版本身份

- Server v0.0.2：`20fffc1ddec13ea665fc388f4243c6e063974883`；
- Web v0.0.2：`0bf6e8925059e4c254328c5d1643ebd8c1a2943e`；
- 两仓语义标签：`0.0.2`；
- Server 自动 Release：`build-20fffc1ddec13ea665fc388f4243c6e063974883`；
- Web 自动 Release：`build-0bf6e8925059e4c254328c5d1643ebd8c1a2943e`。

## 4. 非阻断说明

- 服务器部署 JAR 与 GitHub Actions Release JAR 的哈希不同。回执已给出二者均从同一最终 main 提交构建的来源说明，服务器上传前后哈希一致；本次以提交 SHA、远端标签和服务器行为共同绑定版本身份。该差异不阻断本次发布裁决。
- 本次服务器验收覆盖健康状态、数据库迁移、公开认证端点、前端 bundle 与登录页渲染。真实账号登录后的业务链路已属于此前功能验收范围，本发布方向没有要求重新执行。
- Server develop 工作树中的 `功能清单.md` 与上传运行产物、Web 的三个杂散 JSON 均未进入发布提交，也未删除，符合范围隔离要求。

## 5. 终态

发布方向归档到 `product/v0.0.2-oa/passed/direction-v0.0.2-oa-release.md`。当前无活动业务功能或发布任务，等待 Owner 下一项需求。
