# 前端 ESLint 模块边界配置同步

- 状态：待排期，抽空修复。
- 来源：Owner 2026-09-04反馈；当前仅登记，未独立读取工程配置验证。
- 位置：`Smart-WorkFlow-Web/eslint.config.js`。
- 问题：实际模块目录已有`form`、`workflow`、`job`、`storage`等，模块边界列表仍为`['system', 'lowcode', 'workflow', 'notify', 'agent', 'iot', 'openapi']`；需核实旧`lowcode`与现有`form`的对应关系，以及`job`、`storage`和其他模块是否漏配。
- 风险：部分模块可能未被预期的跨模块依赖规则覆盖，具体影响待核实。
- 后续处理：由管理员核对完整模块目录与规则语义，更新工程配置；用合法导入通过、违规跨模块导入被拦截的实际结果验证。
- 本次仅登记待办，不启动修复，不改变业务功能数或90项功能清单状态。
