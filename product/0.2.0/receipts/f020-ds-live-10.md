# 0.2.0 统一执行·批次 09（F020-DS-LIVE：受控数据源真实入口修复＋PG 全链实证）

2026-10-25｜Executor｜承接 `planning-execution-prompt-unified-020-01.md` 剩余账本与 `direction-ui-semantics-020.md` 语义解除

## Planner 输入承接（VERIFY-SYNC 同步）

- 新账本七项已入知识库唯一下一动作链路；本批完成 **F020-DS-LIVE / A09**，其余（A03—A05 视觉、A11—A16、富文本、通知、节点高级）按批次推进。
- 富文本/通知/节点高级三项语义依赖经 `direction-ui-semantics-020.md` 解除，不再处于等待 Planner 状态。
- 两仓时点核实：Web `b450ef8`（vite.config.ts 在途保护不纳入）、Server `659a49c`→本批 `d0b0186`。

## 路由修复（Server `d0b0186`）

- **根因**：全局 `server.servlet.context-path: /api` 之外，`ExternalDatasourceController` 又映射 `/api/workflow/external-datasource`，实际 URL 变成 `/api/api/...`；前端按约定单前缀请求全部 404 no resource（即批次 07 观察到的 `workflow/external-datasource/page` no resource）——受控数据源管理页/契约/执行全不可达，这就是「真实入口 no resource」的直接原因。
- **修复**：控制器映射去 `/api` 前缀；MockMvc 测试（GrantsWriteAdmissionTest）路径同步。全仓唯一一处此类双前缀（grep 证实）。
- **门禁**：`mvn -pl sw-biz/sw-bpm/sw-bpm-engine -am test` **177/0 BUILD SUCCESS**（含 ExternalDatasourceControllerTest 4/0、GrantsWriteAdmissionTest 2/0 于新路径）。

## PG 真实链（脚本 node 直连 8080；网络索引 `C:/Users/hjxch/.codex/evidence-020/real-joint/f020-ds-live-network-index.json`）

1. **建源**：本地 PG 自身注册为受控源（本地PG演示源 → smart_workflow_dev/ext_demo_city，4 行种子）→ code 0。
2. **密钥不回显**：GET 详情响应无 password 字段、body 不含明文；UI 弹窗说明「密码只写入服务端加密配置，保存后不回显」。
3. **真实执行预览**：`/execute` select 直连源库 → 4 行（广州/深圳/杭州/成都）。
4. **引用授权**：USER:9001＋ROLE:t100_admin → code 0；**契约登记** city_lookup v1（id/name/province）。
5. **表单绑定+发布**：a09_ds_probe 两个 DATASOURCE 字段绑定 city_lookup（city_ctrl 可查看=user:9001）→ PG 动态宽表发布。
6. **运行读取（formKey+fieldKey）**：管理员 4 行；nobody（有 form:data:query）开放字段 4 行；**nobody 受控字段 1220「当前身份无该字段查看权限」**——与 A09 字段查看权同口径。
7. **必要拒绝**：契约停用 → 运行读取 **1213「外部数据源查询契约已停用」**；源停用 → execute 与 ext query 均 400 可判定失败（`ExternalDatasourceUnavailableException`→适配 empty，无数据外泄；信封文案为通用 PARAM_ERROR——改进空间，如实记录）。
8. **授权闸门（真负向）**：撤权后管理员仍可登记系**既定设计**（`isDatasourceManager` 持 workflow:datasource:manage 直通，非缺口）；造「仅 form:design:save、无数据源管理权、未授权」设计者（t100_designer→9101）登记 → **1220「未授权引用该外部数据源」**。

## 浏览器证据（FORMAL_FLOW 可见会话，登录身份 t100admin）

- 受控数据源弹窗（**原 404 空页**）：真实源行「本地PG演示源 / postgresql / jdbc:postgresql://localhost:5432/smart_workflow_dev / postgres / 正常 / 编辑·授权·删除」；`f020-ds-dialog-real-source-1920.png`。
- 查询契约页签：city_lookup v1 / city_lookup2 v1＋启停开关＋「仅展示当前账号可引用的查询契约；停用后设计与运行读取会被拒绝」；背后同屏字段权限（城市-受控 可查看=user:9001）。`f020-ds-dialog-contracts-tab-1920.png`。

## 边界与剩余

- 本批不声称 A09 整项通过：受控数据源链已真实闭合，A09 其余证据沿批次 07/08 采信。
- 源停用信封文案改进（可读性）未做；外部渠道/租户跨域拒绝已在既有测试与契约层承接。
- 剩余账本：A11—A16（PG 主证据环境已就绪）、富文本、通知、节点高级、A03—A05 视觉。

## 服务收尾

- 后端（8080，含路由修复重打包 jar）与前端（5175）按监听进程树终止、端口回读不可达；既有 PG/Redis 容器保持（外部设施）。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
