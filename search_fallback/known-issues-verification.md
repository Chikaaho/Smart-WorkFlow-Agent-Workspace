# 探索任务回执：known-issues 注册表 I1-I48 复核

- **任务来源**：`search_task/known-issues-verification.md`（规划层派发，2026-08-16）
- **执行日期**：2026-08-16
- **执行方式**：1 个 Sub Agent 全量复核 + 汇总层交叉印证（与 checklist 复核回执对照 I33/I37/I43/I44 等）；纯静态读码，未执行任何编译/测试命令，未修改任何文件
- **核对声明**：I1-I48 全部有判定（I45 为记录性条目，未逐条复验，以 `search_fallback/feature-checklist-full-audit.md` 为权威，但其中 M07/M09/M10 部分已由清单复核轮间接核实仍成立）
- **结论摘要**：已修复条目**零复发**；未关闭条目**多数准确**，失准 7 处（§5）；新候选未登记问题 2 项（§4）；编号一致性基本自洽，冲突/过时 3 处（§3）

---

## §1 已修复条目复发检查（13 条）

| 编号 | 修复记录 | 代码现状证据 | 判定 |
|---|---|---|---|
| I1 | 清单同步（07-24 首轮 + 08-12 二轮 34 行） | 功能清单状态列实计 ✅12/🟦37/⬜41 共 90 行，与 D82 口径吻合；文件无未提交改动 | **无复发**（自 08-12 二轮后无新漂移；90 行逐行复核见 checklist 回执） |
| I2 | auth-seam-completion（07-22） | login/refresh/logout 三端点 + V18 refresh_token 表双份 | 无复发 |
| I3 | vue-flow-adapter + bpmn-adapter（部分） | flow-graph/bpmn 防腐层 + `/{id}/bpmn-xml` 端点 + **Step 3 实际完成**（`ProcessDefList.vue:15/93` mountBpmnViewer/openViewer） | 无复发（索引行描述过时，见 §5） |
| I5 | 07-14 独立验证 | 后端 @Test 静态计数=527 与基线吻合 | 无复发 |
| I7 | 通知列表+已读 | modules/notify api+NotifyHome.vue+spec 均在 | 无复发 |
| I9 | 全量 CSS 绕过 | `main.ts:3` element-plus css 仍先于 tokens.css | 无复发 |
| I24 | kb-verification VB1 | 静态 527 与基线 527 零差异 | 无复发 |
| I25 | kb-verification VF1 | spec 66 个 = 66f；静态 it( 561（运行 569 口径差 +8 系 tokens.spec.ts 循环展开） | 无复发 |
| I27 | B4 独立事务修复 | `RefreshTokenService.java:99-110` TransactionTemplate+REQUIRES_NEW | 无复发 |
| I28 | D34 越权补齐 | 仓库 system.md L34 硬约束存在 | 无复发 |
| I29 | 回执修正 | 文档级，当前基线口径一致 | 无复发 |
| I33 | checklist-gap-hardening（08-13） | AuthController login L92-97 + refresh L129-138 双入口 statusDenyMessage 校验（0 放行/1 停用/2 锁定，401 语义区分） | **无复发（后端）**；⚠ UI 路径反转见 checklist 回执 §4（前端映射 正常=1/停用=0 与后端相反，停用不阻断登录） |
| I37 | data-scope-enforcement（08-15） | @DataScope 7 表全在 + DeptScopeProviderImpl（@Lazy）+ V30 双份逐字一致 | 无复发 |
| I43/I44 | Flyway V29（08-13） | V29 双份逐字一致，4 行菜单 id16-19 | 无复发（I43/I44 修复范围超管可达性见 §4 候选 I49） |

## §2 未关闭条目现状（逐条）

| 编号 | 注册状态 | 实际状态 | 缺口/证据 | 已开发未满足 |
|---|---|---|---|---|
| I4 | 待开发 | 准确 | BasicLayout 无多页签（仅 router-view） | 否 |
| I6 | 已评估 | 准确 | @vueuse/core 纯传递依赖（锁文件 23 处命中，package.json 无） | 否 |
| I8/I12 | 设计预留 | 准确 | 单节点 RAMJobStore（`JobStartupRunner.java:17` 注释明言），接缝已预留 | 否 |
| I10 | 红线 | 准确 | FormData 各 Service 均 JdbcTemplate 裸 SQL，拦截器失效 | — |
| I11 | 需设计器强校验 | 准确 | 发布冻结不可逆仍成立；ColumnValidation 校验已部分存在 | 否 |
| I13 | 部分收敛 | 准确 | 剩余仅 RAG 选型/并行循环语义/流程表单联动（设计级） | 否 |
| I14 | 待产品设计 | 准确 | sw-basic-iot 仅 config 骨架 | 否 |
| I15/I16 | 设计级 | 准确 | 无代码可验 | 否 |
| I17 | 已知限制 | 基本准确 | 后端 RICH_TEXT 已 enabled=true（CLOB/TEXT 映射），前端未见富文本组件 | **部分**（后端已具备） |
| I18 | 定期检查 | **描述失准**（§5） | zip 已不存在（全仓 find *.zip=0）；子项目 system.md 已更新至 27,071/27,861 字节 | 否 |
| I19 | 已知限制 | 准确 | storage downloadFile 用 fetch() 绕过 request 层，mock 不拦截 | 否 |
| I20 | 已知限制 | 准确 | StorageController list 仅 page/size，无 originalName | 否 |
| I21 | 已知偏差 | 准确 | 仅 ControllerTest+DataScopeTest，无 StorageFacadeImplTest | 否 |
| I22 | 第三方依赖 | 准确 | @vueuse/core 传递依赖无法自修 | 否 |
| I23 | 文档与代码不一致 | 准确 | NotifyHome/StorageList 显式 import ElMessage 等 | 否 |
| I26 | 已确认待修复 | **失准**（§5，影响面被低估） | SysRole @TableField 名 vs V5 改名；测试 DDL 匹配实体绕过 Flyway 掩盖全链必崩 | **是**（活跃缺陷被测试掩盖） |
| I30 | 已知限制/暂不处理 | **状态过时**（§5，可关闭） | 代码已增强：`handlers.ts:738-769` mock bpmn-xml 按 processKey 参数化 + 3 userTask + activityId 对齐 | **已满足**（可关闭） |
| I31 | 待修复 | 准确 | DeptController 仅 tree/{id}/CRUD 无条件筛选 | 是 |
| I32 | 待修复 | 准确 | UserFormRequest 仅 deptId；全仓 0 处 sys_user_post | 是 |
| I34 | 待修复 | 准确 | selectUserPage 单参无条件 | 是 |
| I35 | 待修复 | 准确 | 无用户-岗位关联 | 是 |
| I36 | 待修复 | 准确 | sys_user_role 仅读无写 | 是 |
| I38 | 待修复 | 准确（数字微失准 §5） | FieldType 8 enabled + **9** disabled（enum 17 成员） | 是 |
| I39 | 待修复 | 准确 | 9 端点无 @DeleteMapping | 是 |
| I40 | 待修复 | 准确 | 五端点齐但列表配置仅自动派生 | 是 |
| I41 | 待修复 | 准确 | NotifyController 无 DELETE | 是 |
| I42 | 待修复 | 准确 | findByRecipient 仅按收件人倒序 | 是 |
| I45 | 记录性 | 未逐条复验（引审计回执） | M07/M09/M10 部分已由 checklist 复核轮间接确认仍成立 | — |
| I46 | 已知限制（不纳管） | 准确 | JdbcTemplate 通道 + SqlExecutor 绕拦截器属实（与 I10 同源） | 否 |
| I47 | 未修复待排期 | 准确 | bpm h2/pg V8 均含 `where active = true` partial index；bpm 链独立于冒烟 6 链 | 否 |
| I48 | 绕行已生效 | 准确 | flow-graph 无 onEdgeClick/命令式通道，绕行成立 | 否 |

## §3 编号一致性核对

| 项 | 结论 |
|---|---|
| memory/issues.md I46-I48 vs 注册表 | 编号一一对应、内容一致；**唯一冲突：I46 严重程度 memory 标「中」、注册表标「高」** |
| memory/issues.md I3 | 标「按设计 D40，可关闭」——与代码一致；注册表索引行未同步（仍写「UI 查看入口（Step 3）仍待后续」） |
| memory/issues.md I30 | 标「已增强可关闭」——代码证实；注册表仍「已知限制/暂不处理」、todo T10 仍列暂不修复——**三方不同步，代码和 memory 对，注册表与 todo 过时** |
| todo/README.md T1-T10 可追溯性 | 10 条全部可追溯到注册表编号（T1→I2、T2→I8/I12、T3→I17、T4→I19、T5→I20、T6→I21、T7→I22、T8→I23、T9→I6、T10→I30）✓；**状态冲突 1 处：T1→I2 已修复关闭，todo 未删行**（违反其自身收录规则第 3 条） |

## §4 代码中已暴露但未登记的问题（候选编号 I49 起，登记权归规划层）

| 候选编号 | 严重程度 | 一句话问题 | 证据 |
|---|---|---|---|
| I49（known-issues 轮建议） | 中 | **V29 菜单 seed 未 seed sys_role_menu（超管旁路 V6 决策沿用），正式环境 job/storage 菜单仅超管可达**——普通角色有 permission 也无菜单授权，I43/I44 修复记录「生产菜单可达」口径仅对超管成立 | `V29__job_storage_menu_seed.sql:20` 注释「不 seed sys_role_menu（超管旁路）」（h2/pg 双份） |
| I50（known-issues 轮建议，低） | 低 | **AuthController.login 状态校验位于密码匹配之后**（L88→L92 顺序）——停用账号仍消耗一次 BCrypt+用户查询，仅时序/资源问题无安全漏洞 | `AuthController.java:88-92` |
| I51（checklist 轮建议，高价值） | 高 | **前端 status 语义与后端相反**（UserList/DeptList 正常=1/停用=0 vs 后端 0=正常 1=停用 2=锁定）——UI 新建用户无法登录、UI 停用不阻断登录，I33 修复在 UI 路径被反转抵消 | `UserList.vue:337-341`、`SysUser.java:41`、`AuthController.java:189-194`（详见 checklist 回执 §4） |

> ⚠ **编号冲突提示**：checklist 复核轮与 known-issues 复核轮各自独立建议了「I49 起」的候选编号且互不相交（known-issues 轮：I49=V29 菜单授权、I50=登录时序；checklist 轮：I49 候选=前端 status 反转）。上表已统一为 **I49/I50/I51** 顺延排列，最终编号以规划层登记为准（D79 先例：注册表为权威）。

## §5 失准条目清单（7 处）

| 文件·编号 | 字段 | 现状/应为 |
|---|---|---|
| known-issues I3 | 索引行状态描述 | 「UI 查看入口（Step 3）仍待后续」过时——Step 3 已完成（ProcessDefList 已接 mountBpmnViewer），仅 M04-F06 流程监控（Step 4）未做 |
| known-issues I18 | 描述前提 | 「zip 中为最新工程宪法」失准——工作区已无 zip；子项目 system.md 已更新至 27,071/27,861 字节（记录值 22,440/17,323），该条已无同步对象 |
| known-issues I26 | 影响范围 | 「开发 H2 环境不受影响」**错误**——H2 全链 V5 同样改名，任何全链 Flyway 环境下 SysRole 的 MP 查询（IS_BUILTIN 列不存在）都会失败；测试全绿只因测试 DDL 绕过 Flyway。D79 后 Role CRUD 读写 dataScope 同样命中失配列，**影响面≥注册表所述，严重程度应上调** |
| known-issues I30 | 状态 | 代码已增强（3 userTask+processKey 参数化）且 memory 已标可关闭，注册表仍「已知限制/暂不处理」——**应同步为已满足/关闭**，todo T10 同步删除 |
| known-issues I38 | 数字 | 「8/16 类」应为 **8/17**（FieldType enum 现 17 成员，9 个占位 disabled） |
| memory/issues.md I46 | 严重程度 | 「中」vs 注册表「高」——两文件口径不一致，需统一 |
| todo/README.md T1 | 条目存续 | I2 已修复关闭，T1 过时未删（违反收录规则第 3 条） |

## §6 未确认事项

1. **I45**（虚低 15 条）：未逐条复验，以 `search_fallback/feature-checklist-full-audit.md` 为权威；其中 M07/M09/M10 部分已由 checklist 复核轮间接核实仍成立。
2. **I17 前端渲染**：后端 RICH_TEXT 已启用列映射确认；前端 renderer 是否仍为 textarea 未逐文件核验（置信度 90%，与注册表口径一致）。
3. **I22 构建警告**：禁运行约束下无法运行期验证，静态层面结论（第三方无法修复）成立。
4. **I5/I24/I25 运行期数字**：静态计数与声明基线吻合（527/66f），运行期真值未复验（见 baseline 回执，561+8=569 口径已解释）。
5. **I13 剩余项**（并行/循环语义、RAG 选型、流程表单联动）：设计级无代码可验。
