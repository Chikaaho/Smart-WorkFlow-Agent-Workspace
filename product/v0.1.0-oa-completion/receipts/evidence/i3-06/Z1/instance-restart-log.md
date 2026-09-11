# 冻结候选实例重启记录（零代码改动、零重打包）

- 时间：2026-09-11 22:08—22:12（Z2 行为采集会话中途）
- 事实：DEBUG 级实例日志（每 5s 命令调度器 SQL）撑爆磁盘（ENOSPC），原实例 PID 96764/96797
  日志各 264MB/260MB 已原位截断（各保留尾部 24MB），随后按同 JAR 重启。
- 重启命令：与 i3-03 证据 `env/start-instances.sh` 同构（SW_CIPHER_KEY/SW_LOGIN_DIGEST_SECRET/
  SW_LOGIN_RSA_PRIVATE_KEY=/tmp/i3-03/rsa.pem，测试专用非生产密钥），新增
  `--logging.level.root=INFO` 止血。顺序启动：A(8081) 健康后 B(8082)。
- 重启后实例：A PID 5767 @ 8081、B PID 5807 @ 8082（由 /tmp/i3-03/instance-a2.pid、
  instance-b2.pid 记录；调度日志 instance-a2.log / instance-b2.log 为 Z6 提取源）。
- JAR 校验：sw-bootstrap-1.0.0-SNAPSHOT.jar sha256=383ae1a7725319ae…（与 candidate.json 一致）。
- 结论：冻结后零代码修改、零重打包；实例重启不改变候选工件本身，行为采集继续绑定
  snapshotId=i3-06-frozen-a。
