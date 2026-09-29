# 后台 SSO 配置管理与 B 端手机号准入（sso-admin-config，执行跟踪）

> 任务：`product/sso-admin-config/ready/direction-sso-admin-config.md`（L）；关联 P31（开放未核销）。
> **功能状态 `VERIFYING`（自验完成，待规划验收）**；审查 01/02 已下发并处理中。

## 当前状态（2026-09-29 16:2x 更新）

- **已验收范围**（审查 01 已锁定 + 审查 02 恢复后补强）：
  - 飞书准入真实链四段闭环：预建用户自动绑定 → 免密登录 → 手机号变更拒绝 → 恢复（审计 23 行）
  - A2 矩阵（审查 02 恢复后全数闭环）：无匹配用户（no local user with trusted phone）、
    租户内重复手机号（ambiguous phone in tenant）、他租户同号隔离（演示租户同号用户
    t1phoneholder 不影响 I5测试租户准入，V907 夹具）——均真实链+审计
  - **A2-b 揭示并修复 I5 遗留模式缺陷**：V84 绑定唯一索引含 deleted 列，解绑（UNBOUND，
    deleted=0）行占用唯一键 → 解绑后重绑必撞键。修复=准入重绑前物理删除占位行
    （`deleteDormantUnboundRows`；绑定历史由审计表承载）；外部主体占位行属其他本地账号
    仍拒绝（不自动迁移）。**双循环解绑/重绑真实链验证通过**（逻辑删除方案第二循环必撞，
    已弃用）。门禁：模块 332/0/0/0、bootstrap 锚 38/0/0/0、Boot 6/0/0/0
  - A3 分项权限矩阵：list/check、edit、enable、secret 四角色对象各自仅允许己方动作、
    其余 403（u_a3list/u_a3edit/u_a3enable/u_a3secret 四用户实测）
  - A4 票据-Provider 绑定：停用后未兑换票据拒绝签发新会话（Boot 用例+机制说明）
  - A5 加密兼容：同钥历史密文互读、异钥 fail-closed（SsoCredentialCipherCompatTest）
- **钉钉 B1（审查 02 裁决：BLOCKED，Owner 等待人工验证；暂停自动重试/控制台修改/催扫码）**：
  - 后台配置面已逐项核实（事实）：clientId 逐字一致（dingzoptrn9m3m33rwe1）、回调登记在册、
    Contact.User.Read 已开通、版本已发布（1.0.0→1.0.1 含网页应用能力）、可见范围=仅我可见
  - 实际观察（事实）：authorize 持续 900103「应用不存在」；无会话 curl 取到的登录页外壳
    不含该错误（错误由页面 JS 渲染）；无会话访问 login.dingtalk.com 被弹回官网；
    im.dingtalk.com 显示"系统维护中"；上午会话存活时同 clientId 链路可用
  - **900103 根因待验证**（审查 02 裁决：会话过期仅为工作假设之一，不排除应用配置或
    代码问题；不得写成定论）。解除条件：Owner 提供人工验证结果并明确可继续后，
    依据实际页面/错误/授权结果恢复
- **企业微信**：Owner 延期（保留配置记录只读，本期无新增启用入口）

## 候选与门禁

- Server `a34729c` → `5cd0c15` → `d39db4c`（批次 4—6：A4 票据绑定/A5 兼容测试/重绑修复）；
  Web `38672cd`（本轮零改动）
- 门禁（批次 6 后实跑）：模块 **332/0/0/0**、bootstrap 锚 **38/0/0/0**、Boot **6/0/0/0**
- 证据：`receipts/evidence/admission-chain-01/`（A1—A6 全套：运行身份、门禁日志、审计
  JSON、四链截图、A3 矩阵 JSON）

## 已证实事实（供后续复核）

- 飞书 mobile 属敏感字段：contact:user.phone:readonly（获取用户手机号）为必要权限；
  contact:contact.base:readonly / contact:user.base:readonly 均不携带
- 钉钉个人测试应用经 open-dev 控制台「应用开发」入口进入；发版后能力变更才生效
- 隔离验证环境 H2 内存库：重启即清库，审计/绑定不跨重启；Redis 缓存跨重启存活
  （权限装配排障时曾 FLUSHALL，限定本任务命名空间）
- V84 绑定唯一索引含 deleted 列的历史缺陷及修复（见上）
