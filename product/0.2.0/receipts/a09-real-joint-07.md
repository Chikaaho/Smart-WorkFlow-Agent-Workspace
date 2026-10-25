# 0.2.0 统一执行·批次 06（A09 真实联合链·首段：环境建立与表单配置→发布→回读）

2026-10-25｜Executor｜tier=FORMAL_FLOW（用户可见可交互浏览器会话，headless=false，真实后端）

## 环境（自建受控生命周期，已净停）

- 后端：`bootstrap-dev.jar`（含本版全部 Server 改动重新打包）+ `--spring.profiles.active=dev`（H2）+ 端口 18080。启动门槛如实记录：需外部注入 `SW_CIPHER_KEY`、`SW_LOGIN_RSA_PRIVATE_KEY`（PKCS#8 **PEM**）、`SW_LOGIN_DIGEST_SECRET`、`JWT_SECRET`（占位值被拒）；dev 固定验证码 `1234`（sw.dev.test-mock）；devseed 身份 `t100admin/admin123`（租户 100，V901 明文声明）。启动 17.7s。
- 前端：`pnpm dev --port 5175`（VITE_PROXY_TARGET=18080）。
- 结束清理：两进程按 PID/端口精确终止，18080/5175 均已不可达（残留 0）。

## 真实行为链（证据：截图 + 后端日志 /tmp/sw-backend-dev.log）

1. **真实登录**：浏览器可见会话填写 t100admin/admin123/验证码1234 → POST /api/auth/login 200 → 进入 /workspace（真实 drafts/copies/catalog/analytics 200）。截图 `workspace-after-real-login-1920.png`。发现并绕过两点：验证码挑战 TTL 300s（调试超时导致 2102 过期一次，换新挑战后成功）；IAB 环境 Playwright click 动作等待不收敛，改 evaluate 派发 DOM click（表单 submit、事件链真实执行）。
2. **表单创建**：表单管理→新建表单→「A09联调演示表单」→ 真实创建（id `e282ca3e-26dd-4a20-8aee-5c7035fa1fbd`）并进设计器。
3. **字段设计**：画布加入单行文本+多行文本；属性面板呈现 DR04 配置（最小长度/校验正则/校验提示）；切设置触发**脏状态保护弹窗**（设计 272:1575 行为真实）→ 保存并继续 →「草稿已保存」。
4. **权限面板（A09 主体）**：表单权限工作区在真实后端全量渲染——字段权限（单行文本 TEXT / 多行文本 RICH_TEXT ×可查看/可编辑）、动作权限（查看/新增/编辑/删除/导出/导入/发起流程）、受控数据源入口、默认列表（展示列/可查询字段/默认排序/开放操作）。
5. **默认列表配置**：默认排序=单行文本·升序 →「保存默认列表」→「保存成功」。
6. **发布**：发布确认（"发布后表名/字段名冻结"）→ **后端真实发布**：日志 `Form published: id=e282ca3e…, formKey=form_mvnk62lc, physicalTable=sw_form_j4xx7xm3ap, version=2`（动态宽表物理建立，userId=9001）。
7. **发布后回读**：整页刷新后权限工作区数据完整回读（字段权限行、默认列表、排序=单行文本·升序持久）。截图 `a09-permissions-after-publish-reload-1920.png`。

证据目录：`C:/Users/hjxch/.codex/evidence-020/real-joint/`（3 张 1920 截图）；后端访问日志含全部请求 userId/状态码。

## 边界与剩余

- 本段覆盖 A09 的「配置可保存、发布、回读」主链；**未完成**：权限主体限制配置（现值均为"不限"，需配 role:/user: 主体并做代表性读写+越权负向）、受控数据源真实配置（dev 无已登记数据源）、A10—A16 后续链。
- 环境启动四密钥+命令已记录于本回执，后续会话可复建。
- 本段不声称 A09 通过，仅提交首段真实行为证据；A03/A04/A05 整体仍未通过。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
