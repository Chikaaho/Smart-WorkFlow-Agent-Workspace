# 0.2.1 缺陷修复交接

## 1. 功能名称

0.2.1 缺陷修复列车。

## 2. 功能目标

本地逐项修复、Owner 逐项验收；Owner 宣布结束后同步状态、合并并发布 0.2.1。

## 3. 当前状态

`COMPLETED`（规划 2026-11-03 终态复核，`receipts/planning-final-review-021-completed.md`），0.2.1 已发布并部署 UAT。总 7 阶段：已完成 7，进行中 0，未开始 0。


## 4. 已完成内容

两仓 `fix/0.2.1-bugfix` 已建并推送；2026-11-03 Owner 宣布修复结束、台账 B021-001～029 冻结并全部通过（根仓 `eb5fffb9`）。第 3 阶段同步、两仓合并（Server `5c33eab3`、Web `07568b57`）、0.2.1 tag/Release 发布与 UAT 就地升级均已完成；回执 `close-sync-021-01.md`、`release-sync-021-01.md`。

## 5. 实际工程结果

29 项修复的提交与回执见 `product/0.2.1-bugfix/items.md` 备注和 `receipts/`。发布源：Server `5c33eab3`、Web `07568b57`；当前 main `32b2e1aa`/`edbe121`，develop 与 main 树一致。发布：Server CI `41608817497` success、`bootstrap-0.2.1.jar` 218,553,737 B、`build.version=0.2.1`；Web CI `41606814041` success、`sw-web-dist-0.2.1.zip` 6,165,915 B。UAT 部署：启动 176.986s、ERROR 0、health UP。

## 6. 验收规则

Owner 通过项全部锁定，第 3—6 阶段不重做业务或 UI 验收；只核对同步覆盖和发布事实。

## 7. 当前系统基线

0.2.1 已发布并部署 UAT（Web/Server 正式与部署版本 0.2.1，开发版本 Server `0.2.1-SNAPSHOT`、Web `0.2.1`）。不改变功能数 49、90 清单 46/22/22、ADV64/问题57、P 编号；验证基线新增 []；DB versioned 终点 `V0.2.0` + R__ 19 支。

## 8. 未完成内容

无本版业务剩余；终态传播已完成（`receipts/final-propagation-021-01.md`）。


## 9. 已知风险

保护 Web `vite.config.ts` 在途改动和用户既有服务；发布版本来源（pom revision、CI 断言、Web package）须与 0.2.1 一致，失配修真实配置；合并前核实发布配置与种子压缩要求。

## 10. 唯一下一动作

等待 Owner 安排下一目标。


## 11. 下一轮完成标准

已完成：knowledge 与各入口均为 `COMPLETED`、7/0/0；Server 文档 CI attempt 2 success，两仓 `releases/latest` 已恢复/保持 0.2.1。


## 12. 必须读取

`system.md`、`roles/executor.md`、`project.md`、收口方向与收口记录、`items.md`，以及两端工程宪法。

## 13. 常规决定

收口口径以执行会话落盘的冻结台账为准（Owner 规划会话复核确认 29 项全部通过）。
