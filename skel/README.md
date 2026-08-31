# 工作区目录骨架（skel/）

> 由 Agent Coding Engine `main` 分支提供的**标准工作区目录骨架**模板。
> 新建 coding 项目时，将本 `skel/` 下各目录复制到项目工作区根目录，并按各目录 README 说明初始化。
> 本骨架只描述**目录结构与用途**，不携带任何具体实例的内容。

## 目录

| 目录 | 用途 | 初始化说明 |
|------|------|-----------|
| `memory/` | 压缩记忆（规划角色快读入口） | 见 `skel/memory/README.md` |
| `knowledge/` | 完整知识库（执行角色维护） | 见 `skel/knowledge/README.md` |
| `product/` | 需求方向与回执仓库 | 见 `skel/product/README.md` |
| `todo/` | 暂不修复清单 + 需求缺口池 | 见 `skel/todo/README.md` |
| `search_task/` | 探索任务（规划角色下发） | 见 `skel/search_task/README.md` |
| `search_fallback/` | 探索结果（执行角色写入） | 见 `skel/search_fallback/README.md` |

## 使用方式

1. 将全部骨架目录复制到项目工作区根目录。
2. 依据 `project.md`（项目说明入口）声明实例身份、仓储关系与生命周期。
3. 按 `memory/README.md` 中的权威路径与 `knowledge/README.md` 初始化实例数据与当前状态。

> 标准 `knowledge/`、`memory/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 由 Engine 统一管理，
> 但其中产生的状态、历史、回执和待办必须属于当前项目实例；不同项目不得交叉读取或复用。