# v0.0.2 OA 规划验收05：A8 未通过，仅剩 README 产品化表达

2026-09-07；Planner。审查对象：`completion-v0.0.2-oa-05.md`、`evidence/readme-closeout/` 中两仓完整 diff、链接与扫描原件。A1—A7 继续锁定，本轮只验收 A8。

## 1. 裁决

**A8 未通过，主方向维持 `VERIFYING`。**

两个 README 已完成 CH-aPaaS 定位、OA 用户旅程和三个示例场景的主体改写，但仍把运行环境、配置和命令作为 README 章节保留，不符合 Owner 最新明确口径“写成介绍”。本轮属于 A8 首次验收失败，提交精确差异即可，不进入补充提示升级。

## 2. 已通过并锁定内容

| 项目 | 结论 |
|---|---|
| CH-aPaaS 定位 | PASSED：OA 被描述为平台已落地场景之一，两仓口径一致 |
| OA 用户旅程 | PASSED：工作台、流程中心、表单、个人办理、前后台和通知闭环以使用过程呈现 |
| 三个示例 | PASSED：灾备演练、校园异常流量、MES 温度判断均已纳入，核心语义与 Owner 原始记录一致 |
| 场景状态 | PASSED：明确三个完整端到端场景仍在完善，未冒充 v0.0.2 已全部交付 |
| 链接与卫生 | PASSED：本地链接无缺失，两个外部仓库最终访问 HTTP 200，敏感扫描无真实秘密，哈希 6/6 回读通过 |

后续不得重写上述主体或重新展开 A1—A7，只修正下表剩余项，并加入 Owner 新提供的 Logo。

## 3. 唯一剩余差异

| ID | 原件事实 | 完成条件 | 最小复验 |
|---|---|---|---|
| D1 Server 产品化表达 | `server-readme.diff` 末尾仍有“快速开始”，包含 JDK、Maven、Redis、H2/PostgreSQL、`SW_CIPHER_KEY`、Profile、启动/测试命令、端口和 API 文档路径；首句还并列 Java/Spring Boot | 删除整段工程操作内容；README 以产品介绍、应用场景、版本亮点和项目入口结束。语言/框架如保留，只在身份说明中出现一次 | Server 最终 diff/全文、标题清单、技术操作词扫描、链接检查、`git diff --check` |
| D2 Web 产品化表达 | `web-readme.diff` 末尾仍有“快速开始”，包含 Node、pnpm、真实 API/Mock、代理地址及 typecheck/lint/test/build 命令；首句并列 Vue/TypeScript | 删除整段工程操作内容；README 以用户体验、应用场景、版本亮点和项目入口结束。语言/框架如保留，只在身份说明中出现一次 | Web 最终 diff/全文、标题清单、技术操作词扫描、链接检查、`git diff --check` |
| D3 外部版本文案 | 两仓“当前版本”写“功能已完成验收，正处于发布前的文档收口阶段”，把内部治理过程写入产品介绍 | 改为面向读者的版本亮点和准确发布状态，例如说明 v0.0.2 即将发布、正式版本以仓库标签为准；不出现内部验收/收口术语 | 两仓当前版本段落逐字核对 |
| D4 首屏 Logo | Owner 新提供 `/Users/chikan/Downloads/135208.PNG`，当前两个 README 尚未纳入 | 将同一原图复制到两个仓库稳定文档资源目录；两个 README 标题附近通过相对路径展示，保持比例和清晰度，提供 `CH-aPaaS Logo` 替代文字 | 原图与两仓资源 SHA-256、相对路径解析、两仓 README 实际渲染截图 |

## 4. 下一动作

继续以更新后的 `ready/direction-v0.0.2-oa-readme-closeout.md` 为唯一入口，只修改两个 README 的 D1—D3并新增 D4 Logo 资源。无需运行业务测试，也无需重新采集三个示例和 A1—A7 证据。完成后追加 `completion-v0.0.2-oa-06.md`，附两仓最终 diff/全文、Logo 哈希与渲染截图、链接检查、技术操作词扫描、敏感扫描、`git diff --check` 和工具生成后回读的哈希清单。

状态保持 `VERIFYING / EXECUTION_SUBMITTED`；不得开始阶段三或发布。
