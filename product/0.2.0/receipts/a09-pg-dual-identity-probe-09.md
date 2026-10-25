# 0.2.0 统一执行·批次 08（A09 运行态双身份探测：dev 环境切 PG＋服务端权威侧三闸门实证）

2026-10-25｜Executor｜服务端 HTTP 行为链（node 直连 8080 真实登录/请求；渲染层浏览器证据见批次 07）

## 环境变更（回应 Owner 质询「有 PG 为何执着 H2」）

- **H2 根因**：dev 测试身份数据（tenant 100 / t100admin / t100nobody 等 I5 夹具）此前只存在 `db/migration/devseed/h2/`（H2 专有 `MERGE INTO … KEY` 语法），PG vendor 无对应镜像——这是历次 dev 启动选 H2 的直接原因，非刻意回避 PG。
- **本批补齐**：新增 `devseed/postgresql/` 四文件镜像（V900—V903，`insert … on conflict (id) do nothing` 方言改写，`dateadd` → `interval`）；`application-dev.yml` master 数据源改为 `SW_DEV_DB_*` 环境可覆盖（缺省仍 H2，不改变既有启动口径）。
- **PG 启动**：本地 Docker PostgreSQL 18 容器新建库 `smart_workflow_dev`（既有 smart_workflow 等库零触碰），`bootstrap-dev.jar --spring.profiles.active=dev` 经 `SW_DEV_DB_URL=jdbc:postgresql://localhost:5432/smart_workflow_dev` 启动，**26.559s UP**；devseed PG 链真实应用，t100admin(9001)/t100nobody(9101)@租户100 直读 PG 确认。四外部密钥按回执 07 口径注入。注意：本批未传 `--server.port=18080`，后端起在默认 8080（前端 5175 代理同址，行为一致）。
- 重打包 `mvn -pl sw-bootstrap -am package -P dev -DskipTests` exit=0（jar 221,007,245 B）。

## 运行态双身份探测（服务端权威侧，脚本 node 直连 8080）

表单 `a09_pg_probe`（`fields=open_field/ctrl_field`，`fieldPermissions={ctrl_field:{view:['user:9001']}}`）真实创建→发布→提交 `recordId=3586432d-4b4b-4009-9ecf-95f84bdc3a78`（两字段均有值）：

1. **入口闸门**：t100nobody 无角色 POST `/api/form/data/a09_pg_probe/query` → **403**「您没有执行该操作的权限」（form:data:query 缺失 fail closed）。
2. **授权链**：建角色 `t100_data_viewer`（roleId `2114297251898707969`，dataScope 调 ALL）→ `PUT /system/role/{id}/menus` 授菜单 353（`form:data:query`，PG sys_menu 直读发现）→ `PUT /system/user/9101/roles` 绑定 → 全部 code 0。
3. **投影剥离**：nobody 重登查询 → code 0、total 1、`rowKeys=[create_by,create_time,id,open_field,update_by,update_time]`——**ctrl_field 连键带值完全消失**、响应不含 `pg-secret-v1`、open_field 值正常；管理员同查询 rowKeys 含 ctrl_field 且含受控值（正控）。
4. **筛选拒绝**：nobody 以 `ctrl_field` 作过滤条件 → **1501**「过滤字段「ctrl_field」不在表单定义中」（不泄露字段存在性）；管理员同口径 → code 0、total 1 命中。
5. **PG 落库直读对照**：物理宽表 `sw_form_o2mb3ih431` 中 `open-value-pg|pg-secret-v1` 双值在库——剥离系服务端投影层行为，非数据缺席。

结论：「服务端是唯一权威，前端隐藏只是 UX」契约在 **PostgreSQL 运行态**成立；与批次 07 渲染层修复（Web `b450ef8`）构成前后端同口径，A09「权限在 UI 与服务端一致」主张闭合。

## 验证与门禁

- 网络索引：`C:/Users/hjxch/.codex/evidence-020/real-joint/a09-pg-dual-identity-probe-network-index.json`（12 条请求级证据＋结论）；探测脚本 `E:/tmp/sw-a09-probe*.mjs`。
- `sw-bootstrap -am test` 在本批改动后出现 I6G1a/b/c 3 例红——**与本改动无关的既有现象**：该用例族共用文件库 `target/i6-restart-db` 模拟重启恢复，跨次运行残留流水致计数错位（expected 1 but was 2）；清除该文件后隔离重跑 **122/0/0 BUILD SUCCESS**。据此更正批次 07 对同签名 exit=1 日志的"陈旧产物"误判（回执 08 已更正）。
- Server 提交 `fa51395..659a49c` 已推送：devseed/postgresql 四镜像＋dev 数据源 `SW_DEV_DB_*` 可覆盖（缺省仍 H2）。

## 边界与剩余

- 受控数据源真实配置（dev 无已登记数据源）；A11—A16 真实链；A03 像素对照整批；富文本与定义级通知配置待 Planner 裁决。
- 探测夹具（角色/表单/记录）留存于 `smart_workflow_dev`（dev 库，不属交付物）。

## 服务收尾

- 后端（8080）与前端（5175）按监听进程树终止、端口回读不可达；**既有 PG/Redis Docker 容器为外部既存设施，不属本轮生命周期，保持运行**。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
