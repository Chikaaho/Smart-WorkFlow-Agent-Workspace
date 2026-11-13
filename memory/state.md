# 当前状态摘要

2026-11-13｜规划｜1.1.0 阶段 3 第三轮返修（`planning-review-110-04.md`），七阶段 2/1/4。W1/W3/W5/W6 通过。剩 X1（阻塞）G4-1 审批操作区仍盖住明细表，回执写「不遮挡」（第四次回执失实），要视口截图三位置；X2 连线标签脱离连线；X3 超时失败分类列表 `HUMAN_T…` 与详情/接口 `GRAPH_EXECUTION_FAILED` 不一致，统一 `HUMAN_TIMEOUT`；X4 干预动作 `SUSPEND` 改中文。已接受限制：子图剩余时间不换算、超时扫描单实例、DM8/Kingbase 仅静态核对。下一份 `execution-110-04.md`，只看 X1—X4。阶段 7 后清理 `v110-*` 六容器与 `iso-pg5433`。1.0.0 已 COMPLETED（功能 55）。

## 当前任务

1.1.0（XL）方向 `product/v1.1.0-graph-designer/ready/direction-v1.1.0.md`：G1 设计器重做（Vue Flow + 扩展适配层，含试运行逐节点可视化与单节点运行）、G3 人工/子图节点（`V1.1.0` 迁移 9 库）、G4 小尾巴。Owner 裁决：G2（P67）拆出，语义已定，写在 `todo/p67-graph-as-executor.md`；人工待办只在 Graph 运行页。执行方下一份回执 `execution-110-01.md`，建议首批 G1-1/2/3/6 界面。隔离实例不得连本机现有库，Vite 须 `--strictPort`。未排期：P67、P68。

## 1.0.0 摘要（已结束）

## 阶段 4 合并与 CI

- Server：feature `9fe3f11c` → develop `708d3a36` → main `aa7c86e5`；CI develop `43035313977` ✓、main `43035353166` ✓（attempt 2；attempt 1 固有 flake `JavaSubprocessSandboxTest` NPE，fail-fast 下 p0 未及执行；attempt 2 与 develop run 全量 **2,492/0/0/45**、`CommandQueueIntegrationTest`（含 p0）7/7）。
- Web：feature `838b84d`（TZ 修复）→ develop `b4b2d25` → main `a85aa8e`；CI feature `43036986258` ✓、develop `43037004490` ✓、main `43037042393` ✓（2060 passed/3 skipped）。首合并 `43035549222`/`43035516843` 因 PrintSheet.spec TZ stub 只设一次被 afterEach 撤销、UTC runner 上跨日断言失败——修复后重走链。
- 两仓 feature/1.0.0 merge-base 验证后本地+远端删除。

## 阶段 5 发版

- Server tag `1.0.0`=`aa7c86e5`（tag 对象 `3de61eb7`）、Release `441827517`、`bootstrap-1.0.0.jar` 242,697,784 B sha256 `a8dc16b6…`。
- Web tag `1.0.0`=`a85aa8e2`（tag `1eb974f1`）、Release `441848348`、`sw-web-dist-1.0.0.zip` 6,221,796 B sha256 `cc94fa30…`。
- 两仓 Latest=1.0.0；发布说明含三项已接受限制；既有 tag/Release 未动。

## 阶段 6 部署与复测

- 备份：`smart_workflow_20261111_2318_pre100.dump.gz`(771,644 B)、`bootstrap.jar.bak-pre100`、`server.env.bak-pre100`、`web.bak-20261111_2318_100pre`；余 6.4G。
- Server 1.0.0：health UP、`build.version=1.0.0`、Flyway 33→**34 行**（rank 39 audit log and must change password）、日志 0 ERROR、PID 3417483；jar sha256 与 Release 一致。
- Web 1.0.0：入口 `assets/index-BCCrQSgQ.js`、根/入口/健康/登录 200。
- 复测：F1 导入 3/3（uat100_a/b/c@租户9001）+ 错误批 0 落库 + 首登拦截/403/改密/复登/无权限 403；F2 `uat100_f2_demo` 打印预览+PDF(1 页 14 行)+Excel(A1:D15)；F3 三类日志（LOGIN 32 含 FAIL 11 带 IP）无密码明文；F4 IoT 行「系统（IoT）」+详情 + README 回读 1.0.0。
- 测试数据停用：账号 status=1（登录 `system.account_disabled`）、角色/岗位停用；表单/实例留置。
- 同步：version.json PUBLISHED、CHANGELOG 1.0.0 条目、knowledge current-status + 索引三行核销（24→27）、需求池 P27/P33/P40 核销。

## 边界与教训

- 未强推/未改历史/未动其他 tag 与 Release；演示环境未删未清。
- curl `--data-binary @file` 文件缺失时会发**空请求体**（GitHub 422 size>=1）；后台任务 cwd 与会话 cwd 不一致，长命令一律用绝对路径。
- UAT 健康路径带 `/api` 前缀（`/api/actuator/health`）；超管导入必须显式 `tenantId`；el-input-number `:min=1` 使监控页发起人筛选拒绝 0（API 端 initiatorId=0 可用）。
