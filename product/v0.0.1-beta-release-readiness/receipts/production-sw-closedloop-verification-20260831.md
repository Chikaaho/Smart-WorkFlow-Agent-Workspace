# 执行回执 · 生产环境 /sw 最小闭环验证与修复（2026-08-31）

## 1. 任务与内部 Step 概要

用户指令：更新三仓代码 → SSH 生产（~/ssh/ssh/ssh_personal，部署位 /opt/smart-workflow/{server,web}）→ 浏览器真实验收 http://chikaho.cn/sw 最小闭环 → 发现问题修复（打包 scp_personal 上传重启）直至闭环跑通。

内部 Step：①三仓对齐远端（远端为敏感信息清理后的强制改写历史）②部署拓扑与版本核对 ③GUI 登录/菜单/表单设计 ④闭环探障 ⑤定位并修复 3 个 bug ⑥重新构建上传重启 ⑦浏览器全链路回归。

## 2-3. 实际读取/修改的文件

修改（前端 Smart-WorkFlow-Web，分支 develop）：
- `src/modules/system/views/DictTypeList.vue`：状态映射反转纠正（0=正常 1=停用，对齐 SysDictType 实体注释与 SysDictDataServiceImpl 过滤 status=0=启用）；筛选/表单下拉、tag 判断、新建与重置默认值共 6 处。
- `src/modules/system/views/DictDataList.vue`：同上 6 处。

修改（后端 Smart-WorkFlow-Server，分支 develop）：
- 新增 `sw-bootstrap/src/main/resources/application-prod.yml`（原仅存在于部署 jar、未入库且内嵌 PG 密码明文）：url 默认追加 `?stringtype=unspecified` 修复 jsonb 写入；PG 密码/SW_CIPHER_KEY/OPENAI key 改为纯环境变量注入，不再落任何真实凭据。

修改（生产服务器，非仓库）：
- `/etc/nginx/conf.d/chikaho.cn.conf`：`location /sw` 的 `try_files` 回退 `/index.html` → `/sw/index.html`（原回退 URI 落入 `location /` 反代 38784 端口导致深链接 401）。备份：`chikaho.cn.conf.bak-20260831`。
- `/opt/smart-workflow/server/server.env`（chmod 600）：PG_USERNAME/PG_PASSWORD/SW_CIPHER_KEY/OPENAI_API_KEY/SPRING_PROFILES_ACTIVE=prod，start 前 source。
- 部署替换 `bootstrap.jar`（旧件备份 `bootstrap.jar.bak`）、重解压 web 静态资源（旧 assets 已清理）。

## 4. 每个文件的修改摘要

见上节。所有仓库修改均未提交（本会话未获 Git 提交授权），diff 保留在工作区。

## 5. 实际执行的命令（证据级）

- 三仓：`git pull --ff-only`（失败后改 `git stash && git branch backup-*-20260831 && git reset --hard origin/<main|develop> && git stash pop`；Web develop 额外 `git merge --ff-only origin/main` 快进至 f0d8acb）
- 构建：`MAVEN_OPTS="-Xmx2g" mvn -q package -DskipTests -pl sw-bootstrap -am`（前端先 ps 互斥检测，无并发编译）；`NODE_OPTIONS="--max-old-space-size=2048" pnpm build`
- 上传：`bash ~/ssh/ssh/scp_personal.sh /tmp/bootstrap.jar /opt/smart-workflow/server/bootstrap.jar.new`、`... /tmp/web-dist.zip /opt/smart-workflow/web/dist.zip.new`
- 重启：`source server.env && bash stop.sh && bash start.sh`，轮询 `/api/actuator/health` 至 200（约 125s）

## 6. 命令输出摘要（行为证据）

- 修复前（GUI）：保存草稿 → alert「Request failed with status code 500」；后端日志 `PSQLException: column "definition" is of type jsonb but expression is of type character varying`（FormConfigMapper.insert，sw_form_config 与 sw_form_snapshot.definition 均为 jsonb）。
- 修复前（curl）：`GET /sw/system/user` → 401 text/plain（落到 38784 应用）；`POST /form/def` → code 500。
- 修复后（curl）：`GET /sw/login`、`GET /sw/system/user` → 200 text/html；`POST /form/def` → code 0；save config/publish/workflow defs create/save graph/validate（errorCount=0）/publish/submit data → 全 code 0；`GET /workflow/tasks/todo` 返回 1 条；`POST .../complete` → code 0；`GET /notify/messages` 出现 bizType=WF_APPROVED「您的申请已通过」。
- 修复后（GUI，浏览器真实操作）：登录 → /sw/dict 字典状态列显示「正常」→ 表单设计拖入单行文本（Sortable 拖放，投放点须落在画布列表区 y≈210，与空态提示文案位置无关）→ alert「草稿已保存」「发布成功」→ 流程定义创建/审批人选系统管理员（admin）/「保存成功，图校验通过」/「已发布」→ 填报页（/sw/form/form-render/验收测试表单）填写提交 → alert「提交成功，流程已发起」→ 待办「通过」→ alert「审批通过」→ 收件箱出现「您有一条待办」「您的申请已通过」两条通知。
- health：`{"status":"UP","components":{"db":"UP(PostgreSQL)","redis":...}}`；新 bundle index-Do90Go2o.js 已上线；jar 时间戳 2026-08-31 00:50。

## 7. 与原指令的偏差

- 无方向偏差。补充说明：三仓远端均被强制改写（安全清理），本地 41/74 个未推送提交与远端为同内容改写，已按备份分支（backup-main-20260831、backup-develop-20260831）+ reset 对齐；未推送内容无丢失。
- 中途两次重启失败（缺 SPRING_PROFILES_ACTIVE=prod、OpenAI key 非空校验），均为环境注入问题，已在 server.env 与仓库 yml（占位默认值恢复）双端修复。

## 8-9. 遇到的问题与未完成内容

已修复 3 项：
1. 【后端·生产阻断】sw_form_config/sw_form_snapshot.definition jsonb 列以 varchar 写入 500（H2 dev 不暴露）。修复：prod JDBC URL `stringtype=unspecified` + application-prod.yml 入库去敏感化。
2. 【前端】字典类型/数据状态映射反转（0=正常 显示成 停用）。修复：两视图 12 处。
3. 【nginx】/sw SPA 深链接回退失效（401 落 38784 应用）。修复：try_files 回退 /sw/index.html。

遗留观察项（未修，供规划裁决，本轮不扩范围）：
- O1 表单填报页 form-render/form-data 无任何菜单入口，用户只能手输 URL。
- O2 GUI 建表单时业务标识(formKey)直接生成中文名「验收测试表单」，URL 需编码；且填报页输入框无可访问 label（a11y）。
- O3 登录 redirect 参数存在双重编码（%25），实测仍可正确回跳。
- O4 字典「必填」开关为隐藏 input，纯键盘/自动化不可达（人工可点，低危）。
- O5 生产 sw_form_config 建表 DDL 不在当前 Flyway 迁移链中（生产库为历史手建 schema），迁移链与生产 schema 存在漂移。

## 10. 风险与注意事项

- 服务器 `/opt/smart-workflow/server/bootstrap.jar.bak`、`/etc/nginx/conf.d/chikaho.cn.conf.bak-20260831`、备份分支 backup-main/develop-20260831 为回滚点。
- 生产数据中留有验收数据：表单「验收测试表单」「验收探针表单」、流程「验收测试流程」「验收探针流程」及 2 条实例/通知，可作为验收证据，如需清理请另行授权。
- application-prod.yml 的净意义重大：当前生产 jar 已不含明文密码（由 server.env 注入）；历史 jar 与旧配置文件若不再需要建议管理员择机清除。

## 11. Git diff 摘要

- Smart-WorkFlow-Web develop：DictTypeList.vue / DictDataList.vue 共 24 行变更（未提交）。
- Smart-WorkFlow-Server develop：新增 application-prod.yml（-a 会话内新文件，未提交）。
- 三仓 HEAD 均与 origin 一致（知识仓 87c57b8 / 后端 10c2851 / 前端 f0d8acb，本地 develop 已含 main）。

## 12. 与验收标准逐项对照

| 指令要求 | 结果 |
|---|---|
| 更新三仓最新提交 | ✅ 三仓对齐远端（含安全改写历史），未提交改动保留 |
| SSH 生产验证最小闭环 | ✅ 浏览器真实走通：登录→表单设计/发布→流程定义/发布→填报发起→待办审批→通知 |
| 发现问题并修复 | ✅ 修复 3 项（jsonb 写入 500、字典状态反转、SPA 深链接 401），重启后全链路复验通过 |
| 打包 scp_personal 上传重启直至跑通 | ✅ 前后端重新构建、scp_personal 上传、stop/start 重启、健康检查 UP |

## 13. 最终自验结论

自验通过·待规划验收。生产 http://chikaho.cn/sw 最小闭环流程在浏览器真实操作下端到端跑通，行为证据见 §6。
