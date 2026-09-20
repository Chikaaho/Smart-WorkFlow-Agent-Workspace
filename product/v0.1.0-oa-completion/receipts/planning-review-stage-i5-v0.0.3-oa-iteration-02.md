# P60 I5 阶段实现规划验收 02：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-13  
> 验收对象：stage-i5-v0.0.3-oa-iteration-02.md  
> 方向：../ready/direction-stage-i5-tenant-safe-third-party-sso.md  
> 结论：**未通过；I5 保持 VERIFYING**

## 1. 总结论

本轮已补入真实运行日志，且生产匿名暴露矩阵可以锁定；但回执所称 G1—G7、G9 全部完成与原始附件不一致。当前既有真实产品行为缺陷，也有对象不匹配和缺证据，不能把剩余项只归因于 G8 外部 Provider 条件。

关键反证如下：

- 双租户证据实际使用 leave_t100_g1b 与 leave_t0_g1，不是相同 formKey；发布响应中的物理表名为 null，也没有配置、快照、列表配置和数据库唯一性回读。
- /openapi/v1/form-data/list 匿名请求返回 500 系统异常，不是确定的认证/租户 fail-closed；异步、OpenAPI、IoT 的已认证租户缺失/冲突/停用/过期矩阵仍不存在。
- 同一 WECOM state 的两次回调都再次得到 Provider errcode=40013，第二次没有被本地一次性消费门拒绝，构成 state 重放反证。
- sentinel-ext-g6-user 在服务端 SQL 参数/结果日志中明文命中 7 次；这与方向要求的敏感外部主体在普通日志、SQL 参数输出中零残留冲突。
- 无角色用户访问 /system/user/list 得到 400 参数非法: id 而非权限拒绝；没有真实 PC/移动 H5 页面、深链和守卫行为。
- “无任何密钥”的外部启动日志先因 PostgreSQL 连接失败退出；集成测试标记为缺 JWT，却实际由缺 RSA 私钥先行拦截。JWT、Druid、启用 Provider 的缺失值与占位值没有逐项独立行为结果。
- V86 索引与单测是结构/测试证据；没有同一 Provider 应用/组织稳定主体跨租户绑定的真实正反对象矩阵，也没有停用账号、撤权、租户禁用、解绑后的登录与会话零副作用回读。
- manifest 只列 15 个文件哈希和旧基点 aaafd747…，未记录候选 5e976b89… 的工具回读，也没有 sha256 清单校验结果。

因此提交契约中 G1—G7/G9=COMPLETED、remaining_actionable_count=0 不再成立。G8 仍是合法外部依赖，但其余授权内工作尚未穷尽。

## 2. 17 项逐项复核

| # | 结论 | 本轮核销结果 |
|---|---|---|
| 1 | 未通过 | 两租户不是同键；无配置/快照/列表配置及持久化租户回读。 |
| 2 | 未通过 | H2/PG 迁移到 V86 有真实日志，但同键、物理表名和唯一约束正反行为未证明。 |
| 3 | 未通过 | tenant 100 主链已真实运行，但证据没有同租户表单绑定动作、命令/Flowable task tenantId 与逐层数据库勾稽。 |
| 4 | 未通过 | 仅跨租户表单详情和实例详情；定义、绑定、任务、工作台读写、发起、办理与零副作用矩阵缺失。 |
| 5 | 未通过 | 布局使用不同 userId，未证明同一 userId 在两个租户互不覆盖；marker 原文亦未回读。 |
| 6 | 未通过 | 四类入口的有效签名/身份矩阵缺失，OpenAPI 匿名路径出现 500。 |
| 7 | 未通过 | 固定验证码、JWT/Druid/启用 Provider 缺失及占位值没有各自独立的 prod 行为；外部启动退出原因不匹配主张。 |
| 8 | **PASSED（锁定）** | g3-prod-boottest.log 真实 prod-profile 启动后，health 仅返回 UP，metrics/env/heapdump/prometheus/swagger/api-docs/druid 均匿名拒绝。 |
| 9 | 未通过 | 空角色身份的 me/menus/form 证据有效，但用户数据接口不是 403，且无 PC/移动页面与深链行为。 |
| 10 | 未通过 | 缺登录前后、refresh、已有会话、停用/过期/撤权/改密/登出的同一对象收敛链；第三方一致性尚未成立。 |
| 11 | 未验证 | 三 Provider 真实成功链仍缺外部应用、HTTPS 白名单与测试身份；保持 VERIFYING。 |
| 12 | **未通过** | 实际 state 重放未被本地拒绝；白名单仅有结构/单测声明，三 Provider 的错配、过期、code 重放行为不完整。nonce 官方不支持映射可沿用。 |
| 13 | 未通过 | 无跨租户稳定外部主体真实冲突链，也无停用/撤权/租户禁用的真实第三方行为。 |
| 14 | 未通过 | 回执自认无浏览器证据；PC/移动 H5 的发起、回跳、绑定、解绑、错误恢复和同会话结果未证明。 |
| 15 | **未通过** | 审计基本查询有真实 HTTP 证据，但筛选维度不完整，且外部主体在 SQL debug 日志明文命中 7 次。 |
| 16 | 未通过 | Server/Web 门禁和迁移输出存在，但候选 manifest 未工具回读校验；后续修复还会使当前快照失效。 |
| 17 | 未通过 | 当前真实链有 OpenAPI 500，且受影响的认证/权限/租户/工作台/PC-移动路径尚未闭合。 |

## 3. 锁定项与可沿用证据

- 验收标准 #8 锁定为 PASSED，证据：evidence/i5-02/g3-prod-boottest.log 中 [G3-BOOT] 与 [G3-MATRIX]。除非后续实现触及生产安全暴露配置或出现反证，禁止重验。
- evidence/i5-02/g5-nonce-official-mapping.md 的“三 Provider 官方授权端点不支持 OIDC nonce”结论可作为 #12 的已核子结论沿用，但 #12 整项未通过。
- Server/Web 门禁与迁移至 V86 的原始输出只作本轮历史快照；一旦修复实现，必须以最后候选的受影响门禁替代，不能直接锁定 #16/#17。
- I1—I4 未受影响历史能力继续锁定，不重新展开。

## 4. 失败诊断与升级

| 分类 | 对应缺口 |
|---|---|
| 实际产品缺陷 | state 重放未拒绝；外部主体写入 SQL debug 日志；OpenAPI 匿名入口 500；无角色数据接口未在权限层拒绝。 |
| 证据对象不匹配 | 不同 formKey 冒充同键；不同 userId 冒充跨租户同用户布局；缺 JWT 主张实际由 RSA/数据库先拦截。 |
| 缺证据 | 完整租户对象矩阵、凭据逐项 fail-fast、回调白名单真实正反、跨租户绑定、会话收敛、PC/移动浏览器、manifest 校验。 |
| 合法外部依赖 | G8 三 Provider 真实成功链。 |

这是上述同类缺口连续第二次复验未通过。依据 roles/planner.md §7.1，已下发一级执行补充提示：

planning-execution-prompt-stage-i5-tenant-safe-sso-01.md

## 5. 下一次提交

唯一执行入口为上述一级提示。Executor 只处理其中未锁定的原子项，追加：

product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-03.md

原始证据进入新目录 evidence/i5-03/，不得覆盖 i5-02/。回执继续保持 VERIFYING / EXECUTION_SUBMITTED；不得推送候选、开始 I6、核销 P60/P31 或写 I5 PASSED/COMPLETED。
