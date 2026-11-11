# 当前状态摘要

2026-11-11｜Planner｜1.0.0 阶段 3 第一轮部分通过，返修 R1—R6+补证 B1—B9，见 planning-review-100-01。

## 当前任务

**1.0.0 阶段 3 证据两批已交**：`product/v1.0.0-release/receipts/execution-100-01.md` + `-01-batch2.md`；隔离环境（18093/5275/克隆库 34 行）保持运行供复核；缺口见 batch2 G 节。等 Planner 验收 → 阶段 4 合并 → 5 发版 → 6 部署同步。

## 历史任务（阶段 2，已完成）

**1.0.0 发布列车（阶段 2 完成）**：方向 `product/v1.0.0-release/ready/direction-v1.0.0.md`；回执第一批 `product/v1.0.0-release/receipts/execution-100-01.md`。

- **代码**：Server feature/1.0.0 `2baf48ad`（版本+V1.0.0 9 方言+F3/F1-4/F1/F4+惰性修复）、`14057da5`（README）、`f1bf5d8b`（功能清单）；Web feature/1.0.0 `e553753`；工作区 `1075df70`（version.json 1.0.0 IN_DEVELOPMENT/功能数 55、根 README、production-ops、指针）。
- **门禁**：Server 全量 2482 基线绿；功能轮唯一失败 `CommandQueueIntegrationTest.p0PrioritizedWhileNormalBacklogged` 为固有 flake（双侧对照实证）；Web 四连全绿（test 2054）。
- **阶段 3 待办**：隔离环境证据（方向 §4 清单：模板/导入 0 行落库/改密 403/无权限 403、三处打印+PDF/隐藏对照/历史版本、三类日志+租户对照+保留期有界验证、IoT 三处、flyway +1 行、多库容器冒烟）→ 回执续批 → Planner 验收 → 阶段 4—7。

## 基线

功能 55（预登记，含 P27/P33/P40）；Server 1.0.0-SNAPSHOT、Web 1.0.0；Flyway V1.0.0（31 条，未合并未部署）。Owner 定版本 1.0.0 不再询问；P69 已关闭。

## 教训

- 普通 `Filter` Bean 在 Servlet onRefresh 阶段实例化，早于 sqlSessionFactory；构造期依赖会把 mapper 初始化拖进 Tomcat 资源未就绪时段——过滤器一律 ObjectProvider 惰性解析。
- Python 单表达式 open('w') 写 + 同文件 read 的顺序陷阱会清空文件（本轮三文件损毁已从 HEAD 恢复重放）；改用先读后写分离。
- `.last(` 站点盘点测试、sys_menu 绝对计数 146、31 条迁移断言：新增迁移/SQL 必须同批改三类盘点断言。
