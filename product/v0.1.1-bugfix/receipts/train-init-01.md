# 0.1.1 发布列车初始化回执（train-init-01）

> 方向：`product/v0.1.1-bugfix/ready/direction-v0.1.1-bugfix.md`（XL，READY，2026-09-21）
> 角色：执行（Executor）｜等级：XL｜日期：2026-09-21
> 机器终态：`EXECUTION_SUBMITTED`（待规划验收）｜功能状态：`IN_PROGRESS`
> 本回执只证明列车初始化事实；本轮无缺陷、无业务代码改动、无提交。

## 1. 目标与边界

按方向 §3 与 `memory/state.md` 的唯一下一动作，完成列车初始化：回读两仓 0.1.0 发布基线事实，创建同名 `0.1.1-bugfix` 分支，建立累积缺陷账本，开放缺陷收件。

本轮明确不做：推送远端、合并 `main`、创建 `0.1.1` tag/Release、部署任何环境、运行工程构建或测试、修改业务代码。

## 2. 基线回读（方向 §3.1 锁定起点核对）

| 仓库 | `HEAD` | `main` | `0.1.0^{commit}` | 工作树 | 结论 |
|---|---|---|---|---|---|
| Smart-WorkFlow-aPaaS-server | `d18e9a39c552918615be8b158dfe0cc278cb309f` | `d18e9a39c552918615be8b158dfe0cc278cb309f` | `d18e9a39c552918615be8b158dfe0cc278cb309f` | clean | 与方向锁定值一致 |
| Smart-WorkFlow-aPaaS-Web | `039f987437ed6369c3c131631bd7622c6ae482e7` | `039f987437ed6369c3c131631bd7622c6ae482e7` | `039f987437ed6369c3c131631bd7622c6ae482e7` | clean | 与方向锁定值一致 |

执行命令与原始输出（摘要）：

```
# Server
git status --short --branch  ->  ## main...origin/main        （无未提交改动）
git rev-parse HEAD           ->  d18e9a39c552918615be8b158dfe0cc278cb309f
git rev-parse main           ->  d18e9a39c552918615be8b158dfe0cc278cb309f
git rev-parse '0.1.0^{commit}'->  d18e9a39c552918615be8b158dfe0cc278cb309f
git log --oneline -3         ->  d18e9a3 chore(hygiene): 运行期上传产物移出版本库并加入忽略规则

# Web
git status --short --branch  ->  ## main...origin/main        （无未提交改动）
git rev-parse HEAD           ->  039f987437ed6369c3c131631bd7622c6ae482e7
git rev-parse main           ->  039f987437ed6369c3c131631bd7622c6ae482e7
git rev-parse '0.1.0^{commit}'->  039f987437ed6369c3c131631bd7622c6ae482e7
git log --oneline -3         ->  039f987 chore(hygiene): 人工复核截图存档移出版本库并加入忽略规则
```

`git branch -a` 回读两仓均不存在 `0.1.1-bugfix`（本地与远端皆无），未发生分支名冲突。

## 3. 分支初始化（方向 §3.2）

| 仓库 | 命令 | 结果 | 分支 `HEAD` | 上游 |
|---|---|---|---|---|
| Server | `git checkout -b 0.1.1-bugfix main` | `Switched to a new branch '0.1.1-bugfix'` | `d18e9a39c552918615be8b158dfe0cc278cb309f` | 无（未推送） |
| Web | `git checkout -b 0.1.1-bugfix main` | `Switched to a new branch '0.1.1-bugfix'` | `039f987437ed6369c3c131631bd7622c6ae482e7` | 无（未推送） |

两仓分支直接基于各自已验证的 0.1.0 发布 `main`，未混入 `develop` 或其他未发布功能；`git status --short --branch` 均显示 `## 0.1.1-bugfix` 且无未提交改动。

## 4. 账本与登记产物

| 产物 | 路径 | 用途 |
|---|---|---|
| 累积缺陷账本 | `product/v0.1.1-bugfix/receipts/bug-ledger.md` | 状态口径、分支身份、缺陷总表、提交流水（当前 0 项） |
| 单缺陷回执模板 | `product/v0.1.1-bugfix/receipts/_template-V011-BUG-NNN.md` | 按方向 §4.2/§6 固定每项缺陷的最小记录与验收对照 |
| 功能追踪登记 | `knowledge/features/v0.1.1-bugfix.md` | 列车方向、边界、缺陷工作项与验收流程 |
| 本回执 | `product/v0.1.1-bugfix/receipts/train-init-01.md` | 初始化事实与证据 |

## 5. 工具链就绪核对（后续缺陷验证用）

| 工具 | 实测版本 | 用途 |
|---|---|---|
| Java | `21.0.5`（Java HotSpot 64-Bit Server VM 21.0.5+9-LTS-239） | 后端编译与测试 |
| Maven | `Apache Maven 3.9.1` | 后端 `MAVEN_OPTS=-Xmx2g mvn` 系命令 |
| Node.js | `v22.14.0` | 前端工具链 |
| pnpm | `11.9.0` | 前端 `NODE_OPTIONS=--max-old-space-size=2048 pnpm` 系命令 |

本轮未运行 `mvn`/`pnpm` 构建或测试，也未运行迁移；后续每项缺陷按方向 §6 与两仓工程宪法的分级验证门执行，且前后端编译互斥。

## 6. 与方向的偏差

无。方向 §3.1 锁定起点与实际回读一致，未发现需要停止写入的基线、分支来源或候选历史不一致。

## 7. 受影响范围验证

- 分支起点：两仓 `0.1.1-bugfix` 的 `HEAD` 等于方向锁定的 0.1.0 发布 SHA（回读命令原始输出见 §2—§3）。
- 未引入业务改动：本轮只新增 `product/` 与 `knowledge/` 文档，两仓代码工作树均 clean，无未提交或未跟踪的业务文件。
- 远端零写入：未执行任何 `git push`、tag、Release 或部署动作。

## 8. 剩余边界与未完成项

- 缺陷收件：开放；当前 0 项缺陷、0 个提交。
- 远端分支、`main` 合并、`0.1.1` tag/Release、CI 与部署：未授权，且须在 Owner 明确确认收件结束后按方向 §8—§9 单独确认。
- 0.1.0 中既有延期/未验证边界（WECOM/FEISHU/DINGTALK 三 Provider、I6 五外部通知渠道真实链、腾讯 IoT 实网）不在本轮自动补齐，除非本轮确有对应新证据。

## 9. 自验结论

列车初始化按方向 §3 完成：两仓 `0.1.1-bugfix` 分支建立于 0.1.0 发布基线，累积缺陷账本与单缺陷回执模板就位，缺陷收件开放。本轮自验通过，待规划验收；缺陷进入后按 `V011-BUG-NNN` 逐项收件并按方向 §5 形成原子提交。
