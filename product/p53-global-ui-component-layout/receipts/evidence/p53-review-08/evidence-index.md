# p53-review-08 证据索引（提示08 / review-10 R1a+R1b+R1c）

## 分层
- 分层定义、11类路由绑定表、节点06安全偏差记录：`manifest-layers.json`

## FORMAL_FLOW（真实后端 8080 + admin/系统管理员/T0 + 可见会话 headless=false）
- 清单：`formal-mobile-manifest.json`（5 制品）
- 截图：`ev08m-login-375.png`、`ev08m-form-375.png`、`ev08m-workflow-375.png`、`ev08m-notify-375.png`、`ev08f-login-1440.png`
- facts（URL/身份/对象/碰撞矩阵/hScroll/触控/未授权能力计数）：`facts/ev08*.json`
- 真实验证码位图与回填握手：`captcha-real-attempt*.png`、`captcha-answer-request-*.json`、`captcha-answer-*.txt`
- 网络索引（非空真实 /api/*）：`capture-network-index.json`
- 采集脚本：`scripts/formal-mobile-capture.mjs`；真实表单对象种子：`scripts/seed-mobile-form.mjs`（p53ev08_mobile_form，defId=24cbb61b-6453-40b3-a236-ce03705b0d03）
- 失败尝试追加保留：`failed-attempts/`（wrong-username / cold-server-optimize / i18n-key-missing）

## DESIGN_FIDELITY（受影响节点重采与复核）
- 比较器与采集脚本（证据根指向 review-08）：`scripts/compare-family.mjs`、`scripts/capture-nodes.mjs`、`scripts/p53-*.mjs`
- family-a：`family-a/01|04|05|21|27-runtime.png|dom.json`（沿用 review-07 锁定制品，本轮比较器复核 PASS）、`family-a/06-*`（重采；06 为记录性安全偏差）
- 设计几何（锁定输入，原样拷贝）：`design-geometry/`
- family-a 汇总与退出码：`family-a/family-comparison.json`、`family-a/compare-family.exit`（5 PASS + 06 记录性偏差）

## 工程门禁与指纹（最终源码）
- `final-gates/typecheck|vitest|build|lint .exit/.stdout/.stderr`：全 0；vitest 1217 passed + 3 skipped（134 files）
- `final-gates/visual-verify-workers1.log`（37 passed / 34 failed / 17 skipped，存量漂移）、`final-gates/visual-stale-preexisting-proof.log`（stash 本轮两文件后同用例仍失败 → 存量证明）、`final-gates/visual-login-baseline-final.log`（登录基线 4/4 通过）
- `capture-source-fingerprint-before.json`（采集时点 0c581160…）/`after.json`（最终 87308a68…）；差异仅 4 张登录基线 PNG（授权内基线重建）与 `src/types/components.d.ts`（unplugin 自动再生成），src 逻辑文件零变化

## Terminal（公共契约 v2）
- `terminal-input.json`、`terminal-stdout.log`、`terminal-stderr.log`、`terminal.exit`、`terminal-roundtrip.json`（回执物理末行回读）
