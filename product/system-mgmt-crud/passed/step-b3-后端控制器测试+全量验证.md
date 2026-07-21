# Step B3：后端 — 控制器测试 + 全量验证

## 1. 当前状态

功能「系统管理核心 CRUD 做宽闭环」处于 **IN_PROGRESS** 🟦 状态。

前置 Step：
- B1 **PASSED** ✅ — 服务层基础（SysRoleService + SysRoleServiceImpl + SysPost 实体/Mapper/Service）
- B2 **PASSED** ✅ — 4 Controller (User/Role/Dept/Post) + Flyway V15 双方言菜单 seed

本 Step B3 为后端最后一个 Step，创建控制器单元测试并执行全量 `mvn -q test` 验证，确保已实现的 4 个 Controller 端点行为正确且无回归。

## 2. Step 目标

创建 4 个 Controller 单元测试类（UserControllerTest / RoleControllerTest / DeptControllerTest / PostControllerTest），覆盖每个 Controller 的全部端点（happy path + edge cases），执行全量 `mvn -q compile && mvn -q test`，确认零失败、零回归。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯单元测试样板代码，沿 AuthMeControllerTest 模式机械复制（Mockito mock + AssertJ 断言 + JUnit 5 @DisplayName），无架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

所有 Controller 测试严格沿 `AuthMeControllerTest` 模式（`mock()` Service → 手动 `new Controller(service)` → 直接调用控制器方法 → `assertThat` 断言），仅实体名、方法名、测试数据不同。属 Flash 标准工作范围。

## 5. 已知上下文

### 测试模式（参考 AuthMeControllerTest）

```java
// 模式：纯单元测试，无 Spring 上下文
class XxxControllerTest {

    private final XxxService service = mock(XxxService.class);
    private final XxxController controller = new XxxController(service);

    @Test
    @DisplayName("描述")
    void testName() {
        // Arrange — Mock service behavior
        when(service.someMethod(...)).thenReturn(...);

        // Act — 直接调用 Controller 方法
        R<SomeType> result = controller.endpoint(...);

        // Assert — AssertJ
        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isNotNull();
    }
}
```

### Controller 端点清单

| Controller | 端点 | 方法签名 | 特殊说明 |
|-----------|------|---------|---------|
| UserController | `POST /page` | `page(long pageNum, long pageSize, SysUser query)` | query 可为 null |
| UserController | `GET /{id}` | `get(Long id)` | — |
| UserController | `POST` | `create(UserFormRequest req)` | `@Valid @NotBlank username` |
| UserController | `PUT` | `update(UserFormRequest req)` | id 在 body 中 |
| UserController | `DELETE /{id}` | `delete(Long id)` | — |
| RoleController | `POST /page` | `page(long pageNum, long pageSize, SysRole query)` | query 可为 null |
| RoleController | `GET /{id}` | `get(Long id)` | — |
| RoleController | `POST` | `create(SysRole role)` | `@Valid` |
| RoleController | `PUT` | `update(SysRole role)` | `@Valid` |
| RoleController | `DELETE /{id}` | `delete(Long id)` | — |
| DeptController | `GET /tree` | `tree()` | 返回 `List<SysDept>` 非分页 |
| DeptController | `GET /{id}` | `get(Long id)` | — |
| DeptController | `POST` | `create(SysDept dept)` | `@Valid` |
| DeptController | `PUT` | `update(SysDept dept)` | `@Valid` |
| DeptController | `DELETE /{id}` | `delete(Long id)` | — |
| PostController | `POST /page` | `page(long pageNum, long pageSize, SysPost query)` | query 可为 null |
| PostController | `GET /{id}` | `get(Long id)` | — |
| PostController | `POST` | `create(SysPost post)` | `@Valid` |
| PostController | `PUT` | `update(SysPost post)` | `@Valid` |
| PostController | `DELETE /{id}` | `delete(Long id)` | — |

### Service 方法签名（供 `when().thenReturn()` 参考）

| Service | 方法 | 返回类型 |
|---------|------|---------|
| SysUserService | `page(PageParam)` | `PageResult<SysUser>` |
| SysUserService | `getById(Long)` | `SysUser` |
| SysUserService | `create(SysUser, String)` | `Long` |
| SysUserService | `update(SysUser, String)` | `void` |
| SysUserService | `delete(Long)` | `void` |
| SysRoleService | `page(PageParam, SysRole)` | `PageResult<SysRole>` |
| SysRoleService | `getById(Long)` | `SysRole` |
| SysRoleService | `create(SysRole)` | `Long` |
| SysRoleService | `update(SysRole)` | `void` |
| SysRoleService | `delete(Long)` | `void` |
| SysDeptService | `listTree()` | `List<SysDept>` |
| SysDeptService | `getById(Long)` | `SysDept` |
| SysDeptService | `create(SysDept)` | `Long` |
| SysDeptService | `update(SysDept)` | `void` |
| SysDeptService | `delete(Long)` | `void` |
| SysPostService | `page(PageParam, SysPost)` | `PageResult<SysPost>` |
| SysPostService | `getById(Long)` | `SysPost` |
| SysPostService | `create(SysPost)` | `Long` |
| SysPostService | `update(SysPost)` | `void` |
| SysPostService | `delete(Long)` | `void` |

### R 响应格式

- 成功：`R.ok(data)` → `code = 0`（`R.SUCCESS_CODE`），`data` 为返回值
- 成功无数据：`R.ok()` → `code = 0`，`data = null`

### Entity 字段速查

- **SysUser**：id, username, realName, email, phone, sex, status, deptId, isAdmin (Boolean), avatar
- **SysRole**：id, name, code, sort, status, dataScope, builtIn (Boolean), description
- **SysDept**：id, parentId, name, code, sort, status
- **SysPost**：id, code, name, sort, status, description

## 6. 执行前必须读取的文件

| # | 文件 | 原因 |
|---|------|------|
| 1 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthMeControllerTest.java` | 测试模式参考（Mockito + AssertJ + JUnit5） |
| 2 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/UserController.java` | 确认实际端点签名和内嵌 UserFormRequest 字段 |
| 3 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/RoleController.java` | 确认实际端点签名 |
| 4 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/DeptController.java` | 确认实际端点签名 |
| 5 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/PostController.java` | 确认实际端点签名 |
| 6 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysUserService.java` | 确认 UserService 方法签名（create/update 含 plainPassword） |
| 7 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysRoleService.java` | 确认 RoleService 方法签名 |
| 8 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysDeptService.java` | 确认 DeptService 方法签名 |
| 9 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysPostService.java` | 确认 PostService 方法签名 |
| 10 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysUser.java` | 确认 SysUser 字段（UserFormRequest 构建参考） |
| 11 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRole.java` | 确认 SysRole 字段 |
| 12 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysDept.java` | 确认 SysDept 字段 |
| 13 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysPost.java` | 确认 SysPost 字段 |
| 14 | `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` | 确认 `R.ok()` / `R.ok(T)` / `R.SUCCESS_CODE` 签名 |
| 15 | `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageResult.java` | 确认 PageResult 结构（records, total, pageNum, pageSize） |

## 7. 允许修改的文件范围

### 新建文件（4 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/UserControllerTest.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/RoleControllerTest.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/DeptControllerTest.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/PostControllerTest.java` | 新建 |

### 修改文件

无。不修改任何已有文件。

## 8. 禁止修改的范围

- ❌ 不修改任何 Controller 源文件（B2 已创建的 4 个文件）
- ❌ 不修改任何 Service / ServiceImpl / Entity / Mapper
- ❌ 不修改任何已有测试文件（AuthMeControllerTest 等）
- ❌ 不修改 pom.xml 或添加测试依赖
- ❌ 不修改 application*.yml
- ❌ 不创建集成测试（不需要 Spring 上下文、不需要 H2 数据库）
- ❌ 不修改 R.java / PageResult.java / PageParam.java

## 9. 详细执行方案

### 9.1 创建 UserControllerTest.java

文件路径：`sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/UserControllerTest.java`

测试用例清单（共 7 个）：

| # | 测试方法 | 场景 |
|:--:|---------|------|
| 1 | `page_shouldReturnPageResult` | 正常分页：Mock service 返回 PageResult，验证 code=0 且 records/total/pageNum/pageSize 正确 |
| 2 | `page_withNullQuery_shouldNotThrow` | query=null：service 调用不抛异常 |
| 3 | `get_shouldReturnUser` | 正常获取：Mock service 返回 SysUser，验证 R.ok() 包装正确 |
| 4 | `create_shouldReturnId` | 正常创建：Mock service 返回 Long id，验证 R.ok(id) 且 service.create(user, plainPassword) 参数传递正确 |
| 5 | `create_withEmptyPassword_shouldNotThrow` | plainPassword=null：新建不设密码（由 Service 层校验），Controller 层透传不抛异常 |
| 6 | `update_shouldReturnOk` | 正常更新：Mock service 无返回值（void），验证返回 `R.ok()` code=0 data=null |
| 7 | `delete_shouldReturnOk` | 正常删除：Mock service delete 无异常，验证返回 `R.ok()` code=0 |

完整代码：

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysUser;
import com.sw.ck.system.service.SysUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * {@link UserController} 单元测试。
 * <p>
 * 覆盖分页/详情/创建/更新/删除五个端点，验证请求参数传递和 R 包装正确性。
 * 纯单元测试，Mock SysUserService，无需装载 Spring 上下文。
 * </p>
 */
@DisplayName("用户管理控制器测试")
class UserControllerTest {

    private final SysUserService sysUserService = mock(SysUserService.class);
    private final UserController controller = new UserController(sysUserService);

    // ==================== POST /page — 分页 ====================

    @Test
    @DisplayName("分页查询 → 返回 PageResult 含 records/total/pageNum/pageSize")
    void page_shouldReturnPageResult() {
        SysUser user1 = new SysUser();
        user1.setId(1L);
        user1.setUsername("admin");
        SysUser user2 = new SysUser();
        user2.setId(2L);
        user2.setUsername("zhangsan");

        PageResult<SysUser> mockPage = new PageResult<>();
        mockPage.setRecords(List.of(user1, user2));
        mockPage.setTotal(2L);
        mockPage.setPageNum(1L);
        mockPage.setPageSize(10L);

        when(sysUserService.page(any())).thenReturn(mockPage);

        R<PageResult<SysUser>> result = controller.page(1, 10, null);

        assertThat(result.getCode()).as("成功码应为 0").isZero();
        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getRecords()).hasSize(2);
        assertThat(result.getData().getTotal()).isEqualTo(2L);
        verify(sysUserService).page(any());
    }

    @Test
    @DisplayName("分页 query=null → 不抛异常")
    void page_withNullQuery_shouldNotThrow() {
        when(sysUserService.page(any())).thenReturn(new PageResult<>());

        R<PageResult<SysUser>> result = controller.page(1, 10, null);

        assertThat(result.getCode()).isZero();
    }

    // ==================== GET /{id} — 详情 ====================

    @Test
    @DisplayName("GET /{id} → 返回用户详情")
    void get_shouldReturnUser() {
        SysUser user = new SysUser();
        user.setId(1L);
        user.setUsername("admin");
        user.setRealName("系统管理员");
        user.setEmail("admin@example.com");

        when(sysUserService.getById(1L)).thenReturn(user);

        R<SysUser> result = controller.get(1L);

        assertThat(result.getCode()).as("成功码为 0 → 成功获取").isZero();
        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getId()).isEqualTo(1L);
        assertThat(result.getData().getUsername()).isEqualTo("admin");
        assertThat(result.getData().getRealName()).isEqualTo("系统管理员");
        verify(sysUserService).getById(1L);
    }

    // ==================== POST — 创建 ====================

    @Test
    @DisplayName("创建用户 → 返回新 ID，plainPassword 透传 Service")
    void create_shouldReturnId() {
        when(sysUserService.create(any(SysUser.class), eq("P@ssw0rd!"))).thenReturn(100L);

        UserController.UserFormRequest req = new UserController.UserFormRequest();
        req.setUsername("newuser");
        req.setRealName("新用户");
        req.setEmail("new@example.com");
        req.setPlainPassword("P@ssw0rd!");

        R<Long> result = controller.create(req);

        assertThat(result.getCode()).as("成功码应为 0").isZero();
        assertThat(result.getData()).as("应返回新用户 ID").isEqualTo(100L);
        verify(sysUserService).create(any(SysUser.class), eq("P@ssw0rd!"));
    }

    @Test
    @DisplayName("创建用户 plainPassword=null → Controller 透传不抛异常")
    void create_withNullPassword_shouldNotThrow() {
        when(sysUserService.create(any(SysUser.class), eq(null))).thenReturn(101L);

        UserController.UserFormRequest req = new UserController.UserFormRequest();
        req.setUsername("user2");
        req.setPlainPassword(null);

        R<Long> result = controller.create(req);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isEqualTo(101L);
    }

    // ==================== PUT — 更新 ====================

    @Test
    @DisplayName("更新用户 → 返回 R.ok() code=0 data=null")
    void update_shouldReturnOk() {
        doNothing().when(sysUserService).update(any(SysUser.class), any());

        UserController.UserFormRequest req = new UserController.UserFormRequest();
        req.setId(1L);
        req.setUsername("admin");
        req.setRealName("管理员改名");
        req.setPlainPassword(null); // 不修改密码

        R<Void> result = controller.update(req);

        assertThat(result.getCode()).as("成功码应为 0").isZero();
        assertThat(result.getData()).as("无数据体").isNull();
        verify(sysUserService).update(any(SysUser.class), eq(null));
    }

    // ==================== DELETE /{id} — 删除 ====================

    @Test
    @DisplayName("DELETE /{id} → 返回 R.ok()")
    void delete_shouldReturnOk() {
        doNothing().when(sysUserService).delete(1L);

        R<Void> result = controller.delete(1L);

        assertThat(result.getCode()).as("成功码应为 0").isZero();
        assertThat(result.getData()).as("无数据体").isNull();
        verify(sysUserService).delete(1L);
    }
}
```

### 9.2 创建 RoleControllerTest.java

文件路径：`sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/RoleControllerTest.java`

测试用例清单（共 5 个）：

| # | 测试方法 | 场景 |
|:--:|---------|------|
| 1 | `page_shouldReturnPageResult` | 正常分页：Mock 返回 PageResult，验证 query 参数传入 service |
| 2 | `page_withNullQuery_shouldNotThrow` | query=null 不抛异常 |
| 3 | `get_shouldReturnRole` | 正常获取详情 |
| 4 | `create_shouldReturnId` | 正常创建，`@Valid @RequestBody SysRole` 参数传入 |
| 5 | `delete_shouldReturnOk` | 正常删除 |

完整代码：

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysRole;
import com.sw.ck.system.service.SysRoleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * {@link RoleController} 单元测试。
 */
@DisplayName("角色管理控制器测试")
class RoleControllerTest {

    private final SysRoleService sysRoleService = mock(SysRoleService.class);
    private final RoleController controller = new RoleController(sysRoleService);

    @Test
    @DisplayName("分页查询 → 返回 PageResult")
    void page_shouldReturnPageResult() {
        SysRole role = new SysRole();
        role.setId(1L);
        role.setName("管理员");
        role.setCode("admin");

        PageResult<SysRole> mockPage = new PageResult<>();
        mockPage.setRecords(List.of(role));
        mockPage.setTotal(1L);
        mockPage.setPageNum(1L);
        mockPage.setPageSize(10L);

        when(sysRoleService.page(any(), any())).thenReturn(mockPage);

        SysRole query = new SysRole();
        query.setName("管理员");

        R<PageResult<SysRole>> result = controller.page(1, 10, query);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData().getRecords()).hasSize(1);
        assertThat(result.getData().getRecords().get(0).getCode()).isEqualTo("admin");
        verify(sysRoleService).page(any(), eq(query));
    }

    @Test
    @DisplayName("分页 query=null → 不抛异常")
    void page_withNullQuery_shouldNotThrow() {
        when(sysRoleService.page(any(), eq(null))).thenReturn(new PageResult<>());

        R<PageResult<SysRole>> result = controller.page(1, 10, null);

        assertThat(result.getCode()).isZero();
    }

    @Test
    @DisplayName("GET /{id} → 返回角色详情")
    void get_shouldReturnRole() {
        SysRole role = new SysRole();
        role.setId(1L);
        role.setName("管理员");
        role.setCode("admin");

        when(sysRoleService.getById(1L)).thenReturn(role);

        R<SysRole> result = controller.get(1L);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData().getId()).isEqualTo(1L);
        assertThat(result.getData().getCode()).isEqualTo("admin");
    }

    @Test
    @DisplayName("创建角色 → 返回新 ID")
    void create_shouldReturnId() {
        SysRole role = new SysRole();
        role.setName("测试角色");
        role.setCode("test");
        role.setSort(10);
        role.setStatus(1);

        when(sysRoleService.create(role)).thenReturn(100L);

        R<Long> result = controller.create(role);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isEqualTo(100L);
        verify(sysRoleService).create(role);
    }

    @Test
    @DisplayName("更新角色 → 返回 R.ok()")
    void update_shouldReturnOk() {
        SysRole role = new SysRole();
        role.setId(1L);
        role.setName("管理员改名");
        role.setCode("admin");

        doNothing().when(sysRoleService).update(role);

        R<Void> result = controller.update(role);

        assertThat(result.getCode()).isZero();
        verify(sysRoleService).update(role);
    }

    @Test
    @DisplayName("DELETE /{id} → 返回 R.ok()")
    void delete_shouldReturnOk() {
        doNothing().when(sysRoleService).delete(1L);

        R<Void> result = controller.delete(1L);

        assertThat(result.getCode()).isZero();
        verify(sysRoleService).delete(1L);
    }
}
```

### 9.3 创建 DeptControllerTest.java

文件路径：`sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/DeptControllerTest.java`

测试用例清单（共 5 个）：

| # | 测试方法 | 场景 |
|:--:|---------|------|
| 1 | `tree_shouldReturnList` | 正常返回部门列表（非分页），验证 `listTree()` 调用 |
| 2 | `tree_empty_shouldReturnEmptyList` | 空部门列表不抛异常 |
| 3 | `get_shouldReturnDept` | 正常获取详情 |
| 4 | `create_shouldReturnId` | 正常创建 |
| 5 | `delete_shouldReturnOk` | 正常删除 |

完整代码：

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysDept;
import com.sw.ck.system.service.SysDeptService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * {@link DeptController} 单元测试。
 * <p>
 * 特殊：部门无分页端点，用 GET /tree 返回全量排序列表。
 * </p>
 */
@DisplayName("部门管理控制器测试")
class DeptControllerTest {

    private final SysDeptService sysDeptService = mock(SysDeptService.class);
    private final DeptController controller = new DeptController(sysDeptService);

    @Test
    @DisplayName("GET /tree → 返回部门列表")
    void tree_shouldReturnList() {
        SysDept dept1 = new SysDept();
        dept1.setId(1L);
        dept1.setName("总公司");
        dept1.setCode("root");

        SysDept dept2 = new SysDept();
        dept2.setId(2L);
        dept2.setName("研发部");
        dept2.setCode("dev");
        dept2.setParentId(1L);

        when(sysDeptService.listTree()).thenReturn(List.of(dept1, dept2));

        R<List<SysDept>> result = controller.tree();

        assertThat(result.getCode()).as("成功码应为 0").isZero();
        assertThat(result.getData()).hasSize(2);
        assertThat(result.getData().get(0).getName()).isEqualTo("总公司");
        assertThat(result.getData().get(1).getParentId()).isEqualTo(1L);
        verify(sysDeptService).listTree();
    }

    @Test
    @DisplayName("GET /tree 空列表 → 返回空数组不抛异常")
    void tree_empty_shouldReturnEmptyList() {
        when(sysDeptService.listTree()).thenReturn(Collections.emptyList());

        R<List<SysDept>> result = controller.tree();

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isEmpty();
    }

    @Test
    @DisplayName("GET /{id} → 返回部门详情")
    void get_shouldReturnDept() {
        SysDept dept = new SysDept();
        dept.setId(1L);
        dept.setName("总公司");
        dept.setCode("root");
        dept.setParentId(0L);

        when(sysDeptService.getById(1L)).thenReturn(dept);

        R<SysDept> result = controller.get(1L);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData().getName()).isEqualTo("总公司");
    }

    @Test
    @DisplayName("创建部门 → 返回新 ID")
    void create_shouldReturnId() {
        SysDept dept = new SysDept();
        dept.setName("新部门");
        dept.setCode("new_dept");
        dept.setParentId(1L);
        dept.setSort(10);

        when(sysDeptService.create(dept)).thenReturn(200L);

        R<Long> result = controller.create(dept);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isEqualTo(200L);
        verify(sysDeptService).create(dept);
    }

    @Test
    @DisplayName("更新部门 → 返回 R.ok()")
    void update_shouldReturnOk() {
        SysDept dept = new SysDept();
        dept.setId(1L);
        dept.setName("总公司改名");

        doNothing().when(sysDeptService).update(dept);

        R<Void> result = controller.update(dept);

        assertThat(result.getCode()).isZero();
        verify(sysDeptService).update(dept);
    }

    @Test
    @DisplayName("DELETE /{id} → 返回 R.ok()")
    void delete_shouldReturnOk() {
        doNothing().when(sysDeptService).delete(1L);

        R<Void> result = controller.delete(1L);

        assertThat(result.getCode()).isZero();
        verify(sysDeptService).delete(1L);
    }
}
```

### 9.4 创建 PostControllerTest.java

文件路径：`sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/PostControllerTest.java`

测试用例清单（共 5 个）：

| # | 测试方法 | 场景 |
|:--:|---------|------|
| 1 | `page_shouldReturnPageResult` | 正常分页 |
| 2 | `page_withNullQuery_shouldNotThrow` | query=null |
| 3 | `get_shouldReturnPost` | 正常获取详情 |
| 4 | `create_shouldReturnId` | 正常创建 |
| 5 | `delete_shouldReturnOk` | 正常删除 |

完整代码：

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysPost;
import com.sw.ck.system.service.SysPostService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * {@link PostController} 单元测试。
 */
@DisplayName("岗位管理控制器测试")
class PostControllerTest {

    private final SysPostService sysPostService = mock(SysPostService.class);
    private final PostController controller = new PostController(sysPostService);

    @Test
    @DisplayName("分页查询 → 返回 PageResult")
    void page_shouldReturnPageResult() {
        SysPost post = new SysPost();
        post.setId(1L);
        post.setCode("CEO");
        post.setName("首席执行官");

        PageResult<SysPost> mockPage = new PageResult<>();
        mockPage.setRecords(List.of(post));
        mockPage.setTotal(1L);
        mockPage.setPageNum(1L);
        mockPage.setPageSize(10L);

        when(sysPostService.page(any(), any())).thenReturn(mockPage);

        R<PageResult<SysPost>> result = controller.page(1, 10, null);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData().getRecords()).hasSize(1);
        assertThat(result.getData().getRecords().get(0).getCode()).isEqualTo("CEO");
    }

    @Test
    @DisplayName("分页 query=null → 不抛异常")
    void page_withNullQuery_shouldNotThrow() {
        when(sysPostService.page(any(), eq(null))).thenReturn(new PageResult<>());

        R<PageResult<SysPost>> result = controller.page(1, 10, null);

        assertThat(result.getCode()).isZero();
    }

    @Test
    @DisplayName("GET /{id} → 返回岗位详情")
    void get_shouldReturnPost() {
        SysPost post = new SysPost();
        post.setId(1L);
        post.setCode("CEO");
        post.setName("首席执行官");

        when(sysPostService.getById(1L)).thenReturn(post);

        R<SysPost> result = controller.get(1L);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData().getCode()).isEqualTo("CEO");
    }

    @Test
    @DisplayName("创建岗位 → 返回新 ID")
    void create_shouldReturnId() {
        SysPost post = new SysPost();
        post.setCode("CTO");
        post.setName("首席技术官");
        post.setSort(10);
        post.setStatus(1);

        when(sysPostService.create(post)).thenReturn(300L);

        R<Long> result = controller.create(post);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isEqualTo(300L);
        verify(sysPostService).create(post);
    }

    @Test
    @DisplayName("更新岗位 → 返回 R.ok()")
    void update_shouldReturnOk() {
        SysPost post = new SysPost();
        post.setId(1L);
        post.setCode("CEO");
        post.setName("首席执行官改名");

        doNothing().when(sysPostService).update(post);

        R<Void> result = controller.update(post);

        assertThat(result.getCode()).isZero();
        verify(sysPostService).update(post);
    }

    @Test
    @DisplayName("DELETE /{id} → 返回 R.ok()")
    void delete_shouldReturnOk() {
        doNothing().when(sysPostService).delete(1L);

        R<Void> result = controller.delete(1L);

        assertThat(result.getCode()).isZero();
        verify(sysPostService).delete(1L);
    }
}
```

### 9.5 执行全量验证

```bash
cd Smart-WorkFlow && mvn -q compile && mvn -q test
```

预期结果：
- `mvn -q compile` — 退出码 0，零编译错误
- `mvn -q test` — 退出码 0，所有测试通过
- 测试总数 ≈ 111（基线） + 22（新增）= **133 tests**（允许轻微偏差）
- 新增测试全绿，已有测试零回归（AuthMeControllerTest 5 tests、DictFacadeTest 等不变）

## 10. 关键实现约束

- ✅ 纯单元测试 — 使用 `mock()` + `new Controller(service)` 模式，**不使用** Spring Boot Test / `@SpringBootTest` / `@WebMvcTest` / MockMvc
- ✅ 测试类不加 `public` — 沿用 `class XxxControllerTest`（包级可见，JUnit 5 规范）
- ✅ 断言只使用 AssertJ `assertThat(...)` — 不用 JUnit 5 `assertEquals` / Hamcrest
- ✅ Mock 只使用 Mockito `mock()` / `when()` / `verify()` — 不使用 `@Mock` / `@ExtendWith(MockitoExtension.class)`
- ✅ `@DisplayName` 中文描述 — 与 AuthMeControllerTest 一致
- ✅ 测试方法命名：`endpoint_scenario_shouldExpected`（如 `page_shouldReturnPageResult`）
- ✅ 全量 `mvn -q test` 确认无回归再提交
- ❌ 不使用 Spring 上下文 — 不装载 ApplicationContext
- ❌ 不创建集成测试 — 不建 H2 内存数据库
- ❌ 不使用 `@SpringBootTest` / `@WebMvcTest` / `@DataJpaTest` / `@AutoConfigureMockMvc`

## 11. 边界情况

- `@RequestBody SysUser query` 在 UserController.page() 中可传 `null`（`required = false`），test 必须覆盖 null query 不抛异常
- `UserFormRequest.plainPassword` 可为 `null`（更新时不修改密码），test 验证 Controller 透传不抛异常
- `DeptController.tree()` 返回空列表时也不抛异常
- PageParam 默认值 pageNum=1, pageSize=10，但 Controller 的 `page()` 方法通过 `@RequestParam(defaultValue)` 设置默认值，底层 PageParam 构造函数不影响 Controller 行为
- `R.ok()` 无参数版本 vs `R.ok(data)` — 前者 `data=null`，测试中需区分

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:------:|:----:|----------|
| 新增测试违反 Mockito strict stubbings | 低 | 编译通过但测试红灯 | 严格按 `when().thenReturn()` 只 stub 被调用的方法 |
| Service 方法签名与 test 假设不一致 | 低 | 编译失败 | 执行前读取所有 Service 文件确认签名 |
| 全量测试数增加但已有测试回归 | 低 | 已有功能退化 | `mvn test` 全量跑，确认无 FAILED/ERROR |
| PageResult 缺少 setter | 低 | 编译失败 | 读取 PageResult 确认有 setter（Lombok @Data） |

回滚方案：删除新建的 4 个测试文件即可完全回滚。不涉及任何已有文件修改。

## 13. 测试方案

### 13.1 静态检查

| 检查项 | 命令/方法 | 预期结果 |
|--------|-----------|----------|
| 编译通过 | `mvn -q compile` | 退出码 0，0 errors |
| 测试编译通过 | `mvn -q test-compile` | 退出码 0 |
| 无 Mockito 未使用 stub 警告 | 查看 test 输出 | 无 `UnnecessaryStubbingException` |
| 4 个测试文件均存在 | `ls -la .../controller/*Test.java` | 共 5 个（含已有 AuthMeControllerTest） |
| 无 Spring 注解泄漏 | `grep -r '@SpringBootTest\|@WebMvcTest\|@AutoConfigureMockMvc' .../controller/` | 零命中 |
| 无 JUnit4 注解 | `grep -r 'org.junit.Test\|@RunWith' .../controller/` | 零命中 |

### 13.2 单元测试

本 Step 本身就是创建单元测试。新增 22 个测试用例，覆盖 4 个 Controller 全部 20 个端点。

### 13.3 集成测试

无。本 Step 不涉及集成测试。

### 13.4 手工验证

无需手工验证。

### 13.5 回归检查

| 检查项 | 命令/方法 | 预期结果 |
|--------|-----------|----------|
| 已有测试数不减少 | `mvn test` 输出对比 | 111 tests baseline，新总计 ~133 |
| AuthMeControllerTest 全部通过 | `mvn test -pl sw-biz-system` | 5/5 passed |
| DictFacadeTest 全部通过 | 同上 | 不变 |
| LogicalDeleteTest 全部通过 | 同上 | 不变 |
| 其他模块测试全部通过 | 全量 `mvn test` | 零 FAILED，零 ERROR |

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| **B3-1** | `UserControllerTest.java` 存在，含 ≥6 个 @Test 方法，覆盖 page/get/create/update/delete | `grep -c '@Test' UserControllerTest.java` |
| **B3-2** | `RoleControllerTest.java` 存在，含 ≥5 个 @Test 方法，覆盖 page/get/create/update/delete | `grep -c '@Test' RoleControllerTest.java` |
| **B3-3** | `DeptControllerTest.java` 存在，含 ≥5 个 @Test 方法，覆盖 tree/get/create/update/delete | `grep -c '@Test' DeptControllerTest.java` |
| **B3-4** | `PostControllerTest.java` 存在，含 ≥5 个 @Test 方法，覆盖 page/get/create/update/delete | `grep -c '@Test' PostControllerTest.java` |
| **B3-5** | `mvn -q compile` 退出码 0 | CI 输出 |
| **B3-6** | `mvn -q test` 退出码 0，所有模块测试全通过，零 FAILED，零 ERROR | CI 输出 |
| **B3-7** | 新增测试全绿，已有测试零回归（AuthMeControllerTest / DictFacadeTest / LogicalDeleteTest 等全部通过） | CI 输出逐模块确认 |
| **B3-8** | 测试不使用 Spring 上下文（不加载 ApplicationContext） | `grep -r '@SpringBootTest\|@WebMvcTest' .../controller/UserControllerTest.java` 零命中 |

## 15. 执行回执格式

```markdown
# 执行回执

## 1. Step 编号和名称

## 2. 使用模型
（实际使用了哪个模型）

## 3. 实际读取的文件
（逐文件列出，未读取的标注原因）

## 4. 实际修改的文件
（逐文件列出，新建和修改区分标注）

## 5. 每个文件的修改摘要
（每个测试文件的测试方法数、覆盖端点）

## 6. 实际执行的命令
（逐条列出命令及参数）

## 7. 命令输出摘要
（编译结果、测试结果、退出码、Tests run 总数、模块分布）

## 8. 与原方案的偏差
（哪些地方和方案不同，为什么）

## 9. 遇到的问题
（技术问题、环境问题、理解偏差等，以及如何解决的）

## 10. 未完成内容
（方案中要求但实际未完成的内容，及原因）

## 11. 风险和注意事项
（执行过程中发现的潜在问题）

## 12. Git diff 摘要
（改动文件数、新增行数）

## 13. 验收标准自评
（逐条对照 §14 验收标准回答是否满足）
```

## 16. 测试回执格式

> 本 Step 本身就是创建测试，无需单独测试回执。执行回执中的 `mvn -q test` 输出即为测试证据。
> 根目录代理将基于 §14 验收标准直接审查执行回执。

## 17. 明确禁止事项

- ❌ 禁止使用 Spring Boot Test / `@SpringBootTest` / `@WebMvcTest` / MockMvc
- ❌ 禁止创建集成测试（不需要 H2 / PostgreSQL 数据库）
- ❌ 禁止修改 Controller 源文件以"方便测试"
- ❌ 禁止使用 `@Mock` / `@InjectMocks` / `@ExtendWith(MockitoExtension.class)` 注解
- ❌ 禁止写 `verifyNoMoreInteractions`（太脆弱，后续加端点就挂）
- ❌ 禁止修改已有的 AuthMeControllerTest / DictFacadeTest / LogicalDeleteTest
- ❌ 禁止修改任何 Service / Entity / Mapper / Controller 源文件
- ❌ 禁止添加 `@Transactional` 到测试（不需要回滚，不操作 DB）
- ❌ 禁止使用 `Mockito.mockStatic`（静态 mock 需要额外依赖）
- ❌ 禁止写 `@BeforeEach` / `@AfterEach` 进行复杂 setup（测试间完全独立，无需共享状态）
