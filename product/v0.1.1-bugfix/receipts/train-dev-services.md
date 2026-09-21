# 0.1.1 本地验收服务启动方法

> 用途：Owner 本地浏览器验收修复成果。两服务长期运行，同一时间禁止并行跑 Maven 编译（`knowledge/shared-constraints.md` §6）。

## 后端（Smart-WorkFlow-aPaaS-server，dev profile，端口 8080）

1. 打包：`MAVEN_OPTS="-Xmx2g" mvn -q -DskipTests package`（在仓库根）。
2. 必需环境变量（本地开发值，非生产密钥）：
   - `SW_CIPHER_KEY`：dev 规范开发密钥 `c21hcnQtd29ya2Zsb3ctZGV2LWNpcGhlci1rZXkhIQ==`（devseed/SSO/IoT 预加密数据同构共享，见 `application-dev.yml`）
   - `SW_LOGIN_RSA_PRIVATE_KEY`：本地生成的 RSA-2048 PKCS#8 单行 Base64（存于 `%USERPROFILE%\.sw-local-dev\rsa-pkcs8.b64`，不入库）
   - `SW_LOGIN_DIGEST_SECRET`：任意非空本地值（本地用 `sw-local-dev-digest-secret`）
   - `JWT_SECRET`：非占位值（本地用 `sw-local-dev-jwt-secret-2026-0123456789abcdef`）
3. 启动：`java -Xmx2g -jar sw-bootstrap/target/bootstrap.jar --spring.profiles.active=dev`
   - 本地 Redis 需在 6379 运行（本机已在跑）；H2 内存库自动建库；启动完成日志 `Started StarterApplication`。
   - fail-fast 安全门依次为：SW_CIPHER_KEY → SW_LOGIN_RSA_PRIVATE_KEY → SW_LOGIN_DIGEST_SECRET → JWT_SECRET（缺一即启动失败，报错信息含对应变量名）。

## 前端（Smart-WorkFlow-aPaaS-Web，端口 5173）

1. `pnpm dev`（代理 `/api` → `http://localhost:8080`，见 `vite.config.ts`）。
2. 访问 `http://localhost:5173/login`。

## 当前运行状态（2026-09-21）

- 后端：dev profile 已启动（会话常驻），challenge 接口 8080 直连与 5173 代理均返回 200。
- 前端：vite dev 已启动，5173 返回 200。
