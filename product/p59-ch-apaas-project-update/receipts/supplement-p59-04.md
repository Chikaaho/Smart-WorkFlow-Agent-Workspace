# P59 执行补充提示03 回执（supplement-p59-04）

日期：2026-09-04。角色：执行（Executor）。等级：L。
输入：`receipts/planning-execution-prompt-p59-03.md`（三级提示，唯一当前执行入口）与 `receipts/planning-review-p59-04.md`。
性质：**仅完成两项本地补证，自验通过，待规划验收**。未覆盖任何旧回执/证据/附件。

---

## C1b2-ex 历史保存点（→ evidence-04/c1b2-ex.log → 实际结果）

**正向断言（全部满足）**，工作目录 `/usr/local/projects/Smart-WorkFlow`，每条均带命令与退出码：

1. **对象1（p57-bpm-node-extension.md）**
   - `git rev-parse b2311d72ad1eaa2ded00e1b2ea5252976bb986af:knowledge/features/p57-bpm-node-extension.md` → `474b8e00440ae5229cdcee6123a27945a636aea7`（exit 0），与目标 src blob **逐字相等**；
   - `git merge-base --is-ancestor b2311d72… 0712bb9ed2b888252d4d8be6fe431610e269ddc0` → **exit 0（可达）**，证明祖先提交从保留点可达；
   - `git cat-file -t 474b8e00…` → `blob`（exit 0）。
2. **对象2（session-handoff 归档）**
   - `git rev-parse 0712bb9ed2b888252d4d8be6fe431610e269ddc0:knowledge/history/session-handoff-before-knowledge-full-reconciliation-20260904.md` → `b9783c3844fcaafef3a3f28bf7c8c32e8c217841`（exit 0），与目标 src blob **逐字相等**；
   - `git cat-file -t b9783c38…` → `blob`（exit 0）。

**反向断言**：两个结果均为实际 rev-parse/cat-file/merge-base 输出与退出码，非对象库存在性声明；对象1 有祖先可达证明，对象2 有保留点下归档路径同 blob 证明。**覆盖边界**：未重新整理 main，未改历史，未做修复；两条演进保存点证据闭合。

## D2b-asset 完整发布段验证（→ evidence-04/d2b-asset-*.log、d2b-asset-sim-v4.sh、两份 workflow 副本、d2b-asset-negative-check.txt → 实际结果）

**源码固定**：
- Server `6ab9ae50080b2ae884eefaa728ae021702661ece`、Web `f9dca42317e33fd31254ed38d6c28f34473d40e5`（路径均 `.github/workflows/build-release.yml`）；
- 实际副本 `d2b-asset-server-workflow-6ab9ae5.yml`（54 行）、`d2b-asset-web-workflow-f9dca42.yml`（58 行）；文件 sha256 分别 `ab46b1fe…`、`f31aa7e4…`（与审查04 记载一致）；源 blob `fc12080c…`、`70cc7738…`；副本均由 `git show <完整提交>:<路径>` 导出，行数与末行可逐字核对。

**抽取修复与末行校验**：
- 根因确认：两份源 workflow 文件**无 EOF 换行**（`git show` 输出即无），旧正则按行匹配漏掉最后一行产物参数；
- v4 脚本（`d2b-asset-sim-v4.sh`）改用 python 全文按物理行拆分、剥离 run 块缩进、**保留末行**；仅替换 Actions 上下文表达式（locate.version/jar/jar_name、package.version）为本地实测值，命令结构不变；
- 抽取后逐字校验：Server 末行 `"sw-bootstrap/target/bootstrap.jar#bootstrap.jar"`、Web 末行 `"dist-${GITHUB_SHA}.zip"`（运行期由 GITHUB_SHA 替换为实际 S1），证据在四份日志头部。

**四份完整运行（真实 S1/S2，非空隔离样本产物）**：

| 运行 | 发布段 exit | 结果 |
|---|---|---|
| Server fresh（S1=096f707d…，main 已到 S2=6ab9ae50…） | 0 | GH_CREATE_OK assets=[ sw-bootstrap/target/bootstrap.jar#bootstrap.jar]，tag 指向 S1 |
| Server rerun（预置 tag=build-S1） | 0 | view exists → delete（仅 Release 保 tag）→ create 同资产，tag 仍指 S1 |
| Web fresh（S1=d1ad7719…，main 已到 S2=f9dca423…） | 0 | GH_CREATE_OK assets=[ dist-d1ad7719….zip]，tag 指向 S1 |
| Web rerun（预置 tag=build-S1） | 0 | view exists → delete 保 tag → create 同资产，tag 仍指 S1 |

每份日志含：完整 create 参数（Server 含 jar 及 `#bootstrap.jar` 显示名；Web 含 `dist-<S1>.zip`）、GH_CREATE_OK 资产记录、响应退出码、最终 tag 值与调用序列。样本产物为非空隔离文件（Server 28 字节、Web 24 字节），标注为隔离样本，非正式构建产物。

**反向断言（聚焦检查，evidence-04/d2b-asset-negative-check.txt）**：完整 v4 替身对三调用返退——
- 无资产参数 create → exit 1（GH_CREATE_FAIL no_assets）；
- 指定文件不存在 → exit 1（GH_CREATE_FAIL missing_or_empty）；
- 非空文件存在 → exit 0（GH_CREATE_OK assets=[…]）。
证明替身不再给空发布假成功，缺参/缺文件路径会失败。

**覆盖边界**：本地隔离证据（受控替身 + 非空样本），非 GitHub 真实发布；未重跑业务构建；未修改产品 workflow（抽取/替身属验证资产）；D3b 真实 Release 下载验证仍待授权。

## 哈希与未变更确认

- `evidence-04/SHA256SUMS.txt`（9 项，排除自身）：`shasum -a 256 -c` 9/9 OK。
- 既有 evidence-02/03 哈希清单与新证据未交叉覆盖；旧附件/回执未改动。
- 六分支 17 提交候选未被无声改变（本轮无新 Git 提交进入候选：证据存于工作区 receipts 目录，提示 §4 允许且无需为进入发布清单新增提交——候选 JSON 未变化）。
- 未授权远端动作：无推送、无 tag/Release 操作、无强推、无删除。

## 自验结论

C1b2-ex 与 D2b-asset 两项全部正反断言均有真实输出与退出码；锁定项未无故重跑；发布候选未变。**自验通过，待规划验收。唯一剩余为 D3b（Owner 授权后真实 main→workflow→Release→产物核验）。P59 保持 VERIFYING，不核销、不归档、不进入阶段三。**