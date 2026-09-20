# P53 执行补充提示 02（二级）

> 角色：规划（Planner）下发 → 执行（Executor）  
> 日期：2026-09-17  
> 功能：p53-global-ui-component-layout  
> 状态：`VERIFYING`  
> 最新审查：`planning-review-p53-completion-03-not-passed.md`  
> 提示级别：二级（一级提示后同类证据封装仍失败）  
> 替代关系：**本提示替代 `planning-execution-prompt-p53-global-ui-component-layout-01.md`，成为唯一当前执行入口；提示01、验收01—03及既有回执只作追溯和证据指针，不同时作为执行待办。**

## 1. 精确输入与边界

执行只需读取：

1. `planning-review-p53-completion-03-not-passed.md`；
2. 本提示；
3. `receipt-p53-supplement-02.md`；
4. `evidence/p53-review-02/executor-02/evidence-index.md`、五份 facts、`final-source-fingerprint.json`、`zero-change-recheck.txt`、`visual-update.log` 与 `visual-core-verify.log`；
5. `evidence/p53-review-02/browser-artifacts/` 中与五个原子同名的 PNG/facts、`pixel-alpha-verify.txt`、`contrast-verify.json`，**仅用于复用已成功的截图落盘方法、固定对象与构图，不得直接充当最终快照证据**；
6. P53 主方向标准 3、4、8、9、12、13、15、16、17。

不再读取或重做 lint、设计资产、SSO 口径和已锁定真实业务链。`P53-EV-01a` 已通过并锁定。

本提示不改变需求方向，不授权 Server、数据库契约、认证/租户或 P61 扩张。允许范围仅为：确有必要的 Web 修复、受影响视觉验证资产、最终浏览器证据采集脚本/配置、新证据与新回执。

## 2. 父子映射与唯一剩余原子

稳定父 ID 保持不变；本轮 `-F` 表示“最终快照证据封装”子项：

- `P53-EV-02a → P53-EV-02a-F`
- `P53-EV-02b → P53-EV-02b-F`
- `P53-EV-02c → P53-EV-02c-F`
- `P53-EV-03a → P53-EV-03a-F`
- `P53-EV-04a → P53-EV-04a-F`

| 原子ID | 最新失败事实 | 完成条件（正向断言） | 必要反向断言 | 固定对象 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| P53-EV-02a-F | 最终包只有 facts；旧菜单 PNG 早于最终指纹 | admin 与 portal 各一张最终快照展开态 PNG，菜单项逐项等于 facts | admin 无“进入后台”；portal 无“返回前台”；两端无修改/忘记密码 | admin/系统管理员/T0；`/form/form-def-list`、`/workspace` | 2 PNG + SHA-256 + URL/身份/菜单DOM facts + 同快照清单 | 可复用旧图的对象和构图；不可复用旧 PNG 内容 | 用已成功的落盘机制在最终指纹下重采 | 两种允许的截图路径均有原始失败输出且浏览器仍不可安全导出时，才可按工具阻塞提交 |
| P53-EV-02b-F | 真实 UI 链有旧图和最新 facts，但无最终同快照 PNG；全量视觉的流程设计器项失败 | 能力响应→审批节点→候选弹窗→选 admin id=1→正式字段回填→保存/校验完整可判定 | 不改 Server 契约、不硬编码、不以 API JSON 或旧图替代 UI | definition `2100424929376403458`；process `bpm_ea1731b3ae1e4f38`；节点一；candidate id=1 | 最终候选弹窗 PNG、回填 PNG、保存/校验 PNG；GET/PUT/POST 网络索引；哈希/facts；对应视觉回归 exit 0 | 固定对象失效时登记新旧 ID 与真实原因；行为步骤不可近似替换 | 在最终快照重放并收口流程设计器视觉用例 | 仅对象被外部销毁且授权内无法建立合法等价对象，或两种截图路径均真实失败时可阻塞 |
| P53-EV-02c-F | 真实意见对象有旧图和最新 facts，但无最终同快照 PNG；全量视觉的任务详情项失败 | 真实已完成审批记录打开意见详情，展示节点/审批人/时间/版本/意见；Escape 关闭并回焦 | 不用实例列表、mock 或静态文本代替弹窗 | task `af63f9ac-b248-11f1-9b6a-00ffa7734675`；instance `6f46dbc8-b248-11f1-9b6a-00ffa7734675`；已登记业务键 | 最终展开前/展开态 PNG、字段DOM与网络索引、Escape/焦点 facts、哈希；对应视觉回归 exit 0 | 对象失效时只允许登记新旧 ID 后换真实已完成记录 | 在最终快照重采并收口任务详情视觉用例 | 同上；不得因旧图存在而跳过最终采集 |
| P53-EV-03a-F | 最新几何 facts 无最终 PNG/alpha；旧 PNG 顶栏颜色与最新 facts 不同；相关全量视觉项失败 | 1440×1024 的 workspace、catalog、task detail、admin 四页均从(0,0)覆盖，Logo/nav/user完整，无横向滚动，四角与主体 alpha=255 | 不得出现透明 gutter、顶栏缺项、滚动后关键导航消失；不得用聚焦27项掩盖全量失败 | 同一 admin/T0、真实后端、固定四 URL | 4 PNG + SHA-256 + viewport/scroll/盒模型/颜色/alpha facts + 全量视觉更新及复核 exit 0 | 页面对象 ID 失效可换同类真实任务并登记；不可沿用旧 PNG | 最终源码定版后重采并运行无 grep 的全量视觉单 worker复核 | 只有真实外部服务不可恢复或两种截图路径均失败且有原始结果时可阻塞 |
| P53-EV-04a-F | 最新移动 facts 无最终 PNG/alpha；旧 PNG 未绑定最终指纹 | 375×812 的 login、m/form、m/workflow、m/notify 四页背景不透明、正文可读、无横向滚动、主要操作≥40px | 中心及四角 alpha=255；普通文字对比度≥4.5:1；不得依赖默认承载底色 | 同一真实后端；固定四 URL | 4 PNG + SHA-256 + alpha工具原始输出 + 对比度/hScroll/触控 facts + 同快照清单 | 表单对象失效可换同类真实已发布表单并登记；不可沿用旧 PNG | 最终源码定版后重采并运行像素/对比度工具 | 只有两种截图路径均失败且有原始结果时可阻塞 |

## 3. 截图归档与同快照硬约束

新证据必须写入独立目录：

`product/p53-global-ui-component-layout/receipts/evidence/p53-review-03/`

1. **禁止通过 `data:image` 导航导出**；上一轮已经证明该路径被策略拒绝。
2. 优先复用已在 `evidence/p53-review-02/browser-artifacts/*.png` 成功落盘的截图机制。若该机制在当前任务不可调用，改用用户可见 `headless=false`/headed 浏览器会话直接执行截图到上述绝对路径；两条路径均属于已授权的正式浏览器证据。
3. 截图前生成 `capture-source-fingerprint-before.json`，完成所有截图、facts、网络索引和门禁后再生成 `capture-source-fingerprint-after.json`。两者必须列出相同的排序源文件清单与相同总 SHA-256；不同即全部截图失效，修复后重新采集。
4. 生成 `capture-manifest.json`：逐张记录原子ID、绝对/相对路径、SHA-256、尺寸、采集时间、URL、viewport、身份、对象ID、源码指纹。工具生成后必须回读校验，清单排除自身。
5. `formal_browser_acceptance` 只有在最少 15 张最终 PNG（2 菜单 + 3 审批人链 + 2 意见弹窗 + 4 桌面壳 + 4 移动页）全部存在、哈希可回读且与 facts 同对象时才可为 `true`；若另有必要步骤图，实际数量按清单增加。不能保存 PNG 时必须保持 `false`，不得提交为完成。

## 4. 受影响视觉回归收口

全局布局、样式、移动页、流程设计器或任务详情若有任何实现/基线变化，按以下顺序执行，不使用 `--grep` 代替全量结论：

1. 必要时运行全量视觉更新，单 worker，保存完整 stdout/stderr 与 exit；
2. 再运行全量视觉验证，单 worker，保存完整 stdout/stderr 与 exit；
3. 最终验证必须 exit 0，并如实记录 passed/skipped/failed；预期总集合为 88 项，实际计数以原始输出为准，`failed` 必须为 0；
4. 对上一轮10个失败逐项列出 `旧失败 → 本轮结果 → 原始日志行/附件`，至少包括管理壳、流程中心、数据列表、任务详情、发起流程、表单设计器和流程设计器；
5. 若首次全量运行因并行崩溃，单 worker 是规定的替代路径；单 worker 仍失败则属于未关闭项，不得只提交更小聚焦集。

## 5. 已锁定项与禁止重验项

- `P53-EV-01a`、设计资产64/64、SSO租户口径以及审查03 §3列出的真实业务链全部锁定。
- 不再修改 lint 口径，不重采登录/工作台业务统计、动态分类、数据列表、审批命令、表单提交、字段清单、深链拒绝或撤权链。
- typecheck、Vitest、build 只有最终源码继续变化时才按影响重跑；没有源码变化时可引用 `executor-02` 最终日志。
- 禁止修改 Server、数据库契约、P61、历史审查、历史证据、P53功能状态和P60发布身份。
- 旧 PNG 只允许作为对象、构图和截图落盘能力的参考，不能复制进新目录冒充新采集。

## 6. 允许修改、允许命令与执行顺序

| 维度 | 内容 |
|---|---|
| 允许修改 | 确有反证时修改 Web 布局/移动样式/流程设计器/任务详情与对应测试；截图采集脚本或配置；受影响视觉基线；`p53-review-03` 新证据与新回执 |
| 禁止修改 | Server、数据库契约、认证/租户、P61、历史回执/审查/证据、正式功能状态、已锁定业务实现 |
| 允许命令 | 最终指纹与哈希；真实API授权测试对象操作；headed浏览器截图；像素/对比度工具；`pnpm test:visual:update --workers=1`、`pnpm test:visual --workers=1`；源码变化后按影响执行 typecheck/lint/test/build |
| 执行顺序 | 建五原子账本 → 处理现存10个视觉失败 → 最终源码定版 → before指纹 → 全量视觉更新/复核 → 可见浏览器重采 → 哈希/alpha/对比度/对象核对 → after指纹 → 清单回读 → 新回执 |
| 可并行项 | 四桌面页与四移动页在同一源码指纹、同一身份/会话约束下可并行采集；门禁与真实UI对象写操作不可并行争用同一浏览器或测试对象 |

## 7. 原始输出字段

新回执及终态 payload 必须从附件回读并逐字一致：

- `source_fingerprint_before`、`source_fingerprint_after`、`source_files_count`、`zero_source_change`；
- `visual_update_exit/passed/skipped/failed`、`visual_verify_exit/passed/skipped/failed`；
- `formal_png_count`、`manifest_entry_count`、`sha256_check_exit`、`alpha_check_exit`；
- 每个原子的 `identity/url/object_id/png_paths/png_sha256/facts_path/network_index/result/boundary`；
- `formal_browser_acceptance`；
- `remaining_actionable_count` 与五个 work_items 的 `status/actionable/next_action`。

任何命令为静默输出时保留真实0字节文件和退出码；失败输出不得删除。不得把 `exit 0` 推导成未实际打印的计数，也不得把任务内联图片称为已归档 PNG。

## 8. 相对提示01新增/收紧约束

- **删除了什么**：删除已关闭的 `P53-EV-01a` 及其 lint 动作；不再允许把六原子整体重交。
- **原子化了什么**：五个剩余父原子各映射为唯一 `-F` 最终快照子项，行为正确与证据封装在同一行完成。
- **替代路径是什么**：明确撤销 `data:image` 导出路径，改为复用已成功的 PNG 落盘机制；不可用时采用可见 headed 浏览器直接写绝对 PNG。现已指定合规目录，不再等待 Planner 指定路径。
- **提交条件如何判定**：before/after 源码指纹相同；新目录 PNG/哈希/facts/对象一致；`formal_browser_acceptance=true`；无 grep 的全量视觉单 worker验证 exit 0、failed=0；五个原子全为完成。
- **新增反证处理**：上一轮旧 PNG 与最新顶栏颜色不一致，故旧图只作方法参考；全量10失败必须逐项核销，27项聚焦结果不再作为全量替代。

## 9. 提交前核对矩阵

全部为“是”才允许提交：

- [ ] `P53-EV-01a` 未被重新展开或重做？
- [ ] 五个 `-F` 原子全部使用 `p53-review-03` 的最终快照证据？
- [ ] before/after 源码指纹、文件数与排序清单完全一致？
- [ ] 每张 PNG 实际存在、尺寸正确、SHA-256 由工具生成并回读通过？
- [ ] admin/portal 菜单均为真实展开态且无禁止项？
- [ ] 审批人选择是真实 Server UI 全链，保存/校验及网络索引齐全？
- [ ] 意见详情是真实已完成对象，字段、Escape 与焦点回返齐全？
- [ ] 四桌面壳 PNG 无 gutter/顶栏缺项/横向滚动且 alpha=255？
- [ ] 四个375页面 PNG 背景不透明、对比度≥4.5:1、无横向滚动、主要触控≥40px？
- [ ] 全量视觉更新与随后验证均为单 worker；最终验证 exit 0、failed=0，上一轮10失败逐项有结果？
- [ ] `formal_browser_acceptance=true`，五个 work_items 已关闭，`remaining_actionable_count=0`？

Executor 不得自行写 `PASSED/COMPLETED`、移动方向、启动阶段三或恢复 P61。提交后保持 `VERIFYING`，等待 Planner 复核。
