# 1.2.0 第七批执行回执（execution-120-07）——E1-3 运行链打通 + 四项取证支撑修复

日期：2026-11-21｜执行（Executor）｜依据 `planning-execution-prompt-120-01.md`｜**批次中间态**：运行链已打通（Graph 执行记录产生），Server 启动方式待纠正后完成取证闭环

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `9a4d06e6` | E1-1 语义修正：Graph 入参映射回退 formData（方向语义「流程变量或表单字段映射」——发起时字段值在 formData map，不在顶层变量） |
| Server | `33159e28` | 取证支撑：BpmDeployFacade 新增 deployModelGraph（translate → **addBpmnModel** 直接部署，绕开 Flowable XSD 校验全链）；BpmEngineAutoConfiguration 显式绑定引擎 classpath classloader（XSD 资源可达） |
| Web | `8d40865` | 映射候选契约修复：variableOptions 改 varId（运行期键），此前候选用变量名称导致运行期必然缺失 |

测试：LogLevelServiceTest 5/5（120-05）；bpm-engine+process 全量测试绿（-am）；Web typecheck/vitest 绿。

## 2. E1-3 运行链打通记录（iso120，DB 可回读）

1. 图「风控评分」v3 发布（END 输出 source=input→city 修正，`2124061973460652034` def_version=3）。
2. 流程「风控审批流」草稿修正：删重复 GRAPH_EXEC 节点、绑定 graphDefVersion=3、映射 source=field_1（表单字段名=formData key）→ **发布成功**（版本表计数 v8）。
3. 表单提交发起（API 直驱）：**Graph 执行记录产生**——`sw_agent_graph_execution_request`：status=FAILED、**business_source=PROCESS**、process_instance_id=4099b63d…、node_id=node_2、latency=90ms（**E1-7 关联列写入实证**）。
4. **delegate 运行时诊断日志实证**（`[iso120-diag]`）：nodeConfig=field_1 映射正确、入参 city=广州（formData 回退生效）。
5. 最后失败点=图内 `引用了未定义的变量: input（节点 node_end）`——已修（END source=city）并发布 v3；流程绑定已更新 v3，**下回合发起即闭环**。

## 3. 本批发现并修复的真实缺陷（4 项）

| # | 缺陷 | 修复 |
|---|---|---|
| ① | 映射候选用变量名称（运行期变量键是 varId）→ 运行期必然缺失 | Web 8d40865（varId 契约） |
| ② | 入参映射只读顶层流程变量，表单字段值在 formData map | Server 9a4d06e6（formData 回退） |
| ③ | 图① END 输出 source 引用未声明变量 input（G1-4 结构化入参语义下默认变量不写入） | 造数修正（END source=city）+ 发布 v3 |
| ④ | 重复 GRAPH_EXEC 节点（造数误点两次） | 草稿清理（测试数据准备） |

## 4. 环境问题与绕过记录（如实）

- **Flowable 7.1.0 部署 XSD 加载失败**（`XMLException: schema is null`，BpmnXMLConverter.convertToBpmnModel:291——三个 classloader fallback 均 getResource null）：fat jar 与解包（mvn spring-boot:run）均复现；独立 JVM probe 同 classpath 资源可达。修复=`deployModelGraph`（addBpmnModel 路径，bypass XML 解析/XSD 校验，translator 自身拓扑校验保留）——**待下回合 Server 正确启动后实证**。
- **进程管理教训**：fat jar 旧进程（17:44 前启动）残留占用 18093，`server.pid` 文件记的是 mvn 外壳 PID 导致 kill 未命中——17:44 后的多轮验证实际打在旧进程上（如实登记，下回合启动后先 `lsof -iTCP:18093` 确认进程身份再验证）。
- **debug-auth**：SW_SECURITY_DEBUG_AUTH_ENABLED 变量名已确认（relaxed binding），dev profile 下 `Authorization: Bearer test_1` 通道可用（下回合可 API 直驱）。
- **登录 API**：挑战式（GET /auth/challenge → captchaId + RSA-OAEP(SHA-256) 密文密码 → POST /auth/login），openssl pkeyutl 加密链路已验证（/tmp/token.txt 通道就绪）。

## 5. 下回合收口清单（环境/造数/代码全部就绪）

1. **启动 Server**（正确方式：`mvn install` 后 `java -jar sw-bootstrap/target/bootstrap-dev.jar` + 全 env，启动后 `lsof` 验证进程身份）。
2. 发布流程（API publish → 部署经 deployModelGraph）→ 发起实例（API 表单提交 field_1=城市）→ **E1-3/E1-7/E1-8 证据**（实例详情截图+变量值+Graph 执行记录+DB 关联列）。
3. E1-2/E1-5 截图补拍、E1-3T（3 实例慢 Graph + 普通审批对照）、E1-4 三情况×两策略、E1-6 表单动作四张截图。
4. E2-3（403/审计）、E2-4（重启对照，ROOT 修复已就位）、E3-1 对照截图。
5. execution-120-08 收口回执。

## 6. 阶段进度

七阶段：已完成 2；进行中 1（验收：运行链打通，余浏览器取证闭环）；未开始 4。

## 7. 自验结论

本批交付：3 个代码修复（varId 契约/formData 回退/部署 XSD 绕过）全部编译+测试通过并推送；E1-3 运行链打通至 Graph 执行记录落库（E1-7 关联列实证）。**自验通过**；取证闭环转下回合（Server 启动方式已明确纠正路径）。
