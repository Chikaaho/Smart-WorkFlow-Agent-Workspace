# SSO规划审查05

日期2026-09-29。输入实施回执07及企业审计、错配日志、钉钉解绑、运行诊断、Surefire XML和产物/门禁附件。结论VERIFYING；后台页面开发前置尚未满足。

## 本轮核销

- G5-unbind：DINGTALK00325d5a绑定前在册、解绑成功、旧access401、旧refresh业务401/session_revoked、重认证后bindings=[]。指定对象已正确，核销。
- G2a-state/G3a-conflict：实际解析Surefire XML，tests=32/failures=0/errors=0/skipped=0，32个testcase与具名索引匹配。具名执行证据缺口关闭，保留最终候选适用性核对，不要求重做已锁定场景。
- G4-S：运行容器诊断确认唯一agentAesGcmCipher、ssoCipher不存在、往返成功，运行事实核销；后台配置阶段仍需处理明确依赖绑定与运维契约。
- 飞书审计完整JSON显示FEISHU/6bb50608/EXCHANGE/SUCCESS/scope=enterprise；钉钉personal完整JSON显示00325d5a/EXCHANGE/SUCCESS/scope=personal。锁定这些审计事实。

## 剩余仅两组

**R1（G3b企业矩阵封装与语义）**：dingtalk-enterprise-audit.json被截断在eventType后，JSON解析失败；可见片段不作为完整审计通过。飞书实际文件为feishu-enterprise-audit.txt，回执.json路径应更正，属转录不属产品缺陷。两份mismatch日志只有system.sso_binding_conflict，无ENTERPRISE_MISMATCH审计或输入配置关联，不能单凭日志区分普通绑定冲突。补完整脱敏审计、配置模式/标识摘要、同场景请求时点与拒绝前后无绑定/会话增量；优先提取已有审计，能证明就不重跑。个人模式飞书沿用旧链须确认新增SPI/企业检查后行为适用，否则仅补当前候选个人模式。

**R2（G4a候选与门禁时效）**：回执写最新链含762f427 scope修正，同时称jar从1f950e9构建且“G3b后无代码变化”，需消除矛盾。运行附件仍是cb5f17d旧jar完整哈希；07只有新哈希前缀。模块317及Boot4的原始日志仍指向9月28日旧314/29候选；新XML只证明32项类测试，不证明317模块和最新Boot门禁。提供最终完整SHA、scope修正是否进入产物、完整哈希/实际进程与企业矩阵时点关联、最终受影响门禁原始结果。已有准确制品则补定位，不为文案盲目重跑；若真实场景用旧候选，只重验被改动影响的场景。

企业内第二成员批量验证不是新增验收门槛；已要求的真实匹配与受控错误配置拒绝足以验证本次企业归属边界。企业微信继续Owner延期，生产部署不构成前置。下一入口planning-execution-prompt-three-provider-04.md，仅处理R1/R2。P31不核销；后台配置目标已确定但尚不放行实施。
