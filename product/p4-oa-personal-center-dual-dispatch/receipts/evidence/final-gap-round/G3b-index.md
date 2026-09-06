# G3b 索引：真实混合历史/动作分页（提示05 §3/§4）

## §2 事实
- 被验证路径：MyProcessedRealSourceTest（sw-bootstrap，真实 Flowable 引擎 + 真实 H2/Flyway + 真实 MyBatis-Plus 租户拦截器）→ 真实 BpmTaskFacadeImpl.queryProcessedPage/countProcessed → 真实 BpmMyProcessedController 合并分页。无 mock 参与查询链。
- 场景输入（正反对象全部真实存在于数据源，每用例唯一用户防跨方法污染）：
  I1 本人经真实审批核心完成（ACTION+finished 双源重复对象）；I2 本人完成的无 ACTION 旧历史（引擎直接完成）；I3 平台真实终止路径（runtimeService.deleteProcessInstance，与 BpmTaskFacadeImpl.terminateProcess 同语义）产生的 assignee=本人、deleteReason 非空、从未办理任务；I4 独立任务 deleteTask("deleted")；I5 其他用户完成。
  setUp 断言：引擎 finished+assignee=本人 计数=4（I1—I4），证明取消/删除对象确实在数据源中，非先删再查。
- 结果判据：默认来源并集=应展示集合、交集空、total 精确；同数据重复读取顺序稳定；取消/删除/非本人不入任何页。

## 断言→原件→实际值→结论
1. 反向对象入源 → MyProcessedRealSourceTest.setUp（g8b 清单 com.sw.ck.bootstrap.p4overlap.MyProcessedRealSourceTest.txt，Tests run: 3, Failures: 0, Errors: 0）→ finished 计数=4 → 成立。
2. 正向+反向：默认来源跨页 → defaultSource_mixedRealObjects_exactPagination → 逐页 union={I1,I2}、无重复、total=2（非上界）、两次读取顺序一致、I3/I4 不出现 → 成立。
3. 双来源 → separatedSources_actionAndHistoryCompat → ACTION total=1（I1）；HISTORY_COMPAT total=2（deleteReason 过滤把 4 条本人 finished 中的 2 条取消/删除排除；修复前该口径=4）→ 成立。
4. 富化同位 → itemsEnrichedWithInstanceLinkage → 每条含 processInstanceId/businessKey/handleTime；I1 实例状态 APPROVED 可回查 → 成立。
5. 实现修复 → BpmTaskFacadeImpl.queryProcessedPage/countProcessed 增加 `.taskWithoutDeleteReason()`（源码哈希见清单）→ Flowable finished 历史含取消/删除（deleteReason 非空），已办兼容来源只承认本人实际完成（D4）→ 按真实结果修复。

## 边界
全量物化方案的数据增长代价已在代码注释与本索引披露：按请求 pageSize 循环拉取本人全部记录后内存排序切片——个人已办为用户自有记录，增长与本人办理次数线性相关，本轮不建压测平台、不截断结果制造 total。
