# P61 阶段 C 回执：表单与流程主链治理

> 角色：执行（Executor）｜功能：`p61-user-facing-message-humanization`｜等级：XL
> 方向：`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization.md` §6 阶段 C
> 日期：2026-09-15｜代码基线：Server `c15428f…`（0.1.0）
> 性质：**阶段回执**，不是功能级 completion receipt。

## 1. 阶段目标与内部 Step

方向 §6 阶段 C：完成表单设计、发布、填写、查询、导入导出、流程设计、发布、草稿、审批、
批量操作及其前后端语义统一，清除字段名、SQL/JDBC、BPMN 实现词和原始异常的无边界外显。

| Step | 内容 | 状态 |
|---|---|---|
| C1 | 表单发布校验：英文校验原文与内部枚举名不再外显 | 完成 |
| C2 | 表单数据主链：`e.getMessage()` 原始拼接清除 | 完成 |
| C3 | 物理表名/物理列名不再进入用户消息 | 完成 |
| C4 | 流程错误码用户文案：BPMN / process_key / tenantId / 适配器 / 节点内部词汇 | 完成 |
| C5 | 门禁与零残留扫描留档 | 完成 |
| C6 | 前后端语义统一（Web 1204—1208 对齐、2101—2105 冲突数值标注、同码异文收敛） | 完成（补齐轮见 `evidence/p61-c6-01/`） |
| C7 | 字段校验消息改用字段显示名（接入 definition label） | 完成 |

## 2. 实际修改文件与摘要

| 文件 | 摘要 |
|---|---|
| `sw-biz-form/.../service/impl/FormDefServiceImpl.java` | 6 处：字段标示不合法/重复的提示改为可行动结论（原含物理列名与 `ColumnValidation` 英文原文）；动态建表失败不再拼 JDBC 原文；字段类型不受支持/暂未开放的提示改为业务表述（原含 `FieldType 枚举`、`disabled`、英文整句） |
| `sw-biz-form/.../service/FormDataQueryService.java` | 查询失败统一为「查询记录时系统未能完成，请稍后重试」；「无物理表」「表名格式异常」改为「尚未完成数据表初始化，请联系管理员处理」 |
| `sw-biz-form/.../service/FormDataUpdateService.java` | 同上（更新与详情路径） |
| `sw-biz-form/.../service/FormDataDeleteService.java` | 删除失败改为安全结论；RESTRICT 引用提示由「物理表名 + 物理列名」改为「引用方表单名称 + 关联字段名」，并新增 `resolveFormNameByPhysicalTable` 由物理表名反查业务表单名（查不到退化为「其他表单」），物理标识只进日志 |
| `sw-biz-form/.../service/FormSubmitService.java` | 提交路径的「无物理表」与序列化失败文案改为安全结论 |
| `sw-biz-form/.../service/FormImportExportService.java` | 模板生成 / Excel 解析 / 导出失败改为可行动结论；逐行失败不再直出原始异常 |
| `sw-biz-bpm/.../exception/BpmErrorCode.java` | 12 条用户文案去除实现词汇：`process_key`、`BPMN`、`tenantId`、`入/出边基数`、`注册契约`、`缺少必要能力`、`适配器不存在`、`类型未实现`、`未注册的节点类型` |

## 3. 实际命令与原始结果

证据：`receipts/evidence/p61-cd-01/scan-and-gate.txt`。

| 命令 | 结果 |
|---|---|
| `MAVEN_OPTS="-Xmx2g" mvn -q compile` | exit 0 |
| `MAVEN_OPTS="-Xmx2g" mvn test` | **BUILD SUCCESS；TESTS=1400 / ERRORS=0 / SKIPPED=0 / FAILURES=0**（C7 补齐轮复测 **1407 / 0 / 0 / 0**） |

零残留扫描（main 源码，分隔符无关过滤）：

- 表单侧「无物理表 / 表名格式异常」：**零命中**
- 表单侧 `"<动作>失败: " + e.getMessage()` 原始异常拼接：**零命中**
- 表单侧内部枚举名 / 英文校验原文（`不在 FieldType 枚举中`、`is not enabled`、`(disabled)`）：**零命中**
- 流程侧用户文案中的实现词汇（BPMN / process_key / tenantId / 入出边基数 / 注册契约 等）：**零命中**

## 4. 与方向的偏差

1. **RESTRICT 引用提示引入了一次表单名反查**。原实现只持有物理表名，改为业务表单名需要在
   删除路径上按物理表名查一次元数据。该查询在租户挂起上下文内进行（与既有的跨租户
   `sw_form_config` 扫描同口径），并对异常做了退化处理（「其他表单」），不阻塞删除判定。
2. **批量审批逐项结果未在本阶段改造**。`BpmBatchServiceImpl` 的逐项 `message` 仍取
   `response.getMsg()` / `e.getMessage()`。当前这两者已是安全文案（阶段 A/B/C 已治理），
   故未再做包装；汇总计数与可下钻明细属阶段 F 的批量结果统一。

## 5. 未完成内容与风险

- **C6 补齐（后续增量，已验证）**：Web `error-code-map.ts` 的 1204—1208 兜底已改为后端真实码义
  （原为按不存在的 `FormPublishValidator` 登记的发布预检文案，幽灵引用已零命中）；
  2101—2105 冲突数值已标注「不得仅凭数值分流业务文案」；`FormRender.vue` 的本地错误码映射
  已删除并收敛到中央权威（消除同码异文）。Web 四门全绿
  （typecheck/lint/test/build exit 0，1200 passed + 3 skipped）。证据：`evidence/p61-c6-01/`。
- **C7 补齐（后续增量，已验证）**：`FormFieldValidator.FieldDef` 新增 `label` 并在 definition
  解析时填充；14 条用户可见校验提示全部改用 `displayName()`（优先设计者填写的显示名，缺省回退字段键），
  不再向用户暴露字段键；TABLE 子行提示同步改用子字段显示名。数字/日期/布尔/字典/多选/附件/时间/
  人员部门/数据源各分支的提示一并改为可行动表述（不再回显用户输入值与字典键）。
  C7 补齐轮门禁：**1407 / 0 / 0 / 0**；零双编码字节校验通过。
- **仍开放**：`FormFieldEnrichmentService`、`FormFieldValidator` 之外的引用/附件/外部数据源校验点
  （`FormFieldEnrichmentService`、`FieldPermissionService`）仍有少量字段键回显，属同类改造，
  需接入相同 `displayName()` 口径。
- **风险**：`resolveFormNameByPhysicalTable` 在删除热路径增加一次查询；已加 `LIMIT 1` 与异常退化。
  若该查询在异常时退化，用户看到的是「其他表单」，可行动性下降但不泄漏。

## 6. Git diff 摘要

```
Server: 7 files changed（sw-biz-form 6 + BpmErrorCode 1）
未执行 commit / push / tag / Release；未修改迁移。
```

## 7. 与验收标准对照

| 标准 | 结论 | 证据 |
|---|---|---|
| 5. 受控注入标记零暴露（SQL/JDBC/字段名范围） | **本阶段完成（表单/流程范围）**：表单侧不再出现物理表名、物理列名、JDBC/POI 原文、英文校验原文与内部枚举名；流程侧用户文案不再含实现词汇 | 上述四组零命中扫描 + 全量门禁 |
| 9. 不可重试问题不误导用户重复操作 | **本阶段完成（表单/流程范围）**：配置/结构类失败改为「请联系管理员处理」，不再写「稍后重试」 | `FormDataQueryService` 等改后文案 |
| 3. 1204—1208 服务端码义、Web 兜底、本地预检与契约说明一致 | **本阶段完成**：服务端码义已固定并写入目录与枚举 javadoc；Web 兜底已改为同义；幽灵引用 `FormPublishValidator` 零命中；设计器本地预检文案不再伪装成后端错误码 | `evidence/p61-c6-01/`；`error-code-map.ts` |
| 13. 文案单一权威、同义异文收敛 | **部分完成**：表单渲染页同码异文已收敛到中央权威；**跨页面同义异文与「自动检查阻止新增硬编码文案」仍未建** | `FormRender.vue`；— |

## 8. 自验结论

阶段 C 的 C1—C7 完成：表单与流程主链的用户可见消息不再外显 SQL/JDBC、物理表列名、
英文校验原文、实现词汇与业务字段键；Web 侧 1204—1208 已对齐真实码义、冲突数值已标注
不得仅凭数值分流、同码异文已收敛到中央权威；门禁 Server **1407 / 0 / 0 / 0**、
Web 四门 exit 0（1200 passed + 3 skipped）。

**遗留（已在 §5 列明）**：`FormFieldEnrichmentService` / `FieldPermissionService` 等
少数校验点的字段键回显需接入同一 `displayName()` 口径；跨页面同义异文与
「自动检查阻止新增硬编码文案」属阶段 E/F。

本阶段不自行判定阶段通过；不提请功能 PASSED、不核销 P61。
