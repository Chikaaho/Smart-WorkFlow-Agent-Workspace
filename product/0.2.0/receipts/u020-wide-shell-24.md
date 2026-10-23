# U020 宽桌面主导航与租户页对照

2026-10-24｜Executor｜XL｜聚焦差异已修正，A03/A04/A05 整体未通过

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。

设计节点 `458:12660` 的 1920×1080 租户页不显示侧栏折叠按钮，主导航首项紧接 236px 品牌区与 8px 间距。当前宽桌面仍有折叠按钮，既挤压主导航，也与设计不一致。窄桌面继续保留该入口用于侧栏可达性。

## 修改与检查

- `src/layouts/AppMainNav.vue`：仅在视口宽度不小于 1441px 时隐藏侧栏折叠按钮；1366 仍保留。
- 可见 IAB，`headless=false`，管理员/租户 0，后端 `1b1f5f7` 健康 `UP`。1920×1080/DPR1 下顶栏 1920×64、品牌 24/12/236×40、主导航首项 268/12/112×40、侧栏 236×1016、正文起点 x236、文档滚动面 1920×1080，无折叠按钮。
- 证据 `C:/Users/hjxch/.codex/evidence-020/e2e/tenant-header-24.json`、`screens/u020-tenant-1920-24-cdp.png`、Figma 原图 `screens/design-tenant-458-12660-24.png`。

最终门禁：`AppMainNav.spec.ts` 8 项通过；typecheck、lint（0 error/0 warning）、完整 1797 项通过/3 跳过、构建均 exit 0。原文位置 `web-focused-24.log`、`web-typecheck-24.log`、`web-lint-24.log`、`web-test-24.log`、`web-build-24.log`。

## 未通过边界

设计参考为 3 条租户记录，当前真实数据为 4 条，整表及分页位置不同；无排除区域诊断仅能用于定位，不是 A03 同态通过。全局顶栏 92.321%、侧栏 95.2097%、筛选条 97.8114%、页面标题 98.5855%，所有稳定区域仍未达到 99%，且真实业务数据不同。A03/A04/A05 整体保持未通过。

Web 提交 `34610e9121bfa9206ee87bc60f77dae3d97c97a0` 已普通推送至 `origin/codex/0.2.0-ui-tenant-form-flow`，远端同 SHA、0/0；只保留无关 `vite.config.ts` 在途修改。
