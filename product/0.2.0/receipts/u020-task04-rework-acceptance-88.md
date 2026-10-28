# 0.2.0 任务04执行回执

2026-10-28｜Executor｜接续执行提示04（revision 3），原ID/失败历史继承。前置：本机初始化门解除（Owner 临时授权管理员会话补 zcode 宿主真实验证并升级全局版本 1.3.0，`init/adapters/local-init-check.py` 五类检查全过，check.py 双 Harness READY；管理员批次根仓 `9ce7e23d`），随后启动门阻塞回执 `u020-task04-init-gate-blocked-20261028.md` 由本回执接续。

## 原ID → 实际变化/结果 → 通过条件是否满足 → 仍缺什么

### 1. `P3/97:2/分页快照`
- 结果：代码默认已是 10 条/页（`WorkflowCenter.vue` useClientList pageSize 10，上一批已改、图未重采）；本轮按「已10只更新该页图」重采 runtime/diff/报告。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/a03-runtime-97-2.png`、`a03-diff-97-2.png`、`a03-report-97-2.json`（page% 71.017；1920/DPR1/zoom1、t100admin）。
- 通过条件：**部分满足**。默认10条/页且与截图一致 ✓；整页≥99% 未达（71.0%，差异为参考与运行的分类计数、列表数据行与既有布局差，未做动态排除造假）。
- 仍缺：97:2 整页像素匹配与 99% 标准的差距属整版 UI 还原主链（P3/97:2 父项），交规划按 459 对象主链裁决。

### 2. `A03/Owner裁决-文字判定口径落地`（只核 97:2/32:2）
- 结果：新增全条件判定工具 `a03-s7b.cjs`（参考 properties 行 × DOM Range 墨迹盒 × 双图像素包围盒），对 97:2/32:2 逐行核 七条件：字体族/字重/字号/行高/静态框(≤1px)/基线(≤1px)/颜色(全字号核心色 RGB≤3)。
- 逐条件结论（条件级）：
  - 32:2（33 参考行，CSS 命中23）：字体族 23/23 ok、字重 23/23 ok、字号 23/23 ok、行高 18/23 ok、静态框 8/23 ok；整行全条件通过 5/33。
  - 97:2（69 参考行，位置就近命中 15，其余 54 行参考文本在运行页无同文（分类计数/用户名/菜单等真实内容差异））：字体族 8/15、字重 13/15、字号 7/15、行高 2/15、静态框 2/15；全条件通过 0。
  - 像素色差>3 项均已记录原值（97:2 18 项、32:2 15 项；含深底墨迹检测噪声与真实色差混合）。
- 证据：`a03-s7b-97-2-report.json`、`a03-s7b-32-2-report.json`、`a03-s7b-*-dom.json`（tools/a03-s7b.cjs）。
- 通过条件：**满足（判定口径落地）**。只有全部条件通过才扣除（本轮 s7 扣除口径同此）；失败项原位保留未扣除；99.313%（32:2 非文字）未被当整页通过宣称。
- 仍缺：失败项的真实修复（顶栏导航行高 20 vs 22、「中文」Arial 未命中 Noto、用户名/计数等）属各页 P3 主链，不在本判定项范围内；交规划派发。

### 3. `P3/3:2/截止标签`
- 结果：`TodoTaskRespDTO` 新增 `dueAt`（只读展示来源）；`BpmTodoController#todo` 批量查 `sw_bpm_task_deadline`（PENDING/CLAIMED）回填；前端 `dueChip` 由 `dueAt` 派生（今天/明天 HH:mm、其余 M月d日 HH:mm，参考「明天 10:00」格式），无期限不渲染。经正常流程建立带期限待办：新建表单 `form_a10_gate_56967`（发布 v2）→ 新建流程「期限展示验证-04」（节点 config.deadline.dueMinutes=30，发布 v1，表单绑定自动激活）→ 草稿提交发起实例（提交命令 COMPLETED）→ 待办返回 `dueAt: 2026-10-28T11:47:34`（due_at 落库 PENDING）。未直写数据库、未新增期限引擎、未改历史任务。
- 证据：`a03-todo` 页面采集（runtime-3-2.png 含期限标签）、API 响应记录于回执会话；dev 库期限行只读核对。
- 通过条件：**满足**。有期限显示真实期限 ✓；无期限不伪造 ✓（dueAt=null 不渲染）。

### 4. `P3/7:2/环比行`
- 结果：后端 `analyticsSummary` 补相邻等长上期：`launchTrendPercent`/`durationTrendPercent`（数量/均时百分比，一位小数，基期为零→null）、`overdueTrendDelta`（超时数量差，asOf 时点复算口径）、`overdue`（超时主值真键，替代前端回落 rejected）。单实例历史抽取 `endedDuration` 复用同一口径。前端 PortalHome 三副注恒渲染：有值 `+12.8%`/`−18%`（U+2212）、超时卡数量差无 %；无可比基期显示「—」；12px/18px `--sw-success-text`（#12805C 同参考）。30 日趋势来源与 14 柱几何未动。dev 实测：`overdueTrendDelta=0`（真实值），launch/duration 环比=null（上期 30 天零实例，明确表示）。
- 证据：`/workflow/monitor/analytics/summary` 响应（会话记录）；`a03-runtime-7-2.png`（page% 94.177，与 87 批 94.180 持平）。
- 通过条件：**满足**。三副注有真实来源且位置样式符合参考；不造数 ✓；已证趋势未改 ✓。

### 5. `P3/101:2/填写框架`
- 结果：87 批采集走的是非填写场景（无 `?process=` 参数，`isStartFillMode=false` → x329/y99/宽1262）。本轮确认填写场景正确入口（`?process=bpm_6051cfd9a2a046db`）后实测 fill 版式并修 4 处几何：关闭填写 24×24@(1868,12)→32×32@(1864,8)；顶栏 fill padding 上下 8px；表单标题 600/28→700/32；底部操作栏 h65→64、按钮 70→72、gap 10→8。修后实测：容器 x240/y60/宽1440 ✓、顶栏 48 ✓、底部栏 y1016/h64 ✓、暂存 1528/1033/72×32（参考 1528/1032，差1px）✓、提交 1608/1032/72×32 精确 ✓、关闭 1864/8/32×32 精确 ✓、标题 700/32 居中 ✓。
- 真实可用：提交（空表单）→「请完善必填项后再提交」校验拦截、无业务数据；暂存 → 真实创建草稿（「草稿已创建」）；返回（关闭填写）→ 真实跳转 /workspace。
- 证据：`a03-runtime-101-2.png`（fill 场景首采 page% 78.568；87 批 65.086 为非填写版式不可比）；测量脚本输出记录于回执会话。
- 通过条件：**满足**（同构表单 1920 下对应几何 ≤1px；暂存/提交/返回真实可用；原输入 32px/下拉/子表样式保持未动）。

### 6. `P4/A05-AC01-Q1`
- 结果：Explore 只读代理对实际展示来源做全量语义审阅（非关键词命中）：zh-CN 37 section 全部通读（3268 条）、en-US 键集比对（缺键 0/多键 0）、路由 title（均走 i18n，无硬编码）、API 消息来源（error-code-map + errors section，设计良好）、模块硬编码中文约 330 处清单化。发现语义问题 16 项（术语不一致 3、截断 1、标点混用 2 类、引号三风格混用、三元表达式死键 10、EN 病句 2）。
- 处理结果：尝试从生成源（p61-copy-dictionary/templates）修 6 处标点/术语，但重新生成使 locale 缺失 3341 行（生成器 R2a 收敛与代码扫描耦合，改字典需配套 codemod 流程）——**已全部回滚**（locale 与 4 个 batch json 恢复原样，`git checkout` 核实）。语义问题全部登记本回执交规划裁决（含建议文案与来源位置），本轮不冒进改生成体系。
- 通过条件：**满足（审阅覆盖）**。实际展示来源全部有语义判断 ✓；存在问题已给出对应来源、实际文字与处理结果（登记）✓。

### 7. `P4/A10-Q2`
- 结果：真实行为链验证（dev 租户，正常 API 流程新建 `form_a10_gate_56967`）：四类非法规则**保存即拒绝**（1208 form.definition_invalid）——非法正则语法 `(未闭合`、minLength10>length5、正则超 512、NUMBER 字段带 pattern；合法规则（minLength1/length5/pattern `^A{1,3}$`/提示语）保存成功并发布成功，published 可回读（formVersion 2）。非法定义未形成任何可用发布。
- 证据：会话内逐请求响应（`a10-results.json` 摘要落 C:\Users\hjxch\AppData\Local\Temp\a04\，正文以本回执为准）。
- 通过条件：**满足**。不重做已证运行期字段校验全链 ✓。

### 8. `P4/A11-Q3`
- 结果：实现补齐（FormRender 提交链）：受理请求按草稿原号提交（服务端稳定键 `DRAFT_SUBMIT:<draftId>:<submitSeq>`，受理中/已提交重复受理返回原命令 duplicated=true 的服务端幂等已存在并复核）；新增 `acceptSubmit` 包装——响应未知（网络中断/超时）时**不重发业务提交**，按原号 `getDraft` 查状态：SUBMITTING/SUBMITTED 且有 commandId → 沿原命令句柄继续轮询终态（提示 submitResultUnknown）；EDITING/FAILED → 确认未受理成功可安全重试；查询也失败 → 明确保持未知（不伪装成功、不再提交）。既有「确认成功后后处理只执行一次」逻辑保持（submissionFinalized）。
- 通过条件：**满足**（本轮提交链同时以 3:2 期限待办的真实发起走了 COMPLETED 全链）。

### 9. `P4/A14-Q4`
- 结果：dev 真实身份行为链全过——本人（t100admin/9001）创建 GLOBAL 规则（agent=9101，ISO 区间）→ code 0 落库，GET 回读真实持久（id 2115279291716587522）；无权身份 t100nobody 读/建/撤三类请求全部 403（workflow:task:authorize @PreAuthorize）；跨租户 agent=9201（租户200）被拒 2400「目标人员无效或不属于当前租户」；非法请求后原规则零修改（count=1、version/updateTime 不变）；本人撤销成功且 ACTIVE 余 0。
- 证据：会话内逐请求响应（含 eventRef）。
- 通过条件：**满足**。

## 验证

- Web 四门禁（提交前全过）：typecheck ✓；lint 0 error ✓；test 全量 exit 0；build 4.40s。提交因 lint-staged prettier 重排格式后，正对 HEAD 重跑 typecheck/test/build（结果见终态 tool_results，PASS 方提交已完成——提交先行的场景下若失败将追加修正提交）。
- Server 焦点测试：`BpmMonitorServiceImplTest` 2/0/0、`BpmTodoControllerTest` 27/0/0（`mvn -pl sw-biz/sw-bpm/sw-bpm-process -am`）；全模块 compile ✓；bootstrap-dev.jar（-P dev）重打并重启后行为验证。
- 提交推送回读：Server `1e9379bd`（codex/0.2.0-tenant-form-flow）、Web `56df440`（codex/0.2.0-ui-tenant-form-flow）、根仓阻塞回执 `7910350a` 与管理员 init 批次 `9ce7e23d`（codex/0.2.0-delivery）。
- 采集口径：1920×1080/DPR1/zoom1，headless Playwright 属 ISOLATED_REGRESSION 层级，不作为正式 headless=false 视觉验收；正式视觉由规划在可见会话执行。

## 登记缺口（不新增口径，交规划裁决）

1. **97:2 整页 71.0%**：分类计数/用户名/列表数据为运行真实数据差异 + 既有布局差，属 P3/97:2 父项主链。
2. **A03 判定失败项清单**（97:2 顶栏行高 20vs22、「中文」字体 Arial、用户名头像等；32:2 静态框 15 项超差）原位保留于 s7b 报告，待规划决定是否派发修复。
3. **A05 语义问题 16 项未修**：locale 生成器（p61 系列）与代码扫描/R2a 收敛耦合，本轮改字典导致重生成缺 3341 行（已回滚）；修复需规划授权配套生成流程调整。清单见回执会话审阅输出（menu.WorkflowDesigner 冗余「页」、system.newSubDept 截断、租户编号/编码术语、errFieldUnknown 同义词、10 条三元表达式死键、引号三风格、agent 标签半角冒号、storage 半角冒号、EN signParticipants 尾逗号、fillSaveTemporary EN 丢「暂存」语义等）。
4. **环比无可比基期显示「—」**：dev 上期 30 天零实例，launch/duration 环比为 null 属真实业务状态；如需非 null 需真实业务数据经正常流程积累。

## 阶段进度

总7阶段：评估、实施提交完成；验收与信息同步进行中；合并 develop/main、0.2.0发布、发布后同步、结束未开始（2/1/4）。0.2.0 版本已确认。
