# P61 执行补充提示05：集成 locale 八值精确核对

> 角色：规划（Planner）  
> 日期：2026-09-20  
> 功能：p61-user-facing-message-humanization  
> 状态：`IN_PROGRESS`

## 1. 输入与替代关系

读取：

1. `planning-review-p61-scope-corrected-completion-02-not-passed.md`
2. `completion-receipt-p61-scope-corrected-02.md`
3. `planning-execution-prompt-p61-user-facing-message-humanization-04.md`（只作已锁定范围参考）

本提示替代提示04，成为P61唯一当前执行入口。旧提示、旧回执和C1/C3证据只作追溯，不同时作为待办。

## 2. 唯一原子缺口

| ID | 失败事实 | 完成条件 | 反向断言 | 对象身份 | 最小证据 | 下一动作 | 合法停止 |
|---|---|---|---|---|---|---|---|
| C2-V | 当前证据未输出集成工作树中4个目标键的中英文实际值 | 工具从当前集成工作树读取zh-CN/en-US，并从P61锁定提交`d110ed8`读取同4键期望值；8项逐字比较全部`match=true`，`missing=0`、`duplicate=0`、`allMatch=true`、exit0 | 不得用回执声明、正则测试、键集对账或手抄值替代精确比较 | 当前P53集成工作树 + P61锁定提交`d110ed8` | 一份工具脚本、一份机器可读JSON、一份exit文件 | 生成并实际运行精确比较，回读JSON | 只有提交身份不可读取或集成工作树不存在且无可恢复路径时按契约阻塞 |

目标键固定为：

- `errDynamicTableExists`
- `errFieldTypeUnknown`
- `errOperatorTypeMismatch`
- `errOperatorUnsupported`

## 3. 锁定项与禁止重验

- C1、C3和审查01锁定的全部产品行为继续通过。
- 不运行Server命令，不运行Web全量测试，不启动浏览器，不修改产品代码，不再调整文案。
- 不要求P61证明P53其他键、布局、样式或全量文件完整性；这些由P53验收。

## 4. 证据与提交

证据目录只新增：

- `p61-integrated-locale-value-check.mjs`
- `p61-integrated-locale-value-check.json`
- `p61-integrated-locale-value-check.exit.txt`

JSON至少包含：当前工作树路径/身份、期望提交、4个键×2语言的`expected`/`actual`/`match`、`missingCount`、`duplicateCount`、`allMatch`。期望值必须由工具直接读取`d110ed8`，当前值必须由工具直接读取集成工作树；禁止在脚本中手写期望文案。

全部通过后只新增：

`product/p61-user-facing-message-humanization/receipts/completion-receipt-p61-scope-corrected-03.md`

回执只引用上述三份证据并核销C2-V。不得提交阶段汇报，不得自行写`PASSED/COMPLETED`或进入阶段三。

## 5. 相对提示04的变化

- **删除了什么**：删除C1、C3和全部产品/测试待办。
- **原子化了什么**：只保留当前集成locale的八值精确比较。
- **替代路径是什么**：用工具直接读取当前文件与锁定提交，替代声明、正则和键集对账。
- **提交条件如何判定**：8项`match=true`且`missing=0`、`duplicate=0`、`allMatch=true`、exit0。
