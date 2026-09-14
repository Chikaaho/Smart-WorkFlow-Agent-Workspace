# G8a 实际结果

## 正向
- 候选在独立实现与 G9b 门禁之后生成（时序：1ea3d41→4f556df→3676af1→e941d74 门禁通过→证据提交 fa4bddf→gitlink 946a3b9→manifest）
- 三仓互校：Server e941d74ffb3e5388e1b3ac3efb234d4634436aea（clean）/ Web 0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6（clean）/
  Workspace 946a3b916beea53a2ac476217eaeb2fc08f8af61；无手抄 SHA（全部 git rev-parse 工具输出）
- 迁移：H2 终点 V92（92 条）/ PostgreSQL 终点 V92（90 条），与 G9b 门禁断言一致
- 门禁计数：Server 1361/0/0/0；Web 1185 passed + 3 skipped；hash 校验输出在 command.txt

## 反向
- 不含未提交变化：Server/Web status clean；G5b 不写为通过（外部未验证显式登记）
- 无标签、无 Release、未推送（发布门禁=Owner 授权）

## 覆盖边界
- Workspace 自身的 G8a manifest 提交与回执04提交使 Workspace HEAD 晚于 manifest 内记录值（自引用语义，
  manifest 记录的是代码候选时点 946a3b9；Server/Web HEAD 不受影响）
