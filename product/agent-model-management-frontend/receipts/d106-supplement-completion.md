# 补充完成回执：P5 / M07-F01 D106 补证闭环

> **功能名称**：大模型管理前端闭环（agent-model-management-frontend）— D106 补证
> **依据**：`receipts/planning-review-d106.md` §3「必须补齐的方向偏差」
> **日期**：2026-08-19
> **主体实现**：D106 保留，不重做；本回执只补证据闭环

---

## 1. 补证范围（对照 D106 §3 四项）

| D106 要求 | 补证动作 | 状态 |
|----------|---------|:---:|
| ① other 协议与远端 4xx 可达自动化证据 | 后端 ServiceImplTest +6 用例（见下） | ✅ |
| ② 未认证访问模型接口 401 证据 | 后端 ControllerTest +1 用例（无 token GET /agent/models → 401） | ✅ |
| ③ Mock 禁用/锁定连通性与真实后端双向核对 | 后端代码级语义结论 + 前端 handler/spec 修正（见 §2） | ✅ |
| ④ 重新给出受影响测试与测试门终态命令、退出码、计数；逐项更新标准 5/6/7 证据引用 | 本回执 + `d106-supplement-test.md` | ✅ |

## 2. 双向契约核对结论（标准 7 的核心证据）

**后端真实语义（代码级，`AgentModelConfigServiceImpl.testConnection`，零生产改动）**：
- 纯只读网络探测：方法体内**无任何 `getEnabled()` / `getLockedUntil()` 读取**（enabled 仅出现在 toEntity/toDTO，lockedUntil 仅出现在 toDTO 展示）
- 2xx～4xx 全部 `success=true`（`catch (RestClientResponseException)` → message「服务可达（HTTP xxx）」）；仅网络层异常（`ResourceAccessException`）→ `success=false`
- `other` 协议：GET baseUrl 根路径（switch default 分支 `""`），200/404 均可达
- 仅「配置不存在」→ NOT_FOUND（业务 404，非连通性语义）

**前端 Mock 修正（提交 `1436956`）**：
- 原「disabled→success=false」「锁定→429」假语义**移除**；handler 改为「存在即 `{success:true, message:'服务可达（HTTP 200）', latencyMs}`」，不读取 enabled/lockedUntil
- 保留「不存在 → 404」；注释重写为与后端语义一致（纯网络探测、2xx~4xx 可达、仅网络层失败）
- spec 用例断言同步：disabled 配置、other 协议 disabled、lockedUntil 未来均 → success=true；不存在 → 404

## 3. 新增证据清单

### 后端（提交 `5e0a9c9`，+7 用例，零生产代码改动）

`AgentModelConfigServiceImplTest`（12→18）：
| 用例 | 场景 | 断言要点 |
|------|------|---------|
| 13 | other 协议 mock 200 | success=true、请求路径恰为根路径 `/` |
| 14 | other 协议 mock 404 | success=true、message 含 `404`（不校验响应体） |
| 15 | openai mock 401 | success=true、message 含 `401`、已携带 Bearer 头（鉴权失败≠网络不可达） |
| 16 | ollama mock 404 | success=true、message 含 `404`、无 Authorization 头 |
| 17 | enabled=false 落库后测试 | success=true（连通性与启停无关） |
| 18 | lockedUntil=now+1h 落库后测试 | success=true（连通性与锁定状态无关） |

`AgentModelControllerTest`（4→5）：
| 用例 | 场景 | 断言要点 |
|------|------|---------|
| 5 | 无 token GET /agent/models | HTTP 401、响应体 code==401（复用 Storage/Job ControllerTest 未认证先例：真实 Security 链 + AuthenticationEntryPoint 写 401） |

### 前端（提交 `1436956`，+35/-32，用例数不变）

- `handlers.ts` test-connection 语义修正（§2）
- `agent-models.spec.ts` 连通性用例 5 场景断言重写（disabled→true / locked→true / other-disabled→true / 正常→true / 不存在→404）

## 4. 测试门终态（详见 `d106-supplement-test.md`）

- 后端：**591 tests / 0 failures / 0 errors / 0 skipped**（584 + 7）
- 前端：**69 spec files / 628 tests / 0 failures**，typecheck/lint/test/build 四连退出码 0
- 均 2G 上限、严格串行、每次执行前互斥检查（pgrep 无 java/mvn 或 pnpm/vitest 进程）

## 5. 验收标准 5/6/7 更新后的证据引用

| # | 更新后结论 | 证据 |
|---|-----------|------|
| 5 | **PASSED（补证后）** | 场景集合完整：OpenAI 200/401、Ollama 200/404、other 200/404、网络不可达（连接拒绝）、目标不存在 NOT_FOUND——全部自动化用例（既有 8-11 + 新增 13-16）；前端展示 success/message/latencyMs 不改判语义（ModelList.spec ⑥⑦）；Mock 结构一致（agent-models.spec 连通性用例） |
| 6 | **PASSED（补证后）** | 三类请求链齐备：授权成功（既有 ControllerTest 2）、缺权 403（既有 ControllerTest 1/3，manage 不越权 test）、**未认证 401（新增用例 5）**、superadmin 旁路（既有用例 4）；前端按钮 hasPerm 显隐（ModelList.spec ⑧⑨） |
| 7 | **PASSED（补证后）** | 双向契约闭环：后端代码级语义（testConnection 不读 enabled/lockedUntil、2xx~4xx 可达）+ 后端新用例 17/18 自动化证明 + 前端 handler 移除假语义并同步 spec + 69f/628t 全绿（含既有 F02/GraphDesigner 回归） |

## 6. Git diff 摘要

| 仓库 | 提交 | 变更 |
|------|------|------|
| Smart-WorkFlow | `5e0a9c9` | 2 测试文件 +178 行（+7 用例） |
| Smart-WorkFlow-Web | `1436956` | 2 文件 +35/-32（handler 语义 + spec 断言） |
| 工作区根 | `b2380de` | 6 文件（知识层 D106 状态同步） |

## 7. 未完成内容与遗留

- 无补证范围内未完成项。I52（PG V13 既有缺陷）不在补证范围（D106 §4 明确），待规划层另行决策。
- 终态确认（P5 核销、I45 子集、五行清单最终上调）留待规划层复验。
