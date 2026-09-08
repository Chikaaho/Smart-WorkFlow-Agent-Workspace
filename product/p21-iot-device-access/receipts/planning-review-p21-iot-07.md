# P21 IoT 设备接入第七轮规划复验

> 验收角色：规划（Planner）  
> 验收日期：2026-09-08  
> 当前输入：`completion-p21-iot-07.md`  
> 上一入口：`planning-execution-prompt-p21-iot-05.md`  
> 功能结论：**VERIFYING（行为已闭合，终态冻结未通过）**  
> 后续唯一执行入口：`planning-execution-prompt-p21-iot-06.md`

## 一、结论

第七轮新增的浏览器原生 accessibility/DOM 状态能够关闭全部剩余产品行为：H3b2 展开的候选集合与 eligible 响应一致；H9b 两种连接测试结果及掩码可见；H9c 双语言试运行均受控拒绝且可与 execution 对象关联；H9d 规则、trigger 列表和详情身份一致；H9e 八条 JSONL 分别覆盖四个标签及四个详情，当前文件可逐行解析且对象 ID 正确。H10a-R 也已从锁定日志机械更正为 1182/0/0/0。

但本轮仍不能裁决 `PASSED`：`completion-p21-iot-07.md` 修改时间为 17:13:52，H10d Validator/compare 为 17:14:34，而关键 `final-h9e-r3/states.jsonl` 最后修改时间为 17:17:50。即行为附件在回执冻结和 Validator 之后发生变化，违反提示 05 的固定顺序；H10d 所称“冻结回执与最终证据一致”缺少最终证据集合的冻结依据。

该差异只属于终态证据生命周期，不推翻当前已经独立读取通过的产品行为。后续不得重跑浏览器、Broker、API、测试或修改实现，只重新冻结现有证据并生成一份新的 completion08 终态包。

## 二、本轮新增锁定项

以下 L34—L39 与 L1—L33 一并删除出待办：

| 锁定ID | 结论 | 证据与边界 |
|---|---|---|
| L34 H3b2 合格候选排除 | PASSED | 原生展开下拉只显示 Owner温感；eligible 响应仅含 `2097131606828916738`，不含固定不合格对象 `999999999999999999` |
| L35 H9b 连接测试页面 | PASSED | 原生页面状态同时显示 Owner HEALTHY/SUCCESS、错误连接 UNHEALTHY/AUTH_FAILED，两行凭证均只显示掩码 |
| L36 H9c 双语言试运行页面 | PASSED | Java/JS 原生页面显示各自受控副作用拒绝；运行 API 与 H9e 详情完成 executionId、scriptId、error、sideEffect=0 关联，无真实发布/下行 |
| L37 H9d 规则与 trigger 页面 | PASSED | 原生规则、触发列表和详情三状态绑定同一 rule/trigger/processInstance/formSnapshot |
| L38 H9e 四类运行详情 | PASSED（行为） | `states.jsonl` 当前为 8 条可解析且各自不同的原生状态，四个 tab 和四个详情对象与 L23 锁定 ID 一致；终态冻结另见 H10d |
| L39 H10a-R 测试计数更正 | PASSED | 12 个模块汇总行机械合计 1182/0/0/0 并回读 BUILD SUCCESS，未重跑测试 |

## 三、提示 05 逐项核销

| 原子 | 结论 | 核销事实 |
|---|---|---|
| H3b2 | PASSED | 转 L34 |
| H9b | PASSED | 转 L35 |
| H9c | PASSED | 转 L36；原生脚本页、运行 API 与 H9e 详情组合完成身份关联 |
| H9d | PASSED | 转 L37 |
| H9e | PASSED（行为） | 转 L38；文件内容通过，但被终态冻结后修改 |
| H10a-R | PASSED | 转 L39 |
| H10d | FAILED | `states.jsonl` 晚于 completion07 与 Validator；最终证据集未在终态校验前冻结 |

## 四、规划口径更正

提示 05 的“Token”措辞范围过宽。证据中的固定 loopback 调试身份标记不是 Owner 凭证、正式 Token 或可外部复用的秘密，不计执行失败；后续门禁更正为“不得新增 Owner 凭证、正式 Token 或其他秘密”。Owner 提供的真实口令精确扫描无命中。

## 五、后续裁决

只剩 H10d-R4：冻结现有行为证据、生成 completion08、再执行 ledger 比对和终态 Validator。L1—L39 禁止重验；若现有行为附件或实现再次变化，对应锁定项才按变化影响失效。

当前状态保持 `VERIFYING`，P21 未核销，正式功能数、清单和正式基线不变。
