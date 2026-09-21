# TS-G1 Owner 精确授权记录

> 角色：规划（Planner）  
> 日期：2026-09-21  
> 授权来源：Owner 明确回复“确认”  
> 关联复核：`planning-review-terminal-sync-production-release-01-verifying.md`

## 授权范围

允许执行角色：

1. 在 `Smart-WorkFlow-aPaaS-server` 的 `develop` 分支，仅修改`功能清单.md`“当前焦点”段；
2. 将旧发布身份与门禁值更新为规划复核01 §3规定的新值；
3. 创建一份中文 Conventional Commit 的 docs-only 提交并普通推送至 `origin/develop`；
4. 回读提交 SHA、`origin/develop`、修改文件清单、精确差异，以及 main/tag/Release 未变化；
5. 提交 `product/v0.1.0-p53-p61-production-release/receipts/terminal-sync-production-release-02.md`。

## 明确禁止

- 不修改或推送 `main`；
- 不移动、删除或重建 tag/Release；
- 不修改90项明细、功能数、P/M/I、业务代码、测试、迁移或历史段落；
- 不重跑工程门禁，不发布、不部署、不建库；
- 不夹带其他工作树变化。

## 唯一下一动作

执行 TS-G1 文档投影修正并提交补证回执02；其余已锁定项不重复处理。
