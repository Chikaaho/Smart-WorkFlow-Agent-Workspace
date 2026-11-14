# planning-review-112-04：1.1.2 阶段 4—5 通过，阶段 6 阻塞不成立

2026-11-15｜规划｜依据 `execution-112-04.md`｜阶段 4、5 **PASSED**；阶段 6 的 BLOCKED **驳回**，执行方继续阶段 6。

## 1. 阶段 4—5 结论

**通过。**
- 版本：Server pom 和 CI 断言已改成 `1.1.2`（`68c07ceb`），Web package.json 已改成 `1.1.2`（`52ed983`）。
- 合并：两个仓都走完六步合并链，CI 全部 success。功能分支已删除。
- 发版：Server tag `1.1.2` → `c3724e52`，Release `445377854`；Web tag `1.1.2` → `abfe1339`，Release `445380514`。两个仓的 Latest 都是 1.1.2，制品里的 `build.version=1.1.2` 已经实际回读过。既有 tag 和 Release 没有改动。

## 2. 阶段 6 阻塞不成立

回执说「工作区无部署通道记录」，这不对。正式运维手册 `docs/ops/production-ops.md` §2 写了连接方式：

```bash
~/ssh/ssh/ssh_personal.sh                      # 登录
~/ssh/ssh/scp_personal.sh <本地路径> <远端路径>   # 上传
```

主机和密钥都由这两个脚本封装，手册本身不写 IP 和密钥路径，所以按「凭据」「8.166」这类关键词搜不到。规划已确认本机两个脚本都在，没有读内容。1.0.0 部署脚本（`product/v1.0.0-release/receipts/evidence/stage6-deploy-100.sh`，gitignore）当时直接用了 `~/ssh/config/personal.pem`，可以佐证这个通道一直能用。回执里试过的 `~/.ssh/id_rsa`、`github_ed25519` 都不是这把密钥，所以这次不需要 Owner 提供凭据。

**原因**：手册不在必读链路里。`system.md`、各角色定义、本方向和审查 03 §3 都没有提到它，执行方检索时也没查 `docs/`。方向和审查 03 是规划写的，阶段 6 的交接本应注明「按运维手册部署」，这是规划这边的遗漏。治理入口的修正（把手册列为部署前必读）属于管理员职责，规划已登记，待 Owner 决定。

## 3. 执行方继续阶段 6

先完整读 `docs/ops/production-ops.md`，重点是 §2 连接、§6.4 启停（`start.sh` 要先加载 `server.env`）、§8 发布与升级。然后按 `planning-review-112-03.md` §3 阶段 6 和那里的「唯一值」表执行，范围和顺序都不变：

1. 用手册 §2 的脚本连接。部署前确认剩余空间 ≥3G，备份数据库 dump、`bootstrap.jar`、`server.env`、Web 目录，后缀统一用 `pre112`。
2. 先部署 Server 1.1.2。上传后核对 sha256 和 Release 资产一致，再 stop/start。核对 health、`build.version=1.1.2`、Flyway 仍为 35 行、启动 ERROR 为 0。
3. 再部署 Web 1.1.2：先 `nginx -t`，再 reload，然后核对入口 JS 和根路径返回 200。
4. 在演示环境复测：B1 用受理号和执行编号各取消一次，列表和详情都要显示「已取消」；再复测 B2、B3。截图要用浏览器视口截图。
5. B6：三个仓重拍 `agent-graph.png`。
6. 同步：`version.json`、`CHANGELOG.md`、knowledge 当前状态、两个仓的 README、需求池 P70/P71 改为「已核销（1.1.2）」。memory 由规划维护。

限制照旧：不删、不清演示环境数据；测试账号和口令不写进回执；不在会话里输出密钥内容。

回执 `execution-112-05.md`。

## 4. 进度

共 7 个阶段：已完成 5 个（评估、实施、验收、合并、发版）；进行中 1 个（部署与同步）；未开始 1 个（结束）。下一步由执行方继续阶段 6。
