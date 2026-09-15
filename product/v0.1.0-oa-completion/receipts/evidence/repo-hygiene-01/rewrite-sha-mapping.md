# 未推送历史重写：旧→新提交映射（2026-09-15）

背景：`product/v0.1.0-oa-completion/receipts/evidence/i4-02/server-dev.log`（626.9MB）超过 GitHub 单文件限制，推送被 pre-receive hook 拒绝。
处理：仅对未推送范围（`origin/develop-sw..develop-sw`）执行 `git filter-branch --index-filter` 移除该路径；远端历史未被改写、未强推；重写后顺序推送成功（`69c3197..d033506`，23 个提交）。
影响：重写前的本地 SHA 不再存在；引用它们的回执/证据属历史记录，按终态同步方向 §3「历史回执与原始测试证据不回写」保留原文。

| # | 旧 SHA（重写前） | 新 SHA（当前） | 提交主题 | 主题一致 |
|---|---|---|---|---|
| 1 | 84110ca | d9424d6 | chore(oa): I5 规划确认终态投影——切换唯一入口至 I6 正式方向并提交回执 01 | 是 |
| 2 | 4596114 | 3f66cfd | chore(i6): 提交 I6 实现回执 01 与状态同步（Server c1a71c0 / Web 026c279） | 是 |
| 3 | bc77583 | df1e2da | chore(i6): 提交补证回执 02（G1—G4/G6—G9 行为证据与门禁计数） | 是 |
| 4 | 0430178 | 42084f7 | chore(i6): 修复当前基线行与 memory 口径（补证回执 02） | 是 |
| 5 | 3c66aa7 | 3ad3785 | chore(i6): 提交补充提示轮回执 03 与候选 manifest（G8a） | 是 |
| 6 | c3cdc55 | b39e981 | chore(i6): 落盘 i6-04 对象总账本与 G1c-E/G2e-V/G2f-R/G2g-C 原始流附件；登记二级提示02边界 | 是 |
| 7 | 89fc77b | 2483409 | chore(i6): 记录 G4a/G2g-P 真实工具可用性失败（Docker daemon 未运行、PG 未安装、Redis 服务拒绝访问） | 是 |
| 8 | 4c8c821 | 3ec0b19 | chore(i6): 补记 G1a 载体探索路径（EmbeddedPostgres 全量 boot 复用路线） | 是 |
| 9 | fa4bddf | 6da8fe0 | chore(i6): 二级提示02原子证据落盘——G1a/G2g/G3d/G3e-I/G3f/G4/G6/G7b/G9b/G5b/G2f-J 独立原始流与账本更新 | 是 |
| 10 | 946a3b9 | aa5a5e6 | chore(i6): 二级提示02收口代码候选——Server e941d74 / Web 0a746e3（gitlink 推进） | 是 |
| 11 | d151bb0 | 25a6741 | chore(i6): g8a 0.1.0 候选 manifest（server e941d74 / web 0a746e3，门禁后生成） | 是 |
| 12 | 8a00749 | d955205 | chore(i6): 对象账本终版（G8a 时点三仓指纹与变更登记汇总） | 是 |
| 13 | e7fece8 | 63d092c | docs(i6): 实现回执 04——二级提示02原子收口（除 G5b 外全部 DONE，候选 manifest 已生成） | 是 |
| 14 | 4af109d | 3e1f373 | docs(i6): 补齐收口证据与 V92 版本投影 | 是 |
| 15 | 90aa461 | 720953a | docs(i6): 重生成 V92 候选清单 | 是 |
| 16 | bfb58bd | 8326d5d | docs(i6): 固化终态校验证据 | 是 |
| 17 | 9929dba | b3fbfdd | docs(i6): 固定最终 V92 候选指纹 | 是 |
| 18 | bb2f47f | c147c21 | docs(i6): 固定干净 V92 候选指纹 | 是 |
| 19 | 8e87899 | 933311f | chore(governance): 收紧连续执行与可见浏览器证据门禁 | 是 |
| 20 | 6f33e35 | ae00dba | docs(p60): 0.1.0 发布与整体终态同步——knowledge/memory/todo 终态值收敛 | 是 |
| 21 | 2931fce | 86c0875 | docs(p60): 补交 0.1.0 发布与 P60 整体终态同步回执、方向归档与全量证据 | 是 |
| 22 | e3a5d21 | bd56c4a | docs(search): P60 合并就绪性探索回传与 P61 现状探索任务登记 | 是 |

主题逐条校验：一致 22/22；新列表共 23 条（第 23 条为重写后新增）

| 附 | - | d033506 | chore(repo): 大体积运行日志移出版本库并加入忽略规则 | - |

当前 develop-sw：local = remote = d033506（d0335069edca887a18173514e195e0c841ac6c96）
