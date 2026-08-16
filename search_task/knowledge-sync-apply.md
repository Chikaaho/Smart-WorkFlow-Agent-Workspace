# 探索任务：D83 探索回执结论落库（knowledge/ 补一轮 §3.3 全量同步）

> 派发：规划层，2026-08-16。执行角色自主执行，产出唯一回执。

**任务目标**：把三份 D83 探索回执（`search_fallback/baseline-static-recount.md`、`known-issues-verification.md`、`checklist-status-full-verification.md`）中属于 knowledge/ 的修正全部落库，补齐 D81 同步只覆盖首部、中下部残留的欠账。

**需要回答的问题（逐项落库，回执报告触碰文件清单）**：

1. **登记 I49/I50/I51 进 `knowledge/known-issues.md`**（编号按 D83 裁定，注册表为权威）：
   - I49（中）：V29 菜单 seed 未 seed sys_role_menu——`V29__job_storage_menu_seed.sql:20` 注释「超管旁路」；正式环境 job/storage 菜单仅超管可达，I43/I44「生产菜单可达」口径仅对超管成立
   - I50（低）：`AuthController.login` 状态校验位于密码匹配之后（L88→L92），停用账号仍消耗 BCrypt+用户查询，时序/资源问题
   - I51（高）：前端 status 语义与后端相反——`UserList.vue:337-341`/`DeptList.vue:314-317` 正常=1/停用=0 vs `SysUser.java:41` 0=正常 1=停用 2=锁定、`AuthController.java:189-194`；UI 新建用户无法登录、UI 停用不阻断登录，I33 修复在 UI 路径被抵消；SysRole/SysPost 前端映射与后端一致，属前端值映射错误
2. **失准条目修正**：I26 影响面上调（H2 全链 V5 同样改名，任何全链 Flyway 环境下 SysRole MP 查询必崩，测试 DDL 绕过 Flyway 掩盖，严重程度上调至 高）；I30 状态改已满足/可关闭；I3 索引行描述更新（Step 3 已完成，仅 M04-F06 Step 4 未做）；I18 描述前提更新（工作区已无 zip，子项目 system.md 已更新至 27,071/27,861 字节）；I38 数字 8/16→8/17
3. **knowledge/current-status.md 补同步**（17 处，见 baseline 回执 §5，重点）：§4 进行中表（bpm-plugin 已 COMPLETED）、§5 已完成功能 14→16 行、§8 13→16、§9 测试基线 521→527/63f552t→66f569t、§1 V1-V17→V1-V30、§2.1 agent 模块状态、§2.2 Vue Flow adapter 消费方、L249 清单计数 54/89→55/90
4. **knowledge/session-handoff.md 补同步**：§3-15 全段 11 功能/465/60f521t/页脚 07-30 → 16 功能/527/66f569t/D82 PASSED
5. **knowledge/decisions.md 归属裁定**：D47-D82 是否补录，或注册表归属改为 memory/decisions.md 为准（README 指向冲突需一并处理）——请给出建议，登记权在规划层，但你需先核实 memory/decisions.md 的 D47-D82 完整度
6. **todo/README.md 清理**：T1（I2 已修复）删行、T10（I30 可关闭）删行
7. **前端计数口径注记**：knowledge/ 基线涉及前端测试数处注明「569=运行口径，静态 561（tokens.spec.ts 循环展开）」

**搜索范围**：三份 D83 回执、`knowledge/known-issues.md`、`knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/decisions.md`、`todo/README.md`、`memory/decisions.md`（仅核实 D47-D82 完整度）。

**禁止范围**：不修改 memory/、`todo/requirement-pool.md`、两端代码；不执行 mvn/pnpm/npm/java/node 编译或测试命令（纯静态读码+文档编辑）；编号登记不得改变 I1-I48 既有编号。

**预期证据**：逐项落库的 diff 摘要（文件|改动点|改前→改后）+ 触碰文件清单。

**完成标准**：7 项全部落库 + 回执按 §0.5.5 格式写入指定位置（含触碰文件清单）。

**失败处理**：信息不足或与回执冲突处列入"未确认事项"并说明，回执仍按时写入。

**回执位置**：`search_fallback/knowledge-sync-apply.md`
