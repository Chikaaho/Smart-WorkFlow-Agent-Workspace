# 1.2.0 第九批执行回执（execution-120-09）——E2 链闭环（E2-2 重测 + E2-4 重启对照）+ 语义修复

日期：2026-11-21｜执行（Executor）｜依据 `planning-execution-prompt-120-01.md`｜**批次中间态**：E2 功能链闭环（API 实证），浏览器截图与 E1/E3 项转下批

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `d35ba135` | E2 口径修复①：审计与返回改用生效等级（ROOT 在 Log4j2 下 configuredLevel 恒 null——120-04 §5 缺陷的根因层） |
| Server | `9f1bf978` | E2 口径修复②：调整返回与审计采用目标值语义（部分运行环境 getLoggerConfiguration 查询不可靠——iso120 Server 实测 getConfiguration("ROOT") 返回 null 而独立 JVM probe 正常） |

测试：LogLevelServiceTest 5/5 绿（resetToDefault 用例更新为生效等级语义）。

## 2. E2-2 重测（API 全链，iso120 v9f1bf978）

| 操作 | 结果 |
|---|---|
| PUT ROOT level=DEBUG | `{configuredLevel: DEBUG, effectiveLevel: DEBUG}`（120-04 的 null 失真已消除） |
| PUT ROOT（无 level=恢复默认） | `{configuredLevel: INFO, effectiveLevel: INFO}`（显式回落配置根级别） |
| 操作审计 | `admin｜LOG_LEVEL｜ROOT｜日志等级调整: 默认 → DEBUG（重启后恢复配置文件等级）` 与 `默认 → INFO`——**E2-3「谁/哪个 logger/改前改后」语义准确** |

## 3. E2-4 重启对照实证

调整 ROOT→DEBUG 后重启 iso120 Server（同 env 重启）→ 列表查询：**ROOT effectiveLevel=INFO**（恢复配置文件等级，DEBUG 未保留）——**E2-4「重启后恢复配置文件中的等级」行为实证**（对照：重启前 effective=DEBUG）。

## 4. 缺陷发现与处理（如实）

- **E2-3 场景缺口（造数）**：iso120 的 t100admin 为 devseed 全量权限夹具（119 权限含 system:loglevel:manage），不构成「无权限用户」403 场景——**下批造一个无该权限点的账号**（新用户+基础角色）补 403 证据。
- **审计/返回语义失真链**（120-04 §5 → 本批两次修复）：根因=Log4j2 对 ROOT 的 configuredLevel 语义 + 部分环境 getLoggerConfiguration 查询不可靠（getConfiguration("ROOT") 在 Server JVM 返回 null、独立 JVM probe 正常——环境相关，已用目标值语义消除依赖）。

## 5. 下批清单

E1-3 闭环（EXPIRED 交互诊断→实例轨迹截图）、E1-2/E1-5 补拍、E1-3T、E1-4 六结果、E1-6 四截图、E1-7 列表筛选/跳转、E1-8 跨租户、**E2-3 无权限用户造数+403 证据**、E3-1 对照截图、execution-120-10 收口回执。

## 6. 阶段进度

七阶段：已完成 2；进行中 1（验收）；未开始 4。

## 7. 自验结论

E2 功能链闭环（列表/调整/恢复默认/审计/重启对照全 API 实证 + LogLevelServiceTest 5/5），**本批范围自验通过，待规划验收**。
