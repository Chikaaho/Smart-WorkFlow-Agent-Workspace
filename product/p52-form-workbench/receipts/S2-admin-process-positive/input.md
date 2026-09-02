# S2 管理员流程正向对照 · 输入与环境

- 环境：真实后端 `sw-bootstrap`（dev/H2，context-path `/api`）；Flowable 部署真实执行。
- 主体：`admin`（superadmin，经真实登录链取 token）。
- 绑定表单：`p52_s1_form_1788317569554`（PUBLISHED V=2，满足发布门「formKey 表单已发布」）。
- 对象：
  - 流程 P：`POST /workflow/defs {name:"S2发布流程P", formKey}` 创建，取初始图（START→END，开箱合法）原样保存后发布。
  - 流程 Q：`POST /workflow/defs {name:"S2删除流程Q", formKey}` 创建，用于删除正向。
- 预期：admin 保存合法图成功、图校验 0 错误、发布 HTTP 200 且业务码 0（status=PUBLISHED）；持久化回查（bpmn-xml 可取、列表 status/version 一致）一致；Q 删除业务码 0，回查 2010 流程定义不存在、列表计数 2→1。
- limited 三项 403 与零副作用已由第三次复验锁定，不重跑。
