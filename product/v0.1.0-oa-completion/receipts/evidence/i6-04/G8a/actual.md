# G8a 实际结果

## 正向
- 候选在独立实现与 G9b 门禁之后、追加证据与终态校验提交 `9929dba0d8905e0a0f0c0bbf07ba146f9b0f5ecd` 之后生成；生成前三仓工作树均 clean。
- 三仓互校：Server `e941d74ffb3e5388e1b3ac3efb234d4634436aea`（clean）/ Web `0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6`（clean）/
  Workspace `9929dba0d8905e0a0f0c0bbf07ba146f9b0f5ecd`；SHA 均由 git 工具读取。
- 迁移：H2 终点 V92（92 条）/ PostgreSQL 终点 V92（90 条），与 G9b 门禁断言一致
- 门禁计数：Server 1361/0/0/0；Web 1185 passed + 3 skipped；当前 SHA-256 回读：MANIFEST `393978ad6a40a1a6e12d63e7f1e72cc6ed27d87e14b4d1a53bb79d193c845526`、version `9c1a24675c7bc7d3b47a6d8bb775e79e56518a8f8c2a4d92a4df47c5d11def24`。
- `MANIFEST.json` 与 `G8a/manifest-snapshot.json` 字节一致（MATCH）。

## 反向
- Server/Web/Workspace status 均 clean；G5b 不写为通过（外部未验证显式登记）。
- 无标签、无 Release、未推送（发布门禁=Owner 授权）

## 覆盖边界
- manifest 记录 Workspace 候选提交 `9929dba…`；manifest 自身及后续回执若再次提交不改变 Server/Web 代码候选。
