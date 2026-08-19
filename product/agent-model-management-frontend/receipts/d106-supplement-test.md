# 补充测试回执：P5 / M07-F01 D106 补证测试门

> **功能名称**：大模型管理前端闭环（agent-model-management-frontend）— D106 补证测试
> **依据**：`receipts/planning-review-d106.md` §3
> **日期**：2026-08-19

---

## 1. 测试环境

| 项 | 值 |
|----|----|
| 后端 | H2 内存库（mvn test 真实执行 Flyway 33 迁移）；`MAVEN_OPTS="-Xmx2g"` |
| 前端 | vitest + @vue/test-utils + jsdom；`NODE_OPTIONS="--max-old-space-size=2048"` |
| 互斥 | 前后端严格串行；后端执行前 `pgrep -fl "pnpm|vite|vitest|node"` 零命中；前端执行前 `pgrep -fl "java|mvn|surefire"` 零命中（exit 1） |
| 平台 | macOS（Darwin 25.3.0） |

## 2. 测试前置条件

- 后端：`AgentModelConfigServiceImplTest`（12→18 用例）、`AgentModelControllerTest`（4→5 用例）新增完成，零生产代码改动
- 前端：`handlers.ts` test-connection 语义修正 + `agent-models.spec.ts` 断言同步（用例数不变）

## 3. 实际执行的测试命令

```bash
# 后端（严格串行，执行前互斥检查）
pgrep -fl "pnpm|vite|vitest|node"                 # 零命中
mvn -q -pl sw-basic/sw-basic-agent -am -Dtest=AgentModelConfigServiceImplTest,AgentModelControllerTest -Dsurefire.failIfNoSpecifiedTests=false test   # 模块级快验
MAVEN_OPTS="-Xmx2g" mvn -q test                    # 项目级全量

# 前端（严格串行，执行前互斥检查）
pgrep -fl "java|mvn|surefire"                     # 零命中（exit 1）
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck   # → 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint        # → 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm test        # → 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm build       # → 0
```

## 4. 各测试项结果

### 后端新增用例（全部通过）

| 用例 | 场景 | 预期 | 实际 |
|------|------|------|:---:|
| ServiceImpl 13 | other 协议 mock 200 | success=true、路径=根路径 | ✅ |
| ServiceImpl 14 | other 协议 mock 404 | success=true、message 含 404 | ✅ |
| ServiceImpl 15 | openai mock 401 | success=true、message 含 401、带 Bearer | ✅ |
| ServiceImpl 16 | ollama mock 404 | success=true、message 含 404、无 Authorization | ✅ |
| ServiceImpl 17 | enabled=false 配置 | success=true（连通性与启停无关） | ✅ |
| ServiceImpl 18 | lockedUntil=now+1h 配置 | success=true（连通性与锁定无关） | ✅ |
| Controller 5 | 无 token GET /agent/models | HTTP 401、code==401 | ✅ |

既有用例 8-11（openai 200 / ollama 200 / 网络不可达 / NOT_FOUND）原样保留全过。

### 前端连通性用例（重写后全部通过，用例数不变）

| 场景 | 断言 | 实际 |
|------|------|:---:|
| id=2 ollama 正常 | success=true、message/latencyMs 类型正确 | ✅ |
| id=6 enabled=false | success=true（不读取 enabled） | ✅ |
| id=3 other 且 disabled | success=true（other 协议可达语义） | ✅ |
| id=4 lockedUntil 未来 | success=true（不读取 lockedUntil） | ✅ |
| id=99999 不存在 | code=404、data=null | ✅ |

其余 8 条用例（seeds 安全边界/注册表快照/分页/详情/创建/更新/删除幂等/菜单树）零改动全过。

## 5. 通过项汇总

- **后端项目级全量**：**591 tests / 0 failures / 0 errors / 0 skipped**（584 + 7），BUILD SUCCESS；Flyway 33 迁移在测试日志全部通过，无新迁移
- 模块级快验：AgentModelConfigServiceImplTest 18 + AgentModelControllerTest 5 = 23，全绿
- **前端全量**：**69 spec files passed / 628 tests passed / 0 failures**；typecheck / lint / build 退出码 0
- 互斥检查证据：前后端各侧执行前 pgrep 零命中（已存 /tmp/mutex-pre-module.txt、/tmp/mutex-pre-full.txt）

## 6. 失败项

无（首跑即全绿；本次无失败项）。

## 7. 跳过项及原因

- PG 侧全链 V1→V33 真实库直跑：仍受既有 V13 2BP01 缺陷阻断（I52，非本轮引入，不在补证范围——D106 §4 明确）。
- 后端其他模块测试：由项目级全量 591 覆盖，无需单独跳过项。

## 8. 关键日志

```
# 后端全量
Tests run: 591, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS

# 前端全量
Test Files  69 passed (69)
Tests       628 passed (628)
✓ typecheck / lint / build 均 exit 0
```

---

**结论**：D106 §3 四项补证全部落地——验收标准 5（连通性场景集合完整）、6（授权/缺权/未认证三类链齐备）、7（Mock 与真实后端双向契约闭环）证据齐备，测试门终态：后端 **591/0/0**、前端 **69f/628t** 四连全绿。待规划层复验。
