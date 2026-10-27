# 初始化、全局版本与Harness适配清单

2026-10-27｜Admin｜Owner要求统一初始化指引，同时按机器、环境及Harness决定复用或适配

## 交付

- init/README.md统一Hook参考、Skill准备、本机验证、result更新及全局升级。现有Hook是demo，初始化工具不自动复制Hook或覆写宿主配置。
- init/update.json建立独立全局版本1.0.0；新全局治理/Hook/Skill来源/可复用适配变更须递增，同批暂存检查版本。业务功能与业务版本不触发该版本更新。
- init/check.py为所有角色的只读前置，要求传入真实Harness ID。未初始化/损坏/该Harness未就绪提醒管理员，版本不匹配报告UPDATE_REQUIRED；角色声明不被初始化检查替代，管理员可继续本项维护。
- init/result.json是本机指针，Git公共目录保存按机器/用户隔离的实际结果；关联worktree共享，result/profile不提交。验证成功与末次回读都通过才晋级，失败不抹去旧成功版本或伪造新成功。
- init/harness-list.json记录已知种类、项目使用、维护事实、参考路径、复用条件、特殊化事项和限制；本机实际可见性/启用/复用或适配/验证结果记录在result。当前登记Codex、ZCode、Claude Code及待登记其他Harness入口，维护日期未知留null。
- init/admin.py提供discover/begin/skills/complete/bump/check-version；本机profile显式声明实际适配文件、环境评估及startup_gate/role_binding/allow/reject/dispatch验证命令。模板不能直接作为成功结果，CLI或文件存在不等于真实派发。
- 共享终态契约和Windows/POSIX公共Validator随仓库作为参考基础分发，保持原位置、原规则；未把本机历史宿主脚本整包复制给新机器。Skill保留原来源与兼容入口。

## 验证与现场

初始化协议24项用例已验证：23项整套通过后，新增CLI实际Harness参数/只读结果用例聚焦通过；覆盖版本差异、跨机器/跨Harness拒绝、关联worktree共享、失败保留旧版本、末次回读失败不留成功、忽略本机状态、暂存版本检查等。Skill原有13项通过；公共Validator在Windows/POSIX各做有效允许和无效拒绝，共4个实际检查通过。无业务编译、测试、数据库或部署。

本机discover观察到Codex及Claude命令可见，ZCode不在PATH，后者不推断为未安装。已建立本机result指针，version=0.0.0、initialized=false、要求版本1.0.0。已有Codex自动派发记录出现ROLE_UNBOUND，未把组件测试或已装Skill冒充真实角色/派发适配完成；本机后续须按实际Harness验证后complete。

本次同步system.md、AGENTS入口、三角色及Skill指引；不修改业务提示/功能状态。治理四阶段：整理、实现、验证完成，提交同步进行中（3/1/0）；Git提交与主工作区同步按实际输出和最终交接确认。已有业务规划与Web在途修改保持，不纳入治理提交。
