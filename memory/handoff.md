# 交接

2026-11-11｜执行｜1.0.0 阶段 3 第一、二批证据已交，等 Planner 验收（先验收后合并）。

## 当前

**1.0.0 阶段 2+3（XL）**：两仓 `feature/1.0.0`——Server `b0531505`（含首登白名单修复）、Web `a361f82`（含 filterTenant 修复）；工作区 `develop-sw` 回执两批（execution-100-01.md / -01-batch2.md）。

- **隔离环境在跑（供 Planner 复核）**：Server 18093（local profile + 固定验证码）、Web 5275、PG 库 smart_workflow_100（33→34 行 V1.0.0 实证）。测试账号口令在本机 /tmp 与克隆库，不入 Git。
- **证据**：37 份截图/文件（gitignore）；F1 全链（模板签名/整批 0 落库/只新增/超管租户/改密 403+复位/无权限 403）、F3 三页签+筛选+无密码 0 行、F4 列表 系统（IoT）×2 行、F2 详情双按钮+PDF 66,932B。
- **缺口（回执 G 节）**：任务详情打印截图、历史版本页脚视图、字段隐藏对照、yangfan 隔离截图、清理有界验证、MySQL 实库（Windows 端口映射握手超时）/其余四库。
- 测试期间修复两缺陷：过滤器白名单 /system/auth 双映射、UserList filterTenant 引用（均推送）。

## 保留与保护

不变。新增：隔离环境自建项（smart_workflow_100 库、18093/5275 端口、sw100 测试账号）在验收后清理；UAT 仅 pg_dump 只读。

## 更早历史

0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
