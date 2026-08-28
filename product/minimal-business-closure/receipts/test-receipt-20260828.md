# 测试回执

> 功能：minimal-business-closure（流程主链 + 最小设备控制）
> 日期：2026-08-28
> 对应执行回执：`receipts/execution-receipt-20260828.md`

## 1. 测试环境

- 后端：Java 21 + Spring Boot 3.4 + H2（Flyway 全链 41 版）+ Flowable 7.1；dev 服务器 `spring-boot:run -Dspring-boot.run.profiles=dev`（H2 内存 + 本地 Redis）
- 前端：Vitest + jsdom（109 spec）；1 条 live 链路 spec 直连真实后端 8080
- 前后端编译互斥：已用 `ps` 检测，全程未并行编译

## 2. 测试前置条件

- `mvn -q install -DskipTests` 后启动 dev 服务器（新代码 jar 生效）
- 真实链路取证脚本按 Run 随机号隔离数据（用户/表单/设备/流程 key 均含随机后缀）
- 前端 live spec 前置：admin/admin123、tooluser/user123（角色2 绑定菜单 212/213）——已在 dev 服务器补种

## 3. 实际执行的测试命令

```bash
MAVEN_OPTS="-Xmx2g" mvn test                                # 后端全量
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck     # 前端
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
bash /tmp/evidence-chain.sh                                  # 真实 HTTP 行为链（37 步）
```

## 4. 各测试项结果

| 项 | 结果 |
|---|---|
| 后端 mvn test（全模块） | **915 通过 / 0 失败 / 0 错误**，BUILD SUCCESS |
| FlywayFullChainH2Test | 25 项全过，41 版迁移全链成功（含 V40 IoT、V41 Form CLOB） |
| 前端 pnpm typecheck | 通过，无类型错误 |
| 前端 pnpm lint | 0 errors（1 条既有 warning，非本轮引入） |
| 前端 pnpm test | **109 文件 / 1050 用例全部通过**（含 1 条真实后端 live 链路 spec） |
| 真实 HTTP 行为链 | 37 步全部 code=0（仅 2 处预期内非 0：普通用户 403、旧密码 401），见 `behavior-evidence-20260828.md` |

## 5. 通过项（关键行为断言）

- 修改密码：改密成功 → 旧密码 401 → 新密码登录成功
- 权限：普通用户 `/system/user/page` 403、workflow 只需登录即可访问（方向要求"未授权不能越权"的服务端校验真实生效）
- 表单：创建/改名/配置/发布（建宽表）/删除草稿 全链 code=0
- 流程：创建（绑定表单）→ 保存含 DESIGNATED 审批节点的图 → 修改名称 → validate 0 错误 → publish PUBLISHED（deploymentId 回填）→ 删除草稿流程
- 发起：表单提交异步生成 Flowable 实例（processInstanceId 真实、status=RUNNING、businessKey=表单记录 ID）
- 审批：审批人待办出现（assignee=admin）→ complete → 实例 APPROVED → 发起人视角可查、flowTrace 完整
- 设备：注册即 ONLINE；审批通过自动下发 power_on → SUCCESS + 执行结果 + approvalBizId=流程实例 ID；手动下发 power_off SUCCESS；设备回写 FAILED 结果生效

## 6. 失败项

无（遗留失败均已修复：H2 JSON 列读回包装→V41 迁移；部署无租户→deployModel 携带租户；DESIGNATED 未实现→@Qualifier 修复注入；蛇形列名→双命名兼容；live spec 环境前置→补种数据）

## 7. 跳过项及原因

无

## 8. 回归风险

- Flyway 迁移计数基线由 39→41（FlywayFullChainH2Test 已同步）；PostgreSQL 链新增 V40（iot），无破坏性变更
- `PUT /workflow/defs/{id}` 仅 DRAFT 可改（PUBLISHED 返回 2105），publish 自动落绑定可能覆盖同 formKey 旧启用绑定（符合"一表单一启用绑定"唯一索引约束）
- 前端零代码修改，回归基线与上轮一致（1050/1050）

## 9. 是否满足验收标准

是：方向 §三流程主链全部环节均有真实 HTTP 行为证据；方向 §四允许的模拟设备链已贯通审批结果→命令下发→结果返回

## 10. 最终结论

PASSED（执行层自验，最终判定权在规划角色）

## 11. 记忆更新草稿

- state.md：无新增行（沿用执行回执行）；基线：后端 915→915、前端 1050→1050
- decisions.md：无新增
- issues.md：无新增
- features.md：无变化
