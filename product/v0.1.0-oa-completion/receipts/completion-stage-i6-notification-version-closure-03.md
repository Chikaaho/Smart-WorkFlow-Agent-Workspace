# P60 I6 通知与版本收口实现回执 03（一级补充提示轮）

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 唯一执行入口：`planning-execution-prompt-stage-i6-notification-version-closure-01.md`
> 机器状态：`EXECUTION_SUBMITTED`（阶段 `VERIFYING`）

## 1. 原子账本逐项状态（提示01 §2 × §7 格式：ID → 位置 → 结果 → 边界）

**本轮关闭（真实行为证据，非声明）：**

| 原子 | 位置 | 结果（层级=集成运行/真实 SQL） | 覆盖边界 |
|---|---|---|---|
| **G1c** 重试至明确终态 | `sw-basic-notify-biz/.../i6/I6G1cRecoveryExhaustedBootTest.java`（第三 JVM） | 同一文件库经第三次 JVM 启动：盘退避窗口逐轮到期 → 自主调度连续追加 attempt（序号 1 起连续无跳号）→ 达到最大次数后 failure_class=**RETRY_EXHAUSTED**（明确终态）且 1.5s 空档实验证明停止继续投递；业务行恒为 1 | 指数退避真实写回；仅 FEISHU 固定失败对象；不含真实 Provider 维度（属 G5b） |
| **G2e** 变量矩阵 | 同目录 `I6NotifyClosureIntegrationTest.g2e_variableMatrixFailBeforeSend` | 未知/非法占位名（模板创建即拒）/超长值（2000 上限）在发送前明确失败；合法变量值可正常发送（正向对照防“全拒绝”假阳性）；发送前失败零收件箱残留 | 缺失变量由 L10 锁定；类型不符在 `Map<String,String>` 契约内以类型非法名与超长证明 |
| **G2f** 渲染安全矩阵 | 同测试类 `g2f_safetyMatrix` | `data:` / `vbscript:` / tab 编码 / 大小写 `JAVASCRIPT` / `onclick` / `OnMouseOver` 六类危险输入的实际净化输出断言（六/六清除）；合法 `<p>/<b>/<a href=https://…>` 不被破坏（正向对照）；深链目标类型白名单（WF_TASK/WF_PROCESS/SYSTEM 构建）不承载任意 URL |净化器实现于 EMAIL/卡片目标格式载体；FEISHU/WECHAT_WORK 卡片仅承载受控对象类型（结构+正向） |
| **G2g** 规则最小矩阵 | 同测试类 `g2g_ruleCrudMatrix` | create→get→update→事件覆盖（原事件空/新事件命中）→toggle 停启用→路由随规则生效→delete 后 get NOT_FOUND；同一租户内订阅按用户隔离（user7 持偏好、user99 空/查无越权）；服务层写历史零改写（G2d/L12 已锁） | “无权用户 HTTP 级规则管理拒绝”属 @PreAuthorize 层，需真实 HTTP 证据，归 G4 环境轮 |
| **G3d（部分）** 伪造租户护栏 | `NotifyFacadeImpl.forgedTenantGuard`（send/attemptDelivery 双入口）+ `g3d_forgedTenantRejected` | 登录租户 100 请求租户 200 → FAILED 原因“请求租户与认证租户不一致”；伪造业务对象在租户 200 零写入（真实 SQL 回读） | 模板/规则/订阅/消息/尝试的写侧跨租户拒绝由行级拦截 + G3a 已锁部分承载；“详情/深链/回执”空白格仍缺 |
| **G8a** 候选固定与 manifest | `release/0.1.0/MANIFEST.json`（生成器 node+git 工具） | 三仓候选 SHA 由 git 工具读取并**逐项回读一致**（ws/srv/web 三 match=true）；manifest sha256=`adc058d3a619df1bf2eff8ba78c9a530ef4e7e52ee01249bd6dee55f0cd086e3`；含迁移终点 V90 与未验证登记（G5b/G4）如实标注 | 候选以本回执提交时点为准，代码漂移即触发受影响证据失效 |

**本轮仍开放（如实登记，未冒称）：**

| 原子 | 状态 | 已尝试/未尝试 | 下一动作 |
|---|---|---|---|
| **G1a** 审批对象环流 | 未关闭 | 需真实 BPM 流程 + 失败渠道业态（bootstrap 全量 boot 未启动）；现有 G1 系列证据覆盖通知对象与恢复链，**审批事务断言未取得** | 在真实/近似 XML 流程测试里完成一次审批并注入失败渠道后断言任务/实例状态未回滚 |
| **G3e/G5a 主体映射权威** | 未关闭 | 无 Provider 通知主体安全映射存储（I5 摘要不可反解未接入） | 设计 V91 迁移 + 租户隔离可失效映射表 + `NotifyTargetResolver` 权威实现 + 双租户正负测试 |
| **G3f** 真实 HTTP 零残留扫描 | 未关闭 | prod SQL 日志收敛（配置级，回执01）已有；真实 HTTP 响应/日志扫描未运行 | 启动 dev 后端访问记录/收件箱端点并做响应+日志 grep 扫描 |
| **G4a/G4b** 浏览器链 | 未关闭 | 未启动真实前端+后端 UI 自动化（本会话未运行）；"无法运行"非外部阻塞——登记为**执行中待办**而非法阻塞证据 | 启动真实环境跑 PC/H5 正负链 |
| **G5b** 五外部渠道 | 未关闭（外部条件） | Owner 凭据未到位（2026-09-14 状态不变，如实登记） | 凭据到位后逐渠道 |
| **G6a/G6b** 事件与多身份矩阵 | 未关闭 | 需真实流程对象运行；本轮 G1c/G2 系列证据不外推 | 同一轮真实环境执行 |
| **G7b** PG 旧库升级 | 未关闭 | 本会话未执行 PG 演练（H2 演练 L14 已锁） | 用真实 PG 旧基线库执行同型演练并回读 |
| **G9b（部分）** 收件箱/规则/移动 spec | 未关闭 | 本轮 +5 原子测试后仍缺收件箱/规则/移动聚焦 spec | 按提示补齐后重跑四门 |

## 2. 门禁与本轮变更

- 门面伪造租户护栏（方向 §3.6 产品语义落地）、模板变量超长上限、净化器无引号事件属性扩建为本轮代码修复，并全部由 17/0/0/0 的 I6 集成矩阵锁定。
- 最后代码状态（Server a687f60 → 本轮变更 + Workspace manifest/回执提交）之后的最小受影响门禁：notify-biz 全模块 —— 下一步在最终快照门禁时 `mvn test` 全量重跑得出最终计数。

## 3. Git

- Workspace 本回执 + manifest 修复提交；Server 伪造租户护栏与测试新增待随本节奏一并本地提交；Web 无新改动。
- 远程推送/标签/Release 保持未授权门禁。

## 4. 自检对照（提示01 §8）

- G1a/G3e/G3f/G4/G6/G7b/G8 部分/G9 部分：**未全部关闭**（如实见 §1 表）。
- G5b：外部条件缺失事实 + 解除条件已登记；但独立工作尚有未穷尽项（G3e/G5a、G3f、G4、G6、G7b），故按契约**不报告阻塞**，保持 `EXECUTION_SUBMITTED` 并列出精确 `next_action`。
- 浏览器/流程/数据库对象登记：本轮未新建跨域对象登记表（G 系列复用既有固定对象 task-g1/g2*/g3*）；近似替换无。
- manifest/SHA/计数工具生成回读一致（见 G8a 行）。
