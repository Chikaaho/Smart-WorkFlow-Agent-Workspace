# i6-04 对象总账本（二级提示02 · 采集 2026-09-14）

## 源码指纹（登记起点，G8a 之前必须重新生成）
- Server HEAD: 7ccecac364a63f2a017d8c5f33dbd45b9e99dccc
- Web HEAD: a7868258e83ded3500c47d9984c66dab5c008fa8
- Workspace HEAD: 3c66aa7f4e2d66d821a243903165e62c5d6e3aac
- 源库与迁移身份：Flyway 双方言终点 V90；PG 旧库演练与 H2 演练 DB 身份分开登记（见 G7b/objects.md）

## 流程与通知对象（G1a/G4/G6 同一集合）
- 租户 T=100（U1 管理员 id=1、U2 审批人 id=2、U3 无权 id=99）；租户 T2=200（同名资源用于隔离矩阵）
- 实例 P=<待建>；任务 K=<待建>；动作 A=APPROVE；消息 M=<流程通知建成后登记>
- 指数退避恢复链沿用文件库 target/i6-restart-db（G1c-E；变更则登记新旧 ID）
- PG 旧库升级演练 DB：target/i6-g7b-pg（真实 PG，非 fresh-chain；凭据仅本地安全配置）

## 采集规则
- 每原子目录必须含 command.txt/stdout.log/stderr.log/exit-code.txt/objects.md/actual.md。
- 正反断言、零残留与清理计数在 actual.md 引用原始行号。
- Mock 检查：默认 dev 直连后端；dev:mock 不参与证据链。
