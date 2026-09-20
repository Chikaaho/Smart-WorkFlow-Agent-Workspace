# G9b 实际结果

## 正向（最终实现快照，全部独立原始流）
- Server 正式门禁：1361 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS（server-gate-final.log）
- Web 四门 exit 0：typecheck 0 error、lint 0 error（1 warning）、test 1185 passed + 3 skipped、build ok
- 新增范围聚焦专项含于全量（I6 通知收口 17+1、迁移全链 H2/PG、G7 演练、G7b 幂等升级）
- 计数与原始输出逐字一致（command.txt 与各 log 文件）

## 反向
- 失败→修复→仅重跑受影响门（修复链见 command.txt），不以旧总数或两个既有 spec 代替新增范围

## 覆盖边界
- 门禁计数为最终快照（Server e941d74 / Web 0a746e3），此后除回执/账本/账本附件外无代码/迁移/配置变化
