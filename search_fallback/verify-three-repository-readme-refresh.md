# 三仓 README 重构只读核验回执

> 角色：执行；日期：2026-08-29；依据：`search_task/verify-three-repository-readme-refresh.md`。只读核验，未改文件、未跑编译/测试/迁移/服务、未提交推送。

## 探索结论

三份 README 已重构为「项目定位＋快速开始＋工程导航」主体的准确入口；相对链接 18/18 可达、旧口径零残留（唯一命中为合规「已废弃」澄清）、三仓限定改动仅 README.md。**D-01～D-05 全部 PASSED。**

## 1. 栏目（稳定栏目，非变更记录）

- 根 `README.md`：项目定位→三仓关系→快速开始→目录结构→核心架构→会话角色导航→当前状态快照→通用校验命令→权威文档导航
- 后端 `Smart-WorkFlow/README.md`：技术栈→四层模块架构→依赖方向→模块边界→环境要求→本地启动→构建/测试/迁移校验命令→Flyway 双方言迁移→核心设计要点→权威文档导航
- 前端 `Smart-WorkFlow-Web/README.md`：技术栈→目录分层→启动与运行模式→校验命令→鉴权/菜单/路由/边界→已验证闭环→权威文档导航

「工作区演变轨迹」「本轮完成」等日期式标题检索 0 命中。

## 2. 关键内容短摘录（文件:行号）

- 端口：根 `README.md:32-33,102-105`（后端 :8080/api、前端 :5173）；后端 `README.md:129`（http://localhost:8080/api）；前端 `README.md:110`
- 基线：根 `README.md:133-138`（36、✅32/🟦25/⬜33、955/agent346、110 spec files/1060 tests/0 skipped、H2 V44(44)/PG V44(43)）；后端 `:144,152`（955、V44(44)/V44(43)）；前端 `:127`（110 files/1060 tests）
- 命令/2G：根 `README.md:148,155-158,161`（MAVEN_OPTS=-Xmx2g、NODE_OPTIONS=2048、互斥）；后端 `:121,139-145`；前端 `:118-124`
- profile：后端 `README.md:110-111`（dev=H2、local=PG）
- superAdmin：前端 `README.md:136`（role code 含 superadmin 判定、`userId==1` 已废弃）

## 3. 相对链接（`[ -e ]` 在各自仓库根解析）

| 仓库 | 链接数 | 通过 | 失败 |
|------|:---:|:---:|:---:|
| 根 | 9 | 9 | 0 |
| 后端 | 4 | 4 | 0 |
| 前端 | 5 | 5 | 0 |

合计 18/18 可达，0 失败。含 system.md、knowledge/current-status.md、工程宪法、功能清单.md、eslint.config.js、vite.config.ts 等。

## 4. 旧口径残留（限定三份 README）

命令：`grep -nE '947|1057|V43|465|827|988|60 spec|521|userId==1|工作区演变轨迹|本轮完成' README.md Smart-WorkFlow/README.md Smart-WorkFlow-Web/README.md`

- 唯一命中：前端 `README.md:136` `userId==1`，位于「已废弃」澄清语境，合规。
- 逐词 `947/1057/V43/465/827/988/60 spec/521/工作区演变轨迹/本轮完成` 均 **0 处**。

## 5. 三仓限定 README 差异范围

- 根仓：`M README.md`（112+/89-）；其余为 memory（规划侧先记录）、product/ 方向/审查/回执、search_task/ 核验任务（机制文件）——执行侧仅改 README.md
- 后端仓：`M README.md`（134+/148-），无其他
- 前端仓：`M README.md`（101+/269-），无其他

未触碰业务代码/测试/迁移/工程宪法/system.md。

## 6. 治理复制 / 第二状态库 / 命令 / 一致性

- 治理复制：仅 2 处 `system.md §0.0/§0.3` 导航引用（根 README:5,36），无正文复制
- 第二状态库：根 README 仅精简快照；M 行式清单 0 行、I 行式 known-issues 0 行
- 命令可执行：前端 typecheck/lint/test/build 脚本存在；后端 mvn 命令为标准
- 一致性：三仓对 955、110/1060、V44、2G、端口 8080/5173 写法与 `knowledge/current-status.md` 对齐

## 未确认事项

- 未实际运行 typecheck/build 等命令（任务禁止运行）；质量门由既有正式基线（110f/1060t 全绿）锁定，不受 README 影响。
- 建议规划按 D-01～D-05 判 PASSED；发布三仓 README 需 Owner 另行授权提交推送。