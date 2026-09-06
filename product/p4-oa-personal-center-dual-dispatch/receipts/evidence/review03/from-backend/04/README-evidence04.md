# evidence/04 目录说明（P4 补证03，2026-09-05 深夜～09-06 凌晨）

- fixtures03.py / fixtures03-run.out：夹具脚本（幂等）与本轮运行输出（用户/角色/表单/流程/绑定 ID 与权限差异回读）。
- g1c-evidence.py / .out：G1c 行为证据（普通身份 403×5 反向、管理编辑正向、绑定解析回填）。
- g2a-evidence.py / .out：G2a 行为证据（受理前字段校验 1401、受理冻结、幂等、绑定失效保留内容与修正重提）。
- g4b-evidence.py / .out：G4b 在线证据（会签实例 P0 结算、取消任务消失、迟到 NORMAL 命令、已办不冒充）。
- g4b-late-final.out：最终快照上迟到命令最小重演（LATE_FINAL=FAILED retry=4 任务不存在；BIZ_PROCESSED 对应更早的存活任务合法审批）。
- g6b-*.py/.out/.json：G6b 双进程窗口实验（文件 H2，端口 18082/18083，P0 撤权 + 可见范围撤权 + 零副作用 + 身份无残留）。
- g6b-process-A.log / g6b-process-B.log：G6b 两个进程的运行日志；文件库 target/p4-g6b-db.mv.db 已删除并读回确认。
- backend-p4-final.log / -02 / -03：历史运行日志（含一次端口占用导致的截断混写，保留作历史）；-03 为守卫放宽前运行时。
- backend-p4-final-04.log：当前运行中服务（最终 jar，PID 31852，01:55 启动）的活日志；哈希取冻结副本 backend-p4-final-04-frozen.log。
- backend-full-test-final.log / backend-full-summary.txt：最终源码全量 `mvn -q test`（exit 0；169 报告/1108/0/0/0）。
- frontend-gates.log / frontend-build.log：前端 typecheck/lint/test/build 门禁原始输出（全部 exit 0；121 files/1153 tests passed + 3 skipped；1840 modules）。
- browser-my-instances-approved.png：最终运行时浏览器链终态截图（业务用户"我发起的"显示 20a4ada0 已通过）。
- trace.out：夹具脚本调试期追踪残留（历史保留）。
- 环境变量：运行命令使用一次性生成的本地 dev 密钥（SW_CIPHER_KEY/SW_LOGIN_DIGEST_SECRET）与本地生成 RSA dev 私钥（/tmp/sw_dev_rsa.pem，非仓库、非生产秘密）。

## G6b2（最终 jar 上的重做，取代首轮 g6b-* 作为 G6b 主证据）

- g6b2-fixtures.out / g6b2-window.json：最终 jar（01:55 打包，含队列守卫+消费前拒绝补偿+受理前字段校验+终态守卫放宽）上的 G6b 夹具与窗口对象。
- g6b2-process-A.log（18082，双车道 3600000ms 暂停）/ g6b2-process-B.log（18083，正常轮询）。
- 阶段1 行号：W1—W8（内联脚本输出保留于本文档同目录会话记录；关键值：P0 有界等待返回 ACCEPTED、双命令保持 PENDING、撤权后 dsp permissions=[]、biz by-key 1000）。
  阶段1 输出见 g6b2-phase1.out。
- g6b2-phase2.out：R1—R8 终态读回（P0 消费拒绝/可见范围消费拒绝/草稿 FAILED 保留内容/零副作用/拒绝后正向提交 COMPLETED）。
- g6b2-phase2-readback.out：R9 补读回（dsp 新实例 RUNNING，证明拒绝后消费链健康）。
- 清理：18082/18083 进程已停止；target/p4-g6b-db2.mv.db 已删除并读回确认不存在。
