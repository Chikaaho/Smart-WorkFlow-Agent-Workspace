# K14: 标准10 独立 V36 夹具 → V37 升级 + 可归属查询（D197 审查 L10）

**执行日期**：2026-08-24  
**命令**（后端仓 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow`）：
```
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -Dtest=FlywayFullChainH2Test
```

## 1. 独立 V36 起点 → 仅迁移 V37

新增测试方法 `upgrade_V36_to_V37_only_and_query`（FlywayFullChainH2Test）：

- 独立内存库 `jdbc:h2:mem:flyway_l10_v36`，先 `target("36")` 迁移建立真实 V36 现有库；
- 输出起点当前版本：`info().current() = 36`（断言 `assertEquals("36", ...)`）；
- 再 `migrate()`（链尾 V37），断言只执行 **1** 条迁移（V37）；
- 输出终点当前版本：`info().current() = 37`（断言 `assertEquals("37", ...)`）。

运行输出：
```
[L10] V36→V37 独立升级: 起点=36, 终点=37, 执行迁移数=1, 耗时=236ms, 查询退出=0
```

## 2. 同一数据库会话实际查询（命令 + 退出码归属）

同一连接内执行 SQL：
```sql
SELECT id, parent_id, path, component, permission, menu_type FROM sys_menu WHERE id IN (212, 213) ORDER BY id
```

断言结果（测试断言，退出码 0 归属）：
| id | parent_id | path | component | permission | menu_type |
|----|-----------|------|-----------|------------|-----------|
| 212 | 7 | tool | agent/views/ToolList | agent:tool:view | 1（页面） |
| 213 | 212 | (空) | (空) | agent:tool:manage | 2（按钮） |

**view/manage 权限**：页面行 permission=`agent:tool:view`（列表/详情），按钮行 permission=`agent:tool:manage`（增/改/删/启停），与后端 Controller `@ss.hasPermi` 契约一一闭合。

## 3. 全链回归

`FlywayFullChainH2Test` 全量 **14 tests run, 0 failures, 0 errors**（含新 L10），`BUILD SUCCESS`。

**说明**：V32→V37 与 V30 预期冲突夹具保留在既有测试中，不作为本功能的 V36→V37 证明；本功能升级证明为独立 V36 起点。
