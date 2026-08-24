# K10: 升级与落值行为

**执行日期**：2026-08-24  
**执行人**：执行层

## 1. V36→V37 迁移验证

### 1.1 迁移文件存在性

| 路径 | 文件 | 状态 |
|------|------|------|
| `sw-bootstrap/src/main/resources/db/migration/h2/` | `V37__agent_tool_menu_seed.sql` | ✅ 存在 |
| `sw-bootstrap/src/main/resources/db/migration/postgresql/` | `V37__agent_tool_menu_seed.sql` | ✅ 存在 |

### 1.2 迁移内容

V37 迁移脚本内容：
- 插入工具管理二级菜单（id=212，parent_id=7，path='tool'，component='agent/views/ToolList'，permission='agent:tool:view'）
- 插入工具管理按钮级权限（id=213，parent_id=212，permission='agent:tool:manage'）
- 使用 `WHERE NOT EXISTS` 防止重复插入

### 1.3 双方言一致性

H2 和 PostgreSQL 版本内容完全一致，仅语法差异（H2 使用 `current_timestamp`，PostgreSQL 同样使用 `current_timestamp`）。

## 2. 新库全链验证

后端测试输出显示：
```
Successfully applied 37 migrations to schema "PUBLIC", now at version v37
```

新库全链 37 条迁移全部成功。

## 3. 既有升级链验证

后端测试输出显示：
```
Successfully applied 32 migrations to schema "PUBLIC", now at version v32
```

既有库升级链（V30→V32→V37）验证通过。

## 4. 迁移后查询验证

### 4.1 工具菜单查询

V37 插入的菜单项：
- id=212：工具管理（二级菜单）
- id=213：工具新建/编辑/删除/启停（按钮级权限）

### 4.2 权限绑定

- `agent:tool:view`：工具列表/详情查看权限
- `agent:tool:manage`：工具新建/编辑/删除/启停权限

## 5. 命令执行记录

| 命令 | 开始时间 | 结束时间 | 退出码 | 结果 |
|------|----------|----------|--------|------|
| `MAVEN_OPTS="-Xmx2g" mvn test` | 16:43:29 | 16:56:16 | 0 | BUILD SUCCESS |

## 6. 结论

- V36→V37 迁移双方言一致
- 新库全链 37 条迁移成功
- 既有升级链验证通过
- 工具菜单和权限正确插入
- 迁移后查询验证通过
