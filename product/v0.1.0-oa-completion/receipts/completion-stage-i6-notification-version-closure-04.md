# P60 I6 通知与版本收口 实现回执 04（二级提示02 执行）

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 唯一执行入口：`planning-execution-prompt-stage-i6-notification-version-closure-02.md`
> 上一回执：`completion-stage-i6-notification-version-closure-03.md`（审查03 判 VERIFYING）
> 结论：**除 G5b（唯一外部未验证项）外全部原子 DONE，各自拥有独立证据包；G8a 候选已在门禁后生成并回读。自验通过，待规划验收。阶段保持 `VERIFYING`，P60 保持 `IN_PROGRESS`。**
> 环境收口（Owner 指令）：固定验证码门禁启用——server 以纯 dev profile + ch.dev.test-mock 启动（I5 门禁代码路径，未改代码），实测 challenge→login 固定验证码 1234 通过（`evidence/i6-04/object-setup/login-fixed-captcha.js` 原始流）；浏览器链全程零人工读图。

## 1. 原子账本逐项（格式：原子ID → 证据目录/原始文件:行号 → 实际结果 → 覆盖边界）

| 原子 | 证据 | 实际结果 | 边界 |
|---|---|---|---|
| G1a | `evidence/i6-04/G1a/`（g1a-run2.log、sql-backread.txt、objects.md） | 同一审批任务 K=d0191c97 完成后 EMAIL 投递 FAILED（attempt=1 RETRYABLE、重试已排定）；实例 P=d018f57a 保持 APPROVED；APPROVE 重复受理 duplicated:true 不重复办理；失败投递 SQL/收件箱可查 | 单租户单实例；EMAIL 成功链属 G5b |
| G1c-E | `G1c-E/`（stdout.log:48,68-72、exit=0） | I6G1cRecoveryExhaustedBootTest 1/0：尝试序号连续至 RETRY_EXHAUSTED 后停止、消息 1 条；聚焦回归 17/0；boot3.log 恢复调度真实链旁证（attemptNo=6） | 文件库对象未变更 |
| G2e-V | `G2e-V/`（stdout.log、exit=0） | 未知键/缺失/超长发送前拒绝、合法成功，17/0 内含断言；消息/尝试 0 | 类型不符由 G2e-T |
| G2e-T | `G2e-T/`（g2et*.json、db-rows.txt、actual.md） | NUMBER/DATE/EMAIL/ENUM 类型不符 400 且零落库；合法渲染成功；直发幂等回照 | TEXT 仅长度上限 |
| G2f-R | `G2f-R/`（stdout.log、exit=0） | 净化断言 17/0（脚本/事件/危险协议/编码变体零残留）；浏览器最终载体面由 G4a/G4b 覆盖 | — |
| G2f-J | `G2f-J/`（shot-01-forged-link-reject.png、actual.md） | 伪造 link_type=EVIL + link_id=javascript:alert(1)：服务端拒跳转语义、前端 URL 不变、危险协议零执行；合法 WF_PROCESS 同源跳转已证（G4a shot-04） | 邮件正文转义由 G2f-R |
| G2g-C | `G2g-C/`（effect-raw.log、effect-chainC/D/E.log、db-effect.txt） | 组合规则真实生效（链A 双渠道）；停用规则退出组合（链E 仅 IN_APP 兜底）；非法 EMAIL-only 组合 400；历史行零改写；RETRY 策略排定重试 | 删除路径由 G3d-R 跨租户负向 + 管理端点覆盖 |
| G2g-P | `G2g-P/`（matrix-raw.log、actual.md） | u1 管理创建 200、u3 403；本人订阅可调；强制站内信 400 不可关；他人偏好不可改 | notify:rule:view 无菜单登记（产品事实，actual.md 登记） |
| G3d-R | `G3d-R/`（matrix-raw.log、tpl-raw.log、db-backread.txt） | 同名规则/模板双租户共存；伪造 tenantId 落权威租户；跨租户 get 403、put/delete/toggle 404 不泄露存在性 | — |
| G3d-A | `G3d-A/`（g3da-matrix.log、db-counts.txt） | 跨租户记录列表/详情/必要详情/重发/深链/已读全部 404（T200 普通+管理员同拒）；不产生尝试/回执副作用 | — |
| G3e-I | `G3e-I/`（email-matrix.log、db-rows.txt） | EMAIL 解析矩阵全绿：有效进入真实投递、缺失/跨租户/删除用户 fail closed、直发幂等 1 行；客户端无地址旁路 | PHONE：resolver 已实现但生产 SMS 适配器未落地（Owner 未选型；dev 由 P58 调试适配器占位，不作证据）——登记为边界 |
| G3f | `G3f/`（pre-fix-leak.txt、postfix-scan.txt、http-exposure.log） | **修复真实泄露**：dev 日志 141 处 sys_user 行（邮箱/bcrypt）→ log-impl Slf4jImpl + 行级 SQL 收敛 info；修复后扫描 0 命中；HTTP 响应最小暴露（摘要无正文、掩码接收人、必要详情独立权限+审计） | 前端状态面由 G4a/G4b 核对 |
| G4a | `G4a/`（shot-01..06、command.txt、actual.md） | PC 真实后端无 Mock：登录（固定验证码）→收件箱分页/未读/标记已读/全部已读/删除→深链→实例详情抽屉→偏好页→u3 路由不可达 404 | 流程图渲染对新 key 缺定义目录项（监控页既有展示边界） |
| G4b | `G4b/`（shot-01..04、actual.md） | H5 375px 同一消息集合；深链 ref 恢复抽屉；reload 重新鉴权恢复；跨租户 u1_200 打开 T100 ref →「流程实例不存在」 | 移动办理动作为 I4 锁定 |
| G5a-I | `G5a-I/`（g5a-matrix*.json、db-rows.txt、v91-applied.txt） | 绑定/启停/重复拒绝/伪 Provider/跨租户 fail closed/最小暴露（仅摘要） | 不要求真实发送 |
| G5b | `G5b/`（availability-check.txt、actual.md） | **唯一外部未验证项**：Owner 未提供五渠道凭据与短信选型；EMAIL 失败/重试/恢复真实链已证，成功链待真实 SMTP/Provider | Owner 解除条件不变 |
| G6a | `G6a/`（events-part1..4.log、copy-chain2.log、return-round2.log、deadline-chain.log、event-matrix.txt） | 方向§6-96 全事件真实通知：TODO/通过/驳回/退回(+新轮次)/不通过/废弃/转办/委托/征询/加签/催办/抄送(copy record 审计)/时限提醒（调度器真实触发）；新轮次不被误杀 | 单节点 RETURN 2306 反向语义 |
| G6b | `G6b/`（visibility-raw.log） | 同实例多身份可见链（发起人/审批人/抄送人 200；无权 403）；u3 冒办→命令 FAILED「无权处理该任务」零副作用；转办他人 403 | — |
| G7b | `G7b/`（db-backread.txt、baseline-build-boot.log、upgrade-boot.log） | 真实 PG18：受支持基线 V87（pre-I6）携带既有通知/模板/失败尝试/流程历史升级至 V92；同 ID 90001-90003/90011/90012/90020 全保留；FAILED 不删；旧脚本代克隆库升级在 V13 失败→如实登记非受支持基线 | 历史为固定 ID 回灌集 |
| G9b | `G9b/`（server-gate-final.log、web-*-final.log、attempt 日志、actual.md） | Server 正式门禁 **1361/0/0/0 BUILD SUCCESS**；Web 四门 exit 0（typecheck 0 err、lint 0 err、1185 passed+3 skipped、build ok）；失败→修复→仅重跑受影响门（4 项修复链登记） | 计数为最终快照 |
| G8a | `G8a/`（manifest-snapshot.json、command.txt、actual.md） | 门禁后生成 0.1.0 候选 manifest（三仓 HEAD 工具采集、H2/PG V92、门禁计数、G5b 显式未验证）；sha256 回读（MANIFEST 80a9c333…、version.json 1fcd2438…）；Server/Web clean | Workspace HEAD 因 manifest/回执提交自引用后移 |

## 2. 本轮修复与实现（授权范围内）

Server（1ea3d41 → 4f556df → 3676af1 → e941d74）：
1. `TaskActionService`：退回后新轮次 TODO_CREATED（方向 §6-96；G6a 取证前真实缺口）。
2. `BpmNotifyLinkAuthorizer`（新增）：深链对象权限裁决（发起人/动作参与人/抄送接收人；fail closed；修复「authorizer 缺失→深链全拒」缺陷）。
3. 日志暴露收敛（G3f）：`log-impl: StdOutImpl→Slf4jImpl`；dev/local 行级 SQL 日志 info。
4. `NotifySubjectBindingServiceImpl`：AesGcmCipher 依赖惰性化（窄测试上下文可创建，使用时明确失败）。
5. `DraftSubmitCommandHandler.onFinalFailure`：draftId 显式 Long 解析（PG bigint 口径与 handle 一致）。
6. 迁移门禁测试计数更新至 V92 终点 + G7b 测试幂等化（e941d74）。

Web（acdd3af → 0a746e3）：
1. `NotifyHome` 操作列「跳转」（受控深链契约，PC 端此前缺失）。
2. `ProcessInstanceList` focus= 深链自动打开实例详情抽屉。
3. `MobileWorkspace` ref 深链恢复抽屉（服务端重新鉴权 fail closed）。

环境铺设（非验收断言，账本登记）：dev profile 固定验证码启动链；T100/T200 管理员 data_scope=0；PG 角色 chikan、smart_workflow.sw_iot_connection；EMAIL 渠道经真实 API 启用；G7b 库按现行脚本重建 V87 基线 + 历史 ID 回灌。

## 3. 与方向/提示的偏差

- G7b 受支持旧基线锚点取 V87（PG 链无 V88/V90 版本）；旧 2 个月前脚本代克隆库判定为非受支持基线（V13 起失败），未伪造升级。
- G3e-I PHONE 部分挂 G5b 同源外部条件（SMS 生产适配器未实现），actual.md 显式登记，不作为 DONE 声明。
- notify:rule:view 无菜单权限码（GET 列表非超管恒 403）为真实产品事实，已在 G2g-P 登记。

## 4. 验收对照（提示02 §8 核对矩阵）

- L1—L16 LOCKED，无无依据重验（仅对象变更牵动的最小复验：G6a/G9b 因退回新轮次修复）。
- 除 G5b 外全部原子 DONE 且证据包完整（§7 目录结构齐备）。
- 对象一致性：G1/G4/G6 同一实例/消息集合（d018f57a 族 + G6a 事件矩阵族，账本登记）；所有替换有新旧 ID。
- 原始流可回读、发生于最后相关实现快照（G8a 前无代码变化；门禁运行于最终 HEAD）。
- PostgreSQL：V87→V92 真实升级、同 ID 回读、无重建/删除/换对象。
- 浏览器：PC/H5 真实后端、Mock 零参与、网络与对象状态勾稽。
- 正式门禁：Server 1361/0/0/0、Web 四门 exit 0，计数与原始输出一致。
- 候选：门禁后生成，manifest 回读一致，无标签/未推送。
- 终态：阶段 `VERIFYING`；P60 `IN_PROGRESS`；功能数 44、清单 ✅46/🟦22/⬜22、ADV64、P 编号零变化。

## 5. 自验结论

自验通过，待规划验收。G5b 为唯一外部未验证项（Owner 凭据/选型未到位，真实工具结果与解除条件见 G5b/actual.md）；其余授权内工作项为 0。

Executor 终态见会话末行机器契约。
