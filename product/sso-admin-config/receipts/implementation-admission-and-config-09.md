# sso-admin-config 实施回执 09：补充提示02 收尾（A3a/b 显式点击路径 / R1 入口缺证 / A6）

入口：`planning-execution-prompt-sso-admin-config-02.md`（唯一执行入口）。功能状态 **VERIFYING**；P31 开放。候选：Server `dff266add04a59e0859547f11b647772b20f8e6a`（零改动）、**Web `519a8176e33232a94ab4f1a035042fd2a86793d4`**（本批 A3 修复最终候选）。运行实例 PID 18938（dff266a 构建）。

## A3a/A3b（显式点击路径——无 hover 依赖，同一候选 519a817）

- **实现**（提示授权的"没有则局部增加可点击完整值能力"）：
  - `c9c4afe`：App ID/callback 两列单元格新增 click 处理 → 点击（tap 生成 click）弹出只读弹窗显示完整字段值；PC hover tooltip 保持
  - `519a817`：弹窗宽度小屏自适应（<560px 视口 92%，否则 520px）——修复 390 下 520px 弹窗溢出裁切
- **触屏实测**（390×844 真实视口，headless=false）：
  - `a3a-390-click-appid-dialog.png`：点击 App ID 单元格 → 弹窗「App ID」完整 **`dingzoptrn9m3m33rwe1`**
  - `a3b-390-click-callback-dialog.png`：点击 callback 单元格 → 弹窗「Callback URL (server-derived, read-only)」完整 URL 全文可见（自适应换行，无裁切）
- **反向断言**：两图均为显式 click 触发的弹窗（非 mouseover/mouse-move 产物；此前 hover 系截图 `a3a-390-appid-full-visible.png`/`a3b-390-callback-full-visible.png` 保留为历史，不再作为触屏证据引用）；secret 不出现
- **门禁**：Web 四连在 c9c4afe 与 519a817 各实跑一轮，均全绿（typecheck/lint exit 0、vitest **1301 passed + 3 skipped**、build exit 0——`a1b-web-gate-c9c4afe.log` / `a1b-web-gate-519a817.log`）；lint 过程中发现并修正 `window`→`globalThis`（仓库 no-undef 白名单口径）
- 边界：浏览器桌面引擎无真实触屏数字化器，click 为 tap 的等价事件（提示明示允许："浏览器不支持触屏时采用此按钮路径，不伪称真实设备"）

## R1（secret 轮换——控制台入口缺证，等 Owner）

**探查过程与证据（五项，全部工具实测）**：
1. 新控制台「凭证与基础信息」页：Client ID 显示 20 位正确值 ✓；Client Secret 掩码展示+复制钮；**全文 DOM 检索 `重置|reset` → 0 控件**（唯一相似链接=「查看版本详情」）
2. Secret 行悬停 → 无浮层/操作浮现
3. Secret 旁图标钮（dt__icon）点击 → 无动作
4. 「返回旧版平台」链接 → 两次真实点击（Playwright+CUA）均**无导航、无新标签**（组合 tab 观察，失效链接）
5. 经检索确认的经典控制台权威路径 `open-dev.dingtalk.com/fe/app#/corp/app` → 应用列表可达 → 点开「个人测试」→ **重定向回同一新控制台 UI**，凭证页同样无重置

**结论**：统一后的控制台对该个人测试应用不提供 secret 重置入口——真实工具/能力边界（非"仅声明真人操作"）。**需 Owner**：经钉钉客户端侧的应用管理入口（或其他 Owner 可达面）完成重置；重置后新值经受控运行时通道提供（如更新 `/tmp/sw-sso-dingtalk.secret`，不进回执/截图/命令文本），执行侧随即：`PUT /system/sso/config/DINGTALK/secret` 只写更新（审计在册）→ check 接口 secretUsable=true → 一次真实登录复验（authorize→立即登录→LOGIN_SUCCESS，换票即用新 secret）。旧 secret 已在 e7b4371 历史暴露且重置后立即失效，无回滚依赖。
- 边界：本地更新与复验步骤已就绪且不受阻；唯一缺口=控制台重置动作本身（Owner 面）

## A6（一次收尾同步——回执09口径）

| 入口 | 更新内容 | 回读 |
|---|---|---|
| knowledge/features/sso-admin-config.md | 新增「A3 触屏完整值（显式点击弹窗）」与「R1 控制台入口缺证」两条；Web 候选更新 519a817 | 编辑确认 ✓ |
| memory/README.md、state.md、features.md、issues.md、handoff.md | 摘要行更新为回执09完成态（5 文件替换成功） | ✓ |
| knowledge/current-status.md | 上一轮已更新为回执07 后口径；本轮 A3/R1 增量与当前「VERIFYING+待复核」无矛盾，终态同步在阶段三收敛 | ✓ |
| todo/requirement-pool.md | P31 VERIFYING（未动） | ✓ |
- 不写 PASSED/COMPLETED、不核销 P31；功能数 45、清单 46/22/22 不变

## 门禁与证据

- Server 零改动（dff266a 不变，351/173 锁定继续适用）；Web 每次改动后 build+四连（c9c4afe/519a817 两轮全绿）
- 新增证据 8 件：a3a-390-click-appid-dialog.png、a3b-390-click-callback-dialog.png、a1b-web-gate-c9c4afe.log、a1b-web-gate-519a817.log；索引 `evidence-index-09.json`（逐项哈希，排除 volatile 扫描报告）

## 剩余项

1. R1 控制台重置——Owner 面（钉钉客户端侧应用管理入口），完成后执行侧本地只写更新+最小复验（步骤已就绪）
其余独立可执行项：0
