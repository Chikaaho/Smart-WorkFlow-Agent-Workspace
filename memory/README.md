# memory 使用说明

默认交付遵循Owner七步流程；仅明确不发版时在第三步结束。版本需用户确认，本轮0.1.6已确认。见 `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`，新会话按constraints恢复。

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS，新增业务功能0。总5阶段：①②③完成；④发布阻塞修复已落地（后端受控测试设施＋前端adapters接缝）、续发与发布待完成；⑤发布后同步待完成。按 `product/0.1.6-release/ready/direction-release-016-unblock.md`（Owner已批准下发，替代旧"等待裁决"路由；release-016-01为本轮前态、未受影响项不重跑）续发：验证通过→修复分支→develop→main→两仓CI发布（版本0.1.6）→成对语义tag→UAT交付（先核库形态选S1/S2脚本）→发布后同步；回执release-016-02.md。版本无需再确认；不跳过失败测试、不放宽边界规则。后端失败主因已更正（默认构建无loopback provider装配为主要因果、资产缺失为并因）。正式功能49、46/22/22=90、ADV64/57、P62延期/OFF保持。

