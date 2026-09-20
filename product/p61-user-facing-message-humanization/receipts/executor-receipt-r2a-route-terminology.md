# P61 执行回执：R2a 路由标题与跨页术语收敛

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 对应原子项：R2a（一级执行补充提示 01 §2）
> 证据目录：receipts/evidence/p61-r2a-01/

## 1. 完成条件对照

| 完成条件 | 实际结果 | 证据层级 |
|---|---|---|
| 路由标题、状态词、同义操作使用同一语义键与术语表 | 38 条路由标题全部经 `i18n.global.t` 取自权威目录；同文异译收敛 36 键 | 源码 + 目录审计 |
| 不存在同一状态多种冲突翻译 | 同文多键 0 组、同文异译 0 组（工具判定） | 术语审计退出码 0 |
| 不存在直接枚举值展示 | 枚举直出 0 处（改造前 26 处） | 术语审计退出码 0 |

## 2. 缺口ID → 原始文件/位置 → 实际结果 → 边界

1. **路由标题**：`src/router/index.ts` 共 38 处 `meta.title`，全部为目录键调用；键在双语文档中存在且非空（`p61-key-coverage.mjs` 退出码 0）。

2. **同文异译收敛**：`scripts/p61-key-convergence.json` 声明 36 条被收敛键 → 权威键；`scripts/p61-converge-keys.mjs` 改写源码 4 文件 4 处后校验「被收敛键在源码中零引用」。收敛不产生文案变化（权威键已覆盖同一句）。

3. **同义操作统一为「新建」**：新增模板/消息模板/设备/产品/脚本/连接/规则/Topic/内部工具/外部 HTTP 工具 共 10 组改为「新建」表述；`创建` 收敛到 `common.create`，仅保留在结果与时间名词（创建成功/创建失败/创建时间）。

4. **枚举直出改造**：`scripts/p61-enum-label-codemod.mjs` 对 14 个文件 22 处模板渲染位改为 `enumLabel(领域, 值)`；新增 `src/foundation/i18n/enum-label.ts` 作为唯一枚举→文案键表（8 个领域）。未被登记的线值回落为线值本身，不回落为键名。

5. **模块加载期求值缺陷**：`graphAdapter.NODE_TYPE_LABELS`、`process-graph.NODE_RUNTIME_STATE_LABEL`、`node-panel-registry.label` 原在模块加载期调用 `t()`，会把语言固化、切换语言后失效。已改为键映射 + 取值函数。

**边界**：R2a 未覆盖真实浏览器渲染（归 R7）；枚举标签在真实接口返回未知线值时的表现以「回落线值」为契约，未做穷举线值验证。

## 3. 过程中发现并修复的真实缺陷

| 缺陷 | 发现方式 | 影响 | 处置 |
|---|---|---|---|
| 重建目录丢失既有键 | `p61-locale-reconcile.mjs` 对旧目录键集对账 | `agent.nodeStart` 等 6 键被抹掉，页面会渲染键名 | 补回批次16；对账升级为门禁（缺失键必须由收敛映射解释） |
| 别名没有正主 | 键覆盖检查 | `common.statusWithdrawn` 只有 alias、无人写值，3 处渲染键名 | 补正主条目；校验器新增「别名必须存在非别名正主」判定 |
| 改键后源码未同步 | 键覆盖检查 | `notify.editTemplate` 引用不存在的键 | 键名回归 `notify.editTemplate`；覆盖检查常驻 |
| 常用词做枚举标签覆盖既有映射 | 键集对账 | `条件`/`抄送`/`校验` 三词被节点类型标签占用 | 节点类型改用「X节点」全称；`审批节点`/`抄送节点` 复用既有键 |

## 4. 新增常驻门禁（可判定，非人工声明）

| 脚本 | 判定 | 本次退出码 |
|---|---|---|
| `p61-term-audit.mjs` | 同文多键/同文异译/枚举直出须为 0；同义分叉须逐组给出区分依据 | 0 |
| `p61-key-coverage.mjs` | 源码引用的每个键必须在双语目录中存在 | 0 |
| `p61-locale-reconcile.mjs` | 目录消失的键必须由收敛映射解释 | 0 |
| `p61-validate-dictionary.mjs` | 键唯一、双语齐备、别名有正主、键集零差异 | 0 |
| `p61-copy-inventory.mjs --check` | 生产可达中文文案零未治理 | 0 |
| `p61-gen-locales.mjs --check` | 生成文件与单源一致 | 0 |

## 5. 门禁原始流

见 `evidence/p61-r2a-01/raw-gates.txt`：typecheck / lint / test / build / term-audit / dictionary-validate / key-coverage / locale-single-source / hardcode-gate / locale-reconcile 共 10 项，退出码均 0；测试 1207 passed / 3 skipped / 0 failed。

## 6. 状态

R2a 正向与反向断言均由工具判定通过。R2b、R2c、R3a、R3b、R4a、R4b、R6b、R7、R8b、R8c、R9 仍未完成。
