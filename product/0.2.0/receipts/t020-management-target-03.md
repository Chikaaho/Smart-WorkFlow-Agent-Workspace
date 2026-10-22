# T020 用户与部门的目标租户、归属和关联约束

2026-10-23｜Executor｜XL｜IN_PROGRESS

七阶段保持：需求评估完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。本回执记录 DR03 用户、部门的实施与自验，不代表 T020 或整版验收完成。

## 实施行为

系统超管在全部租户视图新增用户或部门时，先选择可用目标租户；应用单租户筛选后新增继承该目标。普通管理员从当前身份取得本租户。表单只读显示归属；编辑始终读取对象原归属，筛选草稿不会改变对象归属。选择器支持搜索、请求失败重试及陈旧响应丢弃；取消不会回退到租户 0。操作期间不改写登录身份。

用户、部门列表支持超管归属筛选并显示租户名称；全租户部门树按租户分组，分组节点没有对象写操作，总数取真实部门数量。用户提交合并为一个原子接口，用户、部门、角色、岗位和任职部门都按同一目标校验；Long ID 始终保留字符串。父部门和负责人只加载所属租户候选。部门根节点明确显示“无上级部门”。1366×768 下表单内容可滚动，保存和取消固定在窗口底部。

服务端区分操作者和目标租户。超管创建缺少目标、修改既有对象归属、关联其他租户部门/角色/岗位/负责人均拒绝；普通身份不能指定或查询其他租户。目标不存在、停用、过期时拒绝对象写入。系统保留超管账号按租户 0 与 superadmin 角色关系识别，列表仅提供查看，服务端拒绝编辑、删除及清空角色，不能靠账号名称规避。

## 工程验证

使用正式 Flyway、真实租户拦截器、Mapper 和事务代理的 H2/隔离 PostgreSQL 用例由 10 扩充至 14：新增用户/部门目标、同名账号跨租户、对象不可迁移、角色/岗位归属、错误关联零半成品、操作者审计身份不变、普通租户继承及拒绝、目标可用性及超管账号保护。最终 `management-reserved-account` 中 14/0/0/0，101.8 秒；同次安全相关用例 23/0/0/0，Maven exit 0。

系统模块完整回归 `management-tenant-system-final`：common 36、security 17、system 376，均零失败、零错误、零跳过，BUILD SUCCESS。此前 controller mock 与组织集成 fixture 的适配错误已保留原文并修正；没有更改拒绝条件来通过测试。

原文在 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/management-tenant-*.log`、`management-reserved-account.log` 及对应结果文件；Web 原文在 `C:/Users/hjxch/.codex/evidence-020/tenant-target/`。前后端重任务串行，MAVEN_OPTS=-Xmx2g、NODE_OPTIONS=--max-old-space-size=2048。

最终 Web 四连（窗口修正后）：typecheck 0；lint 0 error、2 条既有 warning；190 文件通过、1 跳过，1703 passed / 3 skipped，137.55 秒；build 0、3.32 秒。`checks-result.txt` 与四份同名原文可回读，修正前版本另存 `before-visible-footer-*`；目标六文件 55 个用例通过。

## 真实可见业务链

证据层级 FORMAL_BROWSER，headless=false，可见 IAB、正式 Web dist、正常 RSA 登录、真实 Java 服务、隔离 H2 和任务自有 Redis。测试验证码来自既有 dev fixture，未开启调试认证；证据不承担生产部署证明。原始图像、日志仅本机留存，不入 Git。

`tenant-target/real-browser-01/`，URL `http://127.0.0.1:61686`。通过正常认证接口准备两个租户后，超管在真实页面选择 DR03甲，创建 `dr03_member_a`（甲成员），绑定甲租户根部门、管理员角色及岗位；一次提交成功。应用甲筛选后仅显示甲租户两个用户，新增直接继承甲。全部部门按租户分组；选择甲后创建 `甲业务部`，父部门和负责人候选只来自甲。将筛选草稿改为乙、未查询时编辑甲业务部，表单仍只读显示甲，原负责人保持甲成员。查询乙后仅显示乙根部门。超管标识和当前身份一直为租户 0。

正常退出后以甲租户编码登录普通 admin：用户仅甲租户两个，部门仅根部门及甲业务部，没有全局租户选择器；新增部门直接继承甲。超管保留账号查看打开只读详情。

甲：ID `2113295382757838849`，code `t8c96eaf707`；乙：ID `2113295384326508545`，code `t8d1f0e09e0`。其余对象 ID 与请求对应关系见 `objects.json`、`http-index.jsonl`。1920×1080 和 1366×768 图像使用浏览器原生 viewport，文件包括 `root-user-readonly-1920.png`、`user-target-required-1920.png`、`user-explicit-target-1920.png`、`user-filter-own-target-1366.png`、`user-inherits-filter-1366.png`、`dept-grouped-tenants-1920.png`、`dept-explicit-target-1920.png`、`dept-edit-immutable-owner-1366.png`、`dept-filter-b-1366.png` 和三个 `ordinary-a-*.png`。

首次图像暴露了小屏底部按钮需滚动、根父部门显示 0、部门总数取分组数等问题，随后修正。01 保留为业务链及问题发现证据，最新窗口布局另行补验。

最终构建补验 `real-browser-02/`，URL `http://127.0.0.1:51584`，正常 RSA 超管登录；新夹具甲 `2113301324849278977`、乙 `2113301326321479681`。原生 1366×768 图像已肉眼核对：`user-footer-visible-1366.png` 显示完整用户窗口及底部取消/保存；`user-role-target-hint-1366.png` 只列目标角色，说明为“所属租户”；`dept-count-21-1366.png` 显示真实 21 个部门；`dept-footer-and-root-1366.png` 显示“无上级部门”及底部操作；`dept-leader-single-label-1366.png` 负责人候选为单次 admin。补验未提交新的用户/部门对象。两次自有 Java/Redis 栈均通过控制端点关闭，父进程 exit 0；不操作用户 Redis 服务。

同栈 `http-audit-result.json` 用正常 RSA 登录超管和两个普通管理员，结果 passed：缺少目标、错误部门/角色/岗位/任职部门、错误父部门/负责人、既有对象改租户、修改保留超管账号均拒绝；失败用户数量为 0，既有角色及归属保持。甲乙各自查询仅本租户数据，指定对方租户及全局租户接口均拒绝，当前身份不变。断言首次将 Jackson 字符串 total 与整数比较失败，原文留在 `http-audit-before-count-normalization-*`；修正验证脚本的数值比较后重跑通过。没有将验证脚本类型错误记成产品回滚缺陷。业务拒绝有 HTTP 200/业务码 400 与权限 HTTP 拒绝，按索引逐项记录，不统称 HTTP 403。

## 尚待完成

同一真实栈取得 A08 红基线：普通甲登录并预热缓存后，超管停用甲，原 accessToken 的新 `GET /auth/me` 仍返回 code 0。脚本 finally 已恢复甲租户；原文 `http-cache-red-result.json`，结论 `expected-gap-reproduced`。这是真实缓存准入缺口，后续必须修复并取得相同路径绿证据。

角色、岗位等其他已有跨租户管理页的目标语义，缓存会话及后台认领准入、启停审计仍待继续。A03 整体未通过，T020、F020/J020/W020、U020 其余覆盖与后续验收发布阶段继续实施；功能数、P 核销与正式验证基线不变。

## 提交与范围

Server `e2b3911aeb178e705a10e3c2cf4b458c429fc047`，16 文件、551 insertions / 65 deletions；Web `dd2931645f99b6f69a0907a13c8174d387d595ba`，23 文件、1125 insertions / 128 deletions，均普通推送既有任务分支。Server 修改用户/部门 controller、实体、查询和服务，增加 ManagementTenantContext 与其 controller，岗位查询补目标过滤，数据库与相关 controller/组织 fixture 同步。Web 修改用户/部门视图、API/类型、隔离 Mock、双语文案、操作手册和测试，增加共享选择器/对话框/composable。提交 Hook 的 eslint/prettier 已执行，工作树回读干净。后续缓存准入修改属于下一实施内容，未计入上述提交。
