# F020 表单权限、默认列表与校验配置

2026-10-23｜Executor｜XL｜IN_PROGRESS

七阶段：需求评估已完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。本回执记录 F020 首批可用链路，A09/A10 尚需 Planner 验收，子表视觉与数据源授权细节继续实施。

## 实施结果

- 表单设计器新增「权限」工作区：主表和 TABLE 子字段分别配置 `view` / `edit` 主体，表单动作配置 `view/create/edit/delete/export/import/flowStart`。主体沿用 `role:编码`、`user:ID`、`dept:ID` 约定，空配置保持原授权。保存定义时保留权限对象，修复此前设计器保存会丢掉 `fieldPermissions` 的问题。
- 服务端在查询、新增、更新、删除、导入/导出入口读取同一动作权限；已配置动作在业务操作前拒绝未命中身份。子表编辑权按 `TABLE字段.子字段` 检查行载荷，查看权继续由查询投影剔除。配置无法读取时 fail closed。
- 设计器「权限」工作区增加管理员默认列表：列选择与排序、筛选字段、默认排序列与方向、开放操作；保存到既有 `sw_form_list_config`。个人显示偏好仍只作用于当前用户。
- 增加受控数据源管理入口：当前租户列表、创建、编辑、删除、启停、只读标志。密码仅提交到服务端加密配置，编辑留空保留原密码，响应不回显密文。服务端只接受已登记数据库类型和匹配驱动，拒绝 JDBC 地址内嵌 `user/password`。
- 文本与富文本增加最小长度、线性时间正则和自定义错误提示；Unicode 按码点计数。字段属性面板、子表盖层转换、definition 解析/保存均透传新键；客户端即时提示，服务端在创建、更新、正式提交和导入共用的字段校验器复核。无值时只由必填规则控制，草稿保存不提前触发正式必填。

## 工程验证

- Server F020 回归：`mvn -pl sw-biz/sw-biz-form/sw-biz-form-biz -am test`，exit 0，213 tests / 0 failures / 0 errors / 0 skipped；原文 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/form-f020-regression-02.log`。
- 约束与权限聚焦：`FormFieldValidatorConstraintsTest,FieldPermissionServiceTest` 9/0/0/0，原文 `form-constraints-03.log`。
- 数据源管理聚焦：`ExternalDatasourceControllerTest` 3/0/0/0，exit 0，原文 `datasource-controller-01.log`。覆盖列表、敏感 URL 拒绝、类型/驱动不匹配和加密保存调用路径。
- Web 四连：typecheck 0；lint 0 error（2 条既有 `require-default-prop` warning）；vitest 192 文件通过、1 跳过，1707 passed / 3 skipped；build 0（3.49s，既有 VueUse 纯注释与插件耗时提示）。原文 `web-f020-test-02.log`、`web-f020-build.log`。

## Git

- Server `dc7b9376b914e058a86794ddb5bca79c04e32016`，普通推送并回读任务分支同点。
- Web `bdef38bf94f57b91322e4d1138593bc20c76048b`，普通推送并回读任务分支同点。

## 尚待完成

- 数据源授权主体、查询契约列表/启停/预览和密钥轮换的可视化操作仍需补齐；当前首批提供连接注册与租户隔离管理。
- 子表字段清单的新稿弹窗几何与像素对照尚未完成；A03/A09/A10 不能因本批功能测试通过而判定通过。
- 下一动作继续 J020 表单加载、提交前、提交后事件和共用函数目录，再承接 W020 流程能力与 U020 完整视觉。
