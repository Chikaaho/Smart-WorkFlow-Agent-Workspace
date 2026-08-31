# 管理员修正总回执：P51 通用运行时契约收敛（二级收敛）

> 执行角色：管理员（Admin）
> 唯一活动输入：`receipts/planning-admin-prompt-p51-consolidated-2.md`
> 权威审查：`receipts/planning-rereview-admin-p51-consolidated-20260831-01.md`
> 基础方向：`ready/direction-admin-p51-engine-governance-consolidated.md`
> 日期：2026-08-31
> 结论性质：治理修正完成声明；不裁决 P51。

## 一、修改文件清单

| 文件 | 缺口 | 改动摘要 |
|------|------|----------|
| `system.md` | C1/C3 | §0.8 终态 marker 引用 `SWF_TERMINAL `→`ENGINE_TERMINAL `；§3.4 唯一终态值清单中「各 coding 仓库测试基线、迁移基线」→「项目声明且本功能实际涉及的验证基线集合（未涉及时为空集合；不固定任何技术类别）」；§0.2 执行速查「可执行编译/测试命令（限内存）」→「可执行项目已声明的工程动作」 |
| `roles/planner.md` | C1 | §7.2 终态值清单同一基线集合表述；勾稽规则改「授权集合 = 实际涉及集合，未涉及时为空」；复核第 4 项「后端、前端与迁移基线逐字一致」→「验证基线集合三方一致（授权 = 实际 = 回执，可为空）」；§7.1 互斥检测表述改为声明制 |
| `roles/executor.md` | C2 | §2「限内存」→声明制；§3 入口范围规则移除「跨仓库编译互斥和内存限制」默认要求，改为「针对本次实际涉及工程动作声明的资源、互斥与并发规则；未声明动作不执行、不产生任何默认约束」；§4.1 证据真实性同口径；§8 映射表行同步 |
| `.codex/governance/terminal-contract.json` | C3 | `contract` 与 `schema.const`：`smart-workflow.executor-terminal.v2`→`agent-coding-engine.executor-terminal.v1`；`marker`：`SWF_TERMINAL`→`ENGINE_TERMINAL`（其余字节 0 变化） |
| `.codex/governance/test-terminal-contract.sh` / `.ps1` | C3 | 35 用例中标识字符串同步替换（.ps1 非标识行变化数 0） |
| `.codex/hooks/stop-execution-completeness.sh`、`.claude/hooks/stop-execution-completeness.sh` | C3 | marker 常量同步（各 1 行） |
| `product/p51-agent-coding-engine-decoupling/README.md` | 指针 | 追加最新回执与证据包指针 |
| 本回执 + `receipts/evidence-admin-consolidated-2/`（7 份固定证据） | — | 新增 |

未修改：双平台 Validator（`.codex/governance/validate-terminal.sh`/`.ps1`，二者从契约文件动态读取 const，无需改动）、状态集合、字段 allowed/required/forbidden、阻断次数、三角色权限、已锁定通过项。

## 二、C1～C5 逐项核销

| 缺口 | 结果 | 证据 |
|------|------|------|
| C1 阶段三基线集合声明制，允许为空，无固定技术类别 | ✅ | 证据 01：三处修改 diff 与原文（system §3.4、planner §7.2 清单与勾稽、planner §7.2 复核第 4 项三方一致）；空/单/多集合语义示例；`后端基线|前端基线|迁移基线` 运行时表面 0 命中 |
| C2 资源/互斥/并发仅从项目声明加载；未声明零生成 | ✅ | 证据 02：已声明动作正向执行 exit=0；规则原文三处；断言式默认约束模式（2G/Xmx/max-old-space/上限数值/默认施加）命中 0；行为证据条款已改为「对本次实际涉及且已声明的工程动作提供其约束检查与输出」 |
| C3 终态 schema 与 marker 通用标识，语义不变，旧标识 0 命中且无兼容别名 | ✅ | 证据 03：迁移 diff 仅标识行；契约 required/properties/states/marker/additionalProperties 标识归一后逐项 IDENTICAL；旧标识在 system、roles、.codex 全目录、.claude 全目录 0 命中 |
| C4 通用性扫描覆盖全部运行时治理表面 | ✅ | 证据 05：24 个扫描目标逐项存在性 OK 后才执行扫描；品牌/旧标识与固定工具命令/资源值两类模式命中行计数均 0；BSD grep 2.6.0，无 warning/error/未展开参数 |
| C5 夹具工程动作可审计调用账本 | ✅ | 证据 06：`sh -x` 全量 trace 账本——声明动作 2 项与实际调用一一对应（cat/grep，exit=0）；未声明动作关键词（mvn/pnpm/npm/gradle/cargo/python/docker/kubectl/java/migrate/deploy/build/install/serve/start）账本命中 0；全程无资源/互斥类行为生成 |

## 三、持久证据包索引

目录：`receipts/evidence-admin-consolidated-2/`

1. `01-stage3-baseline-semantics.txt` — C1 修改位置、集合语义、固定技术基线零残留；
2. `02-resource-concurrency-declaration.txt` — C2 正向遵守、规则原文、默认约束零生成；
3. `03-terminal-identifier-migration.txt` — C3 新标识、迁移 diff、结构差异为零、旧标识零残留；
4. `04-terminal-regression.txt` — C3/C4 35 用例回归（35/35）、pwsh 受限记录、Hook 四类输入（含旧标识不兼容）在 Engine 子目录与嵌套 git 仓 cwd 的行为；
5. `05-runtime-surface-scan.txt` — C4 扫描目标存在性 + 双模式零残留；
6. `06-action-call-ledger.txt` — C5 调用账本与零调用断言；
7. `07-scope-git.txt` — 修改范围、diff check、提交、未远端发布。

## 四、权限与终态语义差异核对

- 终态状态集合（EXECUTION_SUBMITTED / TERMINAL_SYNC_SUBMITTED / BLOCKED）、字段 schema、各状态 allowed/required/forbidden、allowedFeatureStatus、首次非法阻断一次/重试仍非法停止续跑、`role=executor` 门禁——全部不变；证据 03 §3.3 标识归一后结构逐项 IDENTICAL、证据 04 §4.1 35/35 等价回归。
- 三角色读取/写入/执行边界无变化；C1/C2 修改仅为把固定技术类别与默认约束改为项目声明制，属于收窄 Engine 预设、未扩任何角色权限。
- Validator 脚本 0 改动：公共 Validator 从契约文件动态读取 const/marker，契约迁移自动生效（35 用例证实）。

## 五、提交前门禁自检（提示 §八）

- C1～C5 均有持久证据：是（§二）；
- 基线集合可为空、无固定技术类别：是（证据 01）；
- 未声明资源/并发 0 默认约束：是（证据 02 §2.3）；
- 运行时旧项目契约标识 0 命中：是（证据 03 §3.4、证据 05 §5.2）；
- 终态字段/状态/阻断语义一致：是（证据 03 §3.3、证据 04 §4.1）；
- 35 用例回归与 Hook 输入通过：是（证据 04）；
- 调用账本未声明动作计数 0：是（证据 06 §6.4）；
- 扫描无 warning/error、Git 可复核：是（证据 05、07）；
- 未触碰锁定项、真实业务实现、分支和远端：是（§六）。

## 六、范围与 Git 声明

- 本轮修改仅限提示 §三允许范围（C1/C2/C3 直接相关内容 + 新回执/证据/索引指针）；`git status`/`diff --stat` 原始输出见证据 07。
- 未读取或修改真实 coding 仓业务实现；未运行真实项目工程动作（账本中仅夹具声明的 cat/grep）。
- 未重做目录/隔离/Hook 定位等已锁定项；未改分支、tag、历史；未 push（证据 07 §7.5：`origin/main..main` 含全部本地提交，从未发布）。
- 提交：本地中文 Conventional Commit，无 Harness 署名。

管理员以治理修正完成结论结束；P51 的验收由规划角色依据本回执与证据包作出。
