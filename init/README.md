# 初始化与全局更新

所有角色先按system.md运行只读版本检查，再进入角色任务。本目录统一管理入口指引、全局版本、Harness清单和本机result；Hook按本机环境适配，不统一复制部署。

## 两个版本与状态指针

| 文件 | 用途 | 是否提交 |
| --- | --- | --- |
| init/update.json | 仓库要求的全局初始化版本；新增/改变全局治理、Hook、Skill来源、适配能力时递增 | 是 |
| init/harness-list.json | 已知Harness、项目使用情况、维护记录、demo和复用/特殊化条件 | 是 |
| init/result.json | 当前工作树的本机状态指针，含最近写入版本，指向Git公共目录内的本机实际结果 | 否 |
| init/local-profile.json | 本机真正启用的Harness、兼容性评估、适配路径和验证命令 | 否 |

全局版本从1.0.0开始，独立于产品0.2.0等业务版本。实际result按本机/用户身份隔离、关联worktree共享；指针里的版本是写入时快照，运行check以公共目录中的当前结果为准。新机器、不同用户、普通clone不会继承其他机器的完成状态。不要把本机result或profile提交到Git。

## 所有角色：先检查

Windows：`py -3 init/check.py --harness codex`；macOS/Linux：`python3 init/check.py --harness codex`。按真实宿主替换为zcode、claude-code或清单中已登记的ID；不能因为另一Harness已初始化就沿用。

- READY：本机版本匹配、该Harness已验证、实际适配文件与Skill可读；再按system.md确认唯一角色，读取角色规范和返回的Skill路径。
- NOT_INITIALIZED / HARNESS_NOT_INITIALIZED：提醒切换管理员，按本指引适配、验证并更新result，普通角色不继续业务工作。
- UPDATE_REQUIRED：提示本机版本和要求版本，由管理员更新并重新验证，不能只把result数字改大。
- INVALID_RESULT：结果损坏、环境漂移或依赖不再可核验；管理员修复后重新完成。

尚未安装Python 3.10+或Git时，提醒管理员先准备基础工具，不能把“无法检查”当READY。检查为只读且不联网、不安装、不修改宿主配置；没有角色声明时也允许这项前置检查。管理员在未就绪状态可继续本次初始化/更新维护，不需要循环切换角色。

## 管理员：初始化或更新

1. 读取system.md、roles/admin.md、本指引和Harness list。运行`py -3 init/admin.py discover`（POSIX换python3）查看命令可见性、历史维护情况与本机状态。命令不在PATH不等于桌面App不存在，必要时据实际环境确认。
2. 首次运行`py -3 init/admin.py --role admin begin`建立未完成的本机result指针。已有成功结果不清零；直接准备更新并在验证通过后complete。
3. 运行`py -3 init/admin.py --role admin skills`。该入口复用governance/skills/ensure-skills.py：已有可用安装不重复下载，缺少时按声明准备；失败先修复。两个Skill的读取与使用仍按system.md。
4. 依据[Hook参考与适配](demos/README.md)选择真正使用的Harness。先判断能否直接复用，需特殊化则实现本机适配；新增Harness先在清单登记独立ID、实际维护范围和证据，不能把custom当已支持。
5. 参考local-profile.example.json写本机local-profile.json，将version填为当前update版本。模板中的示例路径/检查并不存在，必须替换为真实适配及验证；不得写只回显true的假检查。验证命令直接调用治理脚本，不调用业务构建/测试，不使用shell拼接；每项15秒超时、超时只清理自有进程树、输出最多64KiB摘要，保持有界可观测。
6. 运行`py -3 init/admin.py --role admin complete --profile init/local-profile.json`。入口逐项执行真实检查，确认Skill就绪后才原子更新result；角色、允许、拒绝、真实派发任一项失败都不标成功。宿主等待用户信任时保持未完成，不能代理批准。
7. 运行`py -3 init/check.py --harness <实际ID>`回读READY；此时普通角色可继续。全局清单记录公共维护情况，本机result记录发现了哪些、用了哪些、是否直接复用/已特殊化及验证结果。

## 新全局功能：递增update

维护Hook、角色治理、初始化协议、Skill来源或增加可复用Harness适配时，在同一批次运行：

`py -3 init/admin.py --role admin bump --part minor --summary "具体全局能力变化"`

破坏性不兼容用major，兼容新能力用minor，修复用patch。普通业务功能、业务版本号或业务回执不触发全局版本递增。bump只更新仓库要求，绝不自动晋级本机result。管理员适配/验证后再complete；其他机器下次check会提示UPDATE_REQUIRED。

提交前将本批全局文件和update.json一起暂存，再运行`py -3 init/admin.py check-version`。它比较暂存区与HEAD，检查全局范围变化是否配套递增暂存的update版本；可接入本机pre-commit或治理CI。实际接入方式按Harness/环境选择，不覆写原有Git Hook。首次引入1.0.0允许无旧版本。

## Harness清单维护

每项至少记录id/name、可检测命令、project_usage（used/configured/known_only）、maintenance.status、last_maintained（未知填null）及引用、demo_paths、reuse（verify_then_reuse/adapt_required/design_adapter）、specialization和限制。历史维护不等于本机能直接用；本机可用性与启用记录分别落result。新的维护结论有真实验证再更新，不把“有入口文件”升级为已使用或已验证。
