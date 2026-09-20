# P61 后当前状态过期引用审计（探索回传）

> 执行（只读，未改任何文件）｜2026-09-20｜委派 `search_task/post-p61-current-state-stale-reference-audit.md`｜覆盖 knowledge 当前入口、两仓 README/版本元数据/《功能清单》当前焦点、todo+memory 交叉核对、方向路径；未跑构建/测试/服务/浏览器，未读秘密/日志/业务代码。

## 1. 五问结论

1. knowledge 当前入口 P61 过期引用仅 1 处：`feature-reconciliation-index.md:209`（下一动作仍写 P61 探索，且引用不存在的 `search_task/v0.1.0-p61-…-current-seams.md`）。P61 自身记录（current-status、session-handoff、features/p61-*、index 编号行）均为确认态。
2. 两仓根 README「当前版本」段仍写 v0.0.1 上一发布、v0.0.2 即将发布，「当前可体验」段仍以 v0.0.2 为范围；版本元数据正确（Server pom 0.1.0、Web package.json 0.1.0）。
3. 保留历史见 §3。
4. knowledge 无 P61 提示 01—05/探索/旧失败验收作当前动作（零命中）；`todo/v0.1.0-oa-plan.md:3` 有 1 处。
5. 其他冲突：Server `功能清单.md:49` 当前焦点仍 `P60 IN_PROGRESS`、1361/1185、V92、入口指向已归档 i6 投影方向。

## 2. 待修清单（当前错误，均可一次机械修改关闭）

| ID | 文件:行 | 摘要 | 分类 | 正确值 | 最小范围 |
|---|---|---|---|---|---|
| E1 | index.md:209 | 下一动作=P61 探索；P60 终态方向指 ready/；探索文件名多 `v0.1.0-` | 当前错误 | 下一动作=P53 提示07；方向 passed/；文件名 `search_task/p61-user-facing-message-humanization-current-seams.md` | 该行括注一段 |
| E2 | features/v0.0.2-oa.md:3 | 阶段三方向 ready/ | 当前错误 | passed/ 并删"复核后移"括注（ready/ 现空） | 1 路径+1 括注 |
| E3 | features/v0.0.2-oa.md:8 | 待规划确认；回执待复核 | 当前错误 | 规划已确认（09-07）；回执经 `planning-final-review-terminal-sync-v0.0.2-oa-03-passed.md` 确认 | 该行 2 处 |
| E4 | features/v0.0.2-oa.md:35 | v0.0.2 尚未发布 | 当前错误 | 09-07 已发布（`20fffc1d…`/`0bf6e892…`） | 1 句 |
| E5 | features/v0.1.0-oa-completion.md:3 | 唯一执行入口 ready/ 主方向 | 当前错误 | 已归档 passed/；入口改"无（P60 已完成）"或下一动作 | 1 路径表述 |
| E6 | features/v0.1.0-oa-completion.md:13 | 方向位置首项 ready/ | 当前错误 | passed/ | 1 路径 |
| E7 | Web README:57 | 当前版本=v0.0.1/v0.0.2 即将发布 | 当前错误 | 0.1.0 已发布（package.json、tag 均 0.1.0） | 1 句 |
| E8 | Web README:18 | 当前可体验=v0.0.2 范围 | 当前错误 | 0.1.0（或标历史小节） | 1 版本号 |
| E9 | Server README:59 | 同 E7 | 当前错误 | 同 E7 | 1 句 |
| E10 | Server README:18 | 同 E8 | 当前错误 | 同 E8 | 1 版本号 |
| E11 | Server 功能清单.md:49 | P60 IN_PROGRESS；1361/1185；V92；入口 i6 投影 ready/ | 当前错误 | COMPLETED（规划已确认 09-15）、1362/0/0/0、1185+3、V93、主任务 P53 提示07 | 该行 3 值 |
| E12 | todo/v0.1.0-oa-plan.md:3 | 当前入口=P61 探索 | 当前错误 | 下一动作=P53 提示07 | 1 句〔交叉核对发现，非声明范围〕 |

（表内 `index.md`=`knowledge/feature-reconciliation-index.md`；`features/…`=`knowledge/features/…`；README 行号为两仓根 README）

## 3. 合法历史（不改）

- 历史事件列/阶段事件内旧值与旧路径：`current-status.md:21`；`features/v0.1.0-oa-completion.md:30/34/38/44/46/48`（含「P61 等待规划确认后启动」）。
- 功能自身锁定基线与发布时点：`features/v0.0.2-oa.md:12—14`；`session-handoff.md:42—45、57—58、67`；`current-status.md:18`；`index.md:161—166、182`。目录/注释类：`knowledge/history/**`、`功能清单.md:29—38` 与 36/38、`product/*/receipts/**`、`search_fallback/**`。

## 4. 需规划判断

- J1 `current-status.md:56` 上轮叙述内 P60 终态方向仍写 ready/（所在章节为当前入口，是否改 passed/ 由规划定）。J2 两仓 README「当前可体验」段（E8/E10 段落）改版本口径还是降为历史小节。

## 5. 计数、覆盖与边界

- 当前错误 **12**（knowledge **6**=E1—E6；双仓当前版本说明 **4**=E7—E10；Server 工程清单 1；todo 计划 1）｜合法历史 **9 类**。
- 已核对：`product/v0.1.0-oa-completion/ready/` 仅剩 ADV 清单与 i5 投影方向、`product/v0.0.2-oa/ready/` 为空、两仓版本元数据、`search_task/` 真实文件名。未覆盖：各仓 `docs/` 深层文档与历史回执逐条枚举；未读业务代码/日志/凭据。每项待修绑精确行与最小范围，无目录级模糊结论。

