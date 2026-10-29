# 0.2.0 执行提示15回执：G17 两列正文左移 8px

2026-10-29｜Executor｜EXECUTION_SUBMITTED。对应[执行提示15](planning-execution-prompt-unified-020-15.md)（revision16，5 项关闭锁定不重做）。本轮仅修 G17/273:1396 tbody 组件类型/必填值两个文字消费者各左移 8px 并可见会话实测。未重跑保存/发布/隔离/认证链、未造字段/改值、未核销 P、未晋级基线、未整版 PASSED。Server 未触碰；vite.config.ts 他人未提交改动保持不动。

## 一、身份与证据

- 会话/视口：t100admin@i5-tenant-100（G17）；1920×1080/DPR1，Chromium **可见交互会话（headless:false）**，DOM `getBoundingClientRect` + Range 墨迹 + computed style 实测。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-geometry.json`（复用 u020-14 采集脚本末轮全量复跑，含 6 节点回归）与 `u020-14-g17.png`；网络索引 `u020-14-network.json`；比较口径与 14 回执一致（Range 墨迹，不混 PNG 口径）。

## 二、唯一整改实测

| 节点 | 本轮改动 | 实测 | 结论 |
| --- | --- | --- | --- |
| G17/273:1396 | 仅 tbody 第2/3列（组件/必填）`.cell` padding-left 12→4（各左移 8px）；表头、首列/编码、操作区、列盒/列宽、字体颜色、按钮全部不动 | tbody 墨迹 **组件 997→989、必填 1257→1249**（Range 口径，目标 989/1249 ±0）；**表头墨迹 997/1257 保持不变**；首列 443、操作区 1387 不变；text-align left 保持；添加按钮 80×32@x1415 无加号、取消/确定 80×32@1327/1415 不变；真实字段 itemName/单行文本/否 未改值 | 通过 |

已过锁定回归（同轮复测）：G14 五框 y188/264/340/416/492、冻结图 scale 1.002、三框 128×44/230×44/128×44 均保持；G18/G26/G37字/G37号未触碰（代码零改动）。

## 三、门禁

- Web 四门禁全绿：typecheck 通过；eslint 0 问题；unit **1956 通过/3 跳过**（228 文件）；build 通过（4.28s）。

## 四、边界与如实保留

1. 口径：本轮以 Range 墨迹为唯一比较口径（997/1257→989/1249），未以 PNG 值冒充 Range 值；规划两种口径任选其一均可核销（PNG 口径为 998→990/1258→1250，同 -8px 位移）。
2. 真实第2/3行（如存在）沿同列相同偏移，未新增字段/改值。
3. 四外部密钥为本机 dev 一次性值（不入 Git 不回显）。

## 五、机器状态

- Web：分支 `codex/0.2.0-ui-tenant-form-flow`，基线 caa5eb7 → 本轮 SHA（见终态行，已推送回读）；vite.config.ts 保持他人未提交改动未提交。Server fe2bba4d 未变。
- knowledge/current-status.md 已同步本批（见同批提交）。
