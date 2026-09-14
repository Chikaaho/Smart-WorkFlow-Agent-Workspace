# G5a-I 实际结果（引用行号见 g5a-matrix*.json / db-rows.txt）

## 正向
- 绑定成功（id=2099409639603679234, provider=FEISHU, userId=10002, ACTIVE，仅回 subjectDigest）g5a-matrix.json:5-19
- 启停链：toggle false → DISABLED（g5a-matrix2.json:7.disable / 8.list-after-disable），toggle true → ACTIVE（9.enable）；DINGTALK 查询为空（10.untoggle-none）
- V91 迁移已应用（v91-applied.txt / v91-boot-excerpt.log）

## 反向
- 重复 ACTIVE 绑定 → 400「该用户已存在同 Provider 的有效绑定」g5a-matrix.json
- 伪 Provider FAKE_SSO → 400「未支持的 Provider」
- 空主体 → 400
- 跨租户 userId=20001（T200）由 T100 会话绑定 → 400「用户不存在或已停用」（fail closed）

## 最小暴露
- 列表响应无 subjectCipher 字段、无明文回显（hasCipherField=false, hasPlaintext=false）

## 数据库权威回读（只读）
db-rows.txt：subject_cipher 为 AES-GCM base64 密文（以 SW_CIPHER_KEY 运行时注入密钥加密），subject_digest 为 SHA-256；非明文、不在 SQL 参数日志 stdout 泄漏面（无主体明文打印）。

## 覆盖边界
- resolveProviderSubject 解析链由投递运行时消费（通道 fail → G3d/G5b 侧断言）；本原子不要求 Provider 真实发送。
