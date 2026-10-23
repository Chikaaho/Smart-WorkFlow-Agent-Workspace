# J020 表单事件与共用函数实施记录

2026-10-23｜Executor｜XL｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。J020 是分支实施内的一批，不表示 A11/A12 已验收或整版完成。

## 已实施

- 表单定义新增 `events` 快照契约，包含 `onLoad`、`beforeSubmitHandler`、`afterSubmitHandler`；动作具备稳定 ID、名称、顺序、启用状态、脚本和可选执行前确认说明。旧定义无 `events` 时保持原义。
- 表单设计器新增「事件」工作区，复用共用脚本弹窗与函数目录；可增删、启停、排序和编辑动作，保存/发布前检查重复 ID 与脚本语法。
- 新建、编辑和发起流程执行加载/提交前后事件；加载事件在一次成功装载后执行一次；提交前事件在字段联动结清后、最终客户端校验前执行，返回 `false`、异常、超时或取消均保留输入并释放提交锁；仅业务提交确认成功后执行提交后动作。
- 草稿保存和草稿提交未接入提交事件；只读详情禁止事件写字段、子表、控件或集成副作用。
- 提交后动作按稳定提交标识记住已成功动作，失败横幅提供显式重试，只补未成功动作，不重发业务提交。
- 提交确认后字段编辑转只读，但受控集成副作用仍可按原提交标识重试；只读查看态仍关闭全部副作用。
- 事件执行复用受限解释器，无 `eval`/`new Function`；单动作预算 5 秒、单事件 15 秒、用户确认单独最长 60 秒，解释器步数预算为 2000。
- 函数目录与运行宿主覆盖主表字段读写、子表行列读写、必填/隐藏/只读、当前用户/部门、当前流程状态与授权变量、文本转换、消息和受控集成。集成函数对未授权标识、只读状态明确拒绝；没有租户、任务归属或任意网络能力。
- 服务端定义契约记录事件形状；保存和发布入口拒绝未知事件、重复/超长 ID、非法顺序、超过 50 个动作或超长脚本。发布快照继续原样冻结事件配置。

## 修改范围

- Web：`src/contracts/form-schema.ts`、`src/adapters/form-designer/index.ts`、`src/modules/form/designer/definition-convert.ts`、`workbench.ts`、`FormEventsPanel.vue`、`src/modules/form/utils/form-events.ts`、`src/modules/form/views/FormDesigner.vue`、`FormRender.vue`、函数目录与中英文案。
- Server：`FormDefinitionSchema.java`、`FormDefServiceImpl.java`、`FormDefinitionServiceTest.java`。

## 验证原文

目录：`C:/Users/hjxch/.codex/evidence-020/j020/`。

- Server Form 模块：`mvn -pl sw-biz/sw-biz-form/sw-biz-form-biz -am test`，exit 0，**215 tests / 0 failures / 0 errors / 0 skipped**，`server-form-tests.log`。
- Web typecheck exit 0；lint exit 0，保留 2 条既有 `require-default-prop` warning；Vitest **1712 passed / 3 skipped**，193 files passed / 1 skipped；build exit 0，日志 `web-typecheck.log`、`web-lint.log`、`web-test.log`、`web-build.log`、`web-gates.txt`。
- 事件运行专项 5/5：顺序与禁用、旧定义兼容、提交前 `false` 阻断、提交后按原标识只补失败动作、只读拒绝写入。
- 设计器与填写页受影响回归 28/28。

## 边界与下一动作

A11/A12 的产品行为、正式浏览器证据及跨端完整链尚待继续，不能由组件测试或本回执替代。当前实现只声明已在本地解释器、组件测试、服务端定义闸门与构建门禁中通过；“授权集成”只暴露宿主允许名单且本填写页未默认开放任何真实集成，需在后续受控链中取得服务端授权与真实调用证据。下一动作继续 W020 流程入口与办理，并在整版联调前补齐 J020 的真实浏览器行为证据。
