# h9-browser.md — 关键交互矩阵（浏览器操作 + 网络响应索引）
时间: 2026-09-08 12:41:47  会话: admin（cookie 会话）  前端: vite dev localhost:5173

| # | 交互 | 操作前 | 操作后/结果 | 网络响应索引 |
|---|---|---|---|---|
| 1 | 命令重试按钮（运行记录/命令 tab） | h9-commands-before.png | toast「已重试：新命令 2097183018439000065（PENDING）」+ h9-retry-after.png | POST /iot/runtime/commands/{id}/retry → 200（RETRY 记录入库） |
| 2 | 连接测试（连接配置第一行） | 列表 UNKNOWN/HEALTHY | h9-connection-test.png（测试中→结果 toast） | POST /iot/connections/{id}/test → 200 {category:SUCCESS} |
| 3 | 设备流程接入开关（设备管理） | 开（ON） | h9-device-switch-off.png → h9-device-switch-on.png（开关往返） | POST /iot/device-manage/{id}/process-access/{flag} → 200；SQL 终态=1 |
| 4 | 流程动作弹窗三来源切换（流程设备动作） | h2a-configured.png（FIXED） | h9-flow-action-formfield.png（FORM_FIELD/流程变量面板切换 DOM 证明） | POST /workflow/defs/{id}/iot-device-action → 200（保存回读） |
| 5 | 脚本试运行/发布 | g6-script.png | （前轮已完成并锁定 L10：JS/Java 发布+试运行） | POST /iot/scripts/{id}/dry-run|publish → 200 |
| 6 | 规则发布/触发记录 | h3-strategies.jsonl | 规则发布 PUBLISHED + 触发 FAILED/SUCCESS/PENDING 三态 | POST /iot/rules/{id}/publish → 200；GET triggers |
| 7 | 运行记录详情 | g6-runtime.png | 消息/命令/脚本/流程触发四 tab 真实数据 | GET /iot/runtime/* → 200 |

反断言：无假按钮（重试实际生成新命令、测试实际更新健康状态）、无错误成功提示（失败操作触发 FAILED 记录）、无明文凭证（连接页 ******）。
