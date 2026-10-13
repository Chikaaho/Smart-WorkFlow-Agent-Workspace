# BF20261013-021 执行回执：脚本常用函数封装与 `#函数名` 语法糖（流程 + 表单）

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14：“①流程脚本需要封装常用函数：获取分管领导（部门id）、获取部门负责人（部门id）、获取流程变量（变量名）、设置流程变量（变量名，变量值），可自行补充；②表单组件的高级编辑也要脚本，封装：获取字段值（字段id）、设置字段值（字段id，字段值）、设置必填（字段id true/false）、设置隐藏（字段id true/false），可自行补充；③表单与流程脚本都用 `#函数名` 表示，例：`var value = #获取流程变量(var_dept_ids)`”。

## 流程脚本（Server）

- **`#` 语法糖编译器**（engine `ScriptSugar`，与 Web 侧 `script-sugar.ts` 同语义）：`#函数名(裸变量名)` 编译为普通 JS 调用并自动按名字字符串处理（`#获取流程变量(var_dept_ids)` → `获取流程变量("var_dept_ids")`）；已引号/数字/表达式透传；嵌套调用递归编译；字符串/注释/模板串内不动；畸形糖给定位诊断。run/validate 入口统一应用。
- **宿主函数**（隔离 worker 内执行）：
  - `获取流程变量(name)`（别名 流程变量取值/getVariable）——取值优先级：本脚本写入 > 实例变量快照 > 授权变量快照；未授权且实例中不存在 → 可诊断脚本错误；
  - `设置流程变量(name, value)`（别名 setVariable）——写入随结果回传，由宿主经 `BpmTaskFacade.setVariable` 落到流程实例变量（跨脚本/节点结果函数的通信层）；值支持 数字/文本/是-否/空/数组/对象（≤64KiB）；系统保留键与空名拒绝；
  - `获取部门负责人(deptId)` / `获取分管领导(deptId)` / `获取上级部门(deptId)`（别名 deptLeader/deptSupervisor/parentDept）——基于宿主预取的部门目录快照（部门ID/上级/有效负责人，同租户启用校验）；未找到返回 null。**分管领导语义**：沿部门树向上找最近的、已登记负责人的上级部门（不含本部门）——现有数据模型无独立“分管”字段，取该可推导语义；如与组织口径不符请指出，可迭代。
- **协议与接线**：worker JSON 协议新增 `functionContext`（组织目录 + 实例变量，仅脚本引用相应函数时才构建/下发，既有脚本零额外开销）与应答 `variableWrites`；`BpmTriggerController` 预览端点回显将写入的变量（只读展示不落库）；触发器执行 OK 时逐项落库，写入失败登记 FAILED 并跳过派发。
- **数据面**：`DeptQueryFacade.listDeptDirectory(tenantId)` + `SysDeptMapper.selectDeptDirectory`（LEFT JOIN 有效负责人，单查询）；无新增表/迁移。

## 表单脚本（Web）

- **契约**：`BaseField.script = { code, onLoad? }`；防腐层解析校验形状后透传（非法形状按无脚本处理）；设计器补丁键白名单加入 `script`。
- **解释器（CSP 安全）**：应用 CSP `script-src 'self'`（禁 unsafe-eval）为既有高价值防线不动，字段脚本以自研 JS 子集解释器执行（`script-interpreter.ts`：var/if/return/表达式/数组/内置 String/Number/Boolean；步数预算 2000 步有界）；设计器即时语法校验同用解释器解析。
- **运行时**（`field-scripts.ts`）：值变更触发该字段脚本；`onLoad` 勾选后装载/回显也执行一次；级联上限 12 步防互写死循环；错误提示不打断填报。
- **函数**：`获取字段值` / `设置字段值` / `设置必填` / `设置隐藏` / `设置只读`（补充）/ `提示消息`（补充）/ `获取当前用户`、`获取当前用户姓名`、`获取当前部门`（补充，来自会话用户）+ 英文别名。
- **接入面**：FormRender（填报页：渲染/必填校验/提交载荷与脚本隐藏同口径；只读查看态不执行）与 TaskDetail 节点业务表单（同口径；草稿保存保留全部数据、最终提交剔除脚本隐藏字段）。
- **设计器面板**：「高级信息」下新增「高级编辑（脚本）」——代码框 + 「表单打开时也执行」+ 即时语法错误 + 可用函数列表（一键插入）；流程设计器触发器脚本下方同步加入流程函数参考与嵌套示例。

## 验证

- Server：engine 全量测试通过（含新增 ScriptSugarTest 11、BpmScriptFunctionsTest 12、ScriptWorkerPoolTest 函数上下文协议真实 worker 用例）；system-biz 全量、sw-bpm-process 全量（含 TriggerExecutionServiceTest 新增 2 写入用例、BpmScriptFunctionContextFactoryTest 3）通过；`sw-bootstrap -am package` 全量编译通过；服务端重启成功（pid 64870）。
- Web 四门：lint 0 错 3 警、typecheck 0、vitest 1478 通过 3 跳过（新增 script-sugar 10、script-interpreter 10、field-scripts 7 用例）、build ✓。
- 实景（应用内浏览器）：表单脚本从设计器撰写（含即时语法校验）→ 保存发布 → 填报页输入「你好」→ 另一字段实时显示「脚本:你好」且必填红星出现；输入「hideA」→ 目标字段隐藏。触发器弹窗函数参考渲染正常。证据：evidence/bf021-network-index.md 与三张截图。
- 边界：环境无已发布流程定义/运行实例，未做真实触发执行全链实景（引擎执行与 worker 协议已在真实 JVM 测试覆盖，接线为单测覆盖）；Owner 点验路径见网络索引。

## 提交

- Server：codex/bugfix-20261013（ScriptSugar/ScriptFunctionContext/端口/worker 协议/Runner 函数/工厂/TriggerExecutionService/预览端点/DeptQueryFacade/测试）。
- Web：codex/bugfix-20261013（script-sugar/script-interpreter/field-scripts/契约与防腐层/FormRender/TaskDetail/ScriptConfig/ProcessDesigner 帮助/契约测试）。
- 根仓：台账 BF20261013-021 行 + 本回执 + 证据 + 两子仓 gitlink。

## 状态

待 Owner 点验（与 BF001—020 同批）。
