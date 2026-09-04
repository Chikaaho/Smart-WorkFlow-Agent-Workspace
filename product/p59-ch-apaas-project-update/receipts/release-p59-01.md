# P59 真实发布回执（release-p59-01）

日期：2026-09-04。角色：执行（Executor）。等级：L。
授权：Owner 确认 `planning-release-scope-p59-01.md`（三仓六分支 17 提交固定候选 + main 自动发版 + 真实产物核验）。
性质：**D3b 真实发布完成，两仓 Release 均已生成，产物已下载核验**。P59 交付规划验收。

---

## 1. 发布执行结果（六分支）

| 远程 | 分支 | 起点 | 终点（实际推送） | 提交 | 结果 |
|---|---|---|---|---|---|
| Smart-WorkFlow-Agent-Workspace | develop-sw | 0712bb9e… | `ddea4c0c…` | 7 | ✅（候选 6 + aPaaS 修正 1） |
| Smart-WorkFlow-Agent-Workspace | main | cece7847… | `29f70338…` | 1 | ✅ |
| Smart-WorkFlow-aPaaS-server | develop | 11612df0… | `d62c8436…` | 2 | ✅（候选 1 + aPaaS 修正 1） |
| Smart-WorkFlow-aPaaS-server | main | e0e899d1… | `6ab9ae50…` | 5 | ✅（含 4 更正提交，见 §3） |
| Smart-WorkFlow-aPaaS-Web | develop | 4b62076e… | `f2647e15…` | 2 | ✅（候选 1 + aPaaS 修正 1） |
| Smart-WorkFlow-aPaaS-Web | main | 9a22a66b… | `4c044c67…` | 5 | ✅（候选 3 + 2 修复提交，见 §3） |

各分支均仅快进到终点 SHA；未强推、未删除远端分支；推送前回读远端与清单一致，推送后回读最终 SHA 全部符合（见 `evidence-06/d3b-summary.md`）。

## 2. 真实 main → Actions → Release → 产物（D3b 核心证据）

### Server（Smart-WorkFlow-aPaaS-server）

- **run**：`https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/actions/runs/33889195373`
  event=`push`，head_sha=`6ab9ae50080b2ae884eefaa728ae021702661ece`，conclusion=**success**（3m33s）。
- **Release**：`CH-aPaaS-Server 1.0.0-SNAPSHOT build 6ab9ae50080b2ae884eefaa728ae021702661ece`（Latest），由 `github-actions[bot]` 创建。
- **tag**：`build-6ab9ae50080b2ae884eefaa728ae021702661ece` → 目标 **= 6ab9ae50…（构建提交）** ✓（与清单预计 tag 一致）。
- **asset**：`bootstrap.jar`，154,357,403 B；实际下载 sha256=`7418b1397eca24cb0e6494e2e5326e0064364ddecea93e5fc717dfab7ce0307a`（指纹见 `evidence-06/d3b-server-jar-fingerprint.txt`；二进制 >100MB 不入库，本地留存 /tmp/p59-download/bootstrap.jar）。

### Web（Smart-WorkFlow-aPaaS-Web）

- **run**：`https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/actions/runs/33889880505`
  event=`push`，head_sha=`4c044c671318627599560320efd217a0a520b5aa`，conclusion=**success**（2m56s）。
- **Release**：`CH-aPaaS-Web 0.0.0 build 4c044c671318627599560320efd217a0a520b5aa`（Latest），由 `github-actions[bot]` 创建。
- **tag**：`build-4c044c671318627599560320efd217a0a520b5aa` → 目标 **= 4c044c67…（构建提交）** ✓。
- **asset**：`dist-4c044c671318627599560320efd217a0a520b5aa.zip`，766,936 B；实际下载 sha256=`adadb4a381014d28cf4774b4a52a581f727fa15474f3d74c294f8de7c331d071`（`evidence-06/dist-…zip`，含 dist/index.html 与 assets ✓）。

两仓 run→head_sha→tag→Release→asset 全部关联同一提交；发布物对应实际构建提交。

## 3. 发布过程中对该批候选的修正（如实披露）

发布候选经真实运行暴露两个环境适配问题，均以新提交修正并入 main（同发布授权范围，重跑仅重建同提交 Release，未覆盖其他提交发行物）：

1. **Web setup-node `cache: pnpm` 失败**（first run 33889202310 FAIL 21s）：`pnpm store path` 报 `packages field missing or empty`——pnpm workspace 文件存在但无 `packages` 字段。修复：workflow 移除 `cache: pnpm`（提交 `c0b8f70`）。
2. **Web `pnpm install` 仍失败**（run 33889635018 FAIL 24s）：pnpm 9 要求 workspace 显式 `packages`。修复：`pnpm-workspace.yaml` 声明 `packages: ['.']`（语义不变，提交 `4c044c67`）；修复前用 pnpm 9.15 本地验证 install 通过（35.1s）。
3. **Server 推送提示 moved**：GitHub 通告后端仓库规范位置为 `Smart-WorkFlow-aPaaS-server`（sPaaS 系 Owner 原需求文件笔误）。已将三仓说明（project.md、README、Server/Web README）与 Server origin 全部修正为 aPaaS（工作区 `ddea4c0c`、Server `d62c8436`、Web `f2647e15`），残留检查无 sPaaS。

Server main 首次 run 即 success（无需修正）；Web main 经上述两个修正后 success。失败 run 日志均保留（`gh run view --log-failed` 输出已确认根因），未把失败当成成功。

## 4. 边界与未执行动作

- 未部署、未做设备动作、未实现示例流程；未强推、未删除远端 tag/Release。
- 正式业务功能数 41、既有验证基线不变；未进入阶段三（待 Planner 验收后另行处置）。
- 工作区后续回执/规划文件保存在工作区仓库（develop-sw），未加入 main 发布集合。

## 5. 证据封装

- `evidence-06/`：d3b-summary.md（含六分支最终 SHA）、d3b-server-release.txt、d3b-web-release.txt、d3b-web-assets.json、bootstrap.jar（下载）、dist-….zip（下载）。
- SHA256SUMS（6 项，排除自身）回读 6/6 OK。
- 真实 run URL、Release URL、tag 目标、asset 元数据均可在线复核。

**自验结论：D3b 真实发布完成——两仓成功构建、Release 与 tag 绑定构建提交、产物已下载并核对名称/大小/指纹；三仓六分支最终远端状态已保全。待规划验收。**