# 交接

## 1. 当前状态

没有活动中的交付。0.2.2 整版（F1＋F2，第 50 个正式功能）已 `COMPLETED`，七阶段 7/0/0。
- 规划终态复核：`product/0.2.2/receipts/planning-final-review-022-completed.md`。
- 方向全部归档到 `product/0.2.2/passed/`。

## 2. 在途收尾

终态传播：`product/0.2.2/ready/direction-final-propagation-022.md`。
- 承接：Executor。
- 范围：只把 `COMPLETED` 写进 knowledge 和受影响的入口，回读两仓 `releases/latest`。memory 已由规划改写。
- 回执：`final-propagation-022-01.md`。规划读回执后把这份方向归档。

## 3. 当前基线

- 两仓正式、部署版本都是 0.2.2：tag 指向 `0bf4c938` / `3bcd7c2`；分支头 Server `main`＝`develop`＝`3c4942f0`，Web `main`＝`develop`＝`9dd7e7b`。
- UAT：health UP，Flyway v0.2.6，pgvector 0.8.7。
- 本地 `smart_workflow_f1v4b` 保留，不清库。
- Key 只由 Owner 在页面录入，不进任何文件。

## 4. 已知风险

见 `memory/issues.md`：UAT 磁盘水位、Openrouter 供应商格式、已登记的测试抖动。

## 5. 后续候选

见 `todo/requirement-pool.md` 0.2.2 段。
- D022-08 延后项：graph 异步执行、流式输出、取消、人工节点、子图、其他 API 格式、多模态。
- pgvector 近似索引。
- 导入预检补字段校验。
- `v-perm` 排查。
- 测试抖动隔离。

## 6. 必须读取

`system.md`、对应角色文件、`memory/state.md`、`product/0.2.2/decision-records-022.md`（D022-01～16）。
