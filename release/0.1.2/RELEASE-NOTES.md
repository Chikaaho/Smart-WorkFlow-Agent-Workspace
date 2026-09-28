# CH-aPaaS 0.1.2 正式发布说明

- 发布日期：2026-09-28；上一实际发布版本：**0.1.0**（0.1.1 修复轮与 0.1.2 修复轮内容均包含在 0.1.2 本线，0.1.1 未曾独立发版）
- 标签与 Release：两仓 `0.1.2`（annotated、公开、非 prerelease）
- 候选提交：Server main/develop `fd704ff12af3ccd99febaa700c523d7688e91509`；Web main/develop `5368e6c656c095acd3fe2cff1875c27ee5672307`（含版本元数据提交）
- CI：Server run `36396145288` success；Web run `36396187465` success（均为 Build & Release (main)，提交绑定完整 SHA）
- 分仓库完整正文见 GitHub Release `0.1.2`；本文为工作区合并摘要

## 主要功能与修复

### 流程与工作台（两端联动）
- 流程中心列表化改版：分类树、收藏（常用/最近使用/置顶）、主题生成规则设置（009/010）
- 工作台待办/已办/我发起的可读化：待办卡与业务动态卡展示主题 + 流程名 · 发起人 · 发起时间，状态/动作翻译（021/022）；工作台本地列表路由（023）
- 菜单管理配置化与后台信息架构（011/017）；后台信息架构规整迁移 V95
- 发起/详情体验改版：表单边框体系、流程图 24px 网格画布与节点层级、整页铺满（012/013）；顶栏 tab 左对齐（020）；用户/部门选择器弹窗化（019）

### 表单与设计器
- 表单设计器交互修复与体验收口（0.1.1 轮 V011 系列：画布栅格、字段卡、字段标识锁定、已发布表单新版本原子发布等）
- 文字组件与字段标题位置、表单列表分类树、表单管理创建人列、表单定义列表下发创建人展示名

### 架构与治理
- 后端架构优化 Phase 1—6C 全量落地：动态表数据安全（`DynamicTableSql` 唯一入口）、可靠业务事件、IoT API 边界（`sw-basic-iot-api`）、依赖版本治理（Enforcer）、生产制品隔离（`build-prod.sh` 唯一生产入口 + 制品门禁）、CI-friendly 版本身份（`0.1.2-SNAPSHOT`/`0.1.2`）
- P61 用户可见错误码与提示语人性化（服务侧 + UI 侧）；P53 全局 UI 设计令牌与组件布局还原
- SSO 登录前发起按租户名称精确解析并新增用户选项端点；全局 ID/key 输入点选择器化

## 兼容、配置与迁移

- **无新增/变更运行时配置项**（CONFIG-CHANGES.md）
- Flyway **V94→V102**（0.1.0 终点 V93）自动前向迁移；2026-09-26 生产快照已至 V96，下次部署增量应用 V97→V102（DB-MIGRATIONS.md）
- Web `package.json` 版本 `0.1.0` → `0.1.2`；i18n 新增 2+2 条文案键
- 升级步骤与回滚边界见 UPGRADE.md / ROLLBACK.md

## 验证

| 门禁 | 结果 |
|---|---|
| Server 本地 `mvn -q compile` | exit 0 |
| Server 本地 `mvn -B test`（2G 上限） | **BUILD SUCCESS exit 0：1586 / 0 / 0 / 0**（2026-09-28 @ fd704ff） |
| Web 本地四连（2G 上限） | typecheck / lint / test / build 全 exit 0；vitest **1301 passed + 3 skipped（142 文件 + 1 skipped）** |
| Server CI run 36396145288 | success（全量测试门禁 + prod 打包 + 制品门禁，`build.version=0.1.2` 双 PASS） |
| Web CI run 36396187465 | success（四连 + dist 打包） |

## 已知边界

- SMS/EMAIL/FEISHU/DINGTALK/WECHAT_WORK 五外部通知渠道与腾讯 IoT 实网真实送达：Owner 延期/未验证
- V012-CODE-001（后端全限定类名清理与 import 规范）已登记未实施（`product/v0.1.2-bugfix/ready/direction-backend-import-style.md`）
- 本次发布不含服务器部署与生产库操作（部署需另行授权）
