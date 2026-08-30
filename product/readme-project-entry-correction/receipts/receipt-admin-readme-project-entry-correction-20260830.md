# 三仓项目入口 README 修订回执

> 执行角色：管理员（Admin）
> 对应方向：`product/readme-project-entry-correction/ready/direction-admin-readme-project-entry-correction.md`
> 日期：2026-08-30
> 结论：通过

## 一、成稿结构与目标读者

### 根仓 README

目标读者为项目使用者、首次进入工作区的开发者和需要跨仓导航的协作者。

最终栏目：

1. 项目能力；
2. 三个仓库；
3. 快速开始；
4. 文档导航。

正文说明平台定位、稳定能力、三仓职责与运行关系，并将后端、前端和治理细节导向各自权威入口。

### 后端 README

目标读者为后端开发者、API 使用者和需要准备本地后端环境的协作者。

最终栏目：

1. 核心能力；
2. 技术栈；
3. 模块结构；
4. 环境要求；
5. 快速开始；
6. 常用开发命令；
7. 进一步阅读。

正文提供模块化单体概览、数据库模式、配置入口、普通 Maven 启动与开发命令，以及工程宪法、架构、功能清单和 API 入口。

### 前端 README

目标读者为前端开发者和需要使用真实 API 或 Mock 模式进行本地开发的协作者。

最终栏目：

1. 核心能力；
2. 技术栈；
3. 目录结构；
4. 环境要求；
5. 开发模式；
6. 快速开始；
7. 常用开发命令；
8. 进一步阅读。

正文说明前端分层、环境入口、API/Mock 两种模式和常用 pnpm 命令；每条命令均使用独立 fenced code block。

## 二、实际修改文件

本任务实际写入以下四个文件：

1. `README.md`；
2. `Smart-WorkFlow-Server/README.md`；
3. `Smart-WorkFlow-Web/README.md`；
4. `product/readme-project-entry-correction/receipts/receipt-admin-readme-project-entry-correction-20260830.md`。

方向文件、历史回执、工作区治理文件、工程宪法、knowledge、memory、todo、业务代码、测试、构建配置、依赖和迁移均未由本任务修改。工作区原有的其他未提交改动保持原状。

## 三、验收标准逐项结果

| 编号 | 结果 | 证据 |
| --- | --- | --- |
| 1 | 通过 | 三份 README 均具备项目说明、核心能力或结构、快速开始和进一步文档入口；栏目见本回执第一节。 |
| 2 | 通过 | 三份 README 全文检查未命中 `NODE_OPTIONS`、`MAVEN_OPTS`、`2048`、2G 资源限制、前后端编译互斥及 `knowledge/shared-constraints.md`。 |
| 3 | 通过 | 全文检查未发现功能数量、清单数量、spec/test 数、迁移数量、`PASSED`、`COMPLETED` 或“全绿”等动态验收快照。 |
| 4 | 通过 | README 未采用日期式变更主体，未出现“本轮完成”、任务编号流水账或提交检查门禁。 |
| 5 | 通过 | 命令均位于 fenced code block；前端每条命令独立成块；未发现 `NODE\_OPTIONS`、`****` 或多条命令粘连。 |
| 6 | 通过 | 仓库名称统一为 `Smart-WorkFlow-Knowledge`、`Smart-WorkFlow-Server`、`Smart-WorkFlow-Web`；启动入口与当前目录一致；三份 README 相对链接检查为 0 缺失。 |
| 7 | 通过 | README 正文仅呈现最终项目入口结构，未写入面向本次修订过程的纠偏说明。 |
| 8 | 通过 | 本任务写入范围为三份 README 与本回执；未运行编译、测试、构建、迁移、服务或发布命令；未暂存、提交或推送。 |

## 四、静态检查结果

### 零残留检查

对三份 README 执行全文检查，覆盖以下类别：

- 本机资源限制：`NODE_OPTIONS`、`MAVEN_OPTS`、`2048`、2G、前后端编译互斥；
- 动态基线：功能/清单计数、spec/test 计数、迁移计数、`PASSED`、`COMPLETED`、全绿声明；
- 变更记录式内容：日期式更新主体、“本轮完成”、任务编号流水账、提交检查门；
- Markdown 残片：`NODE\_OPTIONS`、`****`、多命令粘连；
- 会话纠偏残留：面向本次修订过程的否定式说明。

检查结果：三份 README 共检查 3 个文件，0 失败，0 残留。

### 相对链接检查

逐一解析三份 README 中的相对 Markdown 链接，并按各 README 所在目录解析目标。

检查结果：0 缺失。

### Git 文本检查

分别执行以下静态检查：

```bash
git diff --check -- README.md
```

```bash
git -C Smart-WorkFlow-Server diff --check -- README.md
```

```bash
git -C Smart-WorkFlow-Web diff --check -- README.md
```

检查结果：三项均通过，无空白错误。

## 五、执行边界

本任务只进行了文档读取、README 与回执写入、全文检索、相对链接存在性检查以及 Git 只读差异检查。未运行 Maven、pnpm、数据库迁移、服务启动、发布、暂存、提交或推送操作。

管理员文档修订完成，三份 README 已形成稳定的项目入口。
