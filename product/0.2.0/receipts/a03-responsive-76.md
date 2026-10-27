# 0.2.0 批次76：1366/375 响应式检查与窄屏布局修复

2026-10-27｜Executor｜任务03（唯一入口）｜0.2.0 IN_PROGRESS（1/1/5）

## 检查范围与方法

- 视口：1366×768（桌面）与 375×812（移动承接）；页面：/login、/workspace、/workflow/catalog、/workspace/my-instances、/form/form-render/u020_rich_table_66?process=…。
- 指标：`document.documentElement.scrollWidth - innerWidth`（页面级横向溢出）、顶栏/侧栏可见性；保存 10 张截图，索引 `E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/responsive-check.json`。
- 结果：两个视口 5 页 overflowX 均为 0。

## 发现并修复的真实问题

1. **流程中心 375**：工具栏输入框固定 395px、不换行，输入与卡片被裁切；表格无横向滚动容器。
   - 修复：≤767 工具栏换行（标签独占一行、输入 100%、查询/重置均分剩余宽度），表格卡 `overflow-x:auto` 且表格 `min-width:720px` 保证列可读；复采确认输入/按钮/卡片完整。
2. **发起填写 375**：白卡宽度 `min(1440px, calc(100vw - 240px))` 在 375 下被压成 135px，表单不可用。
   - 修复：≤767 填写画布 padding 12、白卡 `width:100%`、底栏左右 12、底栏内部随视口满宽；复采确认白卡 351px、标题/字段/底栏完整。

## 验证

- Web 四门禁：typecheck 0；lint 0；test 226 文件通过/1 跳过、1,946 通过/3 跳过（首轮出现 8 条 vitest 工作线程 teardown 竞态 `EnvironmentTeardownError`，全部用例仍通过；单独 FormRender 32/32 通过，全量重跑 exit 0，确认基础设施竞态，非产品失败）；build ✓ 4.09s。
- 证据：`responsive-check.json`、`responsive-{login,workspace,catalog,instances,formfill}-{1366,375}.png`。

## 状态与下一动作

0.2.0 IN_PROGRESS（1/1/5）。已完成：32:2 登录背景（97.98%）、6:2 流程定义深色紧凑版式（85.346%）、1366/375 检查与窄屏修复。仍剩余：4:2/3:2 固定项复查、25 族其余画框承接。A17 依赖整版验收。跟踪交付仍有可执行项，本批不提交完成终态。
