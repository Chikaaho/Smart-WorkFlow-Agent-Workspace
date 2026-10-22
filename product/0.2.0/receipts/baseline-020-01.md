# 0.2.0 基线核实与当前入口纠正（A01）

2026-10-22｜Executor｜XL｜IN_PROGRESS｜自验通过，待 Planner 验收

## 1. 范围与阶段

承接 `product/0.2.0/ready/direction-020.md`、`decision-records-020.md`、`acceptance-020.md`、`visual-acceptance-020.md`、`design-node-index-020.md`。本回执对应验收项 A01（基线与保护），不表示任何主功能完成。

七阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。

## 2. 基线核实

| 对象 | 实际值 | 核实方式 |
| --- | --- | --- |
| Server `origin/develop` | `85e1ab7` | `git fetch --all --tags` 后 `rev-parse` |
| Web `origin/develop` | `2df670b` | 同上 |
| Server `0.1.10` tag | `8a2aa56` | `git rev-list -n1 0.1.10` |
| Web `0.1.10` tag | `e03a886` | 同上 |
| 0.1.10 资产 | Server `bootstrap-0.1.10.jar` 218,065,590 B；Web `sw-web-dist-0.1.10.zip` 1,360,081 B | `gh release view 0.1.10`（两仓） |
| 0.1.10 CI | Server run `39616993514`、Web run `39611689870` 均 success | Release 正文 |
| 0.1.10 UAT | Server `build.version=0.1.10`、健康 UP、启动 181.914s、ERROR 0；Web `assets/index-qOqx_U4O.js` | Release 正文 |
| 本地旧态 | 两仓 `main`/`develop` 原为 `2d6b8f1`/`2ac1a71`（落后 10/25） | fetch 后 `status -sb` |

缺失限制：`product/0.1.10-bugfix/receipts/` 不存在，工作区没有 0.1.10 的本地交付回执、原始日志与逐项验收记录。本回执只引用 Release 正文，不补造原文，也不把 0.1.10 的 CI/UAT 结果当作 0.2.0 的验证证据。

## 3. 任务分支

| 仓库 | 分支 | 起点 |
| --- | --- | --- |
| Server | `codex/0.2.0-tenant-form-flow` | `origin/develop` `85e1ab7` |
| Web | `codex/0.2.0-ui-tenant-form-flow` | `origin/develop` `2df670b` |
| 根仓 | `codex/0.2.0-delivery` | `develop-sw` `f2beb3be` |

三仓工作树起始干净（根仓已有在途修改，见 §5）。

## 4. 当前入口纠正

| 入口 | 原值 | 实际值 | 处理 |
| --- | --- | --- | --- |
| `knowledge/current-status.md` 首段 | 0.1.9、等 Planner 复核 | 0.2.0 分支实施中；0.1.10 为当前发布 | 新写当前段，0.1.9 段降为历史记录 |
| `README.md` 当前发布 | 0.1.9 | 0.1.10 + 0.2.0 开发中 | 新增当前段并标注 0.1.9 为历史 |
| `CHANGELOG.md` | 最新 0.1.9 | 增补 0.1.10 条目 | 只写 Release 可证实事实与来源限制 |
| `version.json` | 0.1.9 | 0.1.10 + 0.2.0 开发目标 | 重写投影，声明 0.1.10 回执缺失 |
| 两仓 `README.md`/包版本/POM 默认版本 | 已是 0.1.10 口径 | 一致 | 无需改动；开发默认 Server `0.1.10-SNAPSHOT`、Web `0.1.10`，待第四步收敛 0.2.0 |

0.1.9 的发布、UAT、功能计数与验收结论保留在原回执与历史段落，不改写。

## 5. 在途修改保护

根仓开工前已存在、本轮未提交、未恢复的修改：

- `.codex/governance/*` 的暂存删除（44 个文件仍在工作树磁盘上，仅索引标记删除）。
- `.gitignore` 的已暂存修改。
- `memory/*`、`product/ui-copy-governance/ready/direction-ui-copy-governance.md`、`todo/p29-tenant-management.md`、`todo/p65-form-javascript-events-api.md`、`todo/requirement-pool.md` 的 0.2.0 规划改动，按规划文档范围随本版提交，不改变其内容归属。

## 6. 视觉基准读取

已读取 Figma 文件 `mbEKPcZv9pcchmElQanR5E` 的 `3:2`（01 工作台）、`458:12660`（租户管理）、`458:12871`（新增租户）原始导出图，本地位置 `/Users/chikan/.codex/evidence-020/design/`。三张图为设计输入，不是还原通过证据；像素对照尚未开始。

## 7. 下一步（实施计划骨架）

1. T020：租户管理服务端接口（列表、创建含首任管理员、编辑、启停）与 Web 页面；先补 `sys_tenant` 与首任管理员关联的持久化事实，再对齐设计。
2. F020：字段/动作权限、默认列表、受控数据源入口；文本长度/正则/提示跨端校验；子表字段弹窗。
3. J020：表单三事件、函数目录、共用脚本面板；与流程监听统一版本化模型。
4. W020：版本挂起/激活、授权代理、审批暂存、节点允许操作、加签位置与多人顺序。
5. U020：全局 token/外壳与新稿对齐，逐页视觉对照；文案全量审阅与操作手册。

## 8. 自验结论

基线核实、分支创建、当前版本入口纠正与在途修改保护完成；五项目标的功能实现、视觉对照与验收证据均未开始，不得据此宣称任何页面或功能完成。

