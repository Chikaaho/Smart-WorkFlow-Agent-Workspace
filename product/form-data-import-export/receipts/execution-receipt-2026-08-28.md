# 执行回执

## 1. 功能名称
表单数据导入导出（P32 / M03-F04-02）

## 2. 实际读取的文件
- `product/form-data-import-export/ready/direction-form-data-import-export.md` — 需求方向文档
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormSubmitService.java` — 现有提交服务
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormFieldValidator.java` — 字段校验器
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataQueryService.java` — 数据查询服务
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/dynamic/FieldType.java` — 字段类型枚举
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/dynamic/ColumnValidation.java` — 列名校验
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/api/dto/FormDefDTO.java` — 表单定义 DTO
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/entity/FormConfigEntity.java` — 表单配置实体
- `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/api/exception/FormErrorCode.java` — 错误码
- `Smart-WorkFlow-Web/src/modules/form/views/FormData.vue` — 表单数据管理页面
- `Smart-WorkFlow-Web/src/modules/form/api/form.ts` — 表单 API
- `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` — Mock 处理器

## 3. 实际修改的文件

### 后端修改
| 文件 | 修改摘要 |
|------|----------|
| `sw-biz/sw-biz-form/sw-biz-form-biz/pom.xml` | 添加 Apache POI 5.2.5 依赖 |
| `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormImportExportService.java` | 新增：模板生成、数据导入、数据导出服务 |
| `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormImportExportController.java` | 新增：模板下载、导入、导出 API 控制器 |

### 前端修改
| 文件 | 修改摘要 |
|------|----------|
| `src/modules/form/api/form.ts` | 新增：downloadFormTemplate、importFormData、exportFormData API 函数 |
| `src/modules/form/views/FormData.vue` | 新增：模板下载、导入、导出按钮及相关逻辑 |
| `src/foundation/mock/handlers.ts` | 新增：模板下载、导入、导出 Mock 处理器 |

## 4. 每个文件的修改摘要

### FormImportExportService.java
- `generateTemplate(formKey)` — 根据表单定义生成 `.xlsx` 模板，第一行为字段显示名称，第二行为字段映射标识
- `importData(formKey, inputStream)` — 解析 `.xlsx` 文件，逐行校验数据，调用 FormSubmitService 提交，返回行/字段级错误反馈
- `exportData(formKey, queryRequest)` — 复用 FormDataQueryService 查询数据，生成 `.xlsx` 文件
- `parseFields(definitionJson)` — 解析表单定义中的可录入字段（排除 TABLE、RICH_TEXT）
- `parseExcelFile(inputStream, fields)` — 解析 Excel 文件，验证模板格式，提取数据行

### FormImportExportController.java
- `GET /{formKey}/template` — 下载表单模板，返回 `.xlsx` 文件
- `POST /{formKey}/import` — 导入表单数据，返回 ImportResult
- `POST /{formKey}/export` — 导出表单数据，返回 `.xlsx` 文件

### form.ts
- `downloadFormTemplate(formKey)` — 下载模板 API
- `importFormData(formKey, file)` — 导入数据 API
- `exportFormData(formKey, query)` — 导出数据 API

### FormData.vue
- 添加「下载模板」「导入」「导出」按钮到 toolbar
- `handleDownloadTemplate()` — 触发模板下载
- `handleImportClick()` / `handleFileChange()` — 文件选择和导入
- `handleExport()` — 触发数据导出
- 导入结果展示（成功/失败条数、行级错误）

### handlers.ts
- `GET /api/form/data/:formKey/template` — Mock 模板下载
- `POST /api/form/data/:formKey/import` — Mock 导入（返回模拟结果）
- `POST /api/form/data/:formKey/export` — Mock 导出

## 5. 实际执行的命令

```bash
# 后端编译
MAVEN_OPTS="-Xmx2g" mvn -q compile -pl sw-biz/sw-biz-form/sw-biz-form-biz -am

# 后端测试
MAVEN_OPTS="-Xmx2g" mvn -q test -pl sw-biz/sw-biz-form/sw-biz-form-biz -am

# 前端类型检查
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck

# 前端测试
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
```

## 6. 命令输出摘要

| 命令 | 结果 |
|------|------|
| 后端编译 | ✅ 通过（无错误输出） |
| 后端测试 | ✅ 通过 |
| 前端类型检查 | ✅ 通过 |
| 前端测试 | ✅ 1050 个测试全部通过 |

## 7. 与原方案的偏差

无偏差。按需求方向文档逐项实现。

## 8. 遇到的问题

1. **Apache POI 依赖**：父 pom.xml 未定义 POI 版本，需在子模块 pom.xml 中直接指定版本号 5.2.5
2. **TypeScript 未使用变量**：Mock 处理器中 `formKey` 变量声明但未使用，改用 `_formKey` 前缀解决

## 9. 未完成内容

无。所有需求方向文档中的「本轮必须覆盖」项均已实现。

## 10. 风险和注意事项

1. **导入行数限制**：当前未设置导入行数上限，大量数据导入可能导致内存溢出，建议后续添加配置化限制
2. **导出行数限制**：当前默认限制 1000 行，可通过 queryRequest.pageSize 调整
3. **模板格式验证**：导入时通过第二行（字段映射标识）验证模板格式，若用户修改第二行会导致字段映射失败

## 11. Git diff 摘要

```
新增文件：
  sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormImportExportService.java
  sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormImportExportController.java

修改文件：
  sw-biz/sw-biz-form/sw-biz-form-biz/pom.xml (+5 lines)
  Smart-WorkFlow-Web/src/modules/form/api/form.ts (+65 lines)
  Smart-WorkFlow-Web/src/modules/form/views/FormData.vue (+120 lines)
  Smart-WorkFlow-Web/src/foundation/mock/handlers.ts (+80 lines)
```

## 12. 建议执行的测试

1. 手工验证：下载模板 → 填写数据 → 导入 → 验证数据落库
2. 手工验证：设置筛选条件 → 导出 → 验证导出数据与查询结果一致
3. 手工验证：导入格式错误的文件 → 验证错误反馈
4. 手工验证：导入必填字段缺失的数据 → 验证行级错误反馈
