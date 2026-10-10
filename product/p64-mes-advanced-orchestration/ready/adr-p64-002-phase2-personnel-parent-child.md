# ADR-P64-002：阶段Ⅱ 人员与父子协作（批次冻结、稳定行回写、岗位委托与聚合）

2026-10-10；Executor；状态：生效（阶段Ⅱ实现与实机验证后按实际决策记录）。延续 [ADR-P64-001](adr-p64-001-phase1-data-to-action.md)（阶段Ⅰ 数据到动作）。

## 1. 背景与范围

阶段Ⅱ交付 A05（单/N 子流程与四等待策略）、A06（隔离与稳定行回写）、A07（岗位委托与下一会签聚合）及相关 A11/A12。约束：旧图零行为、旧实例按冻结 def_version 原义运行、迁移全部追加式、PG/H2 逐字节一致、失败/冲突可诊断不凑数。

## 2. 决策

### D1 子流程批次/批次项两张追加表（V0.1.8）
- `sw_bpm_child_batch`（batch_key 唯一、parent/root 实例、parent_depth、trigger/action、round_no、wait_policy/wait_count、expected_count、source_record_id/version、status WAITING/SETTLED/BLOCKED/CANCELLED、config_json 冻结动作配置）。
- `sw_bpm_child_item`（batch_id、item_key、action_ref_id、`source_row_id`/`source_row_version` 代表行、**`source_rows_json`：本项授权来源行集合 `[{rowId,version}]`**、target_record_id/target_instance_id、status DISPATCHED/WRITTEN/CONFLICT/FAILED/LATE/REFUSED、writeback_json/source/error_text）。
- 派发同事务冻结：预期数、来源行身份与逐行版本、回写配置；转办/重试不新增预期数（批次身份锚定）。

### D2 等待节点＝Flowable ReceiveTask + 类委托监听（V0.1.8 译码器）
- `SUBFLOW_WAIT` 翻译为 ReceiveTask，start 执行监听挂载 `flowable:class`（`SubflowWaitListener`）：Flowable 反射实例化、经静态桥接转发 Spring 单例；令牌到达核对引用批次，全结算即唤醒，否则等待结算侧 `signalWaitNode` 幂等唤醒（无等待流吸收）。
- 选择类委托而非 delegation expression：部分引擎/部署形态下表达式 bean 解析不可用（实机缺陷③，见 §4）。

### D3 稳定行回写门面（form 模块）
- `FormDataWritebackFacade#applyWriteback`：列白名单 + 参数化 + 手写 `deleted=0 AND tenant_id=?` + `parent_record_id` 防线 + **乐观版本守卫**；`readVersion` 供派发冻结。
- 冲突（VERSION_CONFLICT）→ 挂起（CONFLICT），不覆盖任何现有值；NOT_FOUND（错行/越权）→ FAILED 可诊断。
- 行级回写按**授权来源行集合**逐行应用（集合外行忽略）；主记录字段回写按批次冻结版本守卫（同字段并发的合法冲突挂起）。

### D4 子实例授权来源行交付（派发预填）
- CHILD 行级回写动作在派发时把本项来源行（分组项＝组内多行）预填到子记录的目标表格字段（`{rowKeyField: rowId}`），子流程只取得本实例授权来源行；Web 办理页节点表单表格以记录现值预填（无值才填，编辑不回退）。

### D5 岗位委托（V0.1.9 `sys_post_delegate` + R__ 菜单）
- 源岗位→受托岗位 + 适用范围（ORG/DEPT）+ 启停；配置期拒绝自委托/循环/跨租户/越权/同优先级重叠/超 4 跳；启用时重校验。
- 解析：精确部门优先于 ORG 默认；逐跳审计链；未命中沿 P63 原义用源岗位人员；命中但目标空缺/失效 → 异常（不回退）；同轮名单冻结，合法新轮次重新解析。
- 解析失败以 `IllegalStateException` 抛出并在 BPM 边界翻译（避免 system→bpm 反向依赖）。

### D6 聚合会签（NODE_FORM_AGGREGATE）
- 读取来源节点指定轮次全部有效最终提交的节点表单人员字段（经 `NodeFormPersonAggregatePort` 权威读取），按用户 ID 并集去重；失效/越权人员整体拒绝（准确性优先）；来源任务/字段/轮次可追溯。

### D7 护栏与兼容
- 嵌套默认 3 层/硬 8 层、同根链 ≤1000 自动发起实例、单次派发默认 50/硬 200（`sw.bpm.orchestration.max-nesting`）；发布期校验 K≤maxDispatch、等待节点引用 CHILD 非 NONE、回写结构/父字段存在性。
- 迁移纯追加；旧代码回滚不读写新表；无 CHILD 配置的旧图零行为（冻结图按 def_version 运行）。回退边界见 ADR-P64-001 §6 口径延续。

## 3. 本轮修复（实机反证，均附单测/实机证据）

| # | 缺陷 | 修复 | 提交 |
|---|---|---|---|
| ① | 等待端口双实现注入歧义（NoUniqueBeanDefinitionException） | 编排服务不再实现端口，仅保留单适配器 | `1014d8b` |
| ② | 脚本 worker 类路径超长/不可复用于子进程 | `sw.bpm.script.worker-classpath`/`SW_BPM_SCRIPT_WORKER_CLASSPATH` 显式覆盖（缺省原语义） | `1014d8b` |
| ③ | 等待监听 delegation expression bean 解析失败 | `flowable:class` 类委托 + 静态桥接（无依赖构造） | `da11534` |
| ④ | 批次项与子实例关联回填（异步 ORCH 消费先于完成事件） | 按（租户，target_record_id=子 businessKey）反查意图→项并回填 | `492c616` |
| ⑤ | 分组项只冻结单行且未交付本组来源行（行级回写对多行组不成立） | `source_rows_json` 冻结集合 + 逐行回写（集合外拒绝）+ 派发预填子记录表格 | `86ae3fe` |
| ⑥ | 冲突恢复未清 source_rows_json 内冻结版本（重放仍冲突） | 恢复清空集合内版本（保留行身份） | `8b5bb10` |
| ⑦ | BLOCKED 批次在恢复后不重评（守卫仅 WAITING→SETTLED） | 允许 BLOCKED 重评并结算（状态守卫同步） | `8b5bb10` |

## 4. 兼容窗口与回退责任

- 新增表/列全部追加；`source_rows_json` 为新增列（V0.1.8 内），旧行按 `source_row_id` 单值回退，行为兼容。
- 旧代码不读写新表（零行为）；回退到旧版本时新表数据保留不删（不通过破坏性 DDL 删除事实）。
- 受影响旧实例：冻结 def_version 图运行（阶段Ⅰ锁定；本轮未改该路径）。
- 部署并发/排队等资源值不在本阶段变更（沿 P62 边界，策略默认关闭）。

## 5. 已知边界（如实）

- 主记录字段回写按批次冻结版本守卫：同字段多子并发写 → 后者 CONFLICT 挂起，须有权恢复（本轮实机演示恢复后 SETTLED）。
- 子记录主字段为空时，主字段映射按配置原样写入（含 null）——不做隐式跳过（配置语义直译，避免静默丢弃）。
- 聚合会签在回执02 轮的证据层级为 UNIT（原单测断言：并集去重/失效拒绝/轮次偏移）；回执03 轮按一级提示01 补实机聚合下一会签演示与逐 case 原件（evidence/phase2-03）；完整多角色 S2 会签场景仍属阶段Ⅲ A09。
