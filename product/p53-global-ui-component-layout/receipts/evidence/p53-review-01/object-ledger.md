# p53-review-01 对象总账本（P53 补证 · 初始固定）

> 采集日期：2026-09-17。口令、token、验证码答案等秘密不进入本目录；测试身份口令仅存在于 dev/test 种子契约（`admin123`，V4 注释明示仅 dev 使用），不在此复写为"秘密"以外的语义。

## 1. 最后实现前源码指纹

- Workspace HEAD：`develop-sw`（补证期间零提交；P53 实现保持 Web 仓工作树未提交态）。
- Server HEAD：`f55300be88b2878eaf09861576c70e89b9842c23`（工作树 clean；运行中 jar 构建于 2026-09-16 21:52，早于 HEAD 提交时间约 1.3h，行为含 P61 服务侧人性化 errorKey，如实记录不做等同声明）。
- Web 仓：HEAD `381ef74`，工作树 dirty（P53 实现 + 本轮补证测试资产与缺陷修复），逐文件哈希见 `ev1-identity-web.md`（采集开始）与 `ev1-identity-final.md`（采集结束重算），关键文件 45 秒窗口零变化复核 `ev1-zero-change-recheck-final.txt`。
- 设计资产：`docs/ui/` 32 组 64 文件 SHA-256 与补充探索 G1 锁定值 64/64 一致（本轮重算）。

## 2. 固定租户与身份别名

- T0（默认租户）：`admin`（系统管理员，userId=1）——主取证身份；本轮新建立用户 `p53ev_u0`（无任何角色，负向权限对照）。
- T100（devseed 测试租户，V900）：`t100admin`（租户管理员）；本轮新建立 `p53ev_t100_u1`（初始绑定角色 9001，用于撤权链，链内已撤销）。
- 业务对象（全部经真实 API 建立，`scripts/ev2-fixture-setup.js`）：
  - 分类 `行政办公-p53ev`（id 2100393533039640577）、`人事财务-p53ev`（id 2100393533194829826）。
  - 流程定义 `bpm_ef5a3a2d9a8842de`（P53 取证事项，START→END，已发布 v1，归入人事财务分类，后因目录解析调整不再门户可见）；`bpm_57baacd2c6d24129` / `bpm_ece57935478a4a3d`（双审批取证事项及 B 版，已发布；运行时参与人解析为空时实例直接通过——该行为已如实记录，不构成 P53 缺口）。
  - 表单提交记录（formKey `p61r10_batch_form`）：3dd83e1a、25b2fa02、6d0351fd、d61642df 等真实 businessKey/recordId。
  - 审批实例 `1b27023d-d2cb-40a6-a997-17702d1fe706`（P61 批量审批流程）：由可见会话完成真实审批（命令 `2100402875231043586`），意见「P53 取证审批意见：同意（可见会话采集 2026-09-17）」已持久化并在实例详情弹窗回读。

## 3. 原子绑定与取证规则

| 原子 | 固定对象/边界 | 证据位置 |
|---|---|---|
| EV-01 身份包 | Web 工作树指纹 + 五门禁原始输出 + 零变化复核 | `ev1-identity-web.md`、`ev1-identity-final.md`、`gate-*.log`、`ev1-zero-change-recheck-final.txt` |
| EV-02 正式浏览器链 | ZCode IAB（headless=false）+ 真实后端 8080 + vite dev 5173 + 测试身份 | `browser-artifacts/ev2-01…ev2-33`（截图+facts+网络索引） |
| EV-03 页面族矩阵 | dev:mock Playwright 套件（隔离回归层）+ 真实会话截图补充 | `gate-visual*.log`、`e2e/visual/families.spec.ts`、browser-artifacts |
| EV-04 375 边界 | 375×812：登录页 + `/m/form/:formKey`、`/m/workflow`、`/m/notify` + 桌面页退化 | `browser-artifacts/ev2-29…ev2-31d` |
| EV-05 双语与可访问性 | en-US 长文本（登录/工作台）、Tab 键序、弹窗 Escape+焦点回返、原生 required 关联、触控目标尺寸 | `browser-artifacts/ev2-23/25/26/27/28/31d` |
| EV-06 口径统一 | 登录页快照结构 + LoginPage 源码事实 + en-US 提示语 | `browser-artifacts/ev2-01`、`ev2-25`、回执 §EV-06 |

- 每一浏览器原子包含可回读 PNG、URL、视口、身份、关键 DOM 断言与 `/api/*` 网络索引（performance resource）。
- dev:mock 只承担隔离回归层；功能级结论一律以本目录真实后端可见会话证据为准。
- 运行期互斥：全程仅存在 bootstrap.jar 服务进程（PID 36852 监听 8080；PID 28152 为同 jar 残留存根，未监听端口），无 mvn 编译进程并行。

## 4. 本轮实现变更（审查 §6 授权范围：缺陷修复 → 重跑受影响门禁）

| 文件 | 变更 | 性质 |
|---|---|---|
| `src/views/LoginPage.vue` | 表单卡 `box-sizing:border-box`+`width:100%;max-width:380px`、面板 `min-width:0`、≤767px 顶行换行 | 真实视觉缺陷修复（375 横向滚动 + 标题逐字竖排） |
| `src/foundation/mock/index.ts` | dispatchMock 跳过 undefined/null 查询参数（对齐 axios 序列化语义） | dev-only mock 基建修复 |
| `src/foundation/mock/handlers.ts` | 补注册 `GET /api/workflow/catalog/categories`（原穿透真实后端，违反 dev:mock 零参与前提） | dev-only mock 基建修复 |
| `e2e/visual/{auth,regions,baselines,families}` | 时钟冻结、动画禁用、滚动归零、几何/样式就绪门、管理端顶栏基线、页面族矩阵 | 补证测试资产 |
| `e2e/visual/baselines.spec.ts-snapshots/` | admin 三区（首次建立）、login 全视口（一次有说明校准：盒模型修正 444→380） | 基线归位 |
