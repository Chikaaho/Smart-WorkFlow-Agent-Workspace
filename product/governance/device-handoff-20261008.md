# 2026-10-08 设备交接

Owner授权提交推送实际生效的ZCode hook、配置及有效产物，以便换设备继续。当前业务任务为P64，状态READY；合同与方案就绪，业务实施尚未授权。唯一Executor动作仍为[P64方案复核02](../p64-mes-advanced-orchestration/receipts/planning-solution-review-02.md)§5的READY文档传播，之后交Planner复核。

## 1. 远端恢复入口

| 仓库 | 远端 | 恢复分支 | 本次远端回读 |
|---|---|---|---|
| 工作区 | Chikaaho/Smart-WorkFlow-Agent-Workspace | develop-sw | hook/config批次fb0e93e66cadd0b3a55f57330d115a281b938af0；本交接与gitlink另作后续文档批次。 |
| Server | Chikaaho/Smart-WorkFlow-aPaaS-server | feature/p64-mes-advanced-orchestration | c79db713aad5a50af8303f09e74b894f5cb075dc |
| Web | Chikaaho/Smart-WorkFlow-aPaaS-Web | feature/p64-mes-advanced-orchestration | 2b0c660fb1b1d4f612ada472c38e964a481937a5 |

两个feature分支已推送且建立origin同名跟踪，回读本地/远端0/0。代码起点与develop一致，未新增业务实现。根仓gitlink更新为上述已推送的代码仓提交；两个业务仓仍分别管理，使用独立Git检出。

新检出可在选定的父目录执行：

```sh
git clone --branch develop-sw git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git Smart-WorkFlow
cd Smart-WorkFlow
git clone --branch feature/p64-mes-advanced-orchestration git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-server.git Smart-WorkFlow-aPaaS-server
git clone --branch feature/p64-mes-advanced-orchestration git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git Smart-WorkFlow-aPaaS-Web
```

目标设备已有检出时，先核对三仓分支、未提交内容和分歧，再获取相应远端分支；保留该设备既有工作。

## 2. ZCode生效配置

本机实际生效位置为用户级`~/.zcode/cli/config.json`；其hooks与仓库[唯一声明](../../.codex/governance/zcode-hooks-declaration.json)的POSIX块一致。声明、平台安装器、Stop入口、公共Validator和自检均已版本化。`.zcode/config.json`保存工作区MCP配置，hooks.events为空；运行hook由用户级安装器建立。

本次提交fb0e93e包含`zcode-role-bind.py`对开头角色词加标点/结尾的识别、对应测试以及工作区配置快照。支持“执行，领取任务”“规划：复核回执”和单独“执行”，普通任务描述仍不推断会话角色。

POSIX目标机须具备可用的python3（含sqlite3）和jq，在工作区根执行：

```sh
sh .codex/governance/install-zcode-hooks.sh
sh .codex/governance/install-zcode-hooks.sh -Check
sh .codex/governance/hook-selfcheck.sh --recent-audit=3
```

Windows目标机使用对应入口：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .codex/governance/install-zcode-hooks.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .codex/governance/install-zcode-hooks.ps1 -Check
powershell -NoProfile -ExecutionPolicy Bypass -File .codex/governance/hook-selfcheck.ps1
```

安装核验要求为配置in-sync、drift=false及入口可用。在目标设备的ZCode会话明确声明唯一角色后，核对实际派发/审计；新设备尚未产生派发记录时不以文件存在宣称live。本次本机验证为POSIX，目标机安装与实际派发应在目标机回读。

用户配置由平台声明和安装器重建；认证、数据库连接及设备本机秘密使用目标设备自己的私有配置，仓库只保存声明、变量名及恢复入口。

## 3. 本次验证

- `install-zcode-hooks.sh -Check`：exit0，in-sync，effective_scope=user，drift=false。
- `hook-selfcheck.sh --recent-audit=3`：exit0，live，135条审计/102条派发记录，11个角色会话，未发现入口失败台账；真实Stop已有TERMINAL_ACCEPTED记录。它证明当前本机接入状态，不代表目标设备已运行。
- 现有`test-zcode-gate.py`：31项全部通过，3.361s，exit0。有限隔离夹具，90s外层超时与自身进程组清理；本次无超时或残留任务。
- 两个修改Python文件语法、声明/工作区配置JSON解析、POSIX安装器/自检shell语法及diff空白核验通过；未运行业务编译、测试、迁移或性能任务。

## 4. 本地剩余对象分类

| 对象 | 本次判定与处理 |
|---|---|
| changed-files/p63/LoopbackPeerProviderDevTest.java | 临时测试草稿。没有assert断言；assumeTrue只判断当前目录存在，异常被吞掉，不能证明dev注册或真实对端。保留本地，未纳入有效资产提交。 |
| Web stash@{0}（lint-staged automatic backup） | 四文件快照与当前历史祖先c75f77e完全一致，属于已提交自动保存/窄屏修复备份。当前HEAD另有P63后续改动；无需作为独有成果搬运，stash保留本地。 |
| 日志、runtime、构建输出、机器私有配置 | 本机临时/运行/私有状态，未纳入远端批次。 |

正式功能47、清单46/22/22=90、ADV64及其他P/明细保持；P63已完成业务及验证集合继续锁定；P62性能Owner延期未验证、新资源策略默认关闭。

## 5. 下一会话

Planner恢复时先读system.md、roles/planner.md、memory/README→state→handoff，再读[P64主方向](../p64-mes-advanced-orchestration/ready/direction-p64-mes-advanced-orchestration.md)、[方案](../p64-mes-advanced-orchestration/ready/solution-p64-mes-advanced-orchestration.md)及方案复核02。Executor读取同一当前入口，按§5先机械传播READY并回读。实施获授权后在对应feature分支继续；commit使用规范格式和简短中文主题。
