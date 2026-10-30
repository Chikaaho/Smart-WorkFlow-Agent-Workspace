# 0.2.0 执行提示37：现行入口与最终分支收尾

2026-10-31｜Planner｜配套审查36；替代提示36为唯一当前执行入口。五目标业务/UI通过，500项全部RESOLVED、余差0、修复FINISH。Web/Server 0.2.0已发布，服务器内升级通过，整版VERIFYING只待原A17以下两条闭环。

先读审查36、回执u020-36-release-delivery.md及`search_task/u020-release-final-readback-20261031.md`。核实结论通过对应search_fallback回传；已有实际结果直接引用，不补重复证据包。

| 原A17对象 | 唯一限定动作 | 通过条件 |
|---|---|---|
| 用户当前根路径交付 | 以Owner现用根路径及生效发布配置为准，读取当前根页面、必要入口资产和实际API健康/既有只读通路；核对本次Web制品index-DMDsHDv8.js及Server发布身份。使用已有可读结果，不重复采集。 | 根路径确实加载本次Web制品，页面所用实际API通路可达；如缺陷存在只报告该具体响应/配置差异，不能自行换域名、改根路径归属、停其他服务或重建业务场景。 |
| 最终分支/版本和发布后同步 | 核两业务仓最终main/tag/develop及远端、实际开发版本；说明最终Server修复是否已回纳develop。已回纳不做动作，未回纳仅正常回纳本次最终修复并完成受影响验证。先knowledge，再同步本次受影响memory/todo/product当前入口及根README/version/gitlink等实际变化；提交推送本批授权文件。 | 最终发布身份、开发分支包含关系、开发/正式/部署版本分别真实；当前入口一致为已发布0.2.0、A17收尾待Planner终审，无“尚未合并发布/旧失败待核”的当前残留。给本次提交远端/保留在途及有限覆盖结果即可。 |

Owner已确认根路径现状；这不是待Owner恢复路由的事项。API路径从现行配置读取，历史路径不作为测试标准。上述只读核实未授权改nginx或调整其他服务；出现实际配置修复需要时给出准确对象、影响和最小动作，独立收尾继续。

锁定：Web main/tag f5ec5a1、CI 41092067995成功；Server main/tag 39dcedb7、CI 41097671140成功、build.version=0.2.0；本地403类/2338测试0失败0错误、UAT/本机dev健康及种子升级结果。无具体影响/反证不重跑业务/UI、全量工程检查或发布。不改tag、不覆盖Release、不强推；原500项ID/失败史/scope通过历史摘要完整继承。

当前唯一值：五目标本版业务/UI通过；500 RESOLVED/其余0；整版0.2.0 VERIFYING（已发布、A17两条收尾），正式49、46/22/22＝90、ADV64/问题57，P62延期/OFF、既有P核销及正式验证基线保持。根main治理分叉独立留账，本轮不改治理，不要求业务Executor解决治理契约冲突。保护vite.config.ts、他人成果、PG/Redis/用户服务、冻结数据和秘密。

当前两条相较提示36已收窄为现行入口的最小只读结果、最终修复回纳事实及对应同步；不再派合并发布大清单。实施安排由Executor按工程规范决定。有授权内动作继续；真实外部限制只影响对应项。原终态契约保留A17及结束依赖，两条闭环后Planner直接核终态，不为纯文字再开一轮，不擅自宣称COMPLETED。

总7阶段：评估、实施提交、验收同步、两业务仓合并、发布0.2.0完成；发布后同步/交付事实复核进行中；结束未开始（5/1/1）。

```planner-convergence
{"schema":"agent-coding-engine.planner-handoff.v1","feature":"0.2.0","revision":55,"previous_revision":54,"decision":"FINISH","source_receipt":"product/0.2.0/receipts/u020-36-release-delivery.md","history_summary":{"revision":54,"review":"product/0.2.0/receipts/planning-review-unified-020-35-result.md","retained_count":500,"status_counts":{"RESOLVED":500}},"items":[]}
```

FINISH仅为原500项修复结论，A17工作沿本提示及既有Executor终态契约保留。
