# P51 根级运行时补充提示 1

> 指定角色：执行（Executor）
> 提示级别：一级收敛
> 权威输入：`planning-rereview-p51-root-runtime-20260831-01.md`、`direction-p51-root-runtime-workspace.md`

## 一、本轮唯一剩余缺口

| 编号 | 失败事实 | 不可接受证据 | 唯一可接受证据 |
|---|---|---|---|
| R1 | 通用 memory 入口指向不存在的 knowledge 文件 | 目录清单、文件名声明 | 所有被引用入口实际存在，引用解析检查逐项为 0 缺失 |
| R2 | 项目说明读入未形成行为证据 | README 描述、模板存在 | 一个非 Smart-WorkFlow 项目说明被解析后，输出项目身份、coding 仓路径与验证入口，逐字对应配置 |
| R3 | 非 Smart-WorkFlow 示例没有真实跨角色闭环 | Executor 自建 Planner `PASSED`、临时目录摘要 | Executor 只提交其角色范围内的探索回执和执行回执；产物持久保留，等待独立 Planner 会话追加审查 |
| R4 | 双工作区零串扰不可复核 | “0 命中”摘要、仅 `/tmp` 路径 | 两个独立工作区的固定输入清单、搜索命令、完整搜索范围、正向命中与反向 0 命中原始输出写入持久证据包 |
| R5 | Hook 未覆盖独立 Git coding 仓 cwd | 从 Engine 自身子目录运行 | 从项目说明声明且具有独立 `.git` 的 coding 仓子目录触发，能够定位 Engine 根并分别证明合法终态放行、非法终态阻断 |

## 二、锁定通过项

- 根级六类标准目录已存在；
- Smart-WorkFlow/OA 实例仍由 `develop-sw` 保留；
- 分支分离和回滚点有效；
- 不重复清理品牌、固定仓名或绝对路径；
- 不重复执行远端或分支操作。

## 三、允许范围

允许读取：

- 最新复审、原方向、现有执行回执；
- 根 README、项目说明、Harness 配置与 Hook；
- 根级标准目录的通用初始文件；
- 为验证而创建的两个独立非 Smart-WorkFlow 示例工作区。

允许修改：

- 根级通用初始状态与索引文件；
- 项目说明解析/校验所必需的 Engine 文件；
- Harness 配置与 Hook 定位实现；
- 本功能 `receipts/` 下的新执行回执和持久证据文件。

允许命令：

- 只读文件/引用/路径检查；
- 治理契约与 Hook 行为验证；
- 示例工作区的项目说明解析和隔离检查；
- `git diff --check`、`git status --short`、限定范围 diff。

## 四、禁止事项

- 不生成 Planner 审查结论，不写 `PASSED` 或 `COMPLETED`；
- 不读取或修改真实业务 coding 仓的业务源码；
- 不重做已锁定分支工作；
- 不运行远端 push、force push、分支删除或发布；
- 不以临时目录存在、文件名、测试名称或自述替代行为输出；
- 不修改 `system.md`、`roles/`；
- 不扩大到多项目同工作树切换、业务功能或依赖升级。

## 五、相对上一版新增约束

这是首次一级提示，新增约束为：

1. 所有验证证据必须持久追加到本功能 `receipts/evidence-runtime-1/`；
2. 示例链在 Executor 边界结束，规划审查必须留给后续独立规划回合；
3. Hook 必须从独立 Git coding 仓目录触发验证；
4. 每个通用初始文件引用必须执行逐项可解析检查；
5. 回执必须给出原始命令、退出码和输出，不接受结论摘要替代。

## 六、逐缺口证据包

- `R1-reference-resolution.txt`：输入文件、被引用路径、存在性结果、总缺失数；
- `R2-project-config-read.txt`：项目说明固定内容、解析命令、实际输出、逐字段比对；
- `R3-executor-boundary.md`：Executor 实际产物及明确等待 Planner 审查的状态；
- `R4-workspace-isolation.txt`：两个工作区固定输入、搜索范围、正向和反向原始输出；
- `R5-nested-git-hook.txt`：Engine 根、coding 仓根、触发 cwd、合法/非法终态输出和退出码；
- `scope-and-diff.txt`：实际修改、工作树、diff check、未远端发布证据。

## 七、提交前自检

仅当以下全部为“是”才允许提交补充回执：

- R1～R5 每项都有对应持久证据文件；
- 没有 Executor 生成的 Planner 裁决；
- 所有初始入口引用为 0 缺失；
- coding 仓嵌套 Git 场景下 Hook 的正反行为均成立；
- 证据包包含原始输出和退出码；
- 未触碰锁定项、治理角色文件、业务实现和远端。

合法终态使用执行机器契约允许的“已提交待规划验收”状态，不得声明功能完成。
