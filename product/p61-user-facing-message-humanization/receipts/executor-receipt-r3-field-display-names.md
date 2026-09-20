# P61 执行回执：R3a/R3b 字段显示名（Server）

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 对应原子项：R3a、R3b（一级执行提示 01 §2）
> 证据：本回执内嵌命令原始结果摘要 + surefire 报告

## 0. 对此前表述的更正

前轮对话我称 R3a/R3b/R4a/R8b/R8c「未开始」，这是**错误陈述**。规划审查 02 与阶段 C/D 证据明确记载这些项为部分完成（`assertEditablePayload` 显示名重载、`collectFieldLabels`、`displayOf` 均已存在）。本轮先读取 Server 代码核实后才继续推进。

## 1. R3a：canView/canEdit 调用方的字段显示名

**调用点核查**（`grep canView|canEdit|assertEditablePayload`，main 源）：

| 调用点 | 用途 | 判定 |
|---|---|---|
| `FormDataQueryService:808` | 子字段 view 拒绝集展开（内部集合，不直接成文） | 不产生键文案 |
| `FormDataQueryService:199/313` | 投影剔除（无 view 权字段静默不出现） | 安全要求：敏感值不侧漏，正确 |
| `FormDataQueryService.validateAndBuildClauses` | 筛选拒绝消息 | **残留 3 处键回显 → 本轮修复** |
| `FormFieldEnrichmentService:106` | 编辑权限闸门 | 前轮已接显示名（有测试） |

**本轮修复**（`FormDataQueryService`）：

- `QUERY_FILTER_FIELD_NOT_FILTERABLE`（600）、「操作符不适用」（607）、「说明文字字段」（619）三处消息改用 `fieldDisplay.getOrDefault(field, field)`，即 definition 的 `label`。
- 新增 `fieldDisplayFor(formId)`：从 definition 提取字段键 → 显示名映射（复用 `FormFieldEnrichmentService.collectFieldLabels`，本轮由 private 改 public）。
- **保留原样的两处及依据**：`QUERY_FILTER_FIELD_UNKNOWN`（594）对「未知字段与无 view 权字段同口径拒绝」，回显的是用户自己输入的串，展示 label 反而确认字段存在性（源注释即此安全依据）；`id` 系统主键列（613）非表单字段、无显示名。

**行为证据**：`FormDataQueryServiceTest` 23/23 通过，含强化断言——RICH_TEXT 筛选拒绝消息必须含 label「内容」且不含字段键 `content`（此前只断言错误码）。

## 2. R3b：FormVisibilityRules 显示名

**修复前**：8 处消息直接回显 `rule.target()` / `condition.field()` 内部键（79/82/85/88/92/95/99/246 行）。

**修复**：
- 新增 `parseAndValidate(String, Map<String,String> fieldDisplay)` 权威重载；旧 `Set<String>` 签名保留并委托（键即显示名），既有测试不破坏。
- 已知字段一律用 `display(fieldDisplay, key)`；**未定义字段只回显设计者输入的键**（不泄露其他字段存在性）。
- 环依赖检查 `assertAcyclic`/`dfs` 同步接收映射。
- 两个发布门调用点（`FormDefServiceImpl` 校验与发布）改传 `collectFieldDisplay(definitionJson)`。

**行为证据**：`FormVisibilityRulesTest` 8/8 通过，含新增测试 `validateMessagesUseFieldDisplayName`——重复规则/循环依赖/op 非法三种消息均断言含显示名（月薪/部门）且不含字段键（salary/dept），并验证未定义字段回显输入键的边界。

## 3. 编译与测试门禁

```
mvn -pl sw-biz/sw-biz-form/sw-biz-form-biz -am test
```

- 全模块（form-biz）surefire 汇总：**tests=133 failures=0 errors=0**
- 聚焦：FormDataQueryServiceTest 23/23、FormVisibilityRulesTest 8/8
- 附带修正：此前「GlobalExceptionHandler 构造器不匹配」的测试编译失败是**陈旧安装依赖**所致（本地仓库旧 sw-common jar），`-am` 从源码构建即消除；两条相关测试无需改动。

## 4. 边界

R3a 的完整闭环还要求「真实请求 + DOM + 受控字段键反向扫描」，归 R6b/R7 的真实运行链；本回执声称 Server 逻辑与行为测试层完成，不声称浏览器证据已取得。
