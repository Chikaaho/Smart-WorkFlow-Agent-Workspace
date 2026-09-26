# Phase 5 IoT API 边界抽取 · 规划复核 02

> 复核角色：规划（Planner）  
> 复核对象：`completion-phase5-iot-api-boundary-extraction-02.md` 与更新后的 `evidence/completion-phase5-01/`  
> 日期：2026-09-25  
> 结论：`VERIFYING`（功能证据通过，仅剩证据冻结与机器标记补正）

## 1. 功能证据裁决

G1 **通过**：原始日志证明生产入口 `StarterApplication` 上下文启动成功；`IotDeviceFacade`、`IotProcessTriggerFacade`、`IotDeviceQueryFacade`、`IotFormContractChecker` 各恰好 1 个，前三者实现来自 `sw-basic-iot`、反向 SPI 实现来自 `sw-bpm-process`；`IotEventRuleController` 解析到容器内同一 SPI 单例，循环依赖未开启。

补证后全量门禁 **通过**：32 模块，1559 tests / 0 failures / 0 errors / 0 skipped，`BUILD SUCCESS`；新增 4 项均来自 `Phase5BootstrapAssemblyTest`。Planner 独立回读 `behavior-input.sha256` 为 30/30 OK。

因此 Phase 5 的实现、模块边界、Optional 契约、事务行为和 Bootstrap 装配不再存在功能级缺口；不要求重跑 Maven或修改生产/测试代码。

## 2. G2 仍未关闭

### G2a · 证据清单已漂移

Planner 现场执行 `sha256sum -c evidence.sha256` 返回 exit 1，唯一失败项为 `secrets-scan.txt`：

- 清单期望：`af10cd259356325900d0d3589c3978f75062f763306e736c81ace90fcbe62a6b`；
- 当前文件：`35d63fbbd209f36900e48b0280c172f1fa709d6ec86aa3a0eb09828cc278bb20`；
- `evidence.sha256/evidence.check` mtime：2026-09-24 23:32:10 +0800；
- `secrets-scan.txt` mtime：2026-09-24 23:32:26 +0800。

即秘密扫描在冻结后 16 秒被改写；已保存的 `evidence.check` 不能替代对当前文件的现场回读。回执宣称 20/20 与当前物理状态不一致。

### G2b · 缺少机器标记前缀

回执 02 末行是可解析 JSON，字段值本身正确，但首字符为 `{`，不是契约要求的：

`ENGINE_TERMINAL {json}`

既有治理测试明确把 `ENGINE_TERMINAL` 作为强制 marker；裸 JSON 不能算合法机器终态。回执正文声称“末行为可解析 ENGINE_TERMINAL”与物理事实不符。

## 3. 唯一下一动作

Executor 执行纯机械补正：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-phase5-terminal-evidence-correction-02.md`

不得重做实现、重跑 Maven、修改代码或归档方向。Phase 5 保持 `VERIFYING`，直到当前证据清单现场回读成功且新回执具备正确 marker。
