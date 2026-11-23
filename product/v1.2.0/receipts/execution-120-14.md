# 1.2.0 第十四批执行回执（execution-120-14）——S1 单独一批：取消跟踪 + 回执更正

日期：2026-11-23｜执行（Executor）｜依据 `planning-execution-prompt-120-03.md` §1

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| 工作区 | `6bc67191` | S1-untrack：`git rm --cached` 取消跟踪 `.iso120/run/config/*`、`.iso120/evidence/*`、`.zcode/plans/*.md`（8 个文件）；根 `.gitignore` 增加 `/.iso120/`、`/.zcode/plans/`；同笔提交含 S1-receipt 两处更正 |

已推送 `origin/develop-sw`。未改写历史、未强推；`.iso120` 与 `.zcode/plans` 本机文件保留。

## 2. S1-untrack 验收

`git ls-files .iso120 .zcode/plans` 输出（空）：

```
$ git ls-files .iso120 .zcode/plans
count=0
```

本机文件仍在：`.iso120/run/config/application-dev.yml`、`.iso120/run/config/login-rsa-private-key.pem`、`.zcode/plans/plan-sess_*.md` 均保留。回执不贴文件内容。

## 3. S1-receipt 两处更正（均在 `8b4d4d7a` 之后的新提交里）

1. `execution-120-12.md` §1 表格：原写「06f1c410 + 7de697f9 = X1 回退 + iso120 环境文件（含本地私钥）安全更正出 Git」与事实不符。核对提交内容：`06f1c410` 实际把 `.iso120/run/config/application-dev.yml`、`login-rsa-private-key.pem`、`.iso120/evidence/*`、`.zcode/plans/*` 一并加了进来；`7de697f9` 只在 `.iso120/run/.gitignore` 加 2 行，文件仍留在索引。已改为实际表述，并注明由本批 S1 用 `git rm --cached` 完成取消跟踪。
2. `execution-120-12.md` 第 54 行：原 grep 命令里的两个口令原文已删，改为「检索两个种子默认口令（此处不写口令原文）」。

## 4. 口令扫描

`grep -rn -i "password|passwd|口令" product/v1.2.0/receipts/*.md` 结果均为「种子默认口令」类指引文字，无明文口令。`1405` 号错误码与本次无关。

## 5. 环境

- iso120 只连本机 5432 `sw_iso120`；本批未改库、未起服务。
- 临时凭据文件无需新建；本批未写口令。

## 6. 自验结论

S1（untrack）与 S1-receipt（两处更正）完成，验收条件「`git ls-files` 为空」「回执查不到口令」均满足。**本批单独提交，其余原子 ID 转下一批。**
