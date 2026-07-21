# Step B1：后端 — 服务层基础

## 1. 当前状态

功能「系统管理核心 CRUD 做宽闭环」处于 **READY** 状态。本 Step 是第一个执行 Step（B1），为后续控制器层准备好所有服务依赖。

当前后端 gap：
- `SysRoleService` 不存在（仅 Mapper 存在）
- `SysPost` 实体/Mapper/Service 全链不存在（仅 DB 表存在）
- `SysRole.java` 实体字段可能有 DB 列名映射问题

## 2. Step 目标

创建 `SysRoleService` + `SysRoleServiceImpl`、`SysPost` 实体/Mapper/Service/ServiceImpl，修复 `SysRole.java` 列名映射，确保 `mvn -q compile` 通过。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯 CRUD 样板代码，严格遵循 SysDictTypeServiceImpl 已有模式，无任何架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 的所有文件都是沿 `SysDictTypeServiceImpl` 模式的机械复制（Service 接口→Impl→Mapper→Entity），仅实体名和字段名不同。属于 Flash 的标准工作范围。

## 5. 已知上下文

- **BaseService<T>**：`com.sw.ck.common.service.BaseService<T>` — 业务 Service 统一基接口，extends MyBatis-Plus `IService<T>`
- **BaseServiceImpl<M, T>**：`com.sw.ck.common.service.BaseServiceImpl<M extends BaseMapper<T>, T>` — 业务 Service 统一基实现
- **参考实现**：`SysDictTypeServiceImpl`（位于 `com.sw.ck.system.service.impl`）— 包含 code 唯一性校验的完整 CRUD 模式
- **SysRole 实体**：`@TableName("sys_role")`，字段 name/code/sort/status/dataScope/builtIn/remark。需核实 DB 列名是否与 `@TableField` 注解一致
- **SysPost 表**：DB 已存在 `sys_post` 表（V1 Flyway），列：id/create_time/create_by/update_time/update_by/deleted/tenant_id/version + code/name/sort/status/description
- **所有实体继承 BaseEntity**：自动获得 id/createTime/createBy/updateTime/updateBy/deleted/version/tenantId
- **SysUserService 参考**：`SysUserService.create(user, plainPassword)` — 创建方法接受额外参数的模式（B2 会用）
- **PageParam**：`com.sw.ck.common.page.PageParam` — pageNum(default 1) + pageSize(default 10)
- **PageResult<T>**：`com.sw.ck.common.page.PageResult<T>` — records + total + pageNum + pageSize
- **BaseException**：`com.sw.ck.common.exception.BaseException(CommonErrorCode, String)` — 业务异常

## 6. 执行前必须读取的文件

| # | 文件 | 原因 |
|---|------|------|
| 1 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysDictTypeServiceImpl.java` | 参考 Service 实现模式（create/update/delete/page/getByCode） |
| 2 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRole.java` | 待修复的实体，确认当前字段和注解 |
| 3 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysDept.java` | 参考实体模式（验证 BaseEntity 继承 + @TableField 注解风格） |
| 4 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysRoleMapper.java` | 确认 Role Mapper 存在并了解泛型签名 |
| 5 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysDictTypeService.java` | 参考 Service 接口定义模式 |
| 6 | `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V1__init_schema.sql` | 核实 sys_role 和 sys_post 的 DB 列名（确认 description vs remark、is_builtin vs built_in） |
| 7 | `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/BaseException.java` | 确认构造函数签名 |
| 8 | `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/CommonErrorCode.java` | 确认 PARAM_ERROR 等枚举值 |

## 7. 允许修改的文件范围

### 新建文件（6 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysRoleService.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysRoleServiceImpl.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysPost.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/mapper/SysPostMapper.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysPostService.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysPostServiceImpl.java` | 新建 |

### 修改文件（最多 1 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRole.java` | 如需修复列名映射则修改 |

## 8. 禁止修改的范围

- ❌ 不修改 `BaseService` / `BaseServiceImpl`（框架基础类）
- ❌ 不修改 `SysUser` / `SysUserService` / `SysDept` / `SysDeptService`
- ❌ 不修改 `SysDictTypeMapper` / `SysDictTypeService` / `SysDictTypeServiceImpl`
- ❌ 不创建 Controller 类（B2 负责）
- ❌ 不创建 Flyway 迁移脚本（B2 负责）
- ❌ 不创建测试类（B3 负责）
- ❌ 不修改任何 `.sql` 文件
- ❌ 不修改 `pom.xml` 或任何 Maven 配置
- ❌ 不修改任何 `-api` 模块的文件
- ❌ 不修改 `application*.yml` 配置文件

## 9. 详细执行方案

### 9.1 核实 DB 列名（先读后写）

在 `V1__init_schema.sql` 中搜索 `sys_role` 和 `sys_post` 的建表语句，确认实际列名：
- `sys_role`: 确认 `remark` 还是 `description`，`built_in` 还是 `is_builtin`
- `sys_post`: 确认所有列名（code/name/sort/status/description）

**如果 SysRole.java 的 @TableField 与实际列名不一致，修复之。**

### 9.2 创建 SysRoleService.java

文件路径：`.../service/SysRoleService.java`

```java
package com.sw.ck.system.service;

import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.service.BaseService;
import com.sw.ck.system.entity.SysRole;

/**
 * 系统角色 Service 接口。
 */
public interface SysRoleService extends BaseService<SysRole> {

    /** 创建角色（校验 code 唯一性） */
    Long create(SysRole role);

    /** 更新角色（校验 code 唯一性，排除自身） */
    void update(SysRole role);

    /** 逻辑删除角色 */
    void delete(Long id);

    /** 分页查询角色（支持 name/code/status 筛选） */
    PageResult<SysRole> page(PageParam pageParam, SysRole query);

    /** 按 code 查询角色 */
    SysRole getByCode(String code);
}
```

### 9.3 创建 SysRoleServiceImpl.java

文件路径：`.../service/impl/SysRoleServiceImpl.java`

**完全复制 `SysDictTypeServiceImpl` 模式，替换实体名为 SysRole、Mapper 为 SysRoleMapper。**

```java
package com.sw.ck.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.service.BaseServiceImpl;
import com.sw.ck.system.entity.SysRole;
import com.sw.ck.system.mapper.SysRoleMapper;
import com.sw.ck.system.service.SysRoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SysRoleServiceImpl
        extends BaseServiceImpl<SysRoleMapper, SysRole>
        implements SysRoleService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(SysRole role) {
        if (getByCode(role.getCode()) != null) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "角色编码已存在");
        }
        save(role);
        return role.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(SysRole role) {
        SysRole existing = getByCode(role.getCode());
        if (existing != null && !existing.getId().equals(role.getId())) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "角色编码已存在");
        }
        updateById(role);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        removeById(id);
    }

    @Override
    public PageResult<SysRole> page(PageParam pageParam, SysRole query) {
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<>();
        if (query != null) {
            if (StringUtils.isNotBlank(query.getName())) {
                wrapper.like(SysRole::getName, query.getName());
            }
            if (StringUtils.isNotBlank(query.getCode())) {
                wrapper.like(SysRole::getCode, query.getCode());
            }
            if (query.getStatus() != null) {
                wrapper.eq(SysRole::getStatus, query.getStatus());
            }
        }
        wrapper.orderByAsc(SysRole::getCreateTime);
        return baseMapper.selectPage(pageParam, wrapper);
    }

    @Override
    public SysRole getByCode(String code) {
        return lambdaQuery().eq(SysRole::getCode, code).one();
    }
}
```

**关键约束**：
- `BaseServiceImpl<SysRoleMapper, SysRole>` — 泛型参数正确，第一个是 Mapper 类型，第二个是实体类型
- `removeById(id)` 执行逻辑删除（BaseEntity 有 @TableLogic）
- `baseMapper.selectPage(pageParam, wrapper)` — 使用 BaseMapperX 的分页方法
- `lambdaQuery()` — MyBatis-Plus 的链式查询，`BaseServiceImpl` 自带

### 9.4 创建 SysPost.java

文件路径：`.../entity/SysPost.java`

```java
package com.sw.ck.system.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 岗位表。
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_post")
public class SysPost extends BaseEntity {

    /** 岗位编码 */
    @TableField("code")
    private String code;

    /** 岗位名称 */
    @TableField("name")
    private String name;

    /** 排序 */
    @TableField("sort")
    private Integer sort;

    /** 状态：0=正常 1=停用 */
    @TableField("status")
    private Integer status;

    /** 描述 */
    @TableField("description")
    private String description;
}
```

### 9.5 创建 SysPostMapper.java

文件路径：`.../mapper/SysPostMapper.java`

```java
package com.sw.ck.system.mapper;

import com.sw.ck.common.mapper.BaseMapperX;
import com.sw.ck.system.entity.SysPost;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface SysPostMapper extends BaseMapperX<SysPost> {
}
```

### 9.6 创建 SysPostService.java

文件路径：`.../service/SysPostService.java`

```java
package com.sw.ck.system.service;

import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.service.BaseService;
import com.sw.ck.system.entity.SysPost;

/**
 * 岗位 Service 接口。
 */
public interface SysPostService extends BaseService<SysPost> {

    Long create(SysPost post);

    void update(SysPost post);

    void delete(Long id);

    PageResult<SysPost> page(PageParam pageParam, SysPost query);
}
```

### 9.7 创建 SysPostServiceImpl.java

文件路径：`.../service/impl/SysPostServiceImpl.java`

**复制 `SysDictTypeServiceImpl` 模式但去除 code 唯一性校验（MVP 简化）。**

```java
package com.sw.ck.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.toolkit.StringUtils;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.service.BaseServiceImpl;
import com.sw.ck.system.entity.SysPost;
import com.sw.ck.system.mapper.SysPostMapper;
import com.sw.ck.system.service.SysPostService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SysPostServiceImpl
        extends BaseServiceImpl<SysPostMapper, SysPost>
        implements SysPostService {

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(SysPost post) {
        save(post);
        return post.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(SysPost post) {
        updateById(post);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        removeById(id);
    }

    @Override
    public PageResult<SysPost> page(PageParam pageParam, SysPost query) {
        LambdaQueryWrapper<SysPost> wrapper = new LambdaQueryWrapper<>();
        if (query != null) {
            if (StringUtils.isNotBlank(query.getCode())) {
                wrapper.like(SysPost::getCode, query.getCode());
            }
            if (StringUtils.isNotBlank(query.getName())) {
                wrapper.like(SysPost::getName, query.getName());
            }
            if (query.getStatus() != null) {
                wrapper.eq(SysPost::getStatus, query.getStatus());
            }
        }
        wrapper.orderByAsc(SysPost::getCreateTime);
        return baseMapper.selectPage(pageParam, wrapper);
    }
}
```

### 9.8 验证

```bash
cd /data/reasonix/files/Smart-WorkFlow
mvn -q compile
```

预期：BUILD SUCCESS，无编译错误。

## 10. 关键实现约束

- **SysRoleServiceImpl 必须包含 code 唯一性校验**（与 SysDictTypeServiceImpl 一致）：create 时检查 code 重复；update 时排除自身后检查
- **SysPostServiceImpl 不做 code 唯一性校验**（MVP 简化）
- **SysPost 继承 BaseEntity**（不是 BaseEntityNoTenant，因为 sys_post 表有 tenant_id）
- **SysPostMapper 必须标注 @Mapper**（与其他 Mapper 一致）
- **所有 Service 方法用 @Transactional(rollbackFor = Exception.class)**（与 SysDictTypeServiceImpl 一致）
- **page 方法使用 LambdaQueryWrapper + LIKE/ EQ + orderByAsc(createTime)**（与 SysDictTypeServiceImpl 模式一致）
- **删除走逻辑删除 removeById**（BaseEntity 的 @TableLogic 自动处理）
- **不修改 SysRole 现有字段类型或语义**，仅修复 @TableField 注解值（如有必要）

## 11. 边界情况

- **重复 code 创建/更新**：抛出 BaseException，由全局异常处理器转换为 R.fail
- **删除不存在的记录**：MyBatis-Plus removeById 对不存在的 id 不抛异常（返回 false）
- **分页查询空条件**：query 为 null 时返回全量分页（与 SysDictTypeServiceImpl 行为一致）
- **空字符串筛选**：StringUtils.isNotBlank 过滤空串和 null
- **SysPost status 字段**：数据库 DDL 是 smallint，Java 用 Integer

## 12. 风险和回滚方案

| 风险 | 影响 | 应对 |
|------|------|------|
| SysRole @TableField 列名不匹配 | 运行时 SQL 错误 | 先读 DB schema 确认列名，再决定是否修改 |
| SysPost DB 表结构与实体不匹配 | mvn compile 通过但测试失败 | 严格按 DB 列名写 @TableField |
| 引入新的 Maven 依赖 | 编译失败 | 不使用任何新依赖，沿用现有 import |

回滚：删除新建的 6 个文件，用 `git checkout` 恢复 SysRole.java（如有修改）。

## 13. 测试方案

### 13.1 静态检查

- `mvn -q compile` 零错误
- grep 确认新建文件存在

### 13.2 单元测试

本 Step 不新增测试（B3 负责控制器集成测试）。

### 13.3 集成测试

不适用（本 Step 仅创建 Service 层，无 Web 层）。

### 13.4 手工验证

无。

### 13.5 回归检查

- 后端测试计数不变（本 Step 不新增测试）：111 tests
- `mvn -q compile` 全模块编译通过

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| B1-1 | `SysRoleService.java` 存在，声明 create/update/delete/page/getByCode | 文件存在 |
| B1-2 | `SysRoleServiceImpl.java` 存在，包含 code 唯一性校验逻辑 | 文件内容审查 |
| B1-3 | `SysPost.java` 存在，继承 BaseEntity，@TableName("sys_post") | 文件存在 |
| B1-4 | `SysPostMapper.java` 存在，继承 BaseMapperX<SysPost>，标注 @Mapper | 文件存在 |
| B1-5 | `SysPostService.java` 存在，声明 create/update/delete/page | 文件存在 |
| B1-6 | `SysPostServiceImpl.java` 存在，继承 BaseServiceImpl<SysPostMapper, SysPost> | 文件存在 |
| B1-7 | `mvn -q compile` 退出码为 0 | 命令输出 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step B1

## 1. Step 编号和名称
B1 — 后端服务层基础

## 2. 使用模型
（实际使用的模型）

## 3. 实际读取的文件
（逐文件列出）

## 4. 实际修改的文件
（逐文件区分新建/修改）

## 5. 每个文件的修改摘要
（每个文件的改动点、行数）

## 6. 实际执行的命令
```
cd Smart-WorkFlow && mvn -q compile
```
（粘贴完整输出）

## 7. 命令输出摘要
- 编译结果：PASSED / FAILED
- 退出码：0 / 非0

## 8. SysRole 列名核实结果
- DB 实际列名：remark 还是 description？built_in 还是 is_builtin？
- 是否需要修改 SysRole.java？改了什么？

## 9. 与原方案的偏差
（如有）

## 10. 未完成内容
（如有）

## 11. 结论
PASSED / FAILED
```

## 16. 测试回执格式

本 Step 的测试即为 `mvn -q compile`，测试回执可与执行回执合并。

## 17. 明确禁止事项

- ❌ 不创建 Controller 类（B2 负责）
- ❌ 不创建 Flyway 迁移脚本（B2 负责）
- ❌ 不创建测试类（B3 负责）
- ❌ 不修改 SysUser / SysDept / SysDictType 及其 Service/Mapper
- ❌ 不修改 BaseService / BaseServiceImpl / BaseMapperX
- ❌ 不修改 pom.xml 或添加依赖
- ❌ 不修改 application*.yml
- ❌ 不运行 mvn test（编译即可）
