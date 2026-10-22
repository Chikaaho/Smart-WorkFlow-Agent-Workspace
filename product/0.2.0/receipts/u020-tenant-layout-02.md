# U020 租户列表与弹窗布局实施记录

2026-10-22｜Executor｜XL｜IN_PROGRESS

## 进度与范围

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本记录承接 `u020-shell-01.md` 的 UI 优先动作，记录列表布局、弹窗与验收台的实现和实际差异。A03 尚未通过，租户页面与 U020 均未完成。

根仓原工作树 `E:/code/Smart-WorkFlow-Agent-Workspace` 在 `develop-sw`，有 0.1.10 收尾文档的在途修改；切换被 Git 拒绝后，在 `C:/Users/hjxch/.codex/worktrees/020-continuation/Smart-WorkFlow-Agent-Workspace` 续接 `codex/0.2.0-delivery`，原修改完整保留。前后端工作树原本干净，fetch 后切到各自已有 0.2.0 跟踪分支。Server HEAD 保持 `9b667b0`，本批没有后端实现改动。

## 实现与 Git

Web 分支 `codex/0.2.0-ui-tenant-form-flow`：`a94cae9` → **`ca674de54dc2884d3394883df2dd3a73a55c6b69`**；已普通推送至 `origin`，远端精确分支 SHA 回读一致，领先/落后 `0/0`，工作树干净。

18 个文件的变更摘要：

| 路径（Web 仓库内） | 变更 |
| --- | --- |
| `src/components/page-layout/StandardListTemplate.vue` | 增加 `appearance="design"`：筛选→标题→按内容收高的表格；分页进入卡片 |
| `src/components/page-layout/ListPagination.vue` | 新稿模式：左侧总数，右侧上一页/页码/下一页/页容量/跳页 |
| `src/components/page-layout/ListTable.vue` | 表头背景增加可继承的语义变量 |
| `src/components/DetailDialog.vue` | 共用弹窗增加居中的新稿模式，继续复用错误与关闭通道 |
| `src/modules/system/views/TenantList.vue` | 采用共用新稿模式；列宽、明文状态、筛选尺寸及新增/编辑字段与操作区布局；新增按钮简化为「新增」 |
| `src/layouts/BasicLayout.vue` | 管理端侧栏使用 236px border-box 度量，消除多出的 1px |
| `src/layouts/components/AppSidebar.vue` | 从同一菜单树派生分区标题；浅色管理端条目 204×40，居中并显示浅紫激活态 |
| `src/layouts/menu-title.ts` | 租户菜单标题接入既有本地化映射 |
| `src/styles/tokens.css` | 设计行高/表头高度变量，字体优先 Noto Sans SC |
| `src/foundation/mock/tenant-handlers.ts`、`handlers.ts`、`seeds.ts` | 补齐临时租户 UI 数据、名称/状态筛选、分页、创建/改名/启停、身份拒绝与租户 0 只读；菜单仍走统一数据源 |
| `src/foundation/mock/tenant-handlers.spec.ts` | 覆盖筛选分页、失败零新增、密码不留存、根租户保护和身份拒绝 |
| `src/components/page-layout/page-layout.spec.ts` | 保证新模式仅一个分页控件、分页事件透传 |
| `src/foundation/menu/index.spec.ts` | 默认目录跳转断言随新增首项租户菜单调整 |
| `src/locales/zh-CN.ts`、`en-US.ts` | 新增按钮与管理员账号文案，移除迁入手册的孤立说明键 |
| `docs/user-guide/operation-manual.md` | 租户创建、初始密码、编辑和启停操作说明；全局帮助入口仍待 U020 后续批次 |

代码与 diff 由执行方核实；`git diff --check` 通过。提交 Hook 已执行 eslint/prettier 并回读提交范围。本批没有修改认证、实际租户权限或服务端状态规则。Mock 结果只用于前端 UI 验证，不承担 A06—A08 的后端行为结论。

## 实际验证

命令均携带 `NODE_OPTIONS=--max-old-space-size=2048`；运行前检查没有 Java/Maven 进程。检查按类型、lint、测试、构建串行执行，单动作超时 300s，保存退出状态。

| 检查 | 结果 |
| --- | --- |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0；0 error、2 条既有 `require-default-prop` warning |
| `pnpm test` | **181 文件通过、1 文件跳过；1661 用例通过、3 跳过**；exit 0；114.63s |
| `pnpm build` | exit 0；最后 CSS 调整后重新构建通过，2.79s |
| 最后两处 CSS 的聚焦 eslint | exit 0，仍为上述 2 条既有 warning |

首轮测试有 1 条失败：Mock 首项改为租户管理后，目录重定向测试仍期待 `/system/dict`。更新为实际首项 `/system/tenant` 后全量复跑通过。首次日志采集器遇到 Windows stdout 编码错误，已取消自身进程树并固定 UTF-8 后重新运行；该次不计为测试通过。

构建保留第三方 VueUse 的两处 `INVALID_ANNOTATION` warning，构建退出为 0。完整原文仅本机留存：`C:/Users/hjxch/.codex/evidence-020/tenant-ui/` 内的 `typecheck.log`、`lint.log`、`test-first.log`、`test.log`、`build.log`、`checks-result.txt`、`checks-result-build.txt` 与有界执行脚本。

## 设计与可见浏览器

Figma 文件 `mbEKPcZv9pcchmElQanR5E`，本次读取节点 `458:12660`、`458:12730`、`458:12871`、`458:12872` 的设计上下文、元数据和截图。原始列表参考图 **1920×1080**。浏览器为用户可见 IAB，`headless=false`，URL `http://127.0.0.1:5173/system/tenant`；身份为 `dev:mock superadmin`，对象为临时租户 0/1/2。本机已有 Noto Sans SC，浏览器字体检查返回 true；原生布局指标 scale/zoom 均为 1。

| 对象 | 设计 x/y/宽/高 | 实测 |
| --- | --- | --- |
| 管理端侧栏 | 0 / 64 / 236 / 1016 | 一致 |
| 激活菜单 | 16 / 106 / 204 / 40 | 一致 |
| 筛选栏 | 256 / 84 / 1644 / 64 | 一致 |
| 标题区 | 256 / 164 / 1644 / 24 | 一致 |
| 表格卡片 | 256 / 204 / 1644 / 255 | 一致 |
| 卡片内分页 | 257 / 408 / 1642 / 50 | 一致 |
| 新增弹窗 | 580 / 399 / 760 / 282 | 一致 |
| 新增正文 | 605 / 472 / 710 / 132 | 一致；双列控件各 345px，间隔 20px |
| 编辑弹窗 | 580 / 435 / 760 / 210 | 实测，仅名称字段 |

真实 UI 操作：名称查询「深圳」后仅深圳中心 1 行；重置恢复 3 行；新增/编辑均能打开和取消，编辑不显示管理员账号与密码字段。1366×768 下 `documentElement.scrollWidth=1366`，筛选栏为 1090×64，表格保留容器内横向滚动；未声称完成所有响应式场景。

本机证据目录内：`reference-tenant-1920.png`、`runtime-list-1920.png`、`runtime-list-native-1920.png`、`runtime-create-1920.png`、`runtime-edit-1920.png`、`runtime-list-1366.png`、`diff-tenant-1920.png`、`overlay-tenant-1920.png`、`browser-observations.json`、`edit-observations.json`、`network-index.json`、`pixel-results.json`、`compare.py`。网络索引如实保留观测；租户数据由 Mock 调度器在请求层内响应，不伪造真实后端 HTTP 记录。

## 像素差异与剩余项

对同尺寸原图比较，RGB 任一通道差值 >8 为差异；无缩图、无掩罩、排除面积 0。最近一组：

| 区域 | 差异像素 / 比较像素 | 一致率 | 门槛 |
| --- | --- | --- | --- |
| 整页 | 109871 / 2073600 | 94.7014% | 99%，未过 |
| 内容区 | 57753 / 1710944 | 96.6245% | 99%，未过 |
| 顶栏 | 39339 / 122880 | 67.9858% | 98%，未过 |
| 侧栏 | 12779 / 239776 | 94.6704% | 98%，未过 |
| 筛选栏 | 16829 / 105216 | 84.0053% | 98%，未过 |
| 表格与分页 | 34623 / 419220 | 91.7411% | 98%，未过 |

剩余差异包括顶栏导航投影、品牌与账号区域、侧栏菜单内容/顺序、分页与图标细节、运行截图文字边缘和颜色。表头实际观测仍为 `rgb(250,251,254)`，与设计 `#f4f6fb` 不一致；已增加共用表面变量，但当前观测未证明问题关闭。不得把上述几何对齐解释为 A03 通过。

下一动作：继续 U020，核实表头生效样式和截图条件，再完成管理端顶栏、菜单、分页及独立弹窗的像素对照；随后扩展覆盖矩阵并铺开其余页面。T020 停用收敛、真实库创建/隔离验证、既有管理员维护及菜单迁移仍按上一回执保留；F020/J020/W020 尚未实施，整版验收、合并和 0.2.0 发布依赖后续完成。

常规决定：以可选新稿模式扩展现有公共组件，租户页先使用；按同一菜单树补 Mock 入口，不建立第二套业务导航或权限来源。当前功能状态、计数、P 核销与正式基线保持不变。
