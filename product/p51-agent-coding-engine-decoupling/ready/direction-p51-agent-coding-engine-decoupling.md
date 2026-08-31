# P51 Agent Coding Engine 解耦与 Smart-WorkFlow/OA 示例分支方向

> 下发角色：规划（Planner）
> 指定角色：执行（Executor）
> 方向状态：READY
> 日期：2026-08-31
> 性质：工作区架构与仓库组织解耦，不新增 OA 业务功能

## 一、目标

将当前根知识/治理仓调整为通用 Agent Coding Engine：

1. `main` 成为不携带具体业务项目事实的通用 Engine 默认分支；
2. 新建 `develop-sw`，从当前 Smart-WorkFlow/OA 成果的已知基线切出，保留现有实例知识、记忆、方向、回执、待办及其追溯关系；
3. `main/README` 提供 Engine 定位、接入入口和使用说明，并将 `develop-sw` 明确标为 Smart-WorkFlow/OA 示例；
4. Engine 不依赖后端、前端代码仓库，也不把 Smart-WorkFlow 的业务状态当作默认状态；
5. 新项目可以通过最小项目说明接入标准工作区结构，不需要复制或改写通用 `system.md`、`roles/`。

## 二、分支与追溯口径

- 当前根仓 `main` 的已验证起点为 `a86cbbd`；正式执行前仍须重新核对 checkout、远端和 HEAD，不得仅凭本方向中的快照操作。
- `develop-sw` 应从当前实例成果起点切出；该分支承载 Smart-WorkFlow/OA 的 `memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 及实例入口说明。
- `main` 保留通用治理协议、角色定义、终态契约、Validator、通用 Harness 适配和模板/目录初始化能力。
- 不改写既有 Git 历史；分支创建、提交和远端发布必须分别报告实际范围。远端 push、删除远端分支或 force push 不包含在本方向默认授权内，须由 Owner 另行明确授权。
- 既有 OA 历史回执、状态单一源和审计链不得被覆盖、重写或伪装为通用 Engine 状态。

## 三、通用 Engine 边界

应留在 `main` 并完成通用化核对的内容包括：

- `system.md`、`roles/` 中不依赖具体业务名称的角色与工作流协议；
- `.codex/governance/` 的终态契约、Validator 及契约自检；
- 通用 Harness 入口、配置、Hook 和模板；
- 标准工作区目录骨架及各目录的用途、初始化和项目接入说明；
- 最小项目说明的固定入口、字段语义、校验边界和单仓/多仓表达方式。

通用 Engine 不得预置或默认声明：

- Smart-WorkFlow/OA 产品名称、业务模块、P/I 编号和功能状态；
- 固定后端/前端仓库名、端口、迁移版本、测试计数、构建基线或本机资源条件；
- 只对当前 OA 实例成立的知识、记忆、方向、回执、问题和待办。

## 四、项目接入与隔离边界

Engine 必须提供一个唯一项目说明入口，至少表达：

- coding 项目身份、目标和非目标；
- 单仓或多仓关系、代码仓路径及仓库职责；
- 必要工程规则、启动方式和验证入口；
- 实例数据初始化位置及实例生命周期边界。

项目接入后，标准 `knowledge/`、`memory/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 由 Engine 统一管理，但其中产生的状态、历史、回执和待办必须属于当前项目实例。不同项目不得交叉读取或复用当前状态；移除一个项目不得破坏另一个项目或 Engine 本体。

Hook 和 Harness 入口不得依赖 `/usr/local/projects/Smart-WorkFlow/` 等本地绝对路径；应采用相对定位或明确的可配置项目根。根 `AGENTS.md` 也不得把 `Smart-WorkFlow/` 写死为通用入口。

## 五、OA 示例边界

`develop-sw` 作为示例分支，必须能够说明：

- 本分支是 Smart-WorkFlow/OA 的完整实例；
- 实例如何使用 `main` 的 Engine 协议；
- 当前后端 `Smart-WorkFlow-Server/` 与前端 `Smart-WorkFlow-Web/` 的关系和代码入口；
- 现有知识、记忆、产品方向、回执、待办和历史如何继续追溯。

示例分支不反向改变 `main` 的通用定位，也不把 OA 的当前状态复制回 Engine 默认内容。

## 六、非目标

- 不新增、重构或验收 OA 业务功能；
- 不修改后端、前端业务源码、业务测试、数据库迁移或部署配置；
- 不把 `main` 改造成第二个 Smart-WorkFlow 实例，也不建立第二份业务状态源；
- 不在本轮解决 Engine 的插件市场、远程安装服务、跨主机同步或完整升级兼容矩阵；
- 不以 README 单独替代项目说明、初始化校验和实例隔离机制；
- 不默认授权远端 push、force push、删除分支或发布版本。

## 七、影响范围

- 根仓分支组织、历史追溯和发布说明；
- 根 README、根 AGENTS 入口及 Harness Hook 的路径解析；
- 通用工作区目录骨架、模板、项目说明和初始化校验；
- `develop-sw` 中 Smart-WorkFlow/OA 实例文档与状态资料的完整保留；
- Engine 与 coding 仓库之间的引用方向、实例隔离和回滚边界。

执行角色应自行判断具体修改文件、Step 划分、验证命令和测试组织，但不得扩大至本方向的非目标范围。

## 八、风险方向

1. **实例误删风险**：从 `main` 抽取资料时遗漏回执、历史或当前状态，导致 OA 追溯链断裂。
2. **通用化污染风险**：清理不完整，Smart-WorkFlow 名称、端口、基线或业务事实残留在 Engine 默认内容。
3. **入口失效风险**：AGENTS、Hook 或 Validator 的路径改造造成新工作区无法启动治理流程。
4. **状态串扰风险**：空白 Engine、OA 示例和未来项目共享 `knowledge/` 或 `memory/` 当前状态。
5. **分支发布风险**：未先形成可回滚的示例分支就修改 `main`，或未经授权改写远端历史。
6. **边界误判风险**：把“分支存在”和“Engine 已通用化”混同；README 链接、目录存在和文件分类本身不构成行为闭环证据。

## 九、方向级验收边界

只有以下事实全部成立，P51 才能进入功能级验收：

1. `develop-sw` 可追溯到当前 OA 成果起点，实例资料、历史回执和状态单一源完整保留。
2. `main` 在无后端、前端和 OA 实例资料时，标准治理结构、契约和入口仍可独立完成自检。
3. `main` 的完整发布内容不存在 Smart-WorkFlow 专属业务状态、固定项目事实和本地绝对路径耦合。
4. 仅填写最小项目说明并接入一个代码仓后，可进入角色门禁、探索、方向、回执和规划验收流程。
5. `main` README 正确说明 Engine 使用方式，并指向 `develop-sw` OA 示例；`develop-sw` README 反向说明其示例身份及 Engine 来源。
6. 至少通过空白 Engine、Smart-WorkFlow/OA 示例和两个无关项目实例的隔离行为验证；实例切换、移除和回滚均不产生状态交叉。
7. 分支、提交、实际修改范围与回滚点有可复核记录；未授权远端发布动作未被执行。

## 十、待确认问题

- `develop-sw` 是否作为长期示例分支持续维护，还是仅作为迁移快照；
- `main` 的 Engine 版本与 `develop-sw` 示例之间采用何种兼容标记；
- 示例分支与两个 coding 子仓采用普通目录说明、submodule 还是其他引用方式；
- 项目实例是每个项目独立工作区，还是同一 Engine 工作区支持可切换实例；
- 远端 `main`/`develop-sw` 的正式创建、提交和发布时机。

上述问题不阻塞本轮形成方向，但会影响执行角色的具体实现选择；执行角色不得自行把待确认项解释成 Owner 授权。
