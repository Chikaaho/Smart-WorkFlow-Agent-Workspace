# 批次 6 回执 — V012-BUG-015 创建人列补齐（后半阶段）

- 日期：2026-09-27
- 任务：`v0.1.2-bugfix`（L）；方向 `product/v0.1.2-bugfix/ready/direction-second-half-20260927.md`（主方向 `direction-v0.1.2-bugfix.md`）
- 前置事实：本轮重读 bug2.0.md（19 项）与台账——001–008 回归通过锁定；009–013、017、019 转后续迭代需求；014/016/018 待 Owner 验收（无返工项）；无新增、无复开条目（原表空行不计数）。**本轮唯一执行缺口 = BUG-015 创建人列**。
- 结论：**执行自验通过（含 headed 浏览器行为证据），待 Owner 单项验收**
- 提交：Server `0.1.2-bugfix@6a43d04`、Web `0.1.2-bugfix@77f3f2b`（均推送后 ls-remote 回读一致）

## 登记与期望（子项）

| 编号 | 子项 | 期望 |
| --- | --- | --- |
| V012-BUG-015 | 创建人列（批次 5 遗留：待后端 FormDef 列表字段下发） | 列表展示 表单名称/创建人/创建时间/更新时间/发布状态；追踪到真实创建人数据可正确展示，验证权限与受影响列表；展示占位或只改表头不构成补齐 |

## 实际修改文件与摘要

### Smart-WorkFlow-aPaaS-server（`6a43d04`，5 文件 +194/−38）

| 文件 | 摘要 |
| --- | --- |
| `sw-biz-form-api/…/dto/FormDefDTO.java` | 新增 `createByName` 字段（创建人展示名，优先 real_name 其次 username；仅分页列表解析下发，其余路径 null；解析失败降级 null 不阻断列表） |
| `sw-biz-form-biz/…/impl/FormDefServiceImpl.java` | 注入 `UserQueryFacade`（全参构造必填；6 参兼容构造传 null 保持 8 处既有测试构造零改动）；`pageFormDefs` 新增 `resolveCreatorNames`：当前页 `createBy` 去重后经 `getUserDisplayNames` 批量解析逐行回填，门面缺失/查询上下文 empty/异常均降级为 null 并 warn，不阻断列表（沿用 `BpmInstanceController.resolveUserNames` 既有模式） |
| `…/FormDefinitionServiceTest.java` | 新增测试 `pageFormDefs_shouldResolveCreatorDisplayNames`：stub 门面 + JdbcTemplate 直写 `create_by`（101→张三 / 999 未命中 / NULL），断言命中解析、未命中与 NULL 保持 null、无门面兼容构造全量降级；补 `dynamicTableManager` 注入字段 |
| `…/FormI2ClosureIntegrationTest.java` | 全参构造调用补第 13 参 `null`（门面参数），断言不变 |
| `…/TenantOwnershipBehaviorTest.java` | 同上，补 `null` 参数 |

### Smart-WorkFlow-aPaaS-Web（`77f3f2b`，6 文件 +30/−1）

| 文件 | 摘要 |
| --- | --- |
| `src/modules/form/api/form-def.ts` | `FormDefListItem` 新增 `createByName?: string \| null` |
| `src/modules/form/views/FormDefList.vue` | 表单名称后新增 创建人 列（`t('common.creator')`，`row.createByName \|\| '—'` 兜底，不展示裸 id——对齐 BUG-019「不给用户看 id」方向）；列序=表单名称/创建人/创建时间/更新时间/发布状态；移除批次 5 的「创建人待后端下发」注释 |
| `src/locales/zh-CN.ts`、`src/locales/en-US.ts` | `common.creator` 键（创建人 / Created by），双语对齐 |
| `src/foundation/mock/handlers.ts` | `/api/form/def/page` mock 行补 `createByName`（固定占位，标注临时；直连模式由后端解析下发） |
| `src/modules/form/api/form-def.spec.ts` | 新增透传断言：`createByName` 命中值与 null 均原样进入列表行 |

## 实际命令与原始结果摘要

后端（`MAVEN_OPTS="-Xmx2g"`，离线）：
- `mvn -B -o -q compile` → exit 0。
- 聚焦：`mvn -B -o -pl sw-biz/sw-biz-form/sw-biz-form-biz -am test -Dtest='FormDefinitionServiceTest,FormI2ClosureIntegrationTest,TenantOwnershipBehaviorTest'` → exit 0，**27 个用例（17+8+2）0 失败 0 错误**（FormDefinitionServiceTest 17 = 原 16 + 新增 1）。
- 全仓：`mvn -B -o test` → exit 0 / BUILD SUCCESS，**1574 tests / 0 failures / 0 errors / 0 skipped**（= 批次 1 基线 1573 + 本批新增 1，逐模块汇总行求和复算）。

前端（`NODE_OPTIONS="--max-old-space-size=2048"`）：
- 聚焦：`pnpm test src/modules/form/api/form-def.spec.ts src/locales/index.spec.ts src/locales/messages-compile.spec.ts` → 28 passed。
- 四连：typecheck exit 0；lint exit 0（0 error / 98 warnings 既有）；`pnpm test` → **141 files + 1 skipped / 1295 passed + 3 skipped**（= 批次 5 的 1294 + 1）；build exit 0（`✓ built in 1.86s`）。

## 浏览器行为证据（headed，headless=false）

- 环境：本地后端 `bootstrap-dev.jar` 重建后以 `SPRING_PROFILES_ACTIVE=local`（PostgreSQL `sw_apaas_test`）重启，health 200 `UP`；前端 dev `http://localhost:5174`（/api 代理 8080）；身份 admin（V4 种子）；界面语言 English（跟随浏览器）。
- 制品 `evidence/batch-06/`：
  - `form-def-list-creator-column.png`（1440×900，16:10）：表头 Form name / **Created by** / Created at / Updated at / Publish status / Actions；行「测试1」Created by 列渲染 **系统管理员**（真实 `create_by` 经 `UserQueryFacade` 解析出的 real_name，非占位、非表头空壳）；操作列 3 个直显 link 按钮（Edit / Initiation scope / Disable）无底色无描边。
  - `form-def-list-creator-1366x768.png`（1366×768，16:9）：创建人列渲染不变，操作列固定右贴边，无遮挡异常。
- 受影响列表核实：`/api/form/def/page` 的前端消费方仅 `FormDefList`（FormDesigner 走 by-id/by-key 端点）；`FormDefDTO` 为新增可选字段，其余消费路径（详情、发起可见列表等）不受影响。

## 权限验证

- `/form/def/page` 既有 `form:design` 权限门（P4 契约）未改动；本轮仅新增展示名字段解析，无新授权面。
- 展示名解析经 `UserQueryFacade`（租户内查询，system 模块权威），不跨租户、不下发用户 id 与敏感字段；解析失败降级 null 不阻断。
- 行级多创建人映射（不同 `create_by`→不同展示名、未命中/NULL 降级）由新增单测覆盖；测试库当前仅 admin 一个用户、一条表单，浏览器层无法自然产生第二创建人行，如实记录为数据边界（不虚构数据）。

## 与方向的偏差

- 无目标偏差。补充事实：重启本地 dev 后端时发现旧进程环境变量未留存（`SW_CIPHER_KEY`/`SW_SSO_CIPHER_KEY`/`SW_LOGIN_DIGEST_SECRET`/`SW_LOGIN_RSA_PRIVATE_KEY`/`JWT_SECRET` 为 I5 fail-closed 启动硬依赖），以新生成随机值重建本地 dev 运行环境（仅本机进程环境，不落仓库、不进证据）；登录链 RSA 公钥由前端 `/auth/challenge` 动态获取，不受影响。验证目标不涉加密列，无加密数据写入。

## 遇到的问题、未完成内容和风险

- 浏览器多创建人行演示受测试库数据限制（仅 1 用户 1 表单），以单测补足映射正确性证明（见上）。
- `TaskDetail.vue` 审批记录子表的单按钮操作列（plain 样式）未纳入 ListActionsColumn 统一——该列为详情页子表非数据列表页，本轮不动，留待 Owner 对 BUG-015 验收时裁决是否需要收敛。
- 014/016/018 仍为待 Owner 验收状态；未获反馈不写验收通过。

## Git diff 摘要与提交推送回读

- Server `72b8d01..6a43d04`（`0.1.2-bugfix`）：5 文件 +194/−38；push 后 `git ls-remote` 回读 `6a43d04aa7b5ce0e15f00aca371c463172d62cec` 一致。
- Web `89bebbd..77f3f2b`（`0.1.2-bugfix`）：6 文件 +30/−1（lint-staged 钩子 prettier 随提交）；push 后回读 `77f3f2ba81fba515990fc1ccc602d3fc1440bf58` 一致。
- 未合并 main、未创建 tag/Release、未部署。

## 与验收标准逐项对照

| 方向要求 | 结果 |
| --- | --- |
| 追踪到真实创建人数据可正确展示 | ✅ 后端 `createBy`→`UserQueryFacade`→`createByName` 下发，浏览器实测真实行渲染 real_name「系统管理员」 |
| 非占位、非只改表头 | ✅ 行数据为解析展示名；解析失败兜底 `—`，无裸 id |
| 验证权限 | ✅ 既有 `form:design` 门不变；展示名租户内解析、无敏感字段；单测覆盖门面缺失/未命中降级 |
| 验证受影响列表 | ✅ `/form/def/page` 唯一消费方 FormDefList 实测；DTO 新增字段对其他路径无影响（编译期+全量测试证明） |
| 列序=表单名称/创建人/创建时间/更新时间/发布状态 | ✅ 浏览器实测表头顺序一致 |
| 常见视口比例 | ✅ 1440×900（16:10）与 1366×768（16:9）headed 截图制品可回读 |

## 自验结论

执行自验通过：V012-BUG-015 创建人列子项已按后半阶段方向补齐并验证（后端字段下发 + 前端列渲染 + 真实数据行为证据），**待 Owner 单项验收**；015 整项与 014/016/018 的验收结论以 Owner 在 bug2.0.md 的回归测试情况为准。整体修复循环保持开放，未写 PASSED/COMPLETED。

```
ENGINE_TERMINAL status=EXECUTION_SUBMITTED task=v0.1.2-bugfix level=L work_items=0 remaining_actionable_count=0 independent_work_exhausted=true next_action=等待Owner对014-016/018/015的验收反馈及新增/复开登记 next_action_type=WAIT_OWNER_REGRESSION progress_basis=files_changed+tool_results+browser_evidence progress_fingerprint=server:6a43d04,web:77f3f2b,evidence:batch-06 stop_reason=owner_acceptance_pending tool_results=mvn_test:1574/0/0/0,vitest:1295+3,typecheck:0,lint:0_error,build:0,browser:headed_2_viewports browser_status=formal_headless=false_evidence_saved
```
