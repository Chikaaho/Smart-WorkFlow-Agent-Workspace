# G8a 实际结果

## 正向
- 候选在独立实现与 G9b 门禁之后、追加证据与版本投影提交 `4af109d0ec7759a996bb12f0d45f7ed7203dec89` 之后生成。
- 三仓互校：Server `e941d74ffb3e5388e1b3ac3efb234d4634436aea`（clean）/ Web `0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6`（clean）/
  Workspace `4af109d0ec7759a996bb12f0d45f7ed7203dec89`；SHA 均由 git 工具读取。
- 迁移：H2 终点 V92（92 条）/ PostgreSQL 终点 V92（90 条），与 G9b 门禁断言一致
- 门禁计数：Server 1361/0/0/0；Web 1185 passed + 3 skipped；当前 SHA-256 回读：MANIFEST `520b8db57f829c2bb737c31d887bc2c6365587be9b3137e9044d85f624ee53f5`、version `9c1a24675c7bc7d3b47a6d8bb775e79e56518a8f8c2a4d92a4df47c5d11def24`。
- `MANIFEST.json` 与 `G8a/manifest-snapshot.json` 字节一致（MATCH）。

## 反向
- Server/Web status clean；Workspace root status 仅显示 Server 内本轮误生成的临时 evidence 目录，未进入候选代码；G5b 不写为通过（外部未验证显式登记）。
- 无标签、无 Release、未推送（发布门禁=Owner 授权）

## 覆盖边界
- manifest 记录 Workspace 候选提交 `4af109d…`，manifest 自身及后续回执若再次提交不改变 Server/Web 代码候选；Server 内临时 evidence 目录未纳入候选代码，待环境允许时可精确清理。
