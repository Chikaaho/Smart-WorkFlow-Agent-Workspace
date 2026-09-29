# 当前状态摘要

> **当前任务：`sso-admin-config` 后台 SSO 配置管理与 B 端手机号准入（L，`VERIFYING`，2026-09-29）**——方向 `product/sso-admin-config/ready/direction-sso-admin-config.md`；回执 01/02/03/04 见 `product/sso-admin-config/receipts/`；审查 01/02 已处理。飞书准入真实链全闭环（自动绑定/免密登录/变更拒绝/解绑重绑双循环/A2 矩阵/A3 分项权限）；**钉钉 B1 Owner 已授权恢复（IN_PROGRESS）**：900103 根因=个人测试应用绑定开发者登录会话，待 Owner 浏览器重登钉钉后重试链（配置面已全数核实）。企业微信延期。P31 未核销；功能数 45/增量 0、清单 46/22/22、ADV64 不变；生产仍 0.1.2/V102。

> 总体任务 `backend-architecture-optimization` 已 `COMPLETED（规划已确认，2026-09-26）`；`v0.1.1-bugfix` **`COMPLETED（Owner 范围关闭，2026-09-24）`**（裁决 `product/v0.1.1-bugfix/receipts/planning-owner-v011-task-close-20260924.md`）；`v0.1.2-bugfix` **`COMPLETED（Owner 范围关闭，2026-09-28）`**（裁决 `product/v0.1.2-bugfix/receipts/planning-owner-close-20260928.md`）。发布事实见下方。

## 2026-09-28 0.1.2 发布（当前状态）

- `v0.1.2-release`：**`COMPLETED（规划已确认，2026-09-28）`**——发布执行、终态同步与最终裁决均通过（回执见 `product/v0.1.2-release/receipts/`）。
- 发布身份：Server `origin/develop = origin/main = fd704ff12af3ccd99febaa700c523d7688e91509`；Web `origin/develop = origin/main = 5368e6c656c095acd3fe2cff1875c27ee5672307`（package.json 0.1.2）；tag/Release `0.1.2` 双仓公开 Latest（jar sha256 `a4d59613…`、dist zip `703fd2c4…`）；main CI 36396145288 / 36396187465 success。
- **生产部署（2026-09-28，Owner 授权）**：Flyway 自动增量 V97—V102（0 failed），生产当前 V102；公网 `https://chikaho.cn/sw/` 200、health 200 UP、前端 `index-vDQskZXe.js` 生效；备份齐备、回滚路径明确（部署回执 `receipts/deployment-20260928.md`）。

## 锁定基线

- 功能数 **45**（本发布任务增量 0）；清单 **✅46/🟦22/⬜22**（90）；**ADV64** 独立计数；P 编号与里程碑明细本次变更集合为空，不核销。
- 验证基线：Server compile exit 0、test **1586/0/0/0**（2026-09-28 发布门禁实跑 @ `fd704ff`；Phase 6C 时点 1570 仅作历史）；Web 四连全 exit 0、vitest **1301+3**（@ `5368e6c`）；两仓对应 main CI success。
- Flyway 终点 **V102**（制品迁移线；0.1.0 终点 V93 为事实边界；生产已于 2026-09-28 部署应用至 V102，0 failed）。
- 独立待办：V012-CODE-001 保持 READY（后端 import 风格清理，核实无在途改动）；外部通知五渠道与腾讯 IoT 实网验证保持既有 Owner 延期边界；小程序冻结。

## BAO 历史压缩

总体任务与 Phase 1—6C、Final 的阶段细节、权威结果与接受边界不再在 memory 展开；完整记录见 `knowledge/current-status.md` 顶部条目及其历史区、`knowledge/features/` 与 `product/backend-architecture-optimization/`。

## 最终确认与下一动作

终态同步 TS1–TS3 已全部核销，最终裁决 `product/v0.1.2-release/receipts/planning-final-review-terminal-sync-20260928-passed.md`；两份方向均归档 passed。**生产已于 2026-09-28 部署上线 0.1.2（V102，双端健康 200）**。三方 SSO 接入 2026-09-29 功能级 `PASSED`（审查07），阶段三同步回执 `product/dingtalk-sso/receipts/terminal-sync-20260929.md`。当前任务=`sso-admin-config`（`READY`）；**下一动作=执行 `product/sso-admin-config/ready/direction-sso-admin-config.md`**。
