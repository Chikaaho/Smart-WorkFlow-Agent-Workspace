# P56 表单 24 列布局测试回执

## 测试范围

验证列宽契约、确定性排布、设计器配置与换行、发布前预览、实际填写页、definition 持久化以及非法值拒绝。

## 纯函数与组件测试

- `form-layout.spec.ts`：只接受 1—24 整数；缺省/异常值归一；验证 `12+12`、`24`、`1+23`、`13` 的确定性行打包。
- adapter 测试：合法、缺省、非法 `colSpan` 均归一到可用 `FormSchema`。
- definition-convert 测试：设计器导出始终携带合法列宽，TABLE 默认 24，其余普通字段默认 12。
- FieldConfig/DesignerCanvas/PreviewModal 测试：列宽补丁、画布样式、预览字段级网格和宽度序列均通过。

命令结果：前端全量 `pnpm test` 为 `115` 个测试文件通过、`1097` 个测试通过；typecheck、lint、build 均通过。

## 后端行为测试

`FormDefinitionServiceTest` 聚焦执行 `15` 项：

- `colSpan=25` 在保存入口被 `DEFINITION_INVALID` 拒绝，原 config 仍为 `{}`，没有脏布局写入。
- `colSpan=1/12/24` 保存成功，发布建立动态表，definition 回读与 form snapshot 保持原始 JSON。

全量后端 `mvn compile` 和 `mvn test` 均退出码 `0`。

## 页面行为证据

mock 页面启动命令：

```bash
NODE_OPTIONS="--max-old-space-size=2048" VITE_USE_MOCK=true pnpm dev:mock --host 127.0.0.1
```

观测结果：

| 页面 | 结果 |
|---|---|
| `/form/designer/seed-def-001` | 9 字段进入 24 列画布；12 列双列排列，24 列独占整行；旧字段缺失布局元数据时得到合法默认值 |
| `/form/form-render/demo-form` | 实际填写页与设计器采用同一 `12/24` 序列；左右列宽各 `432px`，整行字段 `864px` |
| 设计器预览弹窗 | 9 字段保持同一顺序与 `12/24` 列宽序列；整行字段宽 `920px` |

页面读取同时确认网格使用 `repeat(24, minmax(0, 1fr))` 和 `grid-auto-flow: row`，高度由字段内容自然撑开。

## 验收边界

本回执证明实现与自验结果，不替代 Planner 验收。真实后端运行环境中的保存/重开、跨行拖拽、发布前后预览及权限回归仍需按 P56 方向的完整行为证据独立确认。
