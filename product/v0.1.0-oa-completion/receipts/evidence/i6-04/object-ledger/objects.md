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
