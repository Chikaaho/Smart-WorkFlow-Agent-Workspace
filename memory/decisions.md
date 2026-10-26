# 近期有效决策摘要

> 2026-10-26：本轮0.2.0恢复位置见 memory/README.md；下文0.1.10状态与等待选题属于历史时点，不决定当前任务。

## P65高级JS面板补充（2026-10-21）

Owner要求表单高级JS面板用于数据处理和组件控制，并明确加载完成及提交前/后三类钩子。合并入既有P65，详情 `todo/p65-form-javascript-events-api.md`；提交钩子与校验/请求/保存成功的精确关系在立项时确定。待规划、待排期，版本与优先级待定，本次仅补充候选。

## 0.1.10 发布、收口与终态（2026-10-21）

规划终态复核通过，最终审查 `product/0.1.10-bugfix/receipts/planning-final-review-terminal-sync-0110-completed.md`；四份方向全部归档passed，当前COMPLETED 7/0/0，无活动交付。

Owner 确认版本 0.1.10 并宣布修复结束；修复批次不新增业务功能数。候选 22 Web/6 Server 提交经 develop、版本收敛、main CI 后发布；两仓 annotated tag/release 与 UAT 部署均完成。Server 首次 CI 暴露的 I5 SSO 测试夹具口令不一致已修复（`8a2aa56`），最终两仓 CI success。发布/部署/开发版本分列：正式与 UAT 0.1.10、开发 Server `0.1.10-SNAPSHOT`、Web `0.1.10`；DB versioned 终点 `V0.1.7`。BF0110-01—08 PASSED；Owner已明确将应用导入导出转需求池，待规划/待排期，详情 `todo/application-bundle-import-export.md`。规划终审后最终裁决传播已完成并回读，整体 COMPLETED 7/0/0，当前无活动交付，下一动作由 Owner 选择。

## Owner默认交付流程（2026-10-16）

后续固定：①新需求评估→②执行并从 develop 拉新分支→③验收与信息同步→④开发分支→develop→main（develop 内按发布要求压缩种子/版本收敛）→⑤发版，版本必须用户确认→⑥再次同步信息→⑦结束。只有 Owner 明确“不发版”，才在③结束；版本未给不等于不发版。已确认版本不重复询问。完整裁决：`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`。

## 已完成功能与历史基线

- 正式功能 49；清单 46/22/22=90；ADV64、问题57；不新增/不核销 P。P62 功能 COMPLETED、有限性能延期/OFF；P64/P63 COMPLETED。
- 0.1.6 应用中心与表单分类统一；0.1.7 Bug 修复列车；0.1.8 原生 MQTT 与用户态探测；0.1.9 首例灾备演练修复与验收；0.1.10 修复与组件化收口。
- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`；终态契约单一源 `.codex/governance/terminal-contract.json`。
- Planner 以 `memory/` 最小摘要恢复；冲突时按 knowledge 权威修正。
- P62/P63/P64 边界与 P60/I3—I6、P61、BAO 裁决保持；0.1.5 列车、0.1.3、0.1.0 为历史发布，不重复发布。
