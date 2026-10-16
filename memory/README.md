# memory 使用说明

默认交付遵循Owner七步流程；仅明确不发版时在第三步结束。版本需用户确认，本轮0.1.6已确认。见 `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`，新会话按constraints恢复。

## 当前发布：0.1.6-release

2026-10-16｜发布完成（L，待Planner终审）。总5阶段：①②③④⑤执行完毕。Git：Server `e115857`、Web `f91e8bf`（feature/release-016-ci-fix→develop→main，推送回读一致）；两仓CI success（Server sw-bootstrap 256/0/0/34、全仓汇总2046/0/0/34、制品version 0.1.6；Web四检通过）；成对语义tag/Release `0.1.6`（此前无、未覆盖既有）。修复：后端两项门禁测试改由测试源受控设施（缺设施显式失败、旧归因更正）；前端32项跨模块违规经7个adapters接缝（配置未改、规则未放宽）。UAT：0.1.5→0.1.6就地升级（S1脚本）、DB终点单条0.1.6（`-1768731444`）、零versioned重放、R__新增1单次执行；健康200、启动ERROR 0；可见最小链=应用中心(uncat-t0/2业务表单)→数据列表→发起→待办→Approve→Approved。正式功能49、46/22/22=90、ADV64/57、P62延期/OFF；发布/部署版本0.1.6。唯一下一动作：Planner复核`release-016-02.md`并下发唯一终态清单（终审）。限知：非超管受限视角数据权限对照未做；UAT新增验收数据待Owner处置。

