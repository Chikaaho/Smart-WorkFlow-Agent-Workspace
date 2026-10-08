# P64 MES高级流程编排现状探索回执

2026-10-08；执行角色；任务书 `search_task/p64-mes-advanced-orchestration-readiness-20261008.md`。两仓只读静态精读＋既有回执核对；未编译/测试/构建/迁移/DB/服务/设备。标记：〔运行〕既有行为证据；〔静态〕静态确认；〔待验证〕证据不足。逐题证据、R 矩阵、真值表、影响/资产/入口清单见 `…-attachments.md` §A—§J；P63 传播回读见 `…-p63-propagation-readback.md`。

## 0 P63 确认措辞传播（原最终裁决§4 机械收尾）

核实＝**未传播**：六个当前入口（`knowledge` 的 current-status／session-handoff／P63 登记／architecture／功能索引 ＋ Server `功能清单.md`）仍为「COMPLETED（待规划终态复核）＋下一动作＝Planner 复核回执02」；`passed/` 路径**已就位**（`ready/` 空、两方向均在 `passed/`）。已按§4 机械替换为 `COMPLETED（规划已确认，2026-10-08）` 与 passed 指针，下一动作改指本回执，并落 P64 PLANNING 登记（无计数晋级）；未重验业务、未新增第三轮终态回执。

## 1 八组问题（结论＋层级＋定位）

**Q1 节点审批表单**〔部分〕：人工任务节点＝APPROVAL/CONSENSUS/DYNAMIC_PARALLEL（共 10 类节点，端点 `/workflow/defs/node-capabilities`）；节点级「意见表单」为**内联轻量字段**（formId/version/fields），数据落 `sw_bpm_approval_action`（opinion_data/round_no/快照）可回读〔运行〕。缺：节点绑定已发布低代码表单（无节点级 formKey）、任务级独立表单实例、人员/部门/表格控件（§A）。

**Q2 BPM变量**〔缺失〕：无 `BpmVariable`/表/Service（零命中）、无类型/来源选择器/聚合；近似＝受控表达式（form./data./variables.）、`FormRecordReadFacade`、P63 `FORM_FIELD`〔运行〕。身份＝formKey＋字段逻辑名，改名/删除仅发布期校验（§B）。

**Q3 Trigger判断**〔缺失〕：事件＝表单提交／定时 FLOW／IoT 规则，**节点完成、流程完成无编排触发**；脚本＝IoT 专用 GraalJS 沙箱＋Java 子进程〔运行〕，无 BPM 变量读取入口，返回值只落 `output_json` 无匹配消费；流程内条件＝布尔受控表达式＋priority＋DEFAULT 边〔运行〕（§C）。

**Q4 动作与子流程**〔底座有、编排层缺失〕：`sw_bpm_command` 同事务入队＋租约＋重试＋对账〔运行〕；事务动作数量台账；批量 1—500。缺：流程内发起子流程/调用活动、父子实例与输入输出映射、按集合/按字段分组发起、ALL/ANY/COUNT/NONE 等待、取消级联、深度与循环限制（§D）。

**Q5 动态选人与岗位委托**〔部分〕：组织表齐备；8 策略统一注册表＋参与人快照〔运行〕；负责人单值、多任职列全候选、空缺 fail-closed。缺：分管领导、岗位级「源岗位→受托岗位」委托（现为用户级、单人、单级）、特殊选岗规则、上一轮表单聚合（§E）。P63 部门负责人语义保持原义。

**Q6 三场景**〔S1/S3 缺失、S2 部分〕：MES 模型零命中；IoT（含 P63 预约）＋OpenAPI 受控对端已有〔运行〕，ERP/WMS/PDA/扫码无接缝；事务台账可表达领料/入库式数量动作、无库存账；数据权限记录级、行级缺，无按行回写。S2 缺集合条件（R02/R03）与聚合会签；S3 分组子流程/隔离/回写/ALL 全缺（§F、真值表§H）。

**Q7 兼容与未决**〔部分〕：发布版本冻结＋实例 def_version 快照＋SUSPENDED/DISABLED〔运行〕；模块开关、P62 默认关闭＋授权门、回退演练〔运行〕；迁移链终点 `V0.1.6`。缺：存量实例版本跟随/批量迁移、兼容窗口定义、脚本内存/并发上限（MEMORY_LIMIT_BYTES 未接入〔待验证〕）、「仅全新建库」与「非空库追加升级」口径并存（§G）。

**Q8 影响面**：Server `sw-bpm-api`／`engine`／`process`／`sw-biz-form`／`sw-biz-system`／`sw-basic-iot`／`sw-biz-openapi`／`sw-bootstrap`；Web `modules/workflow`／`form`／`system`／`iot`（回归资产与用户入口见§G）。**XL 关键决策 6 项**（子流程载体、变量层模型、脚本运行时、任务级表单模型、委托归属、行级回写契约）及各自代价见§K。

**R01—R12**：R02/R03/R05/R08/R09/R10 缺失；R01/R06/R07/R11/R12 部分（完整矩阵见§J）。

## 2 未决项（供 Planner 裁决）

变量缺值/有效完成/库存结果边界；子流程深度、派发数量、脚本资源、循环次数限制；兼容窗口与存量处理边界；岗位委托配置权限与组织范围；S2 未匹配组合处置；聚合规则明细与撤回/取消数据排除；是否记真实内部库存账；编排触发载体（扩 IoT 脚本 vs 新建 BPM trigger）。

## 3 证据缺口与冲突

无运行验证；`MEMORY_LIMIT_BYTES` 未接入、`funEmitEvent` 无副作用门、EVENT/RULE 未接线属静态可疑待验证；P63 `FORM_FIELD` 24 格 UI 未逐一遍历（沿 P63 自述边界）；admin 实例详情未回读节点意见（观察项）。冲突＝无。

**结论**：8 组问题与 R01—R12 均已回答或明确标出证据缺口；P63 传播与 P64 登记有实际字段回读。
