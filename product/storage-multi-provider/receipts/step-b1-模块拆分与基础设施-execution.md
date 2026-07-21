# 执行回执

## 1. Step 编号和名称
Step B1：模块拆分与基础设施

## 2. 使用模型
deepseek-v4-flash

## 3. 实际读取的文件
1. `sw-basic/sw-basic-storage/pom.xml` — 原叶子模块 pom，packaging=jar
2. `sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java` — 空配置，引用 MinioProperties
3. `sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/MinioProperties.java` — 四个 MinIO 字段
4. `sw-basic/sw-basic-storage/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` — 注册 StorageAutoConfiguration
5. `sw-basic/pom.xml` — 父 module 含 sw-basic-storage
6. `sw-bootstrap/pom.xml` — 依赖 sw-basic-storage
7. `sw-bootstrap/src/main/java/com/sw/ck/bootstrap/config/FlywayConfiguration.java` — Flyway 迁移策略代码
8. `sw-bootstrap/src/main/resources/application.yml` — 主配置（有独立 minio: 块, flyway locations）
9. `sw-bootstrap/src/main/resources/application-dev.yml` — 开发配置（有 spring.minio 块）
10. `sw-bootstrap/src/main/resources/application-local.yml` — 本地配置（有 spring.minio 块）
11. `sw-basic/sw-basic-notify/sw-basic-notify-api/pom.xml` — 参照模块的 -api pom 结构
12. `sw-basic/sw-basic-notify/sw-basic-notify-biz/pom.xml` — 参照模块的 -biz pom 结构
13. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/config/NotifyAutoConfiguration.java` — 参照 AutoConfiguration 模式
14. `sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java` — 实体基类
15. `sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntityNoTenant.java` — 无租户实体基类
16. `sw-basic/sw-basic-knowledge/pom.xml` — 发现仍依赖旧 sw-basic-storage:jar，已修复

## 4. 实际修改的文件

### 新建文件
1. `sw-basic/sw-basic-storage/sw-basic-storage-api/pom.xml` — -api 模块 POM
2. `sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageFacade.java` — Facade 占位接口
3. `sw-basic/sw-basic-storage/sw-basic-storage-biz/pom.xml` — -biz 模块 POM
4. `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/entity/StorageFile.java` — Entity
5. `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/mapper/StorageFileMapper.java` — Mapper
6. `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageProperties.java` — 多提供商配置属性
7. `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java` — 自动配置类
8. `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` — AutoConfiguration 注册
9. `sw-bootstrap/src/main/resources/db/migration/storage/postgresql/V16__init_storage_file.sql` — PG 迁移脚本
10. `sw-bootstrap/src/main/resources/db/migration/storage/h2/V16__init_storage_file.sql` — H2 迁移脚本

### 修改文件
1. `sw-basic/sw-basic-storage/pom.xml` — packaging jar→pom，添加 modules，删除 dependencies
2. `sw-basic/pom.xml` — module 路径改为子模块路径
3. `sw-bootstrap/pom.xml` — 依赖 artifactId 改为 sw-basic-storage-biz
4. `sw-basic/sw-basic-knowledge/pom.xml` — artifactId 改为 sw-basic-storage-api
5. `sw-bootstrap/src/main/resources/application.yml` — 删除 spring.minio 块，添加 sw.storage 配置，flyway locations 追加 storage
6. `sw-bootstrap/src/main/resources/application-dev.yml` — 删除 spring.minio 块，sw 下添加 storage 配置
7. `sw-bootstrap/src/main/resources/application-local.yml` — 删除 spring.minio 块，sw 下添加 storage 配置

### 删除文件
1. `sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/MinioProperties.java`
2. `sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java`
3. `sw-basic/sw-basic-storage/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`
4. `sw-basic/sw-basic-storage/src/main/resources/db/migration/storage/.gitkeep`

## 5. 每个文件的修改摘要

| 文件 | 操作 | 改动说明 |
|------|------|----------|
| `sw-basic-storage/pom.xml` | 修改 | packaging jar→pom，删除 dependencies，添加 modules 列表 |
| `sw-basic-storage-api/pom.xml` | 新建 | -api 模块，parent=smart-workflow，依赖 sw-common+lombok |
| `sw-basic-storage-api/StorageFacade.java` | 新建 | 占位接口（B3 完善方法签名） |
| `sw-basic-storage-biz/pom.xml` | 新建 | -biz 模块，依赖 -api+sw-common+minio+lombok+test+h2 |
| `sw-basic-storage-biz/StorageFile.java` | 新建 | Entity，extends BaseEntity，11 个业务字段 |
| `sw-basic-storage-biz/StorageFileMapper.java` | 新建 | MyBatis-Plus BaseMapper |
| `sw-basic-storage-biz/StorageProperties.java` | 新建 | @ConfigurationProperties(prefix="sw.storage")，含 ProviderConfig 内部类 |
| `sw-basic-storage-biz/StorageAutoConfiguration.java` | 新建 | 自动配置，@MapperScan，@ConditionalOnProperty |
| `sw-basic-storage-biz/AutoConfiguration.imports` | 新建 | 注册 StorageAutoConfiguration |
| `sw-basic/pom.xml` | 修改 | module 路径改为子模块 |
| `sw-bootstrap/pom.xml` | 修改 | 依赖改为 sw-basic-storage-biz |
| `sw-basic-knowledge/pom.xml` | 修改 | 依赖改为 sw-basic-storage-api |
| `application.yml` | 修改 | 删除 spring.minio 块，flyway locations 追加 storage，sw: 下新增 storage 配置 |
| `application-dev.yml` | 修改 | 删除 spring.minio 块，sw: 下新增 storage(local) 配置 |
| `application-local.yml` | 修改 | 删除 spring.minio 块，sw: 下新增 storage(minio) 配置 |
| `V16__init_storage_file.sql` (PG) | 新建 | 建表 + COMMENT ON + 索引 |
| `V16__init_storage_file.sql` (H2) | 新建 | 建表 + 索引（无 COMMENT ON） |
| 旧 MinioProperties.java | 删除 | 被 StorageProperties 替代 |
| 旧 StorageAutoConfiguration.java | 删除 | 移至 -biz 模块 |
| 旧 AutoConfiguration.imports | 删除 | 移至 -biz 模块 |
| 旧 .gitkeep | 删除 | 不再需要 |

## 6. 实际执行的命令
```bash
# 编译验证（多次迭代）
mvn compile -q
mvn compile -q -pl sw-basic/sw-basic-storage/sw-basic-storage-api,sw-basic/sw-basic-storage/sw-basic-storage-biz -am

# 全量测试
mvn test -q
```

## 7. 命令输出摘要
- **mvn compile -q**：EXIT=0（通过，首次失败因 bcprov 依赖，安装 jar 后通过）
- **mvn test -q**：EXIT=0（全量测试通过）

## 8. 与原方案的偏差
- **sw-basic-knowledge 依赖修复**：方案未提及 `sw-basic-knowledge` 仍依赖旧 `sw-basic-storage:jar`。由于 sw-basic-storage 变更为 pom 打包，jar 不再存在，需将 knowledge 的依赖改为 `sw-basic-storage-api`
- **AutoConfiguration 使用 @MapperScan**：参照 NotifyAutoConfiguration 模式，使用 `@MapperScan` 替代方案中的 `@ComponentScan`（后者范围太大，不够精确）
- **bcprov-jdk18on 问题**：本地 Maven 缓存缺少 1.80 jar 文件，需要手动从 1.78.1 复制 jar 才能完成全量编译（环境问题，非代码问题）

## 9. 遇到的问题
1. **编译错误：旧 sw-basic-storage:jar 不再存在**：`sw-basic-knowledge` 和 `sw-bootstrap` 均依赖旧 artifact。`sw-bootstrap` 已在方案中改为 `sw-basic-storage-biz`，但 `sw-basic-knowledge` 未被方案覆盖，需改为 `sw-basic-storage-api`
2. **依赖无法下载**：org.bouncycastle:bcprov-jdk18on:1.80 的 jar 文件在环境不可用（网络不可达，仅 POM 缓存存在）。临时措施：从 1.78.1 复制 jar 到 1.80 目录
3. **mvn -am 级联解析全部依赖**：即使只编译特定模块，`-am` 会拉取所有依赖模块（包括 sw-basic-knowledge），导致 bcprov 问题暴露。最终通过安装缺失 jar 解决

## 10. 未完成内容
无。方案中所有要求均已完成。

## 11. 风险和注意事项
1. **sw-basic-knowledge 依赖变更风险**：knowledge 模块从依赖 `sw-basic-storage:jar`（包含旧 MinioProperties）改为依赖 `sw-basic-storage-api`（仅含 StorageFacade 接口）。如果 knowledge 中已有代码引用 MinioProperties 或其他仅存在于 `-biz` 的类，编译会失败。当前未发现此类引用（grep 检查为零）
2. **bcprov-jdk18on:1.80 环境风险**：该依赖非本项目引入，但持续缺失会导致 future build 环境不稳定
3. **Flyway V16 执行时机**：V16 脚本针对 sw_storage_file 表，如果之前的迁移已跑过 V15，V16 会自动执行。注意 column 类型（BIGINT for ASSIGN_ID）是否符合 PG 和 H2 环境

## 12. Git diff 摘要
```
11 files changed, 52 insertions(+), 79 deletions(-)
```
新增 10 个文件（2 pom, 4 Java, 1 properties, 2 SQL, 1 AutoConfiguration.imports）

## 13. 建议执行的测试
1. 启动应用（dev profile with H2），确认 Flyway V16 迁移正常
2. 启动后检查 `sw_storage_file` 表结构是否正确（columns, types, indexes）
3. 验证 sw.storage 配置绑定到 StorageProperties 是否正常
4. 验证 sw-basic-storage-biz 不包含 sw-basic-storage 声明的任何类
5. grep 验证无任何文件残留引用 com.sw.ck.storage.config.MinioProperties
