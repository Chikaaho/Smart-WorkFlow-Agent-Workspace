# K16: 标准1 真实后端生产菜单响应链运行证据（D199 审查 L1，提示7）

**执行日期**：2026-08-24  
**执行人**：执行层

## 1. 前置环境（真实后端）

- 后端启动：`SW_CIPHER_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY= MAVEN_OPTS="-Xmx2g" mvn -q spring-boot:run -pl sw-bootstrap -Dspring-boot.run.profiles=dev`
- 就绪：`POST /api/auth/login` → HTTP 200（12:05:03）
- 普通用户 tooluser 经真实 API 创建并绑定 V37 菜单：
  ```
  POST /api/system/user {"username":"tooluser","plainPassword":"user123","realName":"工具用户","deptId":1,"status":0,"roleIds":[2]} → code 0, id=2091859560838533122
  GET  /api/system/role/2/menus → [1..19,200..208]（无 212/213）
  PUT  /api/system/role/2/menus [...,212,213] → code 0（V37 不 seed sys_role_menu，普通角色由管理员配置）
  ```

## 2. 生产菜单响应（真实后端 GET /system/auth/menus）

**superadmin（admin 账号，超管旁路）**：
```json
{"id":"212","title":"工具管理","path":"tool","component":"agent/views/ToolList","permission":"agent:tool:view","menuType":1}
```
（挂在智能体目录 agent 下；菜单 path 为 `tool`，路由拼接为 `/agent/tool`）

**普通用户（tooluser，superAdmin=false，角色=admin + V37 菜单 212/213）**：
```json
{"id":"212","title":"工具管理","path":"tool","component":"agent/views/ToolList","permission":"agent:tool:view","menuType":1}
```
（`GET /system/auth/me` 确认 superAdmin=false、roles=["admin"]）

## 3. 真实链测试运行

命令：`NODE_OPTIONS="--max-old-space-size=2048" pnpm vitest run --config vitest.live.config.ts src/modules/agent/views/tool-production-menu-chain-live.spec.ts`

结果：**Test Files 1 passed / Tests 2 passed（0 failed 0 skipped）**

### superadmin 链输出
```
=== K1-live 身份1: superadmin 生产链 ===
身份: admin（真实后端，超管旁路）
生产菜单工具项: {"path":"tool","component":"agent/views/ToolList","permission":"agent:tool:view"}
router.push: /agent/tool → authGuard 放行 → ToolList 挂载
实际请求: GET /system/auth/me, GET /system/auth/menus, GET /agent/tool/internal
页面渲染: 含「工具管理」
```

### 普通用户链输出
```
=== K1-live 身份2: 普通用户（绑定V37菜单）生产链 ===
身份: tooluser（真实后端，superAdmin=false，角色=admin + 工具菜单 212/213）
生产菜单工具项: {"path":"tool","component":"agent/views/ToolList","permission":"agent:tool:view"}
router.push: /agent/tool → authGuard 放行 → ToolList 挂载
实际请求: GET /system/auth/me, GET /system/auth/menus, GET /agent/tool/internal
页面渲染: 含「工具管理」
```

## 4. 结论

- 生产菜单响应来自**真实后端**（非 Mock seed / dispatchMock / 手工构造）
- 有权普通用户（绑定 V37 菜单）与 superadmin 均从生产菜单响应进入页面：菜单含工具项 → router.push → 真实 authGuard 放行 → ToolList 挂载 → 列表请求真实成功 → 页面渲染
- 撤权与未认证后端拒绝已由标准8 锁定（`AgentToolConfigSecurityIntegrationTest`），本文件不重复
