# i6-04 对象总账本（二级提示02 · 采集 2026-09-14）

## 源码指纹（登记起点，G8a 之前必须重新生成）
- Server HEAD: 7ccecac364a63f2a017d8c5f33dbd45b9e99dccc
- Web HEAD: a7868258e83ded3500c47d9984c66dab5c008fa8
- Workspace HEAD: 3c66aa7f4e2d66d821a243903165e62c5d6e3aac
- 源库与迁移身份：Flyway 双方言终点 V90；PG 旧库演练与 H2 演练 DB 身份分开登记（见 G7b/objects.md）

## 流程与通知对象（G1a/G4/G6 同一集合）
- 租户 T=100（U1 管理员 id=1、U2 审批人 id=2、U3 无权 id=99）；租户 T2=200（同名资源用于隔离矩阵）
- 实例 P=<待建>；任务 K=<待建>；动作 A=APPROVE；消息 M=<流程通知建成后登记>
- 指数退避恢复链沿用文件库 target/i6-restart-db（G1c-E；变更则登记新旧 ID）
- PG 旧库升级演练 DB：target/i6-g7b-pg（真实 PG，非 fresh-chain；凭据仅本地安全配置）

## 采集规则
- 每原子目录必须含 command.txt/stdout.log/stderr.log/exit-code.txt/objects.md/actual.md。
- 正反断言、零残留与清理计数在 actual.md 引用原始行号。
- Mock 检查：默认 dev 直连后端；dev:mock 不参与证据链。

## 环境真实身份（2026-09-14 更新，Docker daemon 已运行）
- 容器 postgres：postgres:latest（PG 18.4），映射 0.0.0.0:5432→5432，凭据仅本地安全配置（容器内 trust）
- 容器 redis：redis:latest（0.0.0.0:6379→6379）；Windows Redis 服务同时 RUNNING（双通道）
- 旧基线库：smart_workflow（V11 66表，如实空骨架）→ 已克隆 i6_g7b_pg（TEMPLATE smart_workflow，G7b 专用）
- 运行库：smart_workflow_run（新建，server boot Flyway 迁移载体）；本地 server：sw-bootstrap jar，profile=local
- server 密码/PID 采样采集时间：见 env-capture.txt；secret 零落盘

## 环境真实身份（2026-09-14 17:22 第二次更新，固定验证码收口）
- 运行 server（dev profile 固定验证码收口）：`mvn spring-boot:run -pl sw-bootstrap -Dspring-boot.run.profiles=dev` + 命令行覆盖 `spring.datasource.dynamic.datasource.master.*` 指向 PG 127.0.0.1:5432/smart_workflow_run（凭据经环境变量运行时注入，不落盘）；SW_LOGIN_RSA_PRIVATE_KEY/SW_LOGIN_DIGEST_SECRET/JWT_SECRET/SW_CIPHER_KEY 运行时生成注入，secret 零落盘
- 固定验证码依据 I5 门禁代码 `LoginChallengeService.generateCaptcha`：纯 dev/test profile + ch.dev.test-mock=true 时答案固定 1234；实测 challenge→login(u1_100/admin123/1234)=200 code=0 accessToken 下发（object-setup/login-fixed-captcha.js 原始流）
- 旧 local profile 进程（PID 41236，jar 遗留）已终止，端口 8080 由 dev profile 进程接替
- devseed 口令 admin123 与 V900 种子同源（仓库公开 dev fixture，非秘密）

## 终版（G8a 前时点，2026-09-14 晚）
- Server HEAD: e941d74ffb3e5388e1b3ac3efb234d4634436aea（develop，clean）；提交链 1ea3d41→4f556df→3676af1→e941d74
- Web HEAD: 0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6（develop，clean）；acdd3af→0a746e3
- Workspace: fa4bddf（证据）→946a3b9（gitlink）→d151bb0（G8a manifest）
- 门禁：Server 1361/0/0/0 BUILD SUCCESS；Web typecheck/lint/test(1185+3)/build 全 exit 0
- Flyway：H2 终点 V92（92 条）/ PG 终点 V92（90 条）；G7b 库 i6_g7b_pg=V92（90 条，同 ID 90001-90003/90011/90012/90020 保留）
- 对象变更登记汇总：TaskActionService 退回新轮次通知；BpmNotifyLinkAuthorizer 新增；
  NotifyHome 深链按钮/ProcessInstanceList focus/MobileWorkspace ref 恢复；日志 log-impl Slf4jImpl；
  DraftSubmitCommandHandler.onFinalFailure Long 解析；NotifySubjectBindingServiceImpl 密钥惰性化；
  data_scope(T100/T200 管理员)=0；PG 角色 chikan 与 smart_workflow.sw_iot_connection（环境铺设）；
  G7b 库重建为 V87 现行脚本基线 + 历史 ID 回灌（旧克隆非受支持基线，见 G7b/actual.md）
- G4/G6 对象集合：G1a 实例 d018f57a/任务 d0191c97/消息 2099430376456531969(IN_APP M)+2099430376506863617(EMAIL FAILED)；
  G6a 事件矩阵实例族（含抄送链 21bca43c、退回链 57e144a5/16cc3c94、时限链 f549f3da）
