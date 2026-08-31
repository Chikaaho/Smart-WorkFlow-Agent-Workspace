# P51 通用运行时契约收敛提示 2

> 指定角色：管理员（Admin）
> 提示级别：二级收敛
> 唯一活动输入：本文件
> 权威审查：`planning-rereview-admin-p51-consolidated-20260831-01.md`
> 基础方向：`../ready/direction-admin-p51-engine-governance-consolidated.md`

## 一、本轮目标

使 Engine 的阶段三字段、资源与并发规则、终态协议标识全部由通用契约和项目声明驱动，并以完整运行时范围的持久证据证明不存在示例项目绑定。

## 二、唯一剩余缺口矩阵

| 编号 | 必须达到的结果 | 正向断言 | 反向零残留断言 |
|---|---|---|---|
| C1 | 阶段三使用“项目声明且本功能涉及的验证基线集合”，集合允许为空 | Planner 清单和复核规则引用同一通用集合 | 无固定后端、前端、测试、迁移基线必填项 |
| C2 | 资源限制、互斥和并发规则仅从项目说明或仓库工程规则加载 | 已声明动作逐项遵守其约束 | 未声明动作不产生内存上限、编译互斥或并发限制 |
| C3 | 终态 schema 与 marker 使用 Agent Coding Engine 通用标识 | 合法、非法、缺 marker 行为保持原判定语义 | 运行时契约、Validator、Hook、system、roles 中无 `smart-workflow`、`SWF_TERMINAL` 或同义项目品牌标识 |
| C4 | 通用性扫描覆盖全部运行时治理表面 | 扫描目标清单逐项存在并执行 | 不以遗漏目录、未展开参数或命令警告形成 0 命中 |
| C5 | 夹具工程动作具有可审计调用账本 | 声明动作与实际调用逐项一一对应 | 未声明动作调用数为 0 |

## 三、允许读取与修改

允许读取：

- 当前复审、本提示、基础总方向和管理员总回执；
- `system.md`、`roles/`；
- `.codex/governance/`、`.codex/hooks/`、`.codex/hooks.json`；
- `.claude/hooks/`、`.claude/settings.json`；
- 根 README、AGENTS、项目说明模板、通用 knowledge/memory 入口；
- 已锁定治理夹具与证据包。

允许修改：

- `system.md`、`roles/` 中 C1/C2/C3 直接相关内容；
- 终态契约、双平台 Validator、双平台 Hook、配置和契约测试中 C3 相关标识；
- 根级运行时入口中引用旧终态标识的内容；
- `receipts/evidence-admin-consolidated-2/` 新证据包；
- 一份管理员修正总回执；
- P51 顶层索引的最终回执指针。

允许运行治理静态检查、双平台可用的契约测试、Hook 正反行为、夹具调用账本验证、`git diff --check`、限定 diff 和本地中文 Conventional Commit。

## 四、禁止事项

- 不重做根级目录、知识初始文件、双工作区隔离或分支迁移；
- 不读取或修改真实 coding 仓业务实现；
- 不运行真实项目工程动作；
- 不改变终态状态集合、字段允许/禁止关系、阻断次数和 Planner/Executor/Admin 权限；
- 不保留旧品牌标识作为兼容别名；
- 不在通用运行时规则中列出某类技术基线、固定资源值或固定工程动作；
- 不执行远端发布、历史改写、分支或 tag 操作；
- 不生成 Planner `PASSED` 或业务 `COMPLETED`。

## 五、精确修改语义

### C1 阶段三基线

- 唯一终态值清单使用“项目声明且本功能实际涉及的验证基线集合”；
- 项目未声明验证基线时允许空集合；
- 规划复核比较“授权集合 = 实际集合 = 回执集合”；
- 移除按后端、前端、测试、迁移等技术类别固定枚举的必填和逐字比较规则。

### C2 资源与并发

- Engine 只要求执行角色读取并遵守项目已经声明的资源、互斥和并发规则；
- 未声明时不得推断数值、命令、互斥对象或默认限制；
- 行为证据要求改为“对本次实际涉及且已声明的工程动作，提供其约束检查与输出”。

### C3 通用终态标识

- schema、marker、文档引用、Validator、Hook 和测试使用一致的 Agent Coding Engine 通用标识；
- 标识迁移后保持原状态集合、字段 schema、合法/非法判定和阻断语义；
- 旧项目品牌标识在运行时表面为 0 命中，历史 P51 回执不属于运行时扫描范围。

## 六、固定证据文件

新证据包固定为：

`product/p51-agent-coding-engine-decoupling/receipts/evidence-admin-consolidated-2/`

必须包含：

1. `01-stage3-baseline-semantics.txt`：修改位置、空集合/单项/多项示例、固定技术基线零残留；
2. `02-resource-concurrency-declaration.txt`：已声明约束正向、未声明约束零生成；
3. `03-terminal-identifier-migration.txt`：新 schema/marker、运行时旧标识零残留、字段与状态差异为零；
4. `04-terminal-regression.txt`：原 35 用例等价回归及 Hook 合法/非法/缺 marker 输出；
5. `05-runtime-surface-scan.txt`：完整扫描目标清单、实际命令、退出码、无 warning/error；
6. `06-action-call-ledger.txt`：项目声明动作、实际调用账本、未声明动作 0 调用；
7. `07-scope-git.txt`：修改文件、diff check、提交哈希、工作树、未远端发布。

## 七、运行时扫描范围

至少覆盖：

- `system.md`、`roles/`；
- `.codex/governance/`、`.codex/hooks/`、`.codex/hooks.json`、`.codex/config.toml`；
- `.claude/hooks/`、`.claude/settings.json`；
- 根 README、AGENTS、CLAUDE、项目说明模板；
- 根级 `memory/`、`knowledge/`、`todo/`、`search_task/`、`search_fallback/`、`product/README.md`。

所有目标必须先逐项验证存在，再执行扫描。命令出现 warning、error、目标未展开或部分目录不可读时，本项直接失败，不得报告 0 命中。

## 八、提交前门禁

只有以下全部为“是”才允许提交修正总回执：

- C1～C5 每项都有对应持久证据；
- 阶段三基线集合可为空且无固定技术类别；
- 未声明资源/并发规则产生 0 默认约束；
- 运行时旧项目契约标识 0 命中；
- 终态字段、状态和阻断语义与迁移前一致；
- 35 用例等价回归和 Hook 三类输入通过；
- 调用账本中未声明动作计数为 0；
- 扫描无 warning/error，Git 工作树和提交可复核；
- 未触碰锁定项、真实业务实现、分支和远端。

## 九、唯一回执

管理员只返回：

`product/p51-agent-coding-engine-decoupling/receipts/completion-admin-p51-engine-governance-consolidated-2.md`

回执逐项核销 C1～C5，并索引上述 7 份证据。管理员只声明治理修正完成，不裁决 P51。
