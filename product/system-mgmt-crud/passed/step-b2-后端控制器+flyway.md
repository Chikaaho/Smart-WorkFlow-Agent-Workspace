# Step B2：后端 — REST Controllers + Flyway V15

## 1. 当前状态

功能「系统管理核心 CRUD 做宽闭环」处于 **IN_PROGRESS** 🟦 状态。

前置 Step B1 已 PASSED ✅（6 服务层文件新建 + SysRole 列名修复，`mvn -q compile` 通过）。

本 Step B2 在 B1 基础上创建 REST Controller 和 Flyway 菜单种子数据，使四个实体（User/Role/Dept/Post）具备完整的 HTTP API。

## 2. Step 目标

创建 4 个 REST Controller + 2 个 Flyway V15 迁移脚本（H2 + PG 双方言），使系统管理四实体的 CRUD 操作可通过 HTTP 调用，并注册系统管理子菜单到菜单树。验证 `mvn -q compile` 通过。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯 CRUD Controller 样板代码，严格沿 DictController 模式机械复制；Flyway 沿 V6 模式追加菜单行
是否触发升级条件：否
```

## 4. 模型选择理由

所有 Controller 严格沿 `DictController` 模式（constructor injection + `@RestController` + `@RequestMapping("/system/xxx")` + `R.ok()` 返回封装），仅实体名和方法名不同。Flyway V15 沿 V6 模式追加 INSERT 行。均属 Flash 标准工作范围。

## 5. 已知上下文

### Controller 模式（参考 DictController）
- `@RestController` + `@RequestMapping("/system/xxx")`
- Constructor injection（无 `@Autowired` / `@Resource`）
- 分页：`@PostMapping("/page")` — 接受 `pageNum`/`pageSize` query params + `@RequestBody(required=false)` 查询对象
- 详情：`@GetMapping("/{id}")`
- 创建：`@PostMapping` — `@Valid @RequestBody` 实体/DTO，返回 `R.ok(id)`
- 更新：`@PutMapping` — `@Valid @RequestBody` 实体/DTO，返回 `R.ok()`
- 删除：`@DeleteMapping("/{id}")` — 返回 `R.ok()`

### 实体 Service 方法签名（B1 已创建）

| Service | create | update | delete | page | 特殊 |
|---------|--------|--------|--------|------|------|
| SysUserService | `(SysUser, String plainPassword)` | `(SysUser, String plainPassword)` | `(Long)` | `(PageParam)` | `getById(Long)`, `getByUsername(String)` |
| SysRoleService | `(SysRole) → Long` | `(SysRole)` | `(Long)` | `(PageParam, SysRole)` | `getByCode(String)` |
| SysDeptService | `(SysDept) → Long` | `(SysDept)` | `(Long)` | 无 page（树） | `listTree() → List<SysDept>` |
| SysPostService | `(SysPost) → Long` | `(SysPost)` | `(Long)` | `(PageParam, SysPost)` | 无特殊 |

### User Controller 特殊需求
- `SysUserService.create(user, plainPassword)` 需要明文密码参数 → Controller 不能直接用 `SysUser` 作为 create/update 的 request body
- 需要内嵌 DTO `UserFormRequest`（`SysUser` 字段 + `plainPassword` 字符串）
- 密码字段仅在 create 时必填，update 时可省略（null=不修改）

### Dept Controller 特殊需求
- 无分页端点 → `GET /system/dept/tree` 返回 `List<SysDept>`（前端自行 flat→tree 转换）
- delete 端点已有 Service 层子部门/在职用户校验（B1 已写）

### 菜单结构（Flyway V15）

当前 System 菜单（id=1）已升级为菜单项（component=`system/views/SystemHome`）。V15 在 System 下追加 4 个子菜单：

| id | parent_id | name | title | component | permission | icon | sort |
|:--:|:---------:|------|-------|-----------|------------|------|:----:|
| 11 | 1 | User | 用户管理 | `system/views/UserList` | `system:user:list` | `User` | 10 |
| 12 | 1 | Role | 角色管理 | `system/views/RoleList` | `system:role:list` | `Avatar` | 20 |
| 13 | 1 | Dept | 部门管理 | `system/views/DeptList` | `system:dept:list` | `Collection` | 30 |
| 14 | 1 | Post | 岗位管理 | `system/views/PostList` | `system:post:list` | `Tickets` | 40 |

Icon 项使用 Element Plus 内置图标名（字符串），前端菜单渲染据此渲染图标。

### Flyway 双方言约束
- H2 和 PostgreSQL 两个目录下的 V15 内容必须**逐字节语义一致**
- `current_timestamp` 在两方言中均适用
- menu_type: 0=目录, 1=菜单（与 V6 一致）
- hidden: `false`（boolean 字面量，H2 和 PG 均支持）

## 6. 执行前必须读取的文件

| # | 文件 | 原因 |
|---|------|------|
| 1 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/DictController.java` | Controller 模式参考 |
| 2 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysRoleService.java` | 确认 Role Service 方法签名 |
| 3 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysUserService.java` | 确认 User Service 方法签名（含 plainPassword） |
| 4 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysDeptService.java` | 确认 Dept Service 方法签名（listTree） |
| 5 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/SysPostService.java` | 确认 Post Service 方法签名 |
| 6 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysUser.java` | 确认 User 实体字段（用于 UserFormRequest DTO） |
| 7 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysRole.java` | 确认 Role 实体字段 |
| 8 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysDept.java` | 确认 Dept 实体字段 |
| 9 | `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysPost.java` | 确认 Post 实体字段 |
| 10 | `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V6__m_seam_menu_seed.sql` | Flyway 菜单 seed 模式参考 |
| 11 | `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V6__m_seam_menu_seed.sql` | PostgreSQL 方言菜单 seed 参考 |
| 12 | `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/` | 确认当前最新版本号（确认 V14 已存在） |
| 13 | `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/` | 确认当前最新版本号（确认 V14 已存在） |

## 7. 允许修改的文件范围

### 新建文件（6 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/UserController.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/RoleController.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/DeptController.java` | 新建 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/PostController.java` | 新建 |
| `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V15__system_mgmt_menu.sql` | 新建 |
| `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V15__system_mgmt_menu.sql` | 新建 |

### 修改文件

无。不修改任何已有文件。

## 8. 禁止修改的范围

- ❌ 不修改任何 Service 层文件（B1 已创建的 6 个文件）
- ❌ 不修改 SysUser / SysRole / SysDept / SysPost 实体
- ❌ 不修改 DictController / AuthController / AuthMeController
- ❌ 不修改 V1~V14 的任何 Flyway 脚本
- ❌ 不创建测试类（B3 负责）
- ❌ 不修改 BaseService / BaseServiceImpl / BaseMapperX / R / PageParam
- ❌ 不修改 pom.xml 或添加依赖
- ❌ 不修改 application*.yml
- ❌ 不创建 UserFormRequest 在单独的 DTO 文件（作为 UserController 内部静态类）

## 9. 详细执行方案

### 9.1 创建 UserController.java

文件路径：`.../controller/UserController.java`

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysUser;
import com.sw.ck.system.service.SysUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管理控制器。
 */
@RestController
@RequestMapping("/system/user")
public class UserController {

    private final SysUserService sysUserService;

    public UserController(SysUserService sysUserService) {
        this.sysUserService = sysUserService;
    }

    /** 内嵌 DTO：用户表单（含明文密码） */
    @Data
    public static class UserFormRequest {
        private Long id;
        @NotBlank(message = "用户名不能为空")
        private String username;
        private String realName;
        private String email;
        private String phone;
        private Integer sex;
        private Integer status;
        private Long deptId;
        /** 明文密码 — 新建时必填，更新时为空表示不修改 */
        private String plainPassword;
    }

    /**
     * 分页查询用户。
     */
    @PostMapping("/page")
    public R<PageResult<SysUser>> page(@RequestParam(defaultValue = "1") long pageNum,
                                        @RequestParam(defaultValue = "10") long pageSize,
                                        @RequestBody(required = false) SysUser query) {
        PageParam pageParam = new PageParam();
        pageParam.setPageNum(pageNum);
        pageParam.setPageSize(pageSize);
        // SysUserService.page(PageParam) 仅接受 PageParam（无 query 筛选）
        return R.ok(sysUserService.page(pageParam));
    }

    /**
     * 获取用户详情。
     */
    @GetMapping("/{id}")
    public R<SysUser> get(@PathVariable Long id) {
        return R.ok(sysUserService.getById(id));
    }

    /**
     * 创建用户。
     */
    @PostMapping
    public R<Long> create(@Valid @RequestBody UserFormRequest req) {
        SysUser user = toEntity(req);
        return R.ok(sysUserService.create(user, req.getPlainPassword()));
    }

    /**
     * 更新用户。
     */
    @PutMapping
    public R<Void> update(@Valid @RequestBody UserFormRequest req) {
        SysUser user = toEntity(req);
        sysUserService.update(user, req.getPlainPassword());
        return R.ok();
    }

    /**
     * 删除用户（逻辑删除）。
     */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        sysUserService.delete(id);
        return R.ok();
    }

    /** UserFormRequest → SysUser 转换 */
    private SysUser toEntity(UserFormRequest req) {
        SysUser user = new SysUser();
        user.setId(req.getId());
        user.setUsername(req.getUsername());
        user.setRealName(req.getRealName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setSex(req.getSex());
        user.setStatus(req.getStatus());
        user.setDeptId(req.getDeptId());
        return user;
    }
}
```

**关键说明**：`UserFormRequest` 是 UserController 的 **内部静态类**（不建独立 DTO 文件），因为它是纯 Controller 层的请求体聚合（`SysUser` 字段 + `plainPassword`），没有跨 Controller 复用需求。

### 9.2 创建 RoleController.java

文件路径：`.../controller/RoleController.java`

严格沿 DictController 模式，但只包含角色类型操作（无子数据操作）。

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysRole;
import com.sw.ck.system.service.SysRoleService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * 角色管理控制器。
 */
@RestController
@RequestMapping("/system/role")
public class RoleController {

    private final SysRoleService sysRoleService;

    public RoleController(SysRoleService sysRoleService) {
        this.sysRoleService = sysRoleService;
    }

    /**
     * 分页查询角色。
     */
    @PostMapping("/page")
    public R<PageResult<SysRole>> page(@RequestParam(defaultValue = "1") long pageNum,
                                        @RequestParam(defaultValue = "10") long pageSize,
                                        @RequestBody(required = false) SysRole query) {
        PageParam pageParam = new PageParam();
        pageParam.setPageNum(pageNum);
        pageParam.setPageSize(pageSize);
        return R.ok(sysRoleService.page(pageParam, query));
    }

    /**
     * 获取角色详情。
     */
    @GetMapping("/{id}")
    public R<SysRole> get(@PathVariable Long id) {
        return R.ok(sysRoleService.getById(id));
    }

    /**
     * 创建角色。
     */
    @PostMapping
    public R<Long> create(@Valid @RequestBody SysRole role) {
        return R.ok(sysRoleService.create(role));
    }

    /**
     * 更新角色。
     */
    @PutMapping
    public R<Void> update(@Valid @RequestBody SysRole role) {
        sysRoleService.update(role);
        return R.ok();
    }

    /**
     * 删除角色（逻辑删除）。
     */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        sysRoleService.delete(id);
        return R.ok();
    }
}
```

### 9.3 创建 DeptController.java

文件路径：`.../controller/DeptController.java`

特殊：无分页端点，用 `GET /system/dept/tree` 返回全量列表（前端自行 flat→tree 转换）。

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysDept;
import com.sw.ck.system.service.SysDeptService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 部门管理控制器。
 */
@RestController
@RequestMapping("/system/dept")
public class DeptController {

    private final SysDeptService sysDeptService;

    public DeptController(SysDeptService sysDeptService) {
        this.sysDeptService = sysDeptService;
    }

    /**
     * 查询部门树（返回全量排序列表，前端自行转换为树形结构）。
     */
    @GetMapping("/tree")
    public R<List<SysDept>> tree() {
        return R.ok(sysDeptService.listTree());
    }

    /**
     * 获取部门详情。
     */
    @GetMapping("/{id}")
    public R<SysDept> get(@PathVariable Long id) {
        return R.ok(sysDeptService.getById(id));
    }

    /**
     * 创建部门。
     */
    @PostMapping
    public R<Long> create(@Valid @RequestBody SysDept dept) {
        return R.ok(sysDeptService.create(dept));
    }

    /**
     * 更新部门。
     */
    @PutMapping
    public R<Void> update(@Valid @RequestBody SysDept dept) {
        sysDeptService.update(dept);
        return R.ok();
    }

    /**
     * 删除部门（逻辑删除，含子部门/在职用户校验）。
     */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        sysDeptService.delete(id);
        return R.ok();
    }
}
```

### 9.4 创建 PostController.java

文件路径：`.../controller/PostController.java`

最接近 DictController 模式的纯 CRUD。

```java
package com.sw.ck.system.controller;

import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.system.entity.SysPost;
import com.sw.ck.system.service.SysPostService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * 岗位管理控制器。
 */
@RestController
@RequestMapping("/system/post")
public class PostController {

    private final SysPostService sysPostService;

    public PostController(SysPostService sysPostService) {
        this.sysPostService = sysPostService;
    }

    /**
     * 分页查询岗位。
     */
    @PostMapping("/page")
    public R<PageResult<SysPost>> page(@RequestParam(defaultValue = "1") long pageNum,
                                        @RequestParam(defaultValue = "10") long pageSize,
                                        @RequestBody(required = false) SysPost query) {
        PageParam pageParam = new PageParam();
        pageParam.setPageNum(pageNum);
        pageParam.setPageSize(pageSize);
        return R.ok(sysPostService.page(pageParam, query));
    }

    /**
     * 获取岗位详情。
     */
    @GetMapping("/{id}")
    public R<SysPost> get(@PathVariable Long id) {
        return R.ok(sysPostService.getById(id));
    }

    /**
     * 创建岗位。
     */
    @PostMapping
    public R<Long> create(@Valid @RequestBody SysPost post) {
        return R.ok(sysPostService.create(post));
    }

    /**
     * 更新岗位。
     */
    @PutMapping
    public R<Void> update(@Valid @RequestBody SysPost post) {
        sysPostService.update(post);
        return R.ok();
    }

    /**
     * 删除岗位（逻辑删除）。
     */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        sysPostService.delete(id);
        return R.ok();
    }
}
```

### 9.5 创建 Flyway V15 — H2 方言

文件路径：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V15__system_mgmt_menu.sql`

```sql
-- ===================================================================
-- V15: 系统管理子菜单 —— 用户管理 / 角色管理 / 部门管理 / 岗位管理
--
-- 约束：
--   · id 使用 11-14（避开 1-9, 15+ 以免冲突）
--   · parent_id = 1（System 菜单，详见 V6）
--   · component 路径使用 vue 组件路径格式（无后缀无前导斜杠）
--   · 不 seed sys_role_menu（超管旁路）
-- ===================================================================

INSERT INTO sys_menu (id, create_time, update_time, deleted, version, parent_id, name, title, hidden, menu_type, path, component, permission, icon, sort)
VALUES (11, current_timestamp, current_timestamp, 0, 0, 1, 'User', '用户管理', false, 1, 'user', 'system/views/UserList', 'system:user:list', 'User', 10);

INSERT INTO sys_menu (id, create_time, update_time, deleted, version, parent_id, name, title, hidden, menu_type, path, component, permission, icon, sort)
VALUES (12, current_timestamp, current_timestamp, 0, 0, 1, 'Role', '角色管理', false, 1, 'role', 'system/views/RoleList', 'system:role:list', 'Avatar', 20);

INSERT INTO sys_menu (id, create_time, update_time, deleted, version, parent_id, name, title, hidden, menu_type, path, component, permission, icon, sort)
VALUES (13, current_timestamp, current_timestamp, 0, 0, 1, 'Dept', '部门管理', false, 1, 'dept', 'system/views/DeptList', 'system:dept:list', 'Collection', 30);

INSERT INTO sys_menu (id, create_time, update_time, deleted, version, parent_id, name, title, hidden, menu_type, path, component, permission, icon, sort)
VALUES (14, current_timestamp, current_timestamp, 0, 0, 1, 'Post', '岗位管理', false, 1, 'post', 'system/views/PostList', 'system:post:list', 'Tickets', 40);
```

### 9.6 创建 Flyway V15 — PostgreSQL 方言

文件路径：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V15__system_mgmt_menu.sql`

内容与 H2 版本完全一致（`current_timestamp` 和 boolean `false` 在两方言中均有效）。

### 9.7 验证

```bash
cd /data/reasonix/files/Smart-WorkFlow
mvn -q compile
```

预期：BUILD SUCCESS，零编译错误。

## 10. 关键实现约束

- **UserController 必须用内部 DTO `UserFormRequest`** 而非直接 `@RequestBody SysUser`，因为 `SysUserService.create/update` 需要 `plainPassword` 参数
- **UserFormRequest 定义为 UserController 内部静态类**，标注 `@Data`，不建独立 DTO 文件
- **UserController.toEntity() 不设 `password` 字段** — 密码由 `SysUserServiceImpl.create/update` 中的 `PasswordEncoder` 编码后设置
- **UserController.toEntity() 不复制 `password` 字段** — `UserFormRequest` 中无 password 字段（仅 plainPassword）
- **DeptController 无 `@PostMapping("/page")`** — 部门用 `GET /tree` 返回全量列表
- **DeptController 的 `@PostMapping` 仅用于创建**（与 DictController 一致），更新用 `@PutMapping`
- **所有 Controller 用 constructor injection**（与 DictController 一致），不用 `@Autowired`
- **Flyway 菜单 id=11/12/13/14** — 必须与后续 F3 的 `seeds.ts` 中 `MOCK_MENU_TREE` 的 id 一致
- **Flyway component 路径**：`system/views/UserList`（无前导斜杠、无 `.vue` 后缀）— 与 V6 的 `system/views/SystemHome` 格式一致
- **Flyway 不 seed `sys_role_menu`** — 超管旁路，与 V6 策略一致
- **PostgreSQL V15 与 H2 V15 内容必须完全一致**（双方言约束）

## 11. 边界情况

- **UserController 更新时不传密码**：`plainPassword` 为 null/空 → SysUserServiceImpl.update 从 DB 加载旧密码保留
- **UserController 创建时密码为空**：`@Valid` + `@NotBlank` 在 UserFormRequest.username 上校验；plainPassword 无校验（纯 nullable），但 `SysUserServiceImpl.create` 有 `Objects.requireNonNull` 兜底
- **RoleController 创建重复 code**：SysRoleServiceImpl.create 有 code 唯一性校验 → 抛出 BaseException → 全局异常处理器转 R.fail
- **DeptController 删除有子部门的节点**：SysDeptServiceImpl.delete 有校验 → 抛出 BaseException
- **Flyway V15 多次执行**：Flyway 检测 checksum，已执行过的迁移不重复运行

## 12. 风险和回滚方案

| 风险 | 影响 | 应对 |
|------|------|------|
| UserFormRequest 字段与 SysUser 不同步 | 运行时字段缺失 | 严格从 SysUser.java 复制字段 |
| Controller 方法签名与 Service 不一致 | 编译错误 | 编译发现问题，修正即可 |
| Flyway V15 checksum 冲突 | 迁移失败 | 确认 V15 版本号未被使用；先查看 `flyway_schema_history` |
| PostgreSQL 方言中 boolean 字面量不兼容 | 迁移失败 | H2 中 `false` 可行；PG 也用 `false`（与 V6 一致） |

回滚：删除新建的 6 个文件，用 `git checkout` 恢复未被修改的文件。

## 13. 测试方案

### 13.1 静态检查
- `mvn -q compile` 零错误
- grep 确认 4 个 Controller 文件存在且包含 `@RestController` 注解
- grep 确认 2 个 Flyway 文件存在且包含 `INSERT INTO sys_menu`

### 13.2 单元测试
本 Step 不新增测试（B3 负责控制器集成测试）。

### 13.3 集成测试
不适用（本 Step 仅创建 Controller 层，集成测试在 B3）。

### 13.4 手工验证
启动后端后可用 curl 验证：
```bash
# 验证列表端点
curl -X POST 'http://localhost:8080/api/system/role/page' -H 'Content-Type: application/json'
curl -X POST 'http://localhost:8080/api/system/post/page' -H 'Content-Type: application/json'
curl 'http://localhost:8080/api/system/dept/tree'
curl -X POST 'http://localhost:8080/api/system/user/page' -H 'Content-Type: application/json'
```

### 13.5 回归检查
- 后端测试计数不变（111 tests）
- 已有 Controller（DictController/AuthController/AuthMeController）不受影响
- `mvn -q compile` 全模块编译通过

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| B2-1 | `UserController.java` 存在，含 UserFormRequest 内部类、create/update/delete/page/get 端点 | 文件存在且内容审查 |
| B2-2 | `RoleController.java` 存在，含 create/update/delete/page/get 端点 | 文件存在 |
| B2-3 | `DeptController.java` 存在，含 tree/get/create/update/delete 端点 | 文件存在 |
| B2-4 | `PostController.java` 存在，含 create/update/delete/page/get 端点 | 文件存在 |
| B2-5 | `V15__system_mgmt_menu.sql`（H2）存在，含 4 条 INSERT INTO sys_menu（id=11~14） | 文件存在且内容审查 |
| B2-6 | `V15__system_mgmt_menu.sql`（PostgreSQL）存在，内容与 H2 版本一致 | 文件存在 |
| B2-7 | `mvn -q compile` 退出码为 0 | 命令输出 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step B2

## 1. Step 编号和名称
B2 — 后端 REST Controllers + Flyway V15

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

## 7. 命令输出摘要
- 编译结果：PASSED / FAILED
- 退出码：0 / 非0

## 8. 与原方案的偏差
（如有）

## 9. 未完成内容
（如有）

## 10. 结论
PASSED / FAILED
```

## 16. 测试回执格式

本 Step 的测试即为 `mvn -q compile`，测试回执可与执行回执合并。

## 17. 明确禁止事项

- ❌ 不创建测试类（B3 负责）
- ❌ 不修改任何 Service 层文件
- ❌ 不修改任何实体类
- ❌ 不修改 DictController / AuthController / AuthMeController
- ❌ 不创建独立 DTO 文件（UserFormRequest 用内部静态类）
- ❌ 不修改 V1~V14 Flyway 脚本
- ❌ 不修改 pom.xml 或 application*.yml
- ❌ 不运行 mvn test（编译即可）
