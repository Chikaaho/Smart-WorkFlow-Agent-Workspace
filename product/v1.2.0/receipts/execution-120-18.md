# 1.2.0 第十八批执行回执（execution-120-18）——阶段 4 合并与阶段 5 发版

日期：2026-11-25｜执行（Executor）｜依据 `planning-execution-prompt-120-06.md`（阶段 4~7 持续授权）

## 1. 阶段 4：合并（普通合并，未压缩、未强推）

合并前 feature 头与提示一致：Web `3f7f43a`、Server `34c43e98`。之后按流程新增的提交全部在 §3/§5 列明。

| 仓 | feature/1.2.0 | develop（合并后） | main（合并提交） | 说明 |
|---|---|---|---|---|
| Web | `3f7f43a` | `3f7f43a`（快进）→ 版本收敛后 `83a06d8` | `e2dab74`（Merge develop）→ 版本收敛后 `c978312`（Merge develop） | 发布 tag 指向 `c978312`；README 同步后 main=`77e4816` |
| Server | `34c43e98` | `34c43e98`（快进）→ CI 修复与收敛后 `cea3dc2a` | `b1350841`（Merge develop）→ 修复+收敛后 `0fb94fad`（Merge develop） | 发布 tag 指向 `0fb94fad`；后续 main=`70b2aada`（工具工作流）→`77d31603`（README 同步） |

两仓 develop 推送、main 推送均为普通 push；feature/1.2.0 已合入 main（未删分支）。工作区仓库只提交回执与 `version.json`/`CHANGELOG.md`/`knowledge` 等同步文件，未提交两个子仓 gitlink。

## 2. main CI（发布提交）

| 仓 | 提交 | run | 结论 |
|---|---|---|---|
| Web | `c978312`（发布） | `45565538125` | **success**（typecheck/lint/test/build + 打包 + Release 资产） |
| Server | `0fb94fad`（发布） | `45565374283` | **success**（全量测试 + prod 打包 + 制品门禁） |
| Web | `e2dab74`（首轮合并） | `45558445330` | success |
| Web | `77e4816`（README 同步） | `45624681065` | success |
| Server | `70b2aada`（工具工作流） | `45593752279` | success |
| Server | `77d31603`（README 同步） | `45624714493` | success |

### 2.1 CI 修复链（两笔，均在 develop 修好后重合并）

1. **run `45558701223` failure（首轮）**：`LastLimitCorpusTest.lastSitesArePortable` —— `.last(` 站点数 139→140（1.2.0 E1-4 在 `BpmCommandController#flowStartView` 新增 FLOW_START 子命令 `LIMIT 1` 回查）。修复 `3eef3591`：守卫期望值与注释同步 140，站点写法仍为可移植 LIMIT 尾部。
2. **run `45561555485` failure（第 2 轮）**：`ErrorCodeCatalogTest` —— E1-6 新增 `FORM/GRAPH_ACTION_FAILED(1405, form.graph_action_failed)` 未同步目录：常量 206→207、唯一数值码 201→202。修复 `782e635b`：`docs/governance/error-code-catalog.md` §2 标题计数与登记行（1404 后插入）+ 测试断言同批更新；本地 `mvn -pl sw-common test -Dtest=LastLimitCorpusTest` 与 `-pl sw-bootstrap test -Dtest=ErrorCodeCatalogTest` 均通过（8/8）。
3. 第 3 次 main 推送即 §2 的 `45565374283` success。修复轮次共 2 笔，均未触及业务代码，无重复失败同类项。

### 2.2 E3-2：I5 用例在 main CI 实跑（最终 run `45565374283`）

```
Running com.sw.ck.bootstrap.i5.I5SsoCipherRuntimeDiagTest
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.438 s
```

用例名 `I5SsoCipherRuntimeDiagTest`（包 `com.sw.ck.bootstrap.i5`），1 用例通过、0 跳过。

## 3. 版本收敛（与 CI 修复同批进 develop，按方向 §2「两仓升 1.2.0」口径）

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `cea3dc2a` | pom `revision` 1.1.3-SNAPSHOT→1.2.0-SNAPSHOT（注释同步）；`build-release.yml` develop 版本断言 `1.2.0-SNAPSHOT`、发布值 1.2.0 |
| Web | `83a06d8` | `package.json` version 1.2.0 |

开发默认版本断言在最终 CI 中通过；制品内 `META-INF/production-build.properties` 实读 `build.version=1.2.0`。

## 4. 阶段 5：发版（两仓 tag `1.2.0` + Release Latest，其他 tag/Release 未动）

| 仓 | tag 指向 commit | tag | Release ID | 制品 | 字节数 | sha256 |
|---|---|---|---|---|---|---|
| Server | `0fb94fad` | `1.2.0`（轻量） | `457783510`（Latest） | `bootstrap-1.2.0.jar` | 244,277,265 B | `e565b010e5e26837e6d5595189e9909c630516486b556bbacc9058653b3b0d5b` |
| Web | `c978312` | `1.2.0`（轻量） | `457827301`（Latest） | `sw-web-dist-1.2.0.zip` | 6,366,174 B | `f941fa5eff8c6fd339f49a66ef31ad1b4ddf5f0f49a319c1b52f75c80c58d3e1` |

- 制品来源：两仓 main CI 的正式构建产物（`build-0fb94fad…` / `build-c978312…` Release），下载后本地 sha256 与 GitHub 资产 digest **逐字节一致**；Server 制品 `build.version=1.2.0`、Web 制品入口 `dist/assets/index-Cu2bpF9U.js`。
- **大制品上传通道披露**：本机到 GitHub 的 244MB 资产上传经本地代理两次中断（45.9MB/572s、90 分钟超时 0 字节），Web 6MB 资产上传正常。为完成发版，新增 `workflow_dispatch` 工具工作流 `release-asset-copy.yml`（提交 `d1f19cd4`，main `70b2aada`）在 Actions 内把 `build-0fb94fad…` 的资产复制到 1.2.0 draft 并发布；该工作流 run `45593869940` 在最后的 `gh release view --json isLatest`（gh 版本不支持该字段）处报错，但上传与 `--draft=false --latest` 发布在报错前已成功——1.2.0 Release 资产与 Latest 已核（直接查 API）。
- 其他 tag 与 Release 未动；`build-<sha>` 自动产物全部保留。
- 发布提交之后 main 另有两笔非发布提交（工具工作流、两仓 README 版本同步），tag 不再移动；对应 Build & Release 均 success（§2）。

## 5. 自验结论

阶段 4 与阶段 5 完成：两仓 main CI（发布提交）success、I5 用例实跑通过、tag/Release Latest 就位、制品哈希三方一致。发布后进入阶段 6（部署与同步），回执见 `execution-120-19.md`。
