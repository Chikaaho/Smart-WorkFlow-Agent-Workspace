# P64阶段Ⅰ规划复审06

2026-10-09；Planner。依据[回执06](phase-1-completion-receipt-06.md)、[复审05](planning-review-phase-1-05.md)、[提示04](planning-execution-prompt-p64-phase1-04.md)及原A01—A04/相关A11—A12。独立读取九包索引、JUnit逐case/worker握手、调用链提取、API与DB原件、Git原输出、ADR与当前路由；不直接读取coding/knowledge，不运行业务或Git。

**阶段Ⅰ保持VERIFYING，P64保持IN_PROGRESS。** 九组中接收02a/02b/04b/06a/06b/07a；04a仅余并发收尾查询、05a仅余来源权限断言、08a余收尾证据/覆盖与文档一致性。当前唯一业务执行入口为[提示05](planning-execution-prompt-p64-phase1-05.md)，追加回执07。Hook新事件交Admin分别核查，独立于业务裁决。

## 接收并有限锁定

- 02a：8个实际XML testcase全通过；5个worker身份与134217728堆上限可回读，索引把OOM/500ms超时、限流/有界等候、释放/恢复/shutdown逐case关联到断言。02b工具原提取给出三入口到同一端口/池调用链，与02a共享限额证据。不是仅凭集合计数或唯一实现名称裁决；grep的“排除test”标题与输出包含test不一致不影响实际生产调用链结论。
- 04b：I6任务93687011首草稿前GET=EMPTY/v4，表单再发后GET=DRAFT/v4、无新增field_r6_only；原FAILED命令明确未知字段，最终同任务SUBMITTED/v4/submitted_by=2，转办请求targetUserId=2、完成命令键尾:2，身份一致。提交响应duplicated=true仅证明已受理重放，成功由持久最终行承担。15/0+7/0逐case覆盖无草稿、缺快照与历史绑定兼容。X2/X3身份分别登记不混用。
- 04a子事实：X7双e_23/node_3和重叠命令、双冻结/取消记账解释成立；冲突测试2/0支持禁止同事务重放。修复后命令各一条retry_count=1且COMPLETED；另一个真实同库对照文件`04a-comparison-node3-e23.txt`包含I6=9360cee4、I7=75af1262各e_23=1/node_3=1，采信该替代原件，不因一份SQL失败推翻已有结果。汇聚终态与分支收尾仍需对应原件，见下。
- 05a子事实：3份XML逐case通过、I6三来源真实快照，类型精确匹配、可空/缺值、ROWS/集合与事件相应case接收；来源权限仍保留原复审05差异，未因名单过滤用例名再次核销。
- 06a：映射原查询与5份可靠性XML可读，三类型映射口径准确，幂等/异载荷冲突/空超限及恢复状态各关联实跑case。06b：同X5原EXPIRED/R1 FAILED保留，R2 COMPLETED；新目标a65a0702持久APPROVED且同business_key，API展示STARTED，有权恢复code0，handler1/匿名分别业务code403/401。附件只存JSON，**没有HTTP状态行，故不独立追认为HTTP403/401**，业务拒绝已满足边界；不强制重放拒绝。后端恢复收敛接收，新增Web入口门禁证据由08a补齐。
- 07a：真实启用v6在役I6与关闭v7新I7明确区分，MATCHED/意图/二段命令与新实例零exec/零ref原查询成立；恢复不依赖图配置的case实际在06a Controller XML，采用共享原件纠正07a索引位置。旧0.1.6升级链继续锁定。实例最终收尾汇总归08a，不重复跑OFF矩阵。
- 原01a/01b/03a/03b/03c/07b、768实写链/权限、P63/VB、READY传播继续锁定，只有新实现涉及的回归需要核验。engine100/process342两份日志BUILD SUCCESS及相应XML成立；Web本次改1文件，不能由旧四门结果代替新快照证据。
- 清单实际100条，逐条文件存在且SHA256全匹配；“98件”是转录差异，修正新回执计数即可，不重跑业务。清单正确不意味着文件内容本身成功。
- Git固定截止原件：Server HEAD/远端87afbe9a32147672d1b90e321bfb6088a4bce313（含代码578ef6b）；Web53eec1e71d0370fa0ff85e8c80db3d93187982a1；根提交后e185105c9ed58c85ee1009bc5462f5d1898499d9、远端同SHA、0/0、仅两gitlink M。纠正memory将代码SHA当Server HEAD的当前口径；不无限回填自SHA。

## 剩余差异（分类后收敛）

| ID | 最新事实与原标准 | 下一步 |
|---|---|---|
| P1-04a / A01/A12 | `04a-postfix-i6-i7-counts.txt`实际是`ERROR: column "process_instance_id" does not exist`，不能称成功计数。替代对照已有e_23/node_3各1，但node_end、单动态分支及任务均完成缺成功原查询。归类缺证据/查询错误，不是已证明修复失败。 | 对保留的同I6/I7只读查缺失汇聚/分支/任务终态，保留失败原件，新输出指明真实列与对象；不重做并发。 |
| P1-05a / A02/A03 | “来源权限”仍只指`shouldOnlyIncludeAuthorizedVariables`且解释为配置名单过滤，没有权限主体/合法非法来源/允许或拒绝的实际断言关联。归类缺断言证据，尚不判权限产品缺陷。 | 安全提取既有相关case的关键安排和实际断言位置/结果，说明来源权限如何落实；若现有case只测名单，则仅补来源权限最小单测/集成。 |
| P1-08a / A12/§0.4.2 | 服务退出`08a-1/2`不存在，目录只有Git txt；0 RUNNING/全终态/零在途仅自述；覆盖没有P64登记和reconciliation实际核验；三ready仍提示04/复审05；ADR头修订04而§4正文仍旧不可恢复边界；Web最新四门仅摘要。归类缺证据及当前文档冲突。 | 六个总剩余原子项（本组四项）见提示05。优先提取既存输出；退出历史缺失允许当前同环境精确读回，不重启已停服务。补覆盖/ADR和新Web结果，Planner修当前可写路由。 |

两观察项保持既有边界：同键异载荷2426不偷偷改历史请求，转办换键为已验证恢复；SUPERSEDED_BY_ROUND旧痕迹保留，修复后单激活已有替代查询。没有新产品范围裁量或实施授权缺口。

功能47、清单46/22/22=90、ADV64、问题57、其他P状态、P62延期/新策略OFF、Server gitlink78495dc不变；阶段Ⅱ/Ⅲ与整体尚未通过。前次Admin事项依Owner历史结案；约21:50两宿主新失败由[新续办任务](../../../todo/admin-zcode-codex-hook-failures-20261009.md)处理，已发往原Admin聊天，不归因于已核实业务行为。

规划收尾回读：当前五memory、P64/需求池待办和三ready均指复审06/提示05/回执07；7份关键文档42条相对链接实际存在。memory总17,997字节，最大3,863字节。Admin消息发送成功且任务快照为active/inProgress；其反馈已定位ZCode21:41:49的289ms失败、正在分别关联两宿主链路，这是进展而非最终根因或修复通过。knowledge及本批次Git仍由授权Executor/Admin各自按精确范围收尾。
