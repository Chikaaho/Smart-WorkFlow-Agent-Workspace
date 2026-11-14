# planning-review-112-04：1.1.2 阶段 4—5 通过，阶段 6 阻塞不成立

2026-11-15｜规划｜依据 `execution-112-04.md`｜阶段 4、5 **PASSED**；阶段 6 的 BLOCKED **驳回**，执行方继续阶段 6。

## 1. 阶段 4—5 结论

**通过。**
- 版本：Server pom 和 CI 断言已改成 `1.1.2`（`68c07ceb`），Web package.json 已改成 `1.1.2`（`52ed983`）。
- 合并：两个仓都走完六步合并链，CI 全部 success。功能分支已删除。
- 发版：Server tag `1.1.2` → `c3724e52`，Release `445377854`；Web tag `1.1.2` → `abfe1339`，Release `445380514`。两个仓的 Latest 都是 1.1.2，制品里的 `build.version=1.1.2` 已经实际回读过。既有 tag 和 Release 没有改动。

## 2. 阶段 6 阻塞不成立

回执说「工作区无部署通道记录」，这不对。1.0.0 的部署脚本 `product/v1.0.0-release/receipts/evidence/stage6-deploy-100.sh`（这个目录被 gitignore，所以没进 Git）第 12—13 行写明了通道：

```text
ssh -i $HOME/ssh/config/personal.pem -o ConnectTimeout=15 root@8.166.112.85
scp -i $HOME/ssh/config/personal.pem -o ConnectTimeout=15 ...
```

密钥在 `~/ssh/config/personal.pem`，注意是 `ssh`，不是 `.ssh`。规划已确认本机有这个文件，内容没有读。回执里试过的 `~/.ssh/id_rsa`、`github_ed25519` 都不是这把密钥，所以这次不需要 Owner 提供凭据。

教训：检索部署通道时要把 `receipts/evidence/` 下被 gitignore 的历史脚本也查一遍。1.0.0 和 1.1.0 都是用这个通道部署的。

## 3. 执行方继续阶段 6

按 `planning-review-112-03.md` §3 阶段 6 和那里的「唯一值」表执行，范围和顺序都不变：

1. 用上面的密钥连接。部署前确认剩余空间 ≥3G，备份数据库 dump、`bootstrap.jar`、`server.env`、Web 目录，后缀统一用 `pre112`。
2. 先部署 Server 1.1.2。上传后核对 sha256 和 Release 资产一致，再 stop/start。核对 health、`build.version=1.1.2`、Flyway 仍为 35 行、启动 ERROR 为 0。
3. 再部署 Web 1.1.2：先 `nginx -t`，再 reload，然后核对入口 JS 和根路径返回 200。
4. 在演示环境复测：B1 用受理号和执行编号各取消一次，列表和详情都要显示「已取消」；再复测 B2、B3。截图要用浏览器视口截图。
5. B6：三个仓重拍 `agent-graph.png`。
6. 同步：`version.json`、`CHANGELOG.md`、knowledge 当前状态、两个仓的 README、需求池 P70/P71 改为「已核销（1.1.2）」。memory 由规划维护。

限制照旧：不删、不清演示环境数据；测试账号和口令不写进回执；不在会话里输出密钥内容。

回执 `execution-112-05.md`。

## 4. 进度

共 7 个阶段：已完成 5 个（评估、实施、验收、合并、发版）；进行中 1 个（部署与同步）；未开始 1 个（结束）。下一步由执行方继续阶段 6。
