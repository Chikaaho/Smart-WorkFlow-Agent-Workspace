# G3e-I 实际结果（email-matrix.log + db-rows.txt）

## 正向（服务端权威解析，稳定结果）
- 有效用户（10003 有邮箱）→ 解析通过、进入真实 SMTP 投递（失败原因=邮件投递失败，非解析失败）
- 缺失用户（999999）→「无法解析收件邮箱（用户无效或未登记邮箱），拒绝发送」
- 跨租户（20001 属 T200）→ 同上解析失败 fail closed；全局账号（id=1，非授信租户内）→ 解析失败
- 直发幂等：同一幂等键双发 → 仅 1 条消息行（db-rows.txt idem-e1），结果回照稳定
- 客户端无法旁路：请求体无任何收件地址字段，地址只来自 sys_user 权威列

## 反向
- 跨租户/缺失目标不产生 SUCCESS；全部落库 FAILED 且有区分原因（db-rows.txt 逐行）

## 覆盖边界
- PHONE：NotifyTargetResolverImpl.resolvePhone 已实现（sys_user.phone 权威列），
  但生产 SMS 适配器未落地（Owner 短信 Provider 选型未提供；SMS 槽位在 dev 由 P58 调试适配器占位
  —— 使用其作手机解析证据会构成调试桩，故不作证据）；PHONE 行为收口挂在 G5b SMS 外部条件，
  本原子 PHONE 部分按覆盖边界登记，非 DONE 声明。
- EMAIL「重复绑定」语义由 G5a-I 主体绑定重复矩阵（400「该用户已存在同 Provider 的有效绑定」）覆盖。
