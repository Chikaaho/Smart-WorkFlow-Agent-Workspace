# 0.2.2 发布回执（第 2 次）：发布后分支同步（C022-S1）

日期：2026-11-05。角色：Executor。依据：`planning-review-release-022-01.md`（revision 17）、`planning-execution-prompt-release-022-01.md`。

范围仅分支同步：不改代码、不动 UAT、不移动/重建 tag、不改 Release。

## 一、合并前 ahead/behind

| 仓 | develop | main | ahead/behind（develop...main） | 祖先关系 |
|---|---|---|---|---|
| Server | `2b9482e1` | `3c4942f0` | 0 ahead / **11 behind** | develop 是 main 的祖先（可 fast-forward） |
| Web | `c9f09f4` | `9dd7e7b` | 0 ahead / **6 behind** | develop 是 main 的祖先（可 fast-forward） |

## 二、合并与推送

两仓均以 **fast-forward 普通合并** 将 `main` 合回 `develop`，无冲突、无强推、未产生新代码提交：

| 仓 | 操作 | develop 结果 | 推送 |
|---|---|---|---|
| Server | `git merge --ff-only main` | `2b9482e1` → **`3c4942f0`** | `2b9482e1..3c4942f0 develop -> develop` |
| Web | `git merge --ff-only main` | `c9f09f4` → **`9dd7e7b`** | `c9f09f4..9dd7e7b develop -> develop` |

- 未改动 tag `0.2.2`、未改 Release、未改任何代码；Web 工作树中 `vite.config.ts` 在途改动保持未提交。
- tag 指向（与 main 最新提交区分）：Server tag 对象 `dc5eedd6` → 提交 `0bf4c938`；Web tag 对象 `98d0ce5f` → 提交 `3bcd7c2`。

## 三、`git ls-remote` 回读（远端）

| 仓 | `refs/heads/main` | `refs/heads/develop` | `refs/tags/0.2.2`（对象） | `refs/tags/0.2.2^{}`（提交） |
|---|---|---|---|---|
| Server | `3c4942f0e5d248b726c96438d138f6a7bc749b14` | `3c4942f0e5d248b726c96438d138f6a7bc749b14` | `dc5eedd652b5bce02c3ba51b589ed646f718e1dc` | `0bf4c938898350c2513e4fdb1f3c6de6503cd007` |
| Web | `9dd7e7b0d047330d6230313d35bc7481cc336345` | `9dd7e7b0d047330d6230313d35bc7481cc336345` | `98d0ce5fb26e37e05ada9e9bf7d1e73fe0dec321` | `3bcd7c2c97d0ef1c5093d0c3b6d14820991fa9e6` |

结论：两仓 `develop` 已包含 `main`（SHA 相同）；tag `0.2.2` 指向不变，仍为发布提交 `0bf4c938`／`3bcd7c2`。

## 四、develop 推送触发的 CI

| 仓 | run | attempt | 结果 | 证据 |
|---|---|---|---|---|
| Server | **`41979306984`** | 1 | **success** | drill `ApplicationCenterRecoveryDrillPostgresTest` **1/1（Skipped 0）**；`P62UpgradeGatePgTest` **2/2**；全工程 **2351 / 0 / 0 / 33**，BUILD SUCCESS |
| Web | **`41979315683`** | 1 | **success** | typecheck/lint/test/build 全通过（develop 分支） |

## 五、入口同步覆盖矩阵（先 knowledge，后 memory/todo）

| 入口 | 写入内容 | 回读核对 |
|---|---|---|
| `knowledge/current-status.md` | 头部状态加「含 main→develop 分支同步」；唯一终态值分列 tag 指向（`0bf4c938`/`3bcd7c2`）与当前分支头（Server `3c4942f0`、Web `9dd7e7b`）；第 4—6 阶段段补 C022-S1 合并、回读、CI run 与 tag 不变 | 与 §三 ls-remote 一致 |
| `knowledge/features/0.2.2-integrated-release.md` | 代码行改为 `main`=`develop`=`3c4942f0`／`9dd7e7b`，tag 指向单列 | 一致 |
| `knowledge/session-handoff.md` | 当前续接段更新分支头、tag 指向与 OpenRouter 格式提示；下一动作加 `release-sync-022-02.md` | 一致 |
| `memory/state.md` | 合并条目补 C022-S1（FF 合并、回读、tag 不变）；终态值补分支头；下一动作与进度改为「已完成 6、未开始 1」 | 一致 |
| `memory/handoff.md` | 第 6 阶段补分支同步与回执；§5 分支头；§8/§10 回执清单；§9 供应商现状 | 一致 |
| `memory/features.md` | 0.2.2 条目补分支同步与分支头、tag 指向 | 一致 |
| `memory/README.md` | 当前交付与下一动作补 `release-sync-022-02.md`、分支头 | 一致 |
| `todo/requirement-pool.md` | 第 4—6 阶段段补 `release-sync-022-02.md`、分支头、tag 不变、供应商现状；剩余仅结束阶段 | 一致 |

部署版本照原样为 0.2.2（tag 提交 `0bf4c938`／`3bcd7c2`），未与 main 最新提交 `3c4942f0`／`9dd7e7b` 混写。

## 六、边界

- 未改代码、未操作 UAT、未移动/重建 tag、未改 Release。
- 任何 Key 未进入文件、提交、回执或日志。
- Web `vite.config.ts` 在途改动未入提交。
