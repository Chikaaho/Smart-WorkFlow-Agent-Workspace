# 批次 13–16 回执：Owner 回归复开项修复（009/010/012/013/019 + 新增 020）

- 日期：2026-09-28
- 执行：Executor（授权方向：`direction-full-repair-20260927.md` 连续分批修复；Owner 2026-09-28 指令「继续读取 bug 清单，大量不通过，已备注原因，同时新增了一个」）
- 证据目录：`receipts/evidence/batch-14/`、`batch-15/`、`batch-16/`
- 关联回执：`batch-11-v012-bug-012-013.md`（本轮为其复开返工）、`batch-09-v012-bug-009.md`、`batch-10-v012-bug-010.md`、`batch-07-v012-bug-019.md`

## 0. 回归事实（Owner 于 bug2.0.md 2026-09-28 09:26 版回填）

- **通过锁定（累计 14 项）**：001–008（既往）、011/014/015/016/017/018（本轮回填"通过"）。
- **复开 5 项（Owner 已备注原因）**：009、010、012、013、019。
- **新增 1 项**：前台顶部 tab 左对齐 → 编号 **V012-BUG-020**（序号列已补填）。

## 1. V012-BUG-020（新增）：前台顶部 tab 左对齐

- 根因：017 轮实现「顶级 tab 最右」时在 `AppMainNav.vue` 使用 `justify-content: flex-end`，把前台顶栏 tab 组整体右贴，破坏了原有的左对齐形态。
- 修复：改为 `justify-content: flex-start`（tab 组紧跟 Logo 区域）；017 的系统管理排序与字典两级验收结论不受影响。
- 验证：1920×1200（16:10）headed 截图 `evidence/batch-14/screens/workspace-topnav-left-aligned-1920x1200.png`。

## 2. V012-BUG-010 复开：定位分类噪音 + 主题规则配置找不到

- 左上角噪音根因：批次 10 在待办页加了「定位分类」chip 行（未 styling 的裸按钮行）。
- 修复：整块移除 `TodoList.vue` 定位分类（脚本/模板/目录预加载/locale `locateCategory`），待办直达列表；spec 注释同步清理。
- 主题规则入口：原入口仅藏在操作列「更多」内（直显位被设计/查看图/发布/删除占满）。修复：`ProcessDefList.vue` 新增**主题规则列**（180px）——已设置显示规则原文（超长省略+悬浮全称），未设置显示警示色「未设置」，单元格点击即打开既有设置对话框；行数据 `themeRule` 由后端分页实体直带（`BpmProcessDef.themeRule` 已映射，无后端改动），`contracts/bpm.ts` 补可选字段。
- 验证：聚焦单测 30/30 绿；16:10 浏览器实测待办页无该行（`evidence/batch-14/screens/todo-no-locator-actions-clipped.png`，该图同时暴露并修复了待办操作列 Reject 截断，见 §6）。

## 3. V012-BUG-012/013 复开：表单边框体系 + 流程图画布

- 根因 1（发起/详情外框与输入边框倒置）：`FormRender.vue` 根元素带 `form-render-page--design` 旧设计壳，其 media 块把字段行改为 `128px label + value` 行式表格（`border: 1px solid #eef1f7` 外框）并 `box-shadow: none` 杀掉输入控件自身边框。
- 修复 1：去掉 `--design` 类并删除整个死样式块；布局改单栏（消除右侧 300px 幽灵列=「最右边空白」）；表单卡去背景/阴影（一般表单形态：标签在上 + 带边框控件）；恢复标准 el-input 边框与红色必填标记。
- 根因 2（网格画布盖节点）：网格为消费方 `.pg-view::before`（定位元素 z-index:0），`.pg-svg` 未定位导致其 `z-index:1` 失效——定位元素整体画在非定位 SVG 之上。
- 修复 2：`ProcessGraphView.vue` 源头给 `.pg-svg` 加 `position: relative; z-index: 1`（全部消费方一次性修复：详情 Diagram 页签 / 完整图页 / 发起页）。
- 修复 3：发起页流程图区补边框 + 24px 网格画布（与详情/查看图同款）；批次 11 已验证但漏提交的两处行为（文件尾覆盖块、目录条目携带 `process` 参数）随批次 13 补交（`d627b6e`）。
- 详情页（013 其余项）：数据表单改发起同款（字段名在上 + 带边框灰底只读值盒）；左右两区 `gap: 0 → 16px`（消除贴死）；页面去 1216 宽上限并 `flex` 纵向撑满视口、记录卡 `flex: 1` 贴底（消除右侧与下方留白）。
- 验证：typecheck/lint/TaskDetail+FormRender spec 27 例绿；1920×1200 headed 截图四张（`evidence/batch-14/screens/`）：发起页无外框+输入边框+流程图网格、详情 Diagram 节点完整浮于网格上方、详情整页填充与两区间距。

## 4. V012-BUG-009 复开：流程中心列表化（不用卡片）

- Owner 反馈原文「流程用列表不要用卡片，和蓝凌的参考程度太低了」。
- 修复（`ProcessCatalog.vue`）：删除 232px 大卡片网格，改为蓝凌结构——
  - 分类树保留（全部/分类/未分类 + 计数 + 分类维护入口）；
  - 「常用流程 / 最近使用」紧凑条目补文档图标；
  - 主区按分类**分组带**（左侧主色竖条 + 分类名 + 计数），组内 4 列「图标+名称」紧凑条目（≤1439 三列、≤1199 两列），点击整行发起（携带 `process` 参数），星标收藏/取消随行；
  - 分组序=树序在前、未分类殿后；组内保持收藏置顶序；删除失去用途的 `categoryFallback` locale 键。
- 验证：typecheck/lint 绿、workflow views 97 例绿；1920×1200 截图 `evidence/batch-15/screens/catalog-grouped-list.png`（分组带+条目形态）、`catalog-star-toggle-state.png`；真实交互：条目点击跳转 `/form/form-render/form_mue3nsz4?process=bpm_80e44959dfc94ee0`、星标三连切换状态迁移正确。

## 5. 执行中发现并修复的后端缺陷：收藏取消→再收藏 500（归属 009）

- 浏览器实测星标「取消→再收藏」时后端 500：`uk_sw_bpm_process_favorite(tenant_id, user_id, process_key)` 为**物理唯一键**，而 `unfavorite` 走 MyBatis-Plus `@TableLogic` 软删（`deleted=1`），软删行仍占用键位 → 再收藏 INSERT 撞唯一键（日志 `eventRef=req-84edb4d6…`，POST /api/workflow/favorites/... status=500）。
- 修复（Server `0d05b5e`）：`BpmProcessFavoriteMapper.deletePhysically`（自定义 `@Delete` 物理删除，租户隔离由拦截器追加）；`unfavorite` 改物理删除；`favorite` 插入前物理清理历史软删残留键位；新增 `BpmProcessFavoriteServiceTest` 3 例（物理删除断言/回环不撞键/已收藏仅刷新）。
- E2E 复验（dev 后端重建重启后）：星标 收藏→取消→再收藏 三连全部成功，状态迁移正确。

## 6. V012-BUG-019 复开：用户/部门改系统弹窗选择器

- Owner 反馈原文「人员和部门等选择器要用系统的选择器弹出选择而不是下拉选择」。
- 修复（Web `3fb7f1a`）：
  - `UserRemoteSelect.vue` 重写为**弹窗选择器**（对外 props/emit 契约不变，三处调用点零改动）：触发框=只读输入框（已选回显「姓名（账号）」、可清除），点击弹出「选择人员」对话框——关键词搜索（append 查询钮）+ 表格（姓名/账号 + ✓ 选中列）+ 行点击暂存 + 确认统一上抛；单选/多选语义保持；Long→String 归一数值化保留。
  - `DeptControl.vue`（表单 DEPT 字段控件）同款改造：触发框显示部门名（保留未知 id 原值兜底）、弹窗内部门清单搜索/行选/确认，readonly 不可打开；新增 `DeptControl.spec.ts` 3 例（触发框回显与打开/行选确认上抛/readonly 拒开）。
  - locale 新增 `common.selectUser/selectUsers/selectDept/pickerSearchPlaceholder/pickerTriggerPlaceholder/pickerUserName/pickerUserAccount/pickerDeptName`（双语）。
- 验证：headed 真实链路（表单管理 → 发起范围 → 触发框 → 弹窗 → 选人 ✓ → 确认 → 触发框回显「系统管理员（admin）」，外层取消未保存、净零变更），截图 `evidence/batch-16/screens/user-picker-dialog-open.png`；组件单测 3/3 绿（人员弹窗与部门弹窗同构）。

## 7. 提交与推送（两仓 0.1.2-bugfix，均 ls-remote 回读一致）

| 仓库 | 提交 | 内容 |
| --- | --- | --- |
| Web | `d627b6e` | 批次 11 漏交补交（发起页文件尾覆盖块 + 目录 process 参数） |
| Web | `9ff1c17` | 批次 13：020 tab 左对齐 + 010 定位分类移除/主题规则列 |
| Web | `3aaa2e0` | 批次 14：012/013 边框体系/网格画布/节点层级/详情铺满（含待办操作列 160） |
| Web | `3aa8ff6` | 批次 15：流程中心列表化 |
| Web | `3fb7f1a` | 批次 16：019 弹窗选择器 |
| Server | `0d05b5e` | 批次 15：收藏物理删修复 + 回环单测 3 例 |

## 8. 边界与残余

- 013 的「16:10 分辨率未验收」按 Owner 指令以 1920×1200 执行侧验证（本轮全部截图视口即 16:10）；Owner 回归分辨率以其环境为准。
- 待办操作列 Reject 截断为本轮 E2E 中发现并顺手修复（120→160，同 015 类根因），未单独登记。
- 批次 15 后端修复已含新增单测；全量后端套件与前端四连结果：Server 全量 1559 例执行，6 失败全部为四个迁移锚类的 V102 链尾陈旧断言，锚修正（Server `e348ff8`）后四锚类 31 例复验全绿、其余 1528 例同树全绿；Web 四连 typecheck 0 / lint 0 error / vitest 1301 passed + 3 skipped / build exit 0。
- 所有复开项与 020 均为执行自验完成，**待 Owner 逐项回归**；「回归测试情况」栏仍由 Owner 填写。
