# P53 review-04 浏览器证据索引

## 采集环境

* 浏览器：Playwright Chromium，headless=false（用户可见、可交互会话），deviceScaleFactor=1
* 视口：1440×1024（桌面）；语言 zh-CN；时区 Asia/Shanghai
* 身份：admin / 系统管理员 / T0（devseed 固定身份）；登录页为匿名会话
* 前端：pnpm dev（http://localhost:5173）；后端：真实服务 8080（2026-09-16 21:52 启动）
* 验证码：后端真实位图，由执行角色读取图像后填写（答案不入证据目录）
* 采集脚本：../scripts/capture-audit.mjs（主采集）、../scripts/capture-supplement.mjs（设计器 tab/历史版本/分类/通知模板补采）
* page errors：0（两次采集 AUDIT_CAPTURE_OK / SUPPLEMENT_CAPTURE_OK）

## 正式 PNG（final/runtime/current-screenshots/，22 张）

| 文件 | 路由/状态 | 对应节点 |
|---|---|---|
| cur-06-login.png | /login（登录前） | 06 |
| cur-01-workspace.png | /workspace | 01 |
| cur-28-portal-menu.png | /workspace 用户菜单展开 | 28/30 |
| cur-02-my-instances.png | /workflow/my-instances | 02 |
| cur-04-admin-home.png | /form/form-def-list | 04 |
| cur-29-admin-menu.png | /form/form-def-list 用户菜单展开 | 29/32 |
| cur-05-portal.png | /portal | 05 |
| cur-21-catalog.png | /workflow/catalog | 21 |
| cur-22/23/24-catalog-category.png | 分类切换（真实分类与空态） | 22/23/24（24-26 布局承载） |
| cur-27-form-render.png | /form/form-render/p61r10_batch_form | 27 |
| cur-07-form-designer.png | /form/designer | 07 |
| cur-designer-processes.png | /form/designer 关联流程 tab | 08 |
| cur-designer-fields-dialog.png | 字段清单弹窗 | 11 |
| cur-designer-history-dialog.png | 真实定义设计器历史版本弹窗 | 14 |
| cur-09-process-designer.png | /workflow/defs/2100424929376403458/design | 09 |
| cur-12-approver-dialog.png | 节点-查看候选弹窗 | 12 |
| cur-13-notify-template.png | /notify/template（节点13 受限映射） | 13 |
| cur-03-taskdetail.png | /workflow/task/af63f9ac-b248-11f1-9b6a-00ffa7734675 | 03/20 |
| cur-19-graph-tab.png | 任务详情流程图 tab | 10/19 |
| cur-15-opinion-dialog.png | 审批详情列表-查看详情弹窗 | 15（16-18 组件复用） |

## 事实文件

* runtime/facts/*.json：每张 PNG 的 URL、视口、computed styles（颜色/圆角/边框/表头）、横向滚动检查
* runtime/facts-supplement/*.json：补采事实
* final/geometry-facts.json：顶栏/侧栏/底色成对测量
* final/color-fidelity.json：四向颜色勾稽 + AA 例外登记
* final/comparison-results.json + final/comparison-mask-index.json：区域像素差异与动态遮罩登记

## 行为锁定项说明

菜单可达、审批人候选/保存/校验、意见弹窗对象与焦点回返等行为事实由 review-03 锁定；本轮实现修改均为视觉层（CSS/布局/展示格式化），未触及行为代码与契约，故按提示 §6 仅重采视觉并做聚焦复核，不重放业务链。
