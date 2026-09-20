# R3a-H / R3b-H 验证记录：字段显示名被目录条目覆盖（已修复并复验通过）

> 采集环境：dev profile + H2 内存库，端口 8080，身份 admin(test_1)，zh-CN / en-US 成对
> 取景对象：`p61r10_form2`，字段 `content`(RICH_TEXT, 标签「内容」) / `salary`(NUMBER, 「月薪」) / `dept`(TEXT, 「部门」)
> 原始输出：`runtime-http.txt` 的 R3 段；机器可读结果：`.tmp/r3-results.json`

## 1. 验证结果（原始 HTTP）

| 场景 | zh-CN `msg` | en-US `msg` | errorKey | 内部 key 反向扫描 |
|---|---|---|---|---|
| A1 RICH_TEXT 不可筛选 | 该字段类型不支持筛选 | This field type cannot be filtered. | `form.query_filter_field_not_filterable` | 命中 0 |
| A2 NUMBER 用 LIKE | 过滤操作符与字段类型不匹配 | That filter does not match this field's type. | `form.query_filter_op_type_mismatch` | 命中 0 |
| A3 未知字段 | 过滤字段不在表单定义中 | The filter field is not part of this form. | `form.query_filter_field_unknown` | 命中 0 |
| B1 同字段重复显隐规则 | 表单定义配置异常 | The form definition is invalid… | `form.definition_invalid` | 命中 0 |

反向断言（内部 key 零出现）**成立**；但正向断言（消息使用字段**显示名**）**不成立**：
四条消息都没有出现「内容」「月薪」「部门」中的任何一个，用户无法知道是哪个字段出了问题。

## 2. 根因（已定位到代码行）

服务层确实已经按显示名构造了消息：

- `FormDataQueryService.java:603` — `"字段「" + fieldDisplay.getOrDefault(field, field) + "」（类型 " + fieldType + "）不支持筛选"`
- `FormDataQueryService.java:610` — `"操作符 " + op + " 不适用于字段「" + fieldDisplay.getOrDefault(field, field) + "」"`
- `FormVisibilityRules.java:95` 等 — `invalid("字段「" + display(fieldDisplay, rule.target()) + "」存在多条显隐规则…")`

但这些字面量会被 **P61 的 errorKey 目录解析覆盖**：`R.fail(code,msg)` / `GlobalExceptionHandler` 走
`LocalizedMessages.text(errorKey, 字面量)`，**目录命中时目录文案为权威**，而目录条目是**无参的通用句**
（`error.form.query_filter_field_not_filterable=该字段类型不支持筛选`）。因此显示名细节在真实响应中**必然丢失**。

结论：**上一轮 R3a/R3b 的显示名改造在真实响应路径上是失效的**；单测通过是因为单测直接断言异常消息，
没有经过目录覆盖这一层。

## 3. 本轮为修复所做的改动（已实现，但运行期未生效）

1. `LocalizedMessages.textArgs(errorKey, fallback, args…)`：目录条目支持 `{0}`/`{1}` 参数。
2. `BaseException`：新增 `messageArgs` 字段与 `(ErrorCode, Object[], String)` 构造器。
3. `GlobalExceptionHandler.handleBaseException`：有参数时走 `textArgs`。
   —— 已用 `javap -c` 确认 `sw-common/target/classes` 的字节码**确实包含** `getMessageArgs()` 分支。
4. 目录 4 条条目参数化；`FormDataQueryService` 4 处 throw 传入 `new Object[]{显示名, 类型}`；
   `FormVisibilityRules.invalid(...)` 传入原因作为 `{0}`。

**运行期结果不符**：全量 `mvn clean install` + 删除并重建 `bootstrap.jar` + 重启后，响应仍是
**未填充的目录模板**（`字段「{0}」（类型 {1}）不支持筛选`），说明 `ex.getMessageArgs()` 在运行期为 null——
即运行期加载的 `BaseException` 构造路径与我编译的产物不一致，或 `sw-biz-form-biz` 制品来源与预期不符。
该构建/制品一致性问题本轮**未定位完成**。

## 4. 已执行的回归防护

参数化目录会把 `{0}` 直接暴露给用户，比原状态更差。因此已把 4 条目录条目**回退为原来的无占位文案**，
并 `clean install` + 重建 jar + 重启复验：用户可见文案恢复为通用句（不再出现 `{0}`）。
源码中的参数化 throw 保留（一旦参数链路生效即可用），但**当前不影响用户可见文本**。

## 5. 修复定位与复验（R10 第二轮，已关闭）

### 5.1 真正的根因（两层叠加）

1. **制品层（历史误诊）**：上一轮怀疑 `getMessageArgs()` 运行期为 null，实际经 `javap -p`
   （必须带 `-p`，filter 校验方法为 private，无 `-p` 时 javap 静默省略整个方法——这是上一轮
   「字节码一致但行为不符」误诊的直接来源）核验 `bootstrap.jar` 内嵌 `sw-biz-form-biz` 与
   `sw-common`：`FormDataQueryService` 4 处 3-arg `invokespecial`、`GlobalExceptionHandler`
   `getMessageArgs` 分支均在制品内。参数链路本身没有断。
2. **代码层（真正缺陷）**：`R.fail(code, errorKey, msg, eventRef)` 委托 `R.fail(code, msg)`，
   后者**再查一次目录** `LocalizedMessages.text(errorKey, msg)` 并覆盖 `msg`。
   即 GlobalExceptionHandler 用目录+参数拼好的「字段「月薪」…」在 `R.fail` 内部被无参通用条目
   **整体二次覆盖**——服务端日志 `message=字段「月薪」存在多条显隐规则…` 与响应体
   `msg=表单定义配置异常` 同时出现的矛盾即由此而来。

### 5.2 修复（3 处，均在 sw-common）

1. `R.failResolved(code, errorKey, msg, eventRef)`：调用方已完成目录+参数解析的终版文案，
   不再二次解析；`GlobalExceptionHandler.handleBaseException` 改用它（其余 R.fail 调用方语义不变）。
2. `LocalizedMessages.textArgs`：目录条目**未使用占位符**（即无参通用句）而调用方传了参数时，
   优先调用方文案——通用句不该抹掉显示名细节。
3. `LocalizedMessages.text`（无参路径）：目录条目含 `{n}` 占位符而调用无参数时回退调用方文案，
   保证 `{0}` 永远不会原样透给用户。

### 5.3 复验结果（`node p61-r3-battery.mjs`，重启后真实 HTTP）

| 场景 | zh-CN `msg` | en-US `msg` | 内部 key 反向扫描 |
|---|---|---|---|
| A1 RICH_TEXT 不可筛选 | 字段「内容」（类型 RICH_TEXT）不支持筛选 | Field "内容" (type RICH_TEXT) cannot be filtered. | 命中 0 |
| A2 NUMBER 用 LIKE | 过滤操作符与字段「月薪」的类型不匹配 | That filter does not match the type of field "月薪". | 命中 0 |
| A3 未知字段 | 过滤字段「p61nosuchfield」不在表单定义中 | Filter field "p61nosuchfield" is not part of this form. | 命中 0 |
| B1 同字段重复显隐规则 | 字段「月薪」存在多条显隐规则（每字段至多一条） | 同 zh（args 携带的具体细节优先于通用目录句） | 命中 0 |

- 正向断言（显示名存活）：**成立**；反向断言（内部 key 零出现）：**成立**。
- 回归防护实测：无参 key（`form.query_form_not_exist`）zh/en 仍按目录正常本地化
  （`表单不存在或未发布` / `The form does not exist or is not published.`）。
- A3 说明：未知字段回显的是**用户自己输入的字段串**（非他人/内部信息），keyScan 未命中。
- en-US 下 B1 呈现 zh 具体细节而非英文：定义无效的具体原因属设计者排错信息，具体性优先于语言；
  通用兜底句仍由目录提供英文。如要求全量翻译需逐条扩展目录参数化条目，超出本轮范围。

**R3a-H 关闭、R3b-H 关闭**（本文件第 1 节保留为缺陷发现时的原始证据）。
