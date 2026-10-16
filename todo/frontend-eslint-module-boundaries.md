# 前端 ESLint 模块边界配置同步

- 状态：**已处置（2026-10-16，0.1.6 发布列车 U016-B）**。
- 来源：Owner 2026-09-04 反馈；2026-10-16 收口。
- 位置：`Smart-WorkFlow-aPaaS-Web/eslint.config.js`。
- 处置经过：
  1. 模块清单已由治理提交 `341b9a5` 修正为对齐当前 `src/modules`（`system/form/workflow/notify/agent/iot/openapi/job/storage`），移除旧 `lowcode`；
  2. 清单恢复覆盖后暴露 15/13 文件、32 项 `import/no-restricted-paths` 既有跨模块违规（含本轮 AppFormDetail.vue）；
  3. 按发布方向 `product/0.1.6-release/passed/direction-release-016-unblock.md` §4（原 `ready/`，发布终态同步时归档），Executor 以现行工程约束允许的 `src/adapters/*` 接缝（先例 `adapters/iot-reservation.ts`）整改全部违规，未改 ESLint 配置、未放宽等级、未批量 disable、未删模块清单；
  4. 验证：合法接缝导入可用（lint 0 error）、违规跨模块导入仍被检出（探针实测）。
- 结果与证据：见 `product/0.1.6-release/receipts/release-016-02.md`（U016-B）与 `receipts/evidence/ci-fix/`。
