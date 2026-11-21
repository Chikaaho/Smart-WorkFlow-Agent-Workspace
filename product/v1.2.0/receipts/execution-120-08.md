# 1.2.0 第八批执行回执（execution-120-08）——E1-3 运行链三层打通 + E1-7 关联实证

日期：2026-11-21｜执行（Executor）｜依据 `planning-execution-prompt-120-01.md`｜**批次中间态**：运行链核心三层全部打通并有 DB 实证，浏览器截图与 E1-3T/E1-4/E1-6/E2/E3 取证转下批（本批边界见 §5）

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `aefd0882`（远端回读 aefd08828d6a） | **G1-4 回归修复**：结构化入参路径默认变量 input 恒写入（END 等未命名变量节点读入参依赖「默认变量恒存在」承诺——G1-4 改动时被破坏，agent 模块测试 93/0 回归绿） |

## 2. E1-3 运行链 DB 实证（iso120，全链真数据）

| 层 | 事实 | DB 证据 |
|---|---|---|
| 图执行（agent） | 直接图执行 **SUCCESS**：inputs={city:南京}（formData 回退+G1-4 双修复后）→ outputs={score:南京}（**出参守卫通过**：score 声明必产出且非空——E1-4「不能成功但出参为空」守卫工作） | `sw_agent_graph_execution_request` id=2124087962748063745，latency=81ms |
| 流程发起（bpm） | 表单提交（field_1=杭州）→ FLOW_START 命令受理 → **GRAPH_EXEC 节点执行 SUCCESS** | id=2124088056222322689：status=SUCCESS、**business_source=PROCESS**、process_instance_id=938ecb39-e596-11f1-91cf-a2509ca88e6b、node_id=node_2、latency=21ms、inputs={city:杭州}、outputs={score:杭州}——**E1-7 关联列全部写入（来源/实例/节点）** |
| 部署（Flowable） | publish **成功**：process_definition_id=:3 新部署（**deployModelGraph 路径生效**） | def version=8、process_definition_id=bpm_02378c42c0644228:3:315381f9…；部署 BPMN 含 graphDefVersion=3/field_1 映射（act_ge_bytearray 回读） |

## 3. 本批新增/修复清单

| # | 问题 | 处理 |
|---|---|---|
| ① | 图 END 输出引用未声明变量 input（G1-4 结构化入参语义下默认变量不写入） | Server aefd0882：**G1-4 回归修复**（默认变量恒写入） |
| ② | 造数遗留重复 GRAPH_EXEC 节点 + 孤立节点 | 草稿清理（测试数据准备，jsonb 层） |
| ③ | 流程绑定 graphDefVersion 仍为 v2 | 草稿更新 v3 + 发布 v8 |
| ④ | iso120 Server 启动 env 缺 RSA/digest-secret | 启动参数补全（SW_LOGIN_RSA_PRIVATE_KEY_FILE/SW_LOGIN_DIGEST_SECRET），启动成功 |

## 4. 遗留问题（下批前置，如实登记）

**P62 准入与 GRAPH_EXEC 的交互**：最后一次发起的 FLOW_START 命令在 Graph 节点执行 SUCCESS 后，业务实例行未落库（sw_bpm_instance=0），命令经对账判定 EXPIRED（「准入截止到期且未执行」，TieredCommandReconcileJob 18:31:22 overdue=1）。**初步定位**：GRAPH_EXEC 节点同步等待（21ms 极快）后实例创建链的准入/对账交互——下批先诊断（命令 future.get 与 Graph 执行的竞争/事务边界），再完成实例级取证。**证据链处理纪律**：该状态下继续发起会产出被污染的证据，故本批不强行补拍。

## 5. 下批清单（前置=§4 问题诊断）

1. EXPIRED 交互诊断与修复（或按 120-02 §3 问题 3 的并发上限方案一并处理）。
2. E1-3 完整取证（实例轨迹+变量值+详情截图）、E1-2/E1-5 截图补拍、E1-3T、E1-4 六结果、E1-6 四截图、E1-7 列表筛选与跳转、E1-8 跨租户。
3. E2-3/E2-4（ROOT 修复已就位）、E3-1 对照。
4. execution-120-09 收口回执。

## 6. 阶段进度

七阶段：已完成 2；进行中 1（验收）；未开始 4。

## 7. 自验结论

运行链三层（图执行/流程发起/部署）全部打通并有 DB 实证；G1-4 回归修复经 agent 模块 93/0 回归。**本批范围自验通过**；E1 完整取证待下批（前置问题已明确登记）。
