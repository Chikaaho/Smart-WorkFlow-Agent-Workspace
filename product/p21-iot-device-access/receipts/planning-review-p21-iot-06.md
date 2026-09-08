# P21 IoT 设备接入第六轮规划复验

> 验收角色：规划（Planner）  
> 验收日期：2026-09-08  
> 当前输入：`completion-p21-iot-06.md`  
> 上一入口：`planning-execution-prompt-p21-iot-04.md`  
> 功能结论：**VERIFYING（第六轮未通过）**  
> 后续唯一执行入口：`planning-execution-prompt-p21-iot-05.md`

## 一、结论

第六轮不能裁决 `PASSED`。本轮新建的 `-r2` 包已关闭绝大多数剩余运行缺口，新增锁定 H1、H2、H3a、H4b、H7、H9a、后端最终快照测试及终态机械校验；H3b 的三来源保存与刷新也已形成可见页面证据。

但浏览器侧仍存在不可接受的证据替代：H9c、H9d、H9e 共 13 张应代表不同标签、列表和详情的 PNG 实际 SHA-256 完全相同，打开后均为纯黑图；H9b 截图只显示连接列表和按钮，没有显示 HEALTHY/AUTH_FAILED、结果文本或凭证掩码；H3b 未显示打开后的候选集合，无法证明不合格设备不在候选中。相应 `cua.jsonl` 是事后摘要式 JSON，`network.json` 仅有请求与 200 状态，不能替代缺失的页面结果。

此外，H10a 原始 Maven 日志确实是全 Reactor `BUILD SUCCESS`，12 个模块汇总行合计为 **1182 tests / 0 failures / 0 errors / 0 skipped**，源码 815 文件前后指纹一致；回执和 `verify.log` 所写“43 tests”只是最后一个模块的汇总，属于纯报告转录错误，不否定本次全仓测试行为，但后续回执必须改用 1182。

## 二、本轮新增锁定项

以下 L25—L33 与既有 L1—L24 一并删除出待办：

| 锁定ID | 结论 | 证据与边界 |
|---|---|---|
| L25 H1 新 Topic 正反链 | PASSED | 新 nonce 经 Owner Broker 到达合法 Topic；服务端拒绝未配置 evil Topic，外部订阅未收到 evil 消息；邪路 message/command/trigger 均为 0 |
| L26 H2 首次与重复 ACK | PASSED | 新命令 BROKER_ACK→SUCCESS；重复 ACK 后 status/result/replyTime/version/correlation 不变，其他命令摘要及事件/属性/trigger/scriptExec 计数不变 |
| L27 H3a 三策略真实运行 | PASSED | 三条独立已发布规则经 Owner MQTT 实际触发：BLOCK=FAILED、CONTINUE=SUCCESS 且有实例、MANUAL=PENDING，身份与前后计数完整 |
| L28 H3b 三来源保存回读 | PASSED（局部） | 四张非重复页面图与三个保存请求证明 fixed→formField→processVariable→刷新仍为 processVariable→恢复 fixed；不锁定候选集合排除项 |
| L29 H4b 类型正例 | PASSED | 已发布新规则将合法 BOOL/DATE/REFERENCE 映射进真实 trigger 与流程实例，formSnapshot/formData 值一致且计数 0→1 |
| L30 H7 租户读写隔离 | PASSED | PostgreSQL 集成运行证明两租户自写 affectedRows=1、交叉写=0，列表各仅含自身对象 |
| L31 H9a 设备流程接入开关 | PASSED | 不同哈希页面图与网络请求证明 OFF、刷新仍 OFF、恢复 ON；最终页面/API 状态一致 |
| L32 H10a 后端最终快照 | PASSED | 原始日志为全 Reactor `mvn test`，12 个模块汇总共 1182/0/0/0 且 BUILD SUCCESS；815 个源码文件测试前后指纹相同。43 是回执转录错误，不是测试总数 |
| L33 H10b/H10c 机械完整性 | PASSED | 75 项 r2 manifest 独立 `shasum -c` 通过且双向集合为空；最终回执末行与 Validator input 当前逐字一致，Validator 在回执冻结后 exit=0 |

## 三、提示 04 逐项核销

| 原子 | 结论 | 核销事实 |
|---|---|---|
| H1 | PASSED | 转 L25 |
| H2 | PASSED | 转 L26 |
| H3a | PASSED | 转 L27 |
| H3b | PARTIAL | 三来源保存/刷新转 L28；候选列表与不合格设备排除仍无页面/DOM 原始结果 |
| H4b | PASSED | 转 L29 |
| H7 | PASSED | 转 L30 |
| H9a | PASSED | 转 L31 |
| H9b | FAILED | 页面图未显示两种测试结果和凭证掩码；摘要及 HTTP 200 不能替代页面结果 |
| H9c | FAILED | Java/JS 两图同哈希且均为纯黑图，页面提示与 executionId 不可见 |
| H9d | FAILED | 三图同哈希且均为纯黑图，规则、trigger 列表和详情不可见 |
| H9e | FAILED | 八图同哈希且均为纯黑图，四个标签与详情不可见 |
| H10a | PASSED（行为） | 转 L32；后续只更正 43→1182 的报告值，禁止重跑 |
| H10b | PASSED | 转 L33；manifest 只证明文件完整性，不证明纯黑图内容合格 |
| H10c | PASSED | 转 L33 |
| H10d | FAILED | ledger 与 terminal 字段虽逐字一致，但把上述未关闭浏览器原子全部写为 COMPLETED、remaining=0，语义不成立 |

## 四、失败诊断与后续裁决

- H3b 候选与 H9b：**缺证据**，已有页面图没有展示目标结果。
- H9c—H9e：**工具取证路径失败**，系统截屏产出同一纯黑图；黑图本身不证明产品失败，但执行方随后用摘要文字宣称页面完成，仍不足以验收。
- H10a 数量：**纯报告转录错误**，规划已从原始模块汇总锁定真实值 1182，不要求重跑测试。
- H10d：**终态账本错误**，必须随真实剩余项重新生成。

后续改用浏览器/CUA 原生 accessibility/DOM snapshot 或浏览器原生 screenshot；不再使用本轮产生纯黑图的 macOS 系统截屏路径。只补 H3b 候选、H9b—H9e 页面结果、测试计数转录及最终账本，其他 L1—L33 禁止重验。

当前状态保持 `VERIFYING`，P21 未核销，正式功能数、清单和正式基线不变。
