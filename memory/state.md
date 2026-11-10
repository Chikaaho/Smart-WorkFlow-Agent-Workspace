# 当前状态摘要

2026-11-10｜Planner｜1.0.0（P27/P33/P40+小尾巴）评估中，见需求池。

## 当前任务

**Server 0.4.1 + Web 0.3.8（L，PUBLISHED）**：完成 W-c 会签意见摘要/部门、W-a2 画布连线与可读性、W-b2 长表单复测、W-e 列表发起时间、三张 README 图。方向 `product/approval-record-patch/passed/direction-server-041-web-038.md`；回执 `execution-041-01.md`（阶段 2—3）、`execution-041-02.md`（阶段 4—6）。

- **发布**：Server tag `0.4.1`=`09549a49`（tag 对象 `addce449`，Release `440170555`，`bootstrap-0.4.1.jar` 236,251,001 B sha256 `fe6ad3ed…`）；Web tag `0.3.8`=`6e9b7313`（tag 对象 `4f1d380f`，Release `440173998`，`sw-web-dist-0.3.8.zip` 6,198,159 B sha256 `c61e0617…`）。Latest 0.4.1/0.3.8；既有 tag/Release 未动。
- **合并/CI**：两仓 fix→develop→main 普通合入；Server develop `42789327773`、main `42789343743`，Web develop `42788699711`、main `42788760585` 均 success。Server 首次失败为工作流硬编码 `0.4.0-SNAPSHOT` 断言漏改，`99e7dad6` 修复 pom/脚本/工作流四处。已合入分支本地与远端已删。
- **UAT**：Server `build.version=0.4.1`、health UP（160s）、Flyway 33 行/max 0.4.0（无新增迁移），部署前备份 DB/jar/env；Web 入口 `assets/index-Cr8LY45m.js`，根/登录/健康 200，备份 web 目录。
- **复测**：W-c 会签 3 行摘要+部门；W-a2 左右接点 7/7、fit 0.617、节点/连线 12.34px、占宽 0.909；W-b2 表单 1218px/面板 447px；W-e 时间 `yyyy-MM-dd HH:mm`；R3b 从「我发起的」进入、侧栏一致，图占宽 0.854、上下不裁。
- **README/Z4**：三仓三图回读 200，版本 0.4.1/0.3.8，禁用词 0、链接 200；P66 24h 观察完成，`COMPLETED`（`execution-final-05.md` §3）。

## 基线

功能 **52**；M59/18/13=90；ADV1/7/56=64；实际 P63；问题 57；正式基线变更 []。已核销 P2/P4/P9/P15/P19/P29/P34/P47/P65/P66，P35 部分；P20 未核销。补丁不增加功能数、不核销 P。

正式/部署版本：Server **0.4.1**（tag `09549a49`，Release `440170555`），Web **0.3.8**（tag `6e9b7313`，Release `440173998`）；Flyway V0.4.0（33 行）。UAT 磁盘 66%（余 6.3G）。

Owner 定：本机 `smart_workflow_030` 等隔离环境保留不删（含密文，已 gitignore）。本轮 `smart_workflow_041` 与 18092/5274 已按精确 PID 停止，DB 暂留至阶段 7 后清理。Key 不入 Git。

## 后续候选

P67 Graph 执行器、P68 外部 Java 工具沙箱（需求池）；DM8/KingbaseES 实库验证；日志管理页；`JavaSubprocessExecutor` 输出竞态；CI 偶发族；知识库写权限；短信电话；P20。

## 教训

0.4.1：发版工作流的 develop 版本断言须与 pom `<revision>` 同批收敛；弹窗类 README 图需另备入口图证明侧栏。
0.3.3：缺陷判定要看迁移链跑完后的最终列类型，不能只看基线；Boolean 列不能绑 1/0。
0.3.x：审查要逐字核对表单数据内部一致性；用户可见英文编码判不通过；「我的实例」只含发起实例。
0.2.4：给执行的替代路线先核前提是否存在。P66：六库冒烟必须含智能体工具启用过滤。
