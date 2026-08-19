# 测试回执：P1 / M02-F02/F03 角色菜单/按钮权限契约一致性收口（D121）

**角色**：执行（工作区根目录，Step 3 汇总回执；Step 3b/3c 补齐后修订）
**功能**：角色菜单/按钮权限契约一致性收口（方向 D121）
**性质**：功能级测试汇总回执。实际执行与原始输出在 step1（后端）/ step2（前端）/ step3b（后端与前端补充）回执中；本回执按 system.md §7.2 汇总，并对后端 surefire XML 做了独立聚合复核、对前端 spec 文件做了独立计数核对（Step 3 为只读核对，Step 3b 为补充实证重跑）。

---

## 1. Step 编号和名称

功能级汇总：M02-F02-01 / M02-F03-01 角色菜单/按钮权限契约一致性收口（自拆 Step 1 后端契约与安全回归 + Step 2 前端 Mock 与页面闭环 + Step 3 汇总核对 + Step 3b 后端菜单过滤证据 / 前端 mock 菜单过滤补充）

## 2. 测试环境

| 项 | 值 |
|---|---|
| 后端 | Java（Spring Boot + Spring Security + MyBatis-Plus），H2 测试库（V31-V34 迁移链，FlywayFullChainH2Test 实证），OS Darwin，MAVEN_OPTS="-Xmx2g" |
| 前端 | Vue 3 + Vite + Vitest（jsdom）+ Element Plus（按需自动注册），Node，NODE_OPTIONS="--max-old-space-size=2048" |
| 相关服务状态 | 测试全程无外部服务依赖（H2 内存库、mock/agent 端点 mock） |

## 3. 测试前置条件

- 后端：编译前 `ps aux | grep -iE "pnpm|vite|vitest|node.*vite"` 无前端进程（前后端编译互斥，EXIT=1 确认无进程）。
- 前端：四连前 `ps aux | grep -iE "mvn|java|surefire"` 无后端进程（互斥满足）。
- 数据准备：后端 H2 迁移链（V31 admin 角色 id=2 built_in=false + 全量菜单绑定 + 按钮 200-208、superadmin id=1 built_in=true）；前端 seeds 夹具（按钮节点 110-122、MOCK_ROLE_MENU_BINDINGS admin 绑定、dataScope 0）。

## 4. 实际执行的测试命令

后端（`/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow`，由 step1 执行）：
1. `MAVEN_OPTS="-Xmx2g" mvn -q compile` → BUILD SUCCESS
2. `MAVEN_OPTS="-Xmx2g" mvn -q test`（全量）→ BUILD SUCCESS

前端（`/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web`，由 step2 执行四连，lint 修正后重跑；step3b 前端补充后再次四连）：
3. `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` → 0 errors（vue-tsc -b --noEmit）
4. `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint` → 0 errors / 0 warnings
5. `NODE_OPTIONS="--max-old-space-size=2048" pnpm test` → 72 spec files / 668 tests / 0 failures（step2）→ **73 spec files / 678 tests / 0 failures**（step3b 补充后全量）
6. `NODE_OPTIONS="--max-old-space-size=2048" pnpm build` → 成功（vite build，dist/ 产出）

后端补充（step3b，`/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow`）：
7. 模块级 `MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-biz/sw-biz-system/sw-biz-system-biz -am test` → 231/0/0/0（28 文件），新类 11/11 通过
8. 全量 `MAVEN_OPTS="-Xmx2g" mvn -q test` → **670 / 0 / 0 / 0**（110 报告文件）

Step 3 本 Step 未执行任何命令（只读核对；对 surefire XML 做了独立聚合：见 §5）；Step 3b 为补充实证重跑（含模块级与全量）。

## 5. 各测试项结果

### 后端（全量 670/0/0/0）

| 测试项 | 预期 | 实际 | 结果 |
|---|---|---|---|
| 全量 surefire 聚合（110 报告文件） | ≥647/0/0/0 | **670 / 0 / 0 / 0** | ✅ |
| 新增 `RoleMenusContractAndSecurityTest`（13 用例） | 13/0/0/0 | 13/0/0/0 | ✅ |
| 其中：getMenus 全绑定（含按钮/目录） | 通过 | 通过 | ✅ |
| getMenus 无绑定空数组 | 通过 | 通过 | ✅ |
| putMenus 替换+回读 | 通过 | 通过 | ✅ |
| putMenus 去重（重复提交只落 2 行） | 通过 | 通过 | ✅ |
| putMenus 空数组清空 | 通过 | 通过 | ✅ |
| putMenus null body 清空 | 通过 | 通过 | ✅ |
| putMenus 未知角色静默成功+孤儿行 | 通过 | 通过 | ✅ |
| putMenus superadmin 拒绝（200+code=400，绑定未删改） | 通过 | 通过 | ✅ |
| putMenus admin 可写 | 通过 | 通过 | ✅ |
| putMenus 无权限 403（HTTP 403+body 403） | 通过 | 通过 | ✅ |
| putMenus 未认证 401 | 通过 | 通过 | ✅ |
| putMenus 超管旁路（permissions 空仍放行） | 通过 | 通过 | ✅ |
| roleMenus 租户隔离（跨租户读空/写孤儿/原租户不受影响） | 通过 | 通过 | ✅ |
| 既有回归：RoleControllerTest、AuthMeControllerTest（3）、AuthFlowIntegrationTest（7）、FlywayFullChainH2Test（9）等 | 通过 | 通过 | ✅ |
| 新增 `AuthMenusContractAndSecurityTest`（Step 3b，11 用例） | 11/0/0/0 | 11/0/0/0 | ✅ |
| 其中：非超管正面混合行菜单树 | 通过 | 通过 | ✅ |
| VO 契约（按钮 component=null/permission 原样） | 通过 | 通过 | ✅ |
| 绑定删除后空树 | 通过 | 通过 | ✅ |
| 角色停用后菜单仍按绑定（如实记录） | 通过 | 通过 | ✅ |
| 无绑定空树 / 超管对照 / 未认证 / 租户隔离 | 通过 | 通过 | ✅ |

### 前端（73 spec / 678 tests / 0 failures）

| 测试项 | 预期 | 实际 | 结果 |
|---|---|---|---|
| typecheck | 0 errors | 0 errors | ✅ |
| lint | 0 errors/0 warnings | 0 errors/0 warnings | ✅ |
| test 全量 | ≥71 spec/646 tests/0 failures | **73 spec / 678 tests / 0 failures** | ✅ |
| build | 成功 | 成功 | ✅ |
| role.spec（6→10，+4：防腐转换/空绑定/清空载荷） | 通过 | 通过 | ✅ |
| RoleList.spec（4→9，+5：回填/保存/超管禁用/创建/父子联动半选回填一致，真实 el-tree） | 通过 | 通过 | ✅ |
| role-menus.spec（0→13，新增：夹具语义/GET 三态/PUT 五态/路由区分） | 通过 | 通过 | ✅ |
| auth-session.spec（Step 3b，0→10：mock 菜单按角色过滤/会话切换/撤权空树） | 通过 | 通过 | ✅ |

## 6. 通过项

- 后端 670 项全部通过，失败/错误/跳过均为 0。
- 前端 678 项全部通过，失败/跳过为 0。

## 7. 失败项

无。说明：后端输出中 `Migration of schema ... to version "31" failed` 为 `FlywayFullChainH2Test.adminSeedConflict_shouldFailExplicitly` **预期内**日志（故意构造 V31 冲突并断言 FlywayException，测试 PASS）；`429 too many requests` 为 agent 测试预期 mock 错误日志。均不影响结果。

## 8. 跳过项及原因

无。

## 9. 关键日志或错误信息

- 首轮前端 typecheck 失败（3 类新 spec 类型错误）→ 已修复后重跑四连全绿（step2 §5）。
- 其余无关键错误日志。

## 10. 是否满足验收标准（验收 9 逐条）

- 后端受影响测试与项目级全量测试通过且不低于基线 647/0/0/0：**满足，670/0/0/0**（Step 3 独立聚合 surefire XML 复核 + Step 3b 全量实测：110 文件 / 670 / 0 / 0 / 0；647+13+11=671 口径中 -1 为历史残留 PgV33VerificationTest 源码已删，文件数持平 110）。
- 前端 typecheck/lint/test/build 全部通过且不低于基线 71 spec/646 tests：**满足，73 spec/678 tests**（Step 2 实测 72/668 + Step 3b 实测 +1 spec/+10 tests；增量 2 spec + 32 tests 精确对应）。
- 命令遵守 2G 上限：**满足**（-Xmx2g / --max-old-space-size=2048）。
- 前后端编译互斥：**满足**（两 Step 各先行 ps 检查无对侧进程）。

## 11. 回归风险

- 前端 seeds 夹具 id 变更（15→18、10→20、角色 3/4/5 去重）：既有引用同步修正（子 parentId、wangwu roleIds），全量 678 通过无回归。
- 前端 mock 会话机制扩展（MOCK_CURRENT_SESSION/switchMockSession）：登录 handler 按用户名切会话，dev:mock 演示语义；既有会话相关测试保持通过（超管常量未变，向后兼容）。
- 后端生产代码零修改，新增测试均为新增请求级用例，既有 647 项原样通过。
- 残余风险：生产 403→500 兜底缺陷挂账（既有，未修，拒绝语义仍成立）；角色停用（status=0）时菜单/权限仍按绑定装配（既有行为，已如实记录，非本方向主路径）。两项均不影响本功能结项（详见功能完成回执 §4/§6）。

## 12. 最终结论

**PASSED**——测试执行与验收层面均通过：后端全量 **670/0/0/0**、前端四连 **73 spec files / 678 tests / 0 failures**，均不低于基线 647/0/0/0 与 71f/646t；验收 1-9 全部 PASS（Step 3b 补齐「非超管已授权菜单可见（正面）」「撤权后菜单不可达」证据后，初判 BLOCKED 已解除）。生产代码与 Flyway 零修改。验收 10（阶段三知识同步）待 Step 4 执行。

## 13. 记忆更新草稿（仅供规划角色核对后落盘）

- **state.md 追加行**：D121 M02-F02/F03 角色菜单/按钮权限契约一致性收口 | 后端 670/0/0/0（647+13+11，-1 历史残留）、前端 73f/678t（71f/646t+2 spec+32）；验收 1-9 PASS，BLOCKED 已解除；生产代码/Flyway 零修改 | 判定 PASSED（待规划层最终验收 + 阶段三）
- **decisions.md 新增条目**：无新增（403→500 为既有缺陷记录，非新决策）
- **issues.md 新增条目**：无新增（403→500 兜底与「角色停用后菜单/权限仍按绑定装配」既有行为已在功能完成回执 §4/§6 记录，属既有/挂账项）
- **features.md 状态变更**：待阶段三（M02-F02-01/F03-01 ✅、P1 核销）
