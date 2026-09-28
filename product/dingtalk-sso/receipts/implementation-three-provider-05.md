# 三方 SSO 实施回执 05（G6 企微配置完成）

入口不变（一级补证提示 01）；VERIFYING；P31 不核销；追加回执。Owner 已提供：CorpID（已存运行时受保护临时文件）、可信域名授权决定「用 chikaho.cn 就行」。

## 企微配置完成项

- **CorpID 已取得并存运行时受保护临时文件**（Owner 提供，值不落制品）。
- **可信域名配置成功**：应用"SW-SSO验证"（AgentId 1000002）→ Developer API → Web Authorization and JS-SDK → **Trustable domain name: chikaho.cn**（页面回读原文；归属验证通过）。
- 域名归属验证实施：生产 nginx（/etc/nginx/conf.d/chikaho.cn.conf）新增精确 location 返回校验内容 `WW_verify_Pnwf7ot9UAMywsNi.txt`（变更前备份 `.bak-20260929-sso`；`nginx -t` 通过后 reload；公网 `https://chikaho.cn/WW_verify_Pnwf7ot9UAMywsNi.txt` 实测 200）。回退=删除该 location 块并 reload。Owner 已授权域名方案（「用chikaho.cn就行」）。
- WECOM 哨兵行在本轮 /tmp 种子中已停用（独立密钥不兼容，回执 03）；真实 WECOM Provider 行待 Secret 后落库。

## Secret 状态（待 Owner）

View Secret 的二次验证确认须在**企微客户端**完成（浏览器打开 2FA 链接仅提示"Open it in WeCom"）。请 Owner：①在企微客户端确认验证请求；②确认后 Secret 经"企微团队"会话送达（或控制台直显），转交执行。收到后执行：独立密钥重加密落 V904 WECOM 行（enabled=1，app_id=CorpID，extra_config 含 agentId=1000002）→ 重启回读。

## 真实链边界（重要，需 Owner 单列授权）

企微可信域名=chikaho.cn（域名级），OAuth redirect_uri 必须落在该域下——**本地 localhost 验证环境无法运行企微真实链**；回调可用前提是把含共用回调修复的两仓新代码部署到生产（生产部署不在本方向自动授权内）。可行方案：Owner 单列授权一次生产部署（含企微回调路径），随后企微真实链在生产环境按既有验收口径执行。

## 其余

钉钉六段已完成（回执 04）；飞书自验提交补证中；G3b 企业归属模型待 Planner 裁决——均不变。
