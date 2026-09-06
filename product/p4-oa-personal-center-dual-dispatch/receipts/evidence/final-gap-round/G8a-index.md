# G8a 索引：源码→产物→运行→证据时点绑定、进程生命周期与收尾

## 断言→原件→实际值→结论
1. 源码→产物 → COLLECTION-MANIFEST-final-gap-round.json → 本轮 28 个变更源/测试文件 + V55 迁移（h2+postgresql）逐个 sha256 工具计算回读；sw-bootstrap-1.0.0-SNAPSHOT.jar sha256=3ee63fa70d38fd41b0fad3ffe460ccc3349f7dfb7bb5802e2a2203a133b391fe（mvn -q package -DskipTests exit 0，13:36 产物，实体文件仍在工程 target/ 可复核）→ 成立。
2. 产物→运行 → g8a-lifecycle-and-cleanup.txt → 8080 在线服务以该 jar 启动（PID 88559，13:39:51）；G1a/G5a 在线证据全部产生于该进程生命周期内 → 成立。
3. 进程生命周期（同库重启）→ g8a-lifecycle-and-cleanup.txt + g4a-g6b-phase1/phase2 服务器日志 → phase1 PID 94735 起 16:13:15 停 16:14:52（文件库，轮询暂停 3600000ms）；phase2 PID 94858 起 16:15:07 停 16:17:11（同文件库正常轮询）；同库=g4a-db/g4a 文件 URL 两相位一致 → 成立（G4a 业务结果 B1/B6 见 G6b 索引 3—4，不再重复）。
4. 限定收尾 → g8a-lifecycle-and-cleanup.txt → 两进程与 8080 全部停止（16:17:11）；文件库删除后读回 "No such file or directory"；8080 内存库随进程销毁（本轮无运行中残留服务）→ 成立。
5. 文件清单回读 → COLLECTION-MANIFEST-final-gap-round.json → 40 条 entries 全部 exists=True、哈希回读一致；jar 元数据单列（kind=jar-artifact），与已验证文件分列 → 成立。
6. 转录更正 → 本索引登记：上轮 g1a-object-map.md 标题 PID31852 为誊录错误，原运行日志属 PID39302（审查05 §L14 指认）；旧文件为锁定原件不修改，以本登记更正来源 → 完成。

## 边界
未 Git 提交推送（不授权）；源码清单只含本轮变更文件（全功能历史变更在既有锁定清单中）；jar 不入库（>100MB），指纹+工程内实体文件绑定。
