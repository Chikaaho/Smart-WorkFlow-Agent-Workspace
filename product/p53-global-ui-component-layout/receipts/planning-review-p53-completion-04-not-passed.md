# P53 功能级验收审查 04：未通过

> 审查角色：规划（Planner）  
> 日期：2026-09-17  
> 功能：p53-global-ui-component-layout  
> 审查对象：`receipt-p53-supplement-03.md`、`evidence/p53-review-03/`  
> 验收结论：**本次未通过**  
> 功能状态：`VERIFYING`  
> 后续唯一入口：`planning-execution-prompt-p53-global-ui-component-layout-03.md`

## 1. 裁决

二级提示要求的五个最终快照子项已经闭合并自本审查起锁定：

- 16 张正式 PNG 均属于可见 `headless=false` 会话；Planner 独立回算 16/16 SHA-256、尺寸均与清单一致，四角及中心抽样 alpha 最低值为 255。
- admin/portal 菜单展开态与 facts 一致；真实审批候选、回填、保存、校验链完整；真实意见弹窗字段、Escape 关闭及焦点回返完整。
- 四个桌面壳顶栏/品牌/导航/用户区完整，无透明 gutter 或横向滚动；四个 375 页面背景不透明、可读、无横向滚动，触控与对比度满足方向。
- before/after 源码清单均为 447 文件，树指纹同为 `c34cbdc77c6cb1be4c7a25959e05be2a51ee793da2e3656dfe1e6ac384276290`。
- 无 `--grep` 的全量视觉更新与随后验证均为 **71 passed / 17 skipped / 0 failed / exit 0**；上一轮 10 个失败已逐项映射为通过。

但 P53 仍不能判定 `PASSED`：审查03曾锁定的 lint 证据属于旧源码指纹 `64787885f7e832a22ab5406f2bb00707ea89ae50839b15cf1b6c862b23b04845`。本轮又修改了 `TaskDetail.vue`、`src/adapters/form-designer/setup.ts`、`families.spec.ts`、`smoke.spec.ts`，最终源码指纹变为 `c34c…`；`receipt-p53-supplement-03.md` 明确写明“不重跑 lint”，`p53-review-03` 目录也没有最终快照的 lint 原始日志与退出码。

按 `roles/planner.md` §7.1 的锁定项失效规则，源码变化且变化文件处于 lint 扫描范围时，旧 lint 结论失效。typecheck、Vitest、build 与视觉全绿不能替代 ESLint 的最终快照结果。方向标准17因此仍缺一个行为证据。

不得核销 P53、不得移动主方向、不得进入阶段三或恢复 P61。

## 2. 原子核销

| 原子 | 本轮裁决 | 证据 | 后续 |
|---|---|---|---|
| P53-EV-02a-F | **通过并锁定** | 两张最终菜单 PNG、facts、哈希 | 禁止重验，除非源码再次变化触及该路径 |
| P53-EV-02b-F | **通过并锁定** | 三张真实审批人链 PNG、GET/PUT/POST 200、facts | 同上 |
| P53-EV-02c-F | **通过并锁定** | 真实任务/实例、弹窗 PNG、字段与焦点事实 | 同上 |
| P53-EV-03a-F | **通过并锁定** | 四桌面壳及流程图 PNG、几何/alpha、全量视觉0失败 | 同上 |
| P53-EV-04a-F | **通过并锁定** | 四移动 PNG、alpha/对比度/hScroll/触控结果 | 同上 |
| P53-EV-01a-R1 | **未通过** | 最终指纹 `c34c…` 下无 lint 原始输出；旧 lint 属于 `6478…` 快照 | 仅补最终快照 lint 与前后指纹；有源码修复时按影响使锁定证据失效 |

`P53-EV-01a-R1` 是原 `P53-EV-01a` 在新源码快照上的失效重开子项，不新增产品需求。

## 3. 失败分类与升级

分类：**快照过期 + 缺门禁行为证据**。不是产品行为反证，也不是工具阻塞；`pnpm lint` 在上一轮已可执行。

二级提示 §6 已明确“源码变化后按影响执行 typecheck/lint/test/build”，本轮仍遗漏最终 lint，属于二级提示后的同类最终快照门禁问题。按 `roles/planner.md` §7.1 下发三级提示：

`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-03.md`

该提示替代提示02，成为唯一当前执行入口。下一轮只验收 `P53-EV-01a-R1`；五个 `-F` 原子及其他历史锁定项不得重新展开。若 lint 在当前 `c34c…` 快照直接通过，不需要重跑浏览器、视觉、Vitest、typecheck 或 build；只有实际修改源码时才按影响重新建立相应快照证据。
