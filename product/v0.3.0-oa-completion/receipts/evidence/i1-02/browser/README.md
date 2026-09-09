# 浏览器真实操作证据索引（G1/G2）

> 运行环境：vite dev(:5173, VITE_PROXY_TARGET=http://localhost:18080) → 后端 dev(:18080, H2 file + Redis)。
> 全部页面经真实浏览器登录（RSA 挑战协议 + 图形验证码人工识别）操作，截图为原始未修饰产物。

| 文件 | 场景 | 证据点 |
|---|---|---|
| 01-login-captcha.png | admin 真实登录页 | 挑战验证码渲染、账号密码表单 |
| 02-admin-user-list.png | admin→用户管理 | 真实数据 10 条（I1 证据用户在列）、新建/编辑/删除按钮（v-perm 授权可见） |
| 03-admin-dept-list.png | admin→部门管理 | 部门树 + 负责人列（I1 新增）、新建子部门/编辑/删除 |
| 04-admin-post-list.png | admin→岗位管理 | 岗位列表与操作列 |
| 05-admin-role-list.png | admin→角色管理 | 角色列表；superadmin 行编辑/删除禁用（内置护栏前端呈现） |
| 06-admin-role-members.png | admin→角色成员对话框（I1 新增） | 「成员」按钮打开对话框：搜索添加/移除成员 |
| 07-plain-user-workspace.png | i1_plain（普通无权用户）登录 | 菜单栏为空、无「进入后台」按钮、身份显示"普通无权用户" |
| 08-plain-user-deeplink-denied.png | i1_plain 深链 /user | 未授权路由未注册 → 404 页面不可达（深链拦截） |

对应 HTTP 层身份矩阵（403/401、跨租户）见 `g2-identity-matrix.txt`。
