# 0.2.0 审查37：根入口通过，原A17仅余最终发布修复回纳

2026-10-31｜Planner｜已全文读取u020-37-a17-closeout.md及search_fallback/u020-release-final-readback-20261031.md，并与回执36、审查36/提示37及当前摘要交叉核对。配套唯一执行入口为planning-execution-prompt-unified-020-38.md。

**原A17第一条关闭，第二条仅余Server最终发布修复的包含关系。五目标业务/UI、原500项、两仓发布及升级结果保持通过；整版VERIFYING。没有新增业务/UI缺陷。**

| 原对象 | 本轮实际结果与裁决 |
|---|---|
| 根入口交付 | 实际域名HTTPS块根路径挂载工作流Web；Host=chikaho.cn的服务器本机请求根页面200，引用本次index-DMDsHDv8.js且资产200；构建API基址sw-server/api，对应health 200/UP。结合回执36已安装jar/build.version=0.2.0，通过提示37限定条件。此为现行域名Host通路结果，不冒称新增外网浏览器全流程实测，不再重采或改路由。 |
| Web回纳与开发版本 | origin/main/tag f5ec5a1，origin/develop 3c1cfe2，eadd20b已回纳，开发版本0.2.0；与已锁定发布结果一致，通过。 |
| Server已核部分 | origin/main/tag 39dcedb7、origin/develop c25f5ea5、开发版本0.2.0-SNAPSHOT；befd32eb为develop祖先的结果采信，仅证明较早任务tip已回纳。 |
| 本批同步/提交 | 回执37报告knowledge和version.json更正根入口事实，提交57e62f33、任务分支/develop-sw推送回读一致，保留vite.config.ts等在途。原当前摘要仍有A17两条待核，Planner本轮直接改为一条，不因旧句要求重跑或补写业务回执。 |

## 原A17第二条的精确差异

回执36明确顺序：任务tip befd32eb → develop a1674f30 → main fbacde47（CI因IoT跨类顺序失败）→ 修复后main 39dcedb7（CI成功）。最后修复是CommandQueueServiceTest所依赖的实体元数据显式初始化。

回执37第15行及探索回传第14行将befd32eb称为“最终修复”，提供其祖先检查通过；该对象早于上述最后IoT修复。不能由较早tip已回纳推导较晚修复已回纳；也不能反过来断言develop实际缺修复。这是原回纳断言的证据对象不完整，不是已证实产品失败或纯措辞打回。

下一动作收窄至Server develop c25f5ea5是否含39dcedb7中的最后IoT修复：先查现有实际结果；39dcedb7为develop祖先即可关闭，若通过cherry-pick/等价提交回纳，核该单一修复的实际等价效果亦可，不强求相同提交身份。事实已具备则只回核实结论，无需改代码或重跑测试；确实未包含才沿原授权正常回纳这一修复，完成直接受影响验证。禁止重开Web、根入口、种子、发布、UI或无关后端检查。

事实任务为search_task/u020-final-published-fix-return-20261031.md；结果写对应search_fallback。原500项仍全部RESOLVED，修复账本FINISH/revision56继承55。正式49、46/22/22＝90、ADV64/问题57、P62延期/OFF、既有P核销与正式验证基线不变。根main治理分叉独立留账，不纳入本轮修复。

总7阶段：评估、实施提交、验收同步、两业务仓合并、发布0.2.0完成；发布后同步/交付事实复核进行中；结束未开始（5/1/1）。原A17从两条收窄为上述一个包含关系，满足后即可核终态。

本轮memory整理：18776→17713字节，8份均小于5000字节；21处ready/todo当前入口已同步为一个剩余包含关系。
