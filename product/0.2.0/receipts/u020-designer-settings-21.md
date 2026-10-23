# U020 表单设计器主页签与设置导航

2026-10-24｜Executor｜XL｜实现与自验完成，A03/A04/A05 整体未通过

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。

本轮承接设计器 07 画框及 15 号设计页签来源。主工作区恢复为「字段清单 / 表单设计 / 流程设计」三个居中页签；权限和事件收进工具条右侧「设置」菜单，保留原工作区内容、`tab=permissions/events` 深链及未保存离开保护。权限或事件激活时，设置入口显示当前工作区名称并带 `aria-current=page`，避免用户失去当前位置。

## 实际修改

- `src/modules/form/views/FormDesigner.vue`：移除主页签中的权限、事件按钮，新增设置下拉；菜单命令继续经过 `onTabChange`，因此权限、事件与三个主工作区共享同一未保存保护。
- `src/modules/form/views/FormDesigner.spec.ts`：更新主页签断言，增加设置菜单切换、URL 同步、当前态和取消未保存保护回归。

## 工程检查

聚焦 `FormDesigner.spec.ts` 通过 13 项，`web-focused-21.log` exit 0；typecheck exit 0（20.55 秒），`web-typecheck-21.log`；lint exit 0、无告警，`web-lint-21.log`。完整测试 204 个文件通过、1 个跳过，1796 项通过、3 项跳过；生产构建 exit 0（3.55 秒 vite 阶段）。原始输出见 `web-test-21-02.log`、`web-build-21-02.log`，证据根为 `C:/Users/hjxch/.codex/evidence-020/e2e/`。

首轮自动门禁在宿主卡死后中断，未把未完成的 `web-gates-21.json` 写成通过；随后分别补跑 lint、完整测试与构建，以上结果均来自补跑。保留无关的 `vite.config.ts` 工作树修改，未纳入本批提交。

## 可见复验

正常测试身份 `w020_e2e_1`、租户 0，IAB 可见会话 `headless=false`。对象为 `72514bbc-4998-414a-b3ef-55a32605019e`，后端 `1b1f5f7`，健康 `/api/actuator/health` 为 `UP`。

显式视口能力设置使页面为 1920×1080 CSS 像素、DPR 1、zoom 1，不是缩放的宿主窗口截图。主页签组为 x=780、y=64、360×48，中心 x=960；工具条操作区 x=1536、y=72、368×32；文档 `scrollWidth=1920`。点击设置后菜单显示权限、事件；权限实际显示字段/动作权限与默认列表，URL 变为 `?tab=permissions`；事件实际显示三个提交阶段，URL 变为 `?tab=events`。证据 `screens/u020-designer-settings-events-21.png` 与 `designer-settings-21.json`。

1366×768 响应式复验：视口 1366×768、DPR 1，页签组 x=249.21875、720.78125×48；操作区 x=982、368×32，右缘 1350 小于 1366；设置按钮 64×32，文档 `scrollWidth=1366`，没有横向溢出。证据 `screens/u020-designer-settings-events-1366-21.png`。

## 提交与边界

Web 提交 `74fb365703c71103b9cd2cb49987e12228a42079` 已普通推送至 `origin/codex/0.2.0-ui-tenant-form-flow`，远端同 SHA、领先/落后 0/0。本回执不声明 A03 已完成真同态像素，也不声明 A04/A05 整体通过；完整设计画框、富文本实现、文案覆盖及后续验收、合并、发布仍按唯一下一动作继续。
