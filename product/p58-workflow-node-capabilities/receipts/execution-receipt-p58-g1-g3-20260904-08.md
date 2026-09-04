# P58 收口执行回执 08：G1—G3

执行角色：Executor  
执行日期：2026-09-04  
依据：`planning-execution-prompt-p58-workflow-node-capabilities-07.md`  
当前状态：`VERIFYING`（本回执不改变规划验收状态）

## G1a / G1b

- G1a 已在真实 SpringBootTest + H2 内存运行中完成 RETURN；同一实例的 RETURN action 与 `sw_notify_message` 查询均有实际行，通知 ID、收件人 1、`WF_RETURNED`、`SUCCESS` 可复核：`attachments/g1-notification-20260904-08.txt:3-12`。
- G1b 固化当前正式身份关系：`test_1 -> formal_user_id=1`；第二候选使用独立正式用户 ID 及独立浏览器请求的既有证据保留在 `attachments/f1-browser-correlation-20260904-07.txt:127-169`，本轮关系摘要与全部对象 ID 在 `attachments/g123-runtime-marker-20260904-08.txt:3-31`、`attachments/ids-g1-g3-20260904-08.env:3-21`。

## G2a / G2b

- G2a 对同一实例、同一节点执行前后 SELECT，含绑定参数与真实行；处理人 1 为 `HANDLED`，候选 2 为 `INVALIDATED`，无 `PENDING`、无活动 Flowable 任务，动作含意见表单及 v1：`attachments/g2-snapshot-20260904-08.txt:3-14`。
- G2b ANY 真实生成 3 个不同子任务；处理人 1 完成后用户 2、3 均带失效原因，零活动任务；用户 2 重放自己的已取消子任务返回 `BaseException:任务不存在`，动作数 1→1：`attachments/g2-snapshot-20260904-08.txt:16-33`。

## G3a / G3b

- G3a 运行环境为 dev profile 的 H2 memory JDBC，端口 18086；Maven 测试退出码为 0，18086/18084/5173 均无监听，临时探针源码与 class 均已移除：`attachments/g3-environment-production-20260904-08.txt:3-16`；完整运行原始输出：`attachments/g123-runtime-command-20260904-08.txt`。
- G3b `-Pprod clean package` 退出码为 0；扫描 21 个服务 JAR（含 336 个嵌套 JAR）及固定 Web `dist` 根，精确 fixture 扫描结果为 server class 0、nested content 0、Web 0，所有产物哈希及 248 个 Web 文件哈希在 `attachments/g3-production-scan-20260904-08.txt:1-345`。

## 交付与门禁

- 全部 G1—G3 非秘密对象 ID 已集中于 `attachments/ids-g1-g3-20260904-08.env`。
- 本轮新增附件、完整原始运行输出、生产构建输出和产物扫描输出均持久化于工作区；本回执及附件不含临时目录引用。
- 本轮未追加业务源码修改；既有 F1—F3 完整后端、前端、Flyway 门禁回执继续作为已完成门禁依据。新增 G1—G3 附件的校验和由 `attachments/checksums-g1-g3-20260904-08.txt` 固定，并以 `shasum -c` 复核。
- 本轮提示项剩余可执行项：0。下一步交 Planner 独立验收；不得据此回写 `PASSED` 或 `COMPLETED`。
