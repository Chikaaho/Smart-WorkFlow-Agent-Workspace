# E0b2 最终候选交叉核对

冻结口径：不改变任何实现、不清理用户既有工作树；候选清单覆盖三仓当前 tracked/untracked 状态，再按路径和本轮 I2 授权范围抽取 task-owned 子集。

## 机器清单

- `06-final-candidate-input.txt`：在 Server 仓执行了提示要求的 `git rev-parse HEAD`、`git branch --show-current`、`git status --short --untracked-files=all`、`git diff --stat HEAD`、`rg --files sw-biz/sw-biz-form | rg 'Form.*Draft.*(Controller|Service)'`。
- `07-three-repo-status.txt`：workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web 的 HEAD、branch、tracked/untracked 原始状态。
- `09-candidate-root-task-owned.txt`：根仓 `knowledge/` 与 `product/v0.1.0-oa-completion/` 的 task-owned 候选路径。
- `10-candidate-server-task-owned.txt`：Server `sw-basic/`、`sw-biz/`、`sw-bootstrap/src/` 的 task-owned 候选路径；未吸收 uploads 与既有删除噪声。
- `11-candidate-web-task-owned.txt`：Web `src/` 的 I2 候选路径；本轮未读取、未修改、未构建 Web。

## 边界

根仓的 `memory/`、`todo/`、`dump.rdb` 以及 v0.3/P4 既有删除未纳入本轮 task-owned 修复；Server 仓既有 product/ 删除、uploads 未纳入；Web 根目录生成的临时 JSON 未纳入。原始状态仍完整保存在 `07-three-repo-status.txt`，因此排除项可回溯，不被候选清单静默吸收。

I2-04 新增证据只位于本目录；临时 token、私钥、运行数据库和运行日志不在候选目录。应用 PID 14356 已通过 Ctrl-C 停止，8080 端口随后探测为 closed。
