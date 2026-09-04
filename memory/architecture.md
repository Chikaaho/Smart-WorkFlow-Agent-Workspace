# 架构摘要

> 截至/同步点：2026-09-04；权威来源：`knowledge/architecture.md`。

系统为后端 Java 21 / Spring Boot 3.4 模块化单体与前端 Vue 3 / TypeScript SPA；工作区根负责统一治理。后端子仓为 `Smart-WorkFlow-Server/`（remote `Chikaaho/Smart-WorkFlow-Server`），前端子仓为 `Smart-WorkFlow-Web/`，两者均为 executor sublayer。工程专属约束分别见两端 `docs/governance/engineering-constitution.md`。模块完成度粗粒度总览见 `knowledge/architecture.md` §5（2026-09-04 刷新：BPM/Agent/IoT 为已交付子能力描述，不将模块整体写完成）。