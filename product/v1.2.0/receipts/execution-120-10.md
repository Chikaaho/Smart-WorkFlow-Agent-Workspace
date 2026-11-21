# 1.2.0 第十批执行回执（execution-120-10）——E2-3 后端拒绝实证 + 无权限用户造数

日期：2026-11-21｜执行（Executor）｜依据 `planning-execution-prompt-120-01.md` E2-3｜**批次中间态**：E2-3 后端 403 实证完成，前端菜单不可见截图与 E1 项转下批

## 1. E2-3 实证（iso120，DB 可回读）

| 项 | 事实 |
|---|---|
| 无权限用户造数 | `iso120_noperm`（id=999901、tenant 0、is_admin=0、无任何 sys_user_role 行；密码与 V4 种子同散列 admin123）——DB 直插（sys_user API 造数走 form/接口参数不匹配，测试数据准备走 SQL） |
| **后端拒绝** | GET `/api/system/log-levels` → **403**（`common.forbidden`「您没有执行该操作的权限」）；PUT `/api/system/log-levels/ROOT/level?level=DEBUG` → **403**——独立权限点 `system:loglevel:manage` 对非授权身份强制生效（E2-3 后端部分实证） |
| 操作审计 | `sys_audit_log` LOG_LEVEL 行：admin 的调整记录「日志等级调整: 默认 → DEBUG/INFO（重启后恢复配置文件等级）」——**谁/哪个 logger/改前改后**齐（E2-3 审计部分实证） |
| 前端菜单不可见截图 | 下批补（登录 iso120_noperm 的可见浏览器会话） |

## 2. 下批清单（合并 120-09 §5）

E1-3 闭环（EXPIRED 诊断）、E1 全套截图、**E2-3 前端菜单截图**、E3-1 对照、execution-120-11 收口回执。

## 3. 自验结论

E2-3 后端拒绝与审计实证完成（403 响应 + LOG_LEVEL 审计行 DB 可回读），**本批范围自验通过**。
