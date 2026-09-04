# P59 执行补充提示04 回执（supplement-p59-05）

日期：2026-09-04。角色：执行（Executor）。等级：L。
输入：`receipts/planning-execution-prompt-p59-04.md`（唯一当前执行入口）与 `receipts/planning-review-p59-05.md`。
性质：**仅完成 D2b-asset 验证工具与证据闭合，自验通过，待规划验收**。未覆盖任何旧回执/证据/附件。

---

## D2b-asset → evidence-05/ → 实际结果 → 本地隔离边界

### 1. 验证工具修复（→ `d2b-asset-sim-v5.sh`）

**缺陷修复**（审查05 三点）：
1. **抽取步骤错误**：v4 取首个 `run: |`（Server 误取 Locate 块、Web 误取 Package 块），v5 改为**命名步骤解析**——定位 `- name: Create GitHub Release` 行，再取其后的 `run: |`，按缩进边界提取至下一步骤或 EOF。两份真实 Release 块均 **17 物理行**（与审查记载一致），末行保留：Server `"sw-bootstrap/target/bootstrap.jar#bootstrap.jar"`、Web `"dist-<完整S1>.zip"`（替换后实际值）。
2. **失败传播**：外层脚本 `set -eu`；发布段用 `set +e; sh release-step.sh; RC=$?; set -e` 捕获真实退出码，脚本以 `exit $RC` 结束（不再固定 0）。日志显式输出 `== 发布段退出码: N ==`。
3. **替身显式错误处理**（v5 内嵌 gh 替身）：缺资产 → `GH_CREATE_FAIL no_assets` exit 1；指定文件不存在/空 → `GH_CREATE_FAIL missing_or_empty` exit 1；已存在 tag 且目标不同 → `GH_CREATE_FAIL tag_conflict`（含 existing/target 实际值）exit 1；`git tag`/`git push` 真实失败 → `GH_CREATE_FAIL git_tag_error/git_push_error` exit 1；已存在 tag 且目标相同 → `GH_CREATE_OK_same_tag` exit 0（显式识别同提交重跑）。**不再吞错后固定成功**。

**完整抽取段保全**（`d2b-extract-server-17lines.sh`、`d2b-extract-web-17lines.sh`）：由 v5 内 python 步骤级解析从固定源码副本生成，逐字可用；抽取段指纹 Server `fe3bc3ea…`、Web `78514fcd…`。

### 2. 四份干净运行（→ `d2b-v5-{server,web}-{fresh,rerun}.log`）

固定对象：Server 源 `6ab9ae50080b2ae884eefaa728ae021702661ece`（S1=`096f707d…`，S2=源提交）；Web 源 `f9dca42317e33fd31254ed38d6c28f34473d40e5`（S1=`d1ad7719…`，S2=源提交）。样本为非空隔离文件（Server 23 字节 bootstrap.jar、Web 24 字节 dist zip），**未冒充正式构建产物**。

| 运行 | 抽取行数 | 发布段 exit | 结果 |
|---|---|---|---|
| Server fresh | 17 | 0 | GH_CREATE_OK assets=[ sw-bootstrap/target/bootstrap.jar#bootstrap.jar]，远端 tag=S1 |
| Server rerun | 17 | 0 | view exists → delete（仅 Release 保 tag，GH_DELETE）→ GH_CREATE_OK_same_tag，tag 仍=S1 |
| Web fresh | 17 | 0 | GH_CREATE_OK assets=[ dist-d1ad7719….zip]，tag=S1 |
| Web rerun | 17 | 0 | GH_CREATE_OK_same_tag，tag 仍=S1 |

四份日志**均无** `command not found`、`bad substitution`、`No such file`、`GH_CREATE_FAIL`（grep 计数 0）。每份含：完整 create 参数（Server 带 jar 及 `#bootstrap.jar` 显示名；Web 带 `dist-<S1>.zip`）、GH_CREATE_OK 资产记录、退出码、最终 tag 值与调用序列。

**反向断言满足**：输入 main 已推进到 S2 时 fresh 的 tag 仍为 S1；rerun 保留该 tag（GH_CREATE_OK_same_tag 路径）。

### 3. 负向聚焦原始日志（→ `d2b-asset-negative-raw.log`，真实输出非摘要）

工作目录 `/tmp/d2b-neg2/work`，替身 `/tmp/d2b-neg2/stubbin/gh`（v5 内嵌替身副本，PATH 前置），预置远端 tag `build-<S1>` → S2（≠ target S1）：
- 缺资产参数：`gh release create build-<S1> --target <S1> --title T --notes N` → **exit 1**，记录 `GH_CREATE_FAIL no_assets`；
- 受控冲突失败传播：同命令 + 存在且非空的 `/tmp/d2b-neg2/bootstrap.jar` → **exit 1**，记录 `GH_CREATE_FAIL tag_conflict existing=<S2> target=<S1>`；
- 结束后 `git ls-remote --tags origin` 显示 tag 仍指向 S2——**未被删除/覆盖**。

### 4. 边界与未变更确认

- 本地隔离证据（受控替身 + 非空隔离样本），**非 GitHub 真实发布**；未重跑业务构建；未修改产品 workflow（v5 只替换验证工具与替身）。
- 锁定项（C1b2-ex、源码身份、A1b/H1/B1/D1/E1/A1a/C1a/C1b1/D2a、六分支 17 提交候选）未重验、未变更；conflict/queryfail 拒绝路径旧日志保留为通过事实，未重跑。
- evidence-05 哈希 8/8 回读 OK（SHA256SUMS 排除自身）。
- 候选未无声改变；无未授权远端动作（无推送/tag/Release/删除/强推）。

## 自验结论

D2b-asset 全部完成条件与反向断言满足：命名步骤完整抽取（17 行逐字对应）、四运行无混入错误且携带资产并保持 S1 目标、负向缺资产/冲突失败真实传播且处 0 gh 成功记录、外层保留真实退出码。**自验通过，待规划验收。**

**唯一剩余**：D3b 真实发布（Owner 对六分支 17 提交候选授权后，真实 main→workflow→Release→产物核验，本地替身不替代该证据）。P59 保持 VERIFYING，不核销、不归档、不进入阶段三。