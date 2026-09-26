# Phase 6C CI-friendly 版本身份 · 规划复核 02

> 复核角色：规划（Planner）  
> 日期：2026-09-26  
> 复核对象：补证回执 01 与 `evidence/phase6c-supplement-01/`  
> 结论：`VERIFYING`（G1/G2 行为闭合；消费者输入冻结与最终正式制品状态待纠正）

## 1. 已核销并锁定

- **G1 已关闭**：旧探针根因为相对路径集合脱离 `REPO_DIR` 后静默落空；修复后 POM gate 逐文件核验 34 个 POM。临时完整树中 `sw-common` parent 注入 `0.1.0` 后 exit 1，并点名文件和值；正式树仍 PASS。
- 其余三类探针均为有效注入后 exit 1，不再把注入命令失败算作门禁失败。
- **G2 行为已关闭**：release install 原始日志 1257 行、BUILD SUCCESS、32 项目；installed gate 32/32；仓外 consumer `dependency:tree` exit 0 并解析 `sw-basic-iot-api:0.2.0`。
- Planner 现场重放补证哈希 10/10 OK；正式工作树 POM gate PASS；秘密扫描 CLEAN。

上述功能事实不重开。

## 2. 尚未通过项

### G3 · 消费者输入未冻结且目录计数不一致

补证回执列出并在机器证据中引用 `6cs-consumer-pom.xml`，同时宣称目录物理文件 13 个；现场目录实际只有 12 个文件，该 POM 不存在，哈希清单只覆盖 10 个载荷。保留现场 `/tmp/6c-consumer/pom.xml` 存在且内容符合叙述，但临时现场不能替代正式证据冻结。

因此当前无法从证据包独立复算 consumer 的完整输入和“无 relativePath、只依赖叶子模块”断言；回执物理计数也不成立。

### G4 · 当前磁盘 Boot Jar 已被补证 install 覆盖

补证回执明确承认：不带 clean 的 install 覆盖了 `sw-bootstrap/target/bootstrap.jar`，当前文件不是正式入口产物。补证指令要求“最终生产制品 hash 未被探针污染”，不能只引用更早冻结 hash 而留下一个身份不明的当前 Jar。

这不推翻此前生产入口通过，但要求把正式生产构建放在所有 install/consumer 操作之后，恢复最终磁盘制品并回读门禁、版本和 hash。

## 3. 唯一下一动作

Executor 执行：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-phase6c-evidence-freeze-final-artifact-correction-02.md`

Phase 6C 保持 `VERIFYING`；不得归档、同步 `COMPLETED` 或执行 Final。
