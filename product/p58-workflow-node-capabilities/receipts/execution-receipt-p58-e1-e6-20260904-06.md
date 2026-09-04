# P58 E1-E6 执行回执 06

日期：2026-09-04；角色：Executor；功能状态：`VERIFYING`。

## 结论

本轮已接手 E1—E6，完成直接相关代码修正、浏览器/后端/数据库行为取证、最终质量门和隔离库清理。P58 不改为 `PASSED` 或 `COMPLETED`，等待 Planner 独立验收。

## 本轮修正

- Web 请求拦截器为浏览器请求生成非秘密 `X-Request-Id` 并输出 method/path/status/requestId；流程编辑器在加载完成前锁定保存，避免异步回读覆盖策略。
- 普通审批、会签比例、意见默认值与版本校验、FAILED 实例重试拒绝、通知幂等查询和 dev-only 注册 Adapter 已落地。
- 修正会签候选快照结算：同一流程实例和节点下的不同 Flowable 子任务不再因 `taskId` 不同而遗漏失效；新增回归测试锁定该 SQL 条件。

## E1—E6 证据索引

| 包 | 本轮锁定内容 | 附件 |
|---|---|---|
| E1 | 四种策略保存/校验/刷新、表单提交、审批提交的浏览器 requestId 与服务端 ACCESS method/path/status/userId 关联；DOM 及实例/定义时间 | `attachments/e1-browser-correlation-20260904-06.txt` |
| E2 | 合成调试身份、401 负向矩阵、非秘密写入 spy 为零、运行期身份回读；未读取任何认证存储值 | `attachments/e2-debug-auth-20260904-06.txt` |
| E3 | 同一意见表单 v1→v2、独立非空意见、ANY/ALL/RATIO66/RATIO67、重复结算、比例向上取整和候选快照回归 | `attachments/e3-opinion-consensus-20260904-06.txt` |
| E4 | 合法发布后的运行期类型错误、FAILED、Flowable/官方待办读回、重试 HTTP 2313 和 UI 失败提示 | `attachments/e4-failed-instance-20260904-06.txt` |
| E5 | 真实注册 dev Adapter 通过通知入口的 SUCCESS/FAILURE/TIMEOUT、幂等重放、Adapter 调用序号、PG 读回和生产扫描 | `attachments/e5-real-adapter-20260904-06.txt` |
| E6 | 最终全量门禁、PG/Flowable 逐表 P58 范围清理、三仓 HEAD/差异指纹、附件校验和及临时进程清理 | `attachments/e6-final-gates-20260904-06.txt` |

完整非秘密对象 ID 索引：`attachments/ids-20260904-06.env`。

## 最终门禁

- Server：`MAVEN_OPTS="-Xmx2g" mvn -q test`，退出码 `0`；Surefire 聚合 `1035 tests / 0 failures / 0 errors / 0 skipped`，报告文件 `152`。
- Flyway：H2 + PostgreSQL 全链路专项，退出码 `0`。
- Web：typecheck、lint、Vitest、build 全部退出码 `0`；`117 passed + 1 skipped` 文件，`1110 passed + 3 skipped` 测试，lint `0 errors / 47 warnings`，build 成功。
- Production：`mvn -q -Pprod -DskipTests clean package` 退出码 `0`；`NO_JAR_DEBUG_ADAPTER_MATCH`、`NO_FRONTEND_DEBUG_FIXTURE_MATCH`。
- 三仓 `git diff --check` 均退出码 `0`。

## 指纹

- root HEAD=`5b44220cc33ea0e61ec2dab3034eece10e43f2f9`；Server HEAD=`2bffd94dd060f32fd19adee5a7c77192c84bfbfe`；Web HEAD=`802971df711397a9d7c9bc20c6c8f5ba60ec70b0`。
- root working-set manifest=`ef315ab5c4e17b38f3eae223505f24d0623cd59ed6e74a5ff5685e64ddfa3a17`；Server=`94be16f7429ab63ed0ff2d8e59fb37d97cf81f345813dba5700d008a5270e55c`；Web=`e454ec5e2f2b500d038fc1d6d31879a6f61b2e9c5f056c6baf077377ce00e6de`。
- 关键修正文件哈希：`ParticipantSnapshotRecorderImpl.java=c2f54901ee3728af698ec8869f0b2036d559ca70247f1dfa252774eb2a49cdb2`；`ParticipantSnapshotRecorderImplTest.java=9105e01156e098256d0e2a9cadc22dc81efe9672d4b7262ddd76991749089254`；`NotifyMessageMapper.java=d2f0630b0ad2f398892e26daed9adbd21b4527bd9271c46a34df5ae3f9ac4057`；`EditProcessDefDialog.vue=6eb74b2476e897c7b88a30d02c3977c76bb00f3ce6a57bcbf27dd0a2c98fc6e2`；`request/index.ts=8218791011c98c7570be3857c48ac3e1dd897ee3333747b3f4db2a1266858a79`。

## 清理边界

独立 PostgreSQL 验收库中的 P58 业务表、Flowable runtime/history/definition-data、动态表和合成身份/权限均已按附件中的逐表结果归零；保留的 `skeleton_approval`、基础绑定及内置系统身份属于隔离库基线，不是 P58 对象。数据库进程、精确临时辅助文件和本地端口均已关闭或移除。无 Cookie、localStorage、sessionStorage 值或认证秘密进入证据。

会签快照修正以 post-fix 单元回归锁定，运行矩阵附件明确区分了修正前运行数据与修正后代码证明；不把单元回归冒充新的运行期造数。

## Planner 接手项

所有本轮授权执行项已完成，下一步为 Planner 读取本回执及七份新附件并独立验收；P58 当前仍为 `VERIFYING`。
