# P56 表单 24 列布局执行回执

## 执行结论

Executor 已完成 P56 方向内的前后端实现、自验与工程门禁，当前提交状态为 `EXECUTION_SUBMITTED`，功能状态保留为 `VERIFYING`，待 Planner 独立验收后再决定是否进入正式通过/完成状态。

## 需求范围

围绕 P56 方向实现统一的 24 列表单布局：字段持有 1—24 的整数列宽，按字段源顺序从左到右、从上到下自动紧凑换行；设计器、预览、实际填写页共享同一列宽归一与排布语义；保存接口拒绝非法列宽并保留合法布局元数据。

## 实际修改

### 前端 `Smart-WorkFlow-Web`

- 新增 `src/contracts/form-layout.ts`，集中定义 24 列、默认列宽、合法性判断与归一规则。
- 新增 `src/modules/form/utils/form-layout.ts`，提供字段最终列宽和确定性行打包纯函数。
- `FormSchema`、字段注册表、定义转换、防腐层接入 `colSpan`；缺少或异常值按字段类型归一，新增字段立即拥有合法列宽。
- `DesignerCanvas.vue` 改为 24 列 CSS Grid，保留 `VueDraggable` 源顺序排序、拖拽句柄、占位/选中反馈与动态跨列展示。
- `FieldConfigPanel.vue` 增加 1—24 列宽配置控件及自动紧凑排布提示。
- `PreviewModal.vue`、`FormRender.vue` 使用同一列宽工具，分别覆盖发布前预览和实际填写页。
- 更新保存接口注释，使其准确反映布局契约校验行为。

### 后端 `Smart-WorkFlow-Server`

- `FormDefServiceImpl.saveConfig` 在持久化前校验 definition 内的 `colSpan`，仅接受 1—24 的整数；缺省值兼容旧 definition。
- 发布解析路径及 TABLE 子字段递归路径复用布局校验，非法值返回 `DEFINITION_INVALID`，合法 definition 与 snapshot 原样保留。
- 为 `FormDefinitionServiceTest` 增加非法列宽拒绝、合法 1/12/24 保存发布及 snapshot 一致性测试。

## 实际验证命令

## 验证 ref

- Knowledge root：`develop-sw` @ `a0b5b70e330e19e499d575cb078aaf26266b96f0`；P56 方向与本回执位于该工作树未提交改动中。
- 前端：`develop` @ `8424d57d5a1fd60abb22554d970b527e064d4e7e`。
- 后端：`develop` @ `a231ef6e9cf3c4f068bc38bf5ef89a93e655e858`。
- 上述 ref 为执行时读取的基线；实现改动仍在工作树，未创建 commit。

### 前端

```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm test -- src/modules/form/utils/form-layout.spec.ts src/adapters/form-designer/index.spec.ts src/modules/form/designer/definition-convert.spec.ts src/modules/form/designer/field-config.spec.ts src/modules/form/designer/DesignerCanvas.spec.ts src/modules/form/designer/PreviewModal.spec.ts src/modules/form/views/FormRender.spec.ts
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
git diff --check
```

结果：聚焦回归 `115` 个测试文件通过、`1097` 个测试通过；全量测试 `115` 个测试文件通过、`1097` 个测试通过；typecheck、lint、build、diff check 均退出码 `0`。生产构建完成 `1831 modules transformed`；仅有第三方依赖注释提示，不影响构建退出状态。

### 后端

```bash
MAVEN_OPTS="-Xmx2g" mvn -q compile
MAVEN_OPTS="-Xmx2g" mvn -q test
MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-biz/sw-biz-form/sw-biz-form-biz -am -Dtest=FormDefinitionServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
git diff --check
```

结果：全量 compile、全量 test、表单模块 `FormDefinitionServiceTest` 聚焦回归均退出码 `0`；聚焦表单测试执行 `15` 项且无失败、无错误；diff check 通过。全量测试日志中的异常分支日志与 Mockito/JDK agent 提示均未形成测试失败。

## 交互页面证据

使用 `pnpm dev:mock` 启动本地页面后，通过应用内浏览器读取可见 DOM 与计算布局：

- `/form/designer/seed-def-001`：9 个字段均有合法列宽，旧 definition 缺省值归一为 `12/24`；设计器网格为 `repeat(24, minmax(0, 1fr))`、`grid-auto-flow: row`，两个 12 列字段同排，24 列字段独占整行。
- `/form/form-render/demo-form`：9 个字段按同一顺序呈现，12 列字段宽 `432px`、24 列字段宽 `864px`；富文本与子表格分别呈现内容驱动高度 `122px` 与 `87.367px`，无固定跨行高度。
- 设计器预览弹窗：9 个字段继续使用同一 `12/24` 列宽序列，12 列字段宽 `460px`、24 列字段宽 `920px`，顺序和换行与设计器/填写页一致。

mock 页面证据用于页面布局和渲染一致性；真实后端持久化由后端 H2 集成测试覆盖。跨行拖拽的实际验收仍应由 Planner 在目标环境按 P56 方向使用真实交互复核。

## 变更边界与状态

- 未修改 P52 既有业务目标、流程/权限语义或数据库 schema/Flyway。
- 未修改工作区既有 root 侧用户变更。
- 未提交 commit，未 push，等待 Planner 验收与后续治理动作。
- 本回执不宣称 Planner 的 `PASSED` 或阶段三 `COMPLETED`。
