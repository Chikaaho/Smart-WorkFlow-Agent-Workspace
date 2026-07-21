# 测试回执

## 1. Step 编号和名称
Step B1：模块拆分与基础设施

## 2. 测试环境
- **操作系统**：Linux 5.15.0-181-generic x86_64
- **Java 版本**：OpenJDK 21.0.11
- **数据库**：H2（内存，开发配置文件）
- **Maven**：3.9.x
- **工作目录**：`/data/reasonix/files/Smart-WorkFlow`

## 3. 测试前置条件
- B1 执行方案已完成并通过验收（模块拆分、POM 重构、Flyway 迁移脚本、配置、实体/Mapper/Facade 均已就位）
- 代码已写入工作区，未执行 Git 提交

## 4. 实际执行的测试命令

### 静态检查（T1-T7）

```bash
# T1: MinioProperties 零残留
cd /data/reasonix/files/Smart-WorkFlow
grep -r "MinioProperties" sw-basic/ --include="*.java" || echo "零命中"

# T2: 旧 AutoConfiguration.imports 已删除
ls sw-basic/sw-basic-storage/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 2>/dev/null && echo "EXISTS" || echo "已删除"

# T3: 新 AutoConfiguration.imports 存在
ls sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports

# T4: V16 脚本存在
ls sw-bootstrap/src/main/resources/db/migration/storage/h2/V16__init_storage_file.sql
ls sw-bootstrap/src/main/resources/db/migration/storage/postgresql/V16__init_storage_file.sql

# T5: Flyway 含 storage 目录
grep "storage" sw-bootstrap/src/main/resources/application.yml

# T6: V16 脚本列包含 tenant_id + deleted
grep -E "tenant_id" sw-bootstrap/src/main/resources/db/migration/storage/*/V16__init_storage_file.sql
grep -E "deleted" sw-bootstrap/src/main/resources/db/migration/storage/*/V16__init_storage_file.sql

# T7: 全仓库 MinioProperties 引用
grep -r "MinioProperties" --include="*.java" . || echo "全仓库零命中"
```

### 回归检查（T8-T9）

```bash
# T8: 全量编译
mvn -q compile; echo "EXIT: $?"

# T9: 全量测试
mvn -q test; echo "EXIT: $?"
```

## 5. 各测试项结果

| 编号 | 测试项 | 预期结果 | 实际结果 | 是否通过 |
|:----:|--------|----------|----------|:--------:|
| T1 | MinioProperties 在 sw-basic/ 零残留 | `grep` 零命中 | 零命中 | PASS |
| T2 | 旧 AutoConfiguration.imports 已删除 | `ls` 报错（文件不存在）| 已删除 | PASS |
| T3 | 新 AutoConfiguration.imports 存在 | `ls` 返回文件路径 | `sw-basic-storage-biz/.../imports` 存在 | PASS |
| T4 | V16 脚本存在（H2 + PG） | 两个脚本文件存在 | H2 和 PG 脚本均存在 | PASS |
| T5 | Flyway locations 含 storage | `grep` 匹配 storage 目录 | `classpath:db/migration/storage/{vendor}` 已注册 | PASS |
| T6 | V16 脚本含 tenant_id 和 deleted 列 | `grep` 匹配到两列 | 两列均存在（含索引定义）| PASS |
| T7 | 全仓库 MinioProperties 零残留 | `grep` 零命中 | 全仓库零命中 | PASS |
| T8 | 全量编译 | 退出码 0 | 退出码 0 | PASS |
| T9 | 全量测试 | 退出码 0 | 退出码 0 | PASS |

## 6. 通过项

全部测试项（T1-T9）均已通过。

- **T1**：`grep -r "MinioProperties" sw-basic/ --include="*.java"` → 零命中
- **T2**：旧路径 `sw-basic/sw-basic-storage/src/main/resources/META-INF/spring/...` 不存在（已删除）
- **T3**：新路径 `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/resources/META-INF/spring/...` 存在
- **T4**：V16__init_storage_file.sql 在 H2 和 PostgreSQL 两个厂商目录下均存在
- **T5**：`classpath:db/migration/storage/{vendor}` 已在 Flyway locations 中注册
- **T6**：V16 脚本同时包含 `tenant_id` 和 `deleted` 列定义，含联合索引 `idx_sw_storage_file_tenant_deleted`
- **T7**：`grep -r "MinioProperties" --include="*.java" .` → 全仓库零命中
- **T8**：`mvn -q compile` → 退出码 0（编译通过无错误）
- **T9**：`mvn -q test` → 退出码 0（全量测试通过）

## 7. 失败项

无。

## 8. 跳过项及原因

无。

## 9. 关键日志或错误信息

测试输出中仅包含一条 WARN 日志，为预期行为（BPMN 翻译器测试中 GraphToBpmnTranslator 的预期错误场景），不影响测试结果：

```
ERROR com.sw.ck.bpm.engine.translator.GraphToBpmnTranslator -- BPMN translation failed: 图翻译为 BPMN 失败
```

该日志来自 BPM 流程引擎测试的预期异常路径，非本次变更引入。

## 10. 是否满足验收标准

### 逐条对照

| 编号 | 条件 | 验证结果 | 证据 |
|:----:|------|:--------:|------|
| B1-1 | storage pom packaging=pom, modules | PASS | `<packaging>pom</packaging>` + `<modules>` 包含 `sw-basic-storage-api` 和 `sw-basic-storage-biz` |
| B1-2 | -api pom 存在 | PASS | `sw-basic-storage-api/pom.xml` 存在，`<packaging>jar</packaging>` |
| B1-3 | -biz pom 存在 | PASS | `sw-basic-storage-biz/pom.xml` 存在，`<packaging>jar</packaging>` |
| B1-4 | sw-basic/pom.xml modules 更新 | PASS | `sw-basic/pom.xml` 中 `module` 包含 `sw-basic-storage/sw-basic-storage-api` 和 `sw-basic-storage/sw-basic-storage-biz` |
| B1-5 | sw-bootstrap/pom.xml 依赖 sw-basic-storage-biz | PASS | `sw-bootstrap/pom.xml` 中 `<artifactId>sw-basic-storage-biz</artifactId>` 存在 |
| B1-6 | StorageProperties 在 -biz | PASS | `sw-basic-storage-biz/.../config/StorageProperties.java` 存在 |
| B1-7 | MinioProperties 已删除 | PASS | `grep -r "MinioProperties" sw-basic/ --include="*.java"` 零命中 |
| B1-8 | StorageAutoConfiguration 在 -biz | PASS | `sw-basic-storage-biz/.../config/StorageAutoConfiguration.java` 存在 |
| B1-9 | AutoConfiguration.imports 新存在旧删除 | PASS | 新路径 `sw-basic-storage-biz/...` 存在；旧路径 `sw-basic-storage/...` 已删除 |
| B1-10 | StorageFile Entity | PASS | `sw-basic-storage-biz/.../entity/StorageFile.java` 存在，继承 `BaseEntity` |
| B1-11 | StorageFileMapper | PASS | `sw-basic-storage-biz/.../mapper/StorageFileMapper.java` 存在，实现 `BaseMapper<StorageFile>` |
| B1-12 | StorageFacade 在 -api | PASS | `sw-basic-storage-api/.../api/StorageFacade.java` 存在 |
| B1-13 | V16 脚本存在 | PASS | H2 和 PostgreSQL 厂商目录下 `V16__init_storage_file.sql` 均存在 |
| B1-14 | Flyway 含 storage | PASS | `application.yml` 中 Flyway locations 已注册 `classpath:db/migration/storage/{vendor}` |
| B1-15 | application.yml 配置 | PASS | `sw.storage` 配置块存在：`enabled: true`、`active-provider: minio`、多 `providers` |
| B1-16 | dev/local profile | PASS | `application-dev.yml` 和 `application-local.yml` 均含 `storage` 配置块 |
| B1-17 | mvn -q compile 退出 0 | PASS | 编译退出码 0 |
| B1-18 | mvn -q test BUILD SUCCESS | PASS | 测试退出码 0 |

### 验收结论

**全部 18 项验收标准均满足（PASS）。**

## 11. 回归风险

- 本次变更为 storage 模块的拆分重构（从单一模块拆分为 `-api` / `-biz` 多模块结构），涉及 POM 结构调整、配置迁移、Flyway 迁移目录新增
- 全量编译（`mvn -q compile`）退出码 0，未引入编译错误
- 全量测试（`mvn -q test`）退出码 0，已有测试全部通过，未出现回归
- MinioProperties 已从所有 Java 文件中删除，全仓库零残留，无间接依赖风险
- 建议在后续 Step 中关注 storage 模块的集成测试覆盖

## 12. 最终结论

**PASSED**
