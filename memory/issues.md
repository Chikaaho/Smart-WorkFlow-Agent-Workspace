# 当前未关闭事项

2026-11-08｜Executor（执行提示04）。

无阻塞项。观察项：

- **UAT 磁盘**：根分区约 96%（剩余 923M），已清理 0.2.x 旧 jar 备份与上传副本；reasonix 会话仍增长，发布前先复核水位。
- **UAT 供应商（Owner 侧）**：Embedding 需 OpenAI 格式 `https://openrouter.ai/api/v1` + `openai/text-embedding-3-small`，模型页挂 Chat 与 Embedding。
- **CI 抖动（重跑通过）**：`P62CompatRollbackPgTest`、I6G1a/b/c、`AgentToolConfigServiceImplTest`、`CommandOverlapRealEngineTest`（Flowable 乐观锁）。
- **应用包缺口**：导出 `opinionForms` 为空，触发器/Agent 图/IoT 规则不随包；导入新环境需补建 17 张意见表单与 2 条触发器（`todo/application-bundle-import-export.md`）；角色成员按 assets/README 预置。
- **0.3.3—0.3.5 教训**：0.3.3 漏备注型裸文本与 ISO 时间（0.3.4 修），0.3.4 表格最小宽度 1438px 溢出 1440 视口（0.3.5 修）——UAT 截图须同时测 scrollWidth/clientWidth。
- **UAT 重跑顺序**：A 高影响路径引擎顺序 负责人→技术委员会→分管副总→参与部门并行→总公司→现场指挥；按回执叙事顺序会错挂意见表单（`YJ-20261108-007` 已 discard）。
- **候选**：指令参数 JSON 键名无中文名字典；详情抽屉头部仍为 ISO 时间。
- **残留**：`smart_workflow_030` 旧实例 RUNNING（保留不删）；0.3.1/0.3.2 旧实例均终态，未删数据。

持续保护：不覆盖 Web `vite.config.ts` 在途改动；不清库（含 `smart_workflow_f1v4b`）；不读取或传播秘密；不动 Owner 的 reasonix、frp、ngrok。
