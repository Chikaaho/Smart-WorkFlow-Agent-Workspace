# P66 0.4.0 发布后同步回执（execution-final-04）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容（XL，0.4.0） |
| 依据 | `product/multi-database-compat/receipts/planning-review-final-02.md` §2（Z1—Z4） |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 状态 | **部分完成**：Z2、Z3 完成；Z1 七张图已替换，`agent-graph.png` 受 Web 产品缺陷阻塞；Z4 时间窗未到 |
| 结论 | 回滚说明已按本机演练更正；develop 已普通快进到 `a4f6c278`；README 截图七张达标，智能体编排图因 Web 缺 Vue Flow 默认主题样式无法达到“节点完整渲染”，需单独 Web 补丁 |

## 1. Z1 README 截图重拍

### 1.1 方法与环境

- 工具：Playwright 1.63.0 + Chromium headless（未使用宿主内置浏览器）。
- 视口：**1440×900**，`deviceScaleFactor: 2`；输出 **2880×1800**。
- 登录：UAT `https://chikaho.cn`，管理员账号；验证码/RSA 挑战走真实登录接口。
- 证据目录：`E:/code/Smart-WorkFlow-Agent-Evidence/p66-040/z1/final/`（本机留存，不入 Git）。

### 1.2 八张图清单

| 文件 | 画面 | 尺寸 | 大小 | 结论 |
|---|---|---:|---:|---|
| `workspace.png` | 流程中心：常用流程、最近使用、6 条流程列表 | 2880×1800 | 222,563 B | 通过（非空状态） |
| `form-designer.png` | MES 研判表单设计器：组件库 + 三列表单 + 组件属性 | 2880×1800 | 251,232 B | 通过 |
| `workflow-designer.png` | 灾备演练流程设计器，缩放 **65%**，节点文字可读 | 2880×1800 | 249,220 B | 通过 |
| `approval-detail.png` | A 流程“分公司技术委员会会签”记录（3 人，状态/时间格式化） | 2880×1800 | 316,475 B | 通过 |
| `sample-a.png` | A 流程“参与部门分管领导并行审批”会签记录（2 人，结构化意见全文） | 2880×1800 | 360,822 B | 通过 |
| `sample-b.png` | B 流程全屏流程图，放大 **71%**，居中“上报学校（督办）/上报分流/P0”分支 | 2880×1800 | 223,009 B | 通过 |
| `sample-c.png` | C 流程表单：知识样本命中与研判依据、研判结论、建议处置 | 2880×1800 | 254,903 B | 通过 |
| `agent-graph.png` | 智能体编排设计器：7 个节点标签 + LLM 节点属性面板 | 2880×1800 | 295,933 B | **不达标（阻塞）** |

七张图均 ≤500KB；未出现 ISO 原文时间（会签/审批时间为 `11-08 13:23`，表单时间为 `2026-11-08 16:12:51` 这类格式化文本）。文件名保持不变，已覆盖 `docs/assets/readme/`；README 首图文案改为“流程中心”，并同步 A/B/审批图注。

GitHub 回读：提交 `4cb2988b` 推送 `develop-sw` 后，八张
`raw.githubusercontent.com/.../develop-sw/docs/assets/readme/*.png` 均 **200**；README 渲染回读包含
“流程中心”首图、界面预览、A/B/C 三示例、Mermaid `flowchart LR` 与九库矩阵，未发现破图标记。

### 1.3 `agent-graph.png` 阻塞：Web 缺 Vue Flow 默认主题

智能体编排设计器实际渲染为**只有节点标签、没有节点卡片**；本次已打开 LLM 节点属性面板，但画布仍不合格。DOM 实测（1440×900，DPR2）：

```text
.vue-flow__node-default  宽 22—46 px、高 17 px
background: rgba(0,0,0,0)；border: 0px none
```

根因：`Smart-WorkFlow-aPaaS-Web/src/adapters/flow-graph/index.ts` 只引入了
`@vue-flow/core/dist/style.css`，未引入 `@vue-flow/core/dist/theme-default.css`。
Vue Flow 的 `DefaultNode` 只渲染 handle + label，节点外框/底色来自默认主题；
当前图类型（START/KNOWLEDGE/LLM/CONDITION 等）没有自定义节点组件，因此全部退化为
透明文本，属于 **Web 产品缺陷**，不是截图参数问题。

影响：Z1 第 4 条“节点完整渲染并适配画布”无法用截图规避。修复需要在 Web 仓补默认主题
（或项目自有节点样式），重新构建/发布/部署 Web 后重拍；本轮未改 Web 代码，避免把
P66 后端发布扩成未授权的 Web 版本。

### 1.4 附带发现：任务详情流程面板高度 0

在 1440×900 下，`/workflow/task/:id` 的 `.instance-flow-panel` 计算高度为 **0px**
（内部 `.el-tabs` 为 447px，18 行流转记录已渲染但被裁切），导致流转记录/审批详情页签
不可见。为不把该缺陷带进 README，本轮回执中的 A 审批图使用会签记录弹窗，B 图使用
全屏流程图；该布局问题另行登记为 Web 候选缺陷，未在本轮修改。

## 2. Z2 回滚演练与说明更正

### 2.1 本机演练

| 项 | 事实 |
|---|---|
| 0.4.0 库快照 | UAT `smart_workflow` 只读 `pg_dump -Fc` → `uat-smart_workflow-0.4.0.dump`（1.3M） |
| 本机恢复 | PostgreSQL 18.4 容器，库 `sw_p66_z2`；`flyway_schema_history` **33 行**，`max(version)=0.4.0`，rank 37/38 为 `V0.4.0`/`R__0.4.0` |
| 0.3.2 jar | UAT `/opt/smart-workflow/server/bootstrap.jar.bak-pre040`，**220,867,859 B**，与远端字节数一致 |
| 启动 | `java -jar bootstrap-0.3.2.jar --spring.profiles.active=prod`，连本机 0.4.0 库；**exit 1** |
| 实际异常 | `FlywayValidateException: Detected applied migration not resolved locally: 0.4.0 rename bpm opinion comment` |
| 旧代码事实 | `0.3.2` 的 `BpmTaskOpinionDraft` 仍 `@TableField("comment")`；0.4.0 已改名为 `opinion_comment` |
| 日志 | `E:/code/Smart-WorkFlow-Agent-Evidence/p66-040/z2/032-on-040.log`，42K，sha256 `ec70e6620f5cb428e6c02382ccf3a6ac97542b978de8128c388204b6ed714874` |

结论：0.3.2 jar **不能**在 0.4.0 迁移过的库上启动。只换 jar 的回退必然失败。

### 2.2 文档更正

- `version.json` 的 `rollback`：删除“（如需）”，改为“停服 → 恢复
  `smart_workflow_20261109_pre040.dump` → 换回 `bootstrap.jar.bak-pre040`”，并写明
  0.4.0 迁移/列改名与 Flyway 校验原因。
- `docs/ops/production-ops.md` §8.1：在通用回滚步骤后新增“**0.4.0 → 0.3.2 强制恢复
  dump**”块，给出四步顺序与异常原文；§9.1 增加对应备份/恢复备注。
- 未改 UAT 数据库、未回滚 UAT、未动已发布 tag。

## 3. Z3 发布后分支同步

- 普通推送（非强推）：`2c3bf850..a4f6c278  main -> develop`。
- 远端回读：
  - `refs/heads/develop = a4f6c27815548e6fd63be0d40e24796139f3f1fa`
  - `refs/heads/main = a4f6c27815548e6fd63be0d40e24796139f3f1fa`
  - `refs/tags/0.4.0 = 6093c4cced542e29cf1bf18fd3f5f5aeb54c67a1`（annotated tag 对象，未移动）
- feature 分支：`refs/heads/feature/0.4.0-multi-database = 19ae82f3f5028b2bc2765c374dc28490f0d52ed3`，**保留**。

## 4. Z4 部署后 24 小时日志量

时间窗未到（要求 **2026-11-10 17:16 之后**）。本轮未做任何日志/磁盘写操作；届时只读记录：

- 当天 `server.log` 大小；
- `df -h /`；
- logrotate 是否已按 `maxsize 100M` 或 `daily` 实际轮转。

## 5. 下一步

1. Planner 终态复核前，需裁决 `agent-graph.png`：是否开一个 Web 补丁方向
   （补 `theme-default.css` / 自有节点样式，并顺带处理任务详情流程面板 0 高度），
   发布后重拍该图；否则 Z1 不能算完成。
2. Z4 到时间后补做并追加回执。
3. 本回执、`version.json`、`production-ops.md`、README 与七张新图提交后，做 GitHub 渲染回读。
