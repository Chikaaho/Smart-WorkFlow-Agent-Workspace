# 0.2.0 执行提示21回执：2个原项收口

2026-10-29｜Executor｜EXECUTION_SUBMITTED。对应[执行提示21](planning-execution-prompt-unified-020-21.md)（revision22）。只处理两个原项：278:1591 名称列左对齐；101:2 正确 process 填写页日期目标结果。未改日期实现/框架、未重跑保存提交或 CRUD、未改分类数据/操作列；未核销 P/晋级基线/宣称整版 PASSED。Server `fe2bba4d` 未动；`vite.config.ts` 他人未提交改动保持不动。

## 一、证据与身份

- admin@tenant-0；1920×1080/DPR1，Chromium **可见交互会话（headless:false）**，DOM `getBoundingClientRect` + Range。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-21-geometry.json`、`u020-21-g1591.png`、`u020-21-g101.png`、网络索引 `u020-21-network.json`；脚本 `tools/u020-21-capture.cjs`。

## 二、逐项实测

| 原ID | 只剩动作 | 实测 | 结论 |
| --- | --- | --- | --- |
| 278:1591 | 名称表头与5条名称左对齐（左缘=表内沿+16≈x602±1），操作列保持 | 弹窗 800×463@(560,308.5)/r12 保持；表格 748、表头44、5行45 保持；名称列 cell 内容区 **x587**（表内沿）+ **padding-left 16** → 表头与5条名称文本 Range 左缘 **x603**（目标602±1）、`text-align:left`；操作列未改（居中），新建96×32/底栏80×32/更多能力/取消关闭保持 | 通过 |
| 101:2 | 先命中正确 process 入口并实测日期/半列 | 命中 `/form/form-render/form_a03_drill_87?process=bpm_6051cfd9a2a046db`：页头文案 **填写**（top h48[+1边框]）、白卡 **1440@x240**、底部操作栏 **64@y1016**；`drillTime` 字段 **695×60**、日期外框 **695×32**，**宽差0**、高 **32**；`el-date-editor--datetime` 类型保持；本轮**未改实现**（提示20已生效的宽度规则直接交付目标结果） | 通过 |

## 三、273:1642 与边界

- 273:1642 沿提示21不派查、不取图；回执20三身份不可达事实已被 Planner 消费，保持未验证与原 PLANNER_ACTION，未改授权/未造应用/未发 query 探测/未重演 403。
- 边界：278:1591 仅名称表头与名称单元格对齐，操作列/尺寸/5真实类/顺序/业务未改；101:2 仅只读观察正确入口，未重演暂存/提交，未改日期类型/时区/值、冻结定义、设计器/只读与1440/48/64框架；未硬编码598/692。

## 四、门禁与交付

- Web 四门禁全绿：typecheck 0；eslint **0 error**；unit **1956 通过/3 跳过**；build **3.99s**。
- Web 提交 `4e3a7b6..5cd8187e04321500362dfa5630dfea87c8576a2a`（1 文件，已推送并 ls-remote 回读）。Server `fe2bba4d` 未变。
- 0.2.0 IN_PROGRESS/VERIFYING；根仓提交 SHA 见终态行；`knowledge/current-status.md` 已同步。
