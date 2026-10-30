# 0.2.0 执行提示34回执：四原项精确余差关闭

2026-10-30｜Executor｜配套审查33/提示34（revision 51）；本轮按「4精确余差」执行，未新增ID/需求、未核销P、未晋级基线、未宣称整版PASSED。执行方式：三批并行子代理（A–C）实施＋主会话Q74同消费者修复取样＋headed实证（r120–r121）＋统一四门禁。

## 一、四项结果（逐项）

| # | 原项 | 结论 | 关键实测 | 证据 |
|---|---|---|---|---|
| 1 | Q08（645:28703）查看态全宽 | **关闭** | /workspace 查看态解除 236px 协同侧栏占位（`#app-sidebar` 该路由不渲染，沿既有全屏排除模式）；二级栏实测 **(0,64,1920,56)**；返回 72×32@**全局x24/y75.5**；标题16px、配置入口95×32@x1801/y75.5 保持；画布 x24..1896 左右各24留白；非负margin/transform刷宽，其他协同路由（/workspace/todo、/workspace/config 等）侧栏不变，未保存/未新增路由 | u020-34-q08-fullwidth.png、u020-34-geometry-r120.json |
| 2 | Q56（472:15663）空画布原设计器布局 | **关闭** | 零流程分支去除外层列表筛选/48px边距，原设计工作区实测：工作区 **(0,152,1920,928)**、节点库 **(0,152,220,928)**、画布区 x220 起、白底画布（backgroundColor rgb(255,255,255)、16px 内边距 → 内体 x236/y168/w1668/h896）；真实未配置说明与创建承接保留；命名窗仍 480×221、取消无写；有关联流程分支未动 | u020-34-q56-workspace.png、u020-34-geometry-r120.json |
| 3 | Q74（272:1784）同消费者稳定172 | **关闭（局部正文间距修正）** | 同一 DetailDialog props/正文slot/类名在真实 FormRender 页样式环境内无写入预览，进场后连续3帧稳定取样：**520×172@(700,454)**、遮罩、标题「申请已提交」16px、正文14px（margin 0、行盒22px）、「查看」80×32@x1115。根因即本成功正文裸 `<p>` 的 UA 默认外边距（2×14px→200）与 normal 行盒（→170）；仅在本消费者 scoped 规则内 margin:0 + line-height:22px（对应已过172结构），未压整窗高度、未裁正文、未动其他 DetailDialog；提交API/拦截/幂等/去向未动、未提交申请 | u020-34-q74-inpage-172.png、u020-34-geometry-r121.json |
| 4 | Q11（273:1332）动态并行原820配置窗 | **关闭** | 复用已过 node-op-dialog 820 承载模式：DP 面板新增「并行分支配置」回显行+设置入口（60×32@x1836），打开 `.dynamic-parallel-dialog` 820宽（实测820×734@(550,64.8)）带遮罩；表单内分支来源类型/主字段/取值范围/完成模式/最大分支数/空来源处置/无效值处置/分支语义全量真实回显，10 控件全部 32 高、底栏 取消/确定 各80×32@y741.8；本地草稿：确定才写回节点配置、取消丢弃；drill87 取值范围=表格字段候选=「设备清单」（真实）；TABLE 子列人/部门筛选为合法空态（未造字段）；取消后关窗、离开不保存、写请求0 | u020-34-dp-820.png、u020-34-geometry-r120.json |

## 二、工程与同步

- Web 四门禁：typecheck 通过；`eslint .` 0 问题；test **1990 passed/3 skipped（230 文件）**；build 4.28s。
- Server 本轮 0 改动；沿用 2213819。全量 Server 旧 notify/agent/bpm/bootstrap/form G1 失败仍为基线，不称后端全绿、不晋级基线。
- 本轮实现改动 Web 8 文件：BasicLayout.vue（/workspace 全屏排除）、WorkspaceBoard.vue（24px 留白样式）、RelatedProcessesPanel.vue/.spec、UnconfiguredFlowBoard.vue（220/白底/16px 几何）、ProcessDesigner.vue（DP 820 设置窗）、FormRender.vue（成功正文 margin/行盒局部规则）。
- 未动 vite.config.ts（本轮子代理 stash 曾短暂卷入，已从 stash 原样恢复并核实仅含既有本地改动，stash 已清理）、冻结JSON、权限、PG/Redis、四密钥。
- 取证脚本 u020-34-r120/r121.cjs 在 Evidence/tools 未入仓；全程只读或可取消本地草稿，非 auth 写请求 0。

## 三、说明

- Q08：仅 /workspace 查看路由加入布局层既有全屏排除清单；编辑态 /workspace/config 自有外壳未动。
- Q74：r120 独立探针（设计器页环境）仍 520×198 证scoped规则不在其样式环境生效，按提示改用真实 FormRender 页内同 props/slot 取样（r121），修正确认为本消费者正文段落局部间距，非全局样式。
- 500 项账本：496+4 全部关闭待复核；无新增遗留。
