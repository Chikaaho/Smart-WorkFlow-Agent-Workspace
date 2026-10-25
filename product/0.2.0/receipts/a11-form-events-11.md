# 0.2.0 统一执行·批次 10（A11 表单事件三事件真实链＋后处理失败重试）

2026-10-25｜Executor｜FORMAL_FLOW（真实后端 PG dev 环境，浏览器可见会话）；承接 Planner 后续办账本 J020-W020-JOINT / A11

## 环境与对象

- 环境：批次 08/09 同口径 PG dev（smart_workflow_dev@本地 Docker PostgreSQL，bootstrap-dev.jar@8080 含 d0b0186，前端 5175），四密钥按回执 07/09。
- 对象：表单 `a11_events_probe`（id `1fe2ed4e-2075-40c0-89d5-838402d4af25`，字段 name(TEXT 必填)/note(TEXT)），定义携带三事件（发布快照冻结）：
  - onLoad `ev_onload_1`：`设置字段值('note','onLoad-回填-'+获取当前用户姓名())`
  - beforeSubmitHandler `ev_before_1`：名称为空 → `提示消息(...)` + return false
  - afterSubmitHandler `ev_after_1`：`提示消息('afterSubmit-动作开始')` 后确定性失败（见 §脚本语法注记）
- API 建表单/发布 code 0（真实 PG 发布）。

## 三事件真实行为（浏览器可见会话，登录 t100admin）

1. **onLoad**：填写页打开即回填 note=`onLoad-回填-租户100管理员`（DOM input value 直读，含真实登录身份姓名）。
2. **beforeSubmitHandler**：空名称点提交 → ElMessage「名称必填：beforeSubmit 已阻止提交」，提交被拦截（后端零提交请求）。
3. **afterSubmitHandler（失败重试）**：填名称后提交 → 后端真实提交成功 `recordId=d2b87c65-a6b3-4616-a5d3-92fcaa1415c1`（submitter 9001，日志 `Form submit completed`）；post-submit 动作执行（「afterSubmit-动作开始」弹出）后失败 → 页面呈现「已提交，后续处理失败：变量未定义：throw」＋**「重试后续处理」按钮**；点击重试 → 动作以**同一稳定提交号**重跑（再次失败，确定性失败脚本），后端日志复核**全程仅 1 次 Form submit completed**——重试不重发业务提交。截图 `a11-events-retry-state-1920.png`。

## 脚本语法注记（如实记录）

- 预期失败脚本用裸 `throw new Error('模拟后处理失败')`；脚本沙箱将其判为「变量未定义：throw」（事件脚本为表达式/return 导向的受限 DSL，不支持裸 throw 语句——与流程脚本「须含 return」同族）。失败路径与重试语义不受影响：失败原因换为沙箱报错，行为链（提交成功→后处理失败→可重试→不重复提交）全部真实成立。
- 无权/版本负向与 A12—A16 归后续批次（本批不冒称 J020-W020-JOINT 整项完成）。

## 边界与剩余

- A11 三事件＋后处理失败重试真实链已闭合（沿用既有实现，本批零代码改动，纯真实行为证据）。
- 剩余账本：A12—A16、富文本、通知、节点高级、A03—A05 视觉。

## 服务收尾

- 后端（8080）与前端（5175）按监听进程树终止、端口回读不可达；PG/Redis 容器保持。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
