# 0.3.6 执行回执：指令参数中文化与 C1 数据一致性（H8、H9）

2026-11-08｜执行｜入口 `receipts/planning-execution-prompt-three-sample-05.md`｜依据 `receipts/planning-review-06.md`（H1—H7 锁定，未重做）

## 0. 结论摘要

H8、H9 已完成。Web 按 §3.0 发布 **0.3.6**（`feature/0.3.6-command-params-cn` 分支开发），Server 没有改动，仍为 0.3.2。已发布 tag（0.3.0、0.3.2、0.3.3、0.3.4、0.3.5）一个都没动。

H8：TEXT 字段新增「键名/取值中文映射」（契约键 `jsonDisplay`），只读 JSON 参数按映射显示中文；「技术参数（JSON 原文）」折叠区仅管理员/设计者（`form:design:save`）可见，普通审批人看不到。存储值与下发给设备的 MQTT 载荷（英文键）不变。

H9：C1、C2 都用前后一致的数据**新建实例重跑**，没有修改原记录。C1 新实例 `MES-20261108-015`（传感器漂移→仪表校准），C2 新实例 `MES-20261108-016`（设备故障→设备维修），均已终态 `APPROVED`，温度序列、升温速率、知识样本命中、研判结论四项与阈值（75/80/85，判定值 1.5℃/分钟）一致。

最终证据目录：`.runtime-030/uat-shots-036/`（本机保留，不入 Git）。全部截图都在 UAT（`https://chikaho.cn`，前端 0.3.6）上用 headed 浏览器（1440×900，DPR 2）拍摄，同时记录表格横向溢出测量（全部无溢出）。

## 1. H8：指令参数中文化与原文权限门禁

### 1.1 做法（`Smart-WorkFlow-aPaaS-Web`，feature `8dd0220`）

- **契约**（`src/contracts/form-schema.ts`）：`TextField` 新增 `jsonDisplay?: { keyLabels?; valueLabels? }`。仅影响展示层；存储值与提交 API 值不变。
- **解析透传**（`src/adapters/form-designer/index.ts`）：`parseDefinition` 的 TEXT 分支把 `jsonDisplay` 整键透传（未配置不落键），设计器保存的 `JSON.stringify(FormSchema)` 可完整回读。
- **渲染**（`src/components/dynamic-field-controls/TextControl.vue`）：键名显示 `keyLabels[键] ?? 原键名`；标量与数组字符串项显示 `valueLabels[值] ?? 原值`；布尔仍是「是/否」，数组仍以顿号拼接。**「技术参数（JSON 原文）」折叠区只在 `hasPerm('form:design:save')` 时渲染**（管理员/设计者可见，普通审批人不渲染该 DOM）。
- **设计器配置**（`src/modules/form/designer/config/TextConfig.vue`）：TEXT 配置面板新增「键名/取值中文映射」两个多行框，每行「键=中文名」，非法行（无 `=`、空键、空值）忽略；映射编辑用本地文本态，切换选中字段时从字段重同步。两个映射都清空时回写 `jsonDisplay: undefined`（不落脏键）。
- **FieldPatch**（`src/modules/form/designer/field-config.ts`）：补丁键新增 `jsonDisplay`，编译期挡住自造键。
- **文案**：zh-CN/en-US 各 4 个新键（`jsonKeyLabels` 等）。

### 1.2 UAT 表单配置更新（数据侧，publish-version）

`ops_drill_plan`（`56ef0af3-88d7-475a-86ef-4d40c795eabb`）发布**版本 3**（2026-11-08 16:35，`POST /form/def/{id}/config` + `POST /form/def/{id}/publish-version`，code 0）：

| 项 | 变更 |
|---|---|
| 字段标题 | `设备指令参数（JSON）` → `到点下发的设备指令` |
| 键名映射 | drillCode=演练编号、action=动作、powerOff=机房断电、fireAlarm=火警告警、machineRooms=目标机房、switchbackWithinMinutes=回切时限（分钟） |
| 取值映射 | switch=切换 |

存储值与 MQTT 载荷不变：`{"drillCode":"DR-2026-Q4-HD-023","action":"switch","powerOff":true,...}`（见 §3 管理员截图中的原文展开）。

### 1.3 测试（要求的三种情况 + 权限门禁）

`TextControl.spec.ts` 9 项（0.3.3 的 3 项 + 新 6 项）：**有映射**（键名/枚举值全中文）、**无映射回退**（原键名/原值）、**部分映射**（命中中文、未命中原文）、数组字符串项映射、普通审批人（无 `form:design:save`）看不到原文折叠区、超管可见。`TextConfig.spec.ts` 6 项（回显/回写/非法行过滤/合并/清空 undefined/切换字段重同步）；`form-designer/index.spec.ts` 透传 1 项。全量 **2054 通过**（235 文件），eslint/vue-tsc 干净。

## 2. H9：C1、C2 一致数据重跑

做法：新建实例（`rework-036-mes.mjs`），全节点 API 审批到终态，不改原记录（`MES-20261108-013`、`MES-20261108-014` 保留原样）。

### 2.1 C1 新实例 `MES-20261108-015`（business `2119342372758802433`，engine `315ad673-db4c-11f1-8842-00163e0d142f`）→ APPROVED

| 项 | 值 | 一致性 |
|---|---|---|
| 当前生产批次 | B-20261108-05 | — |
| 当前温度（Agent 读数） | 81.2 ℃ | 越过告警阈值 80 |
| 温度序列 | 77.6→81.2，约 1.3 分钟内上升 3.6℃，越过告警阈值 80℃，未到停机阈值 85℃；当前不在人工加料阶段 | 与速率 2.8 一致（3.6/1.3≈2.8） |
| 升温速率 | 2.8 ℃/分钟 | ≥1.5 判定值 |
| 阈值 | 常温 75 / 告警 80 / 停机 85，快速升温判定值 1.5 ℃/分钟，窗口 5 分钟 | 四处引用一致 |
| 知识样本命中 | 「升温速率 ≥1.5℃/分钟判快速升温；本次 2.8℃/分钟，读数越过告警阈值 80℃…」 | 与速率/结论一致 |
| 研判结论 | RAPID_RISE（快速升温） | — |
| 现场实测（孙悦） | 77.8 ℃，**偏差 3.4 ℃ > 3** → 传感器漂移 | 保证 传感器漂移→仪表校准 |
| 路径 | 班组长现场确认 → **仪表校准**（李强：红外比对与标准源校准，探头偏高约 3.4℃，JJF 1101-2019，校准后 77.9 ℃）→ 快速升温异常工单处置（**仪表校准**） | ✓ |

### 2.2 C2 新实例 `MES-20261108-016`（business `2119342408209059841`，engine `366916bb-db4c-11f1-8842-00163e0d142f`）→ APPROVED

原 C2（`MES-20261108-014`）核对发现同类矛盾（序列写「缓慢上升/79.8→80.6」但结论 RAPID_RISE、速率 2.8），**一起重跑**：

| 项 | 值 | 一致性 |
|---|---|---|
| 当前生产批次 | B-20261108-06 | — |
| 当前温度 | 82.0 ℃ | 越过告警阈值 80 |
| 温度序列 | 78.4→82.0，约 1.5 分钟内上升 3.6℃，越过告警阈值 80℃，未到停机阈值 85℃；当前不在人工加料阶段 | 与速率 2.4 一致（3.6/1.5=2.4） |
| 升温速率 | 2.4 ℃/分钟 | ≥1.5 |
| 知识样本命中 | 「…本次 2.4℃/分钟，读数越过告警阈值 80℃，需班组长现场确认加热与采集状态。」 | 一致 |
| 研判结论 | RAPID_RISE（快速升温） | — |
| 现场实测（孙悦） | 82.3 ℃，**偏差 0.3 ℃ ≤ 3** → 设备故障 | 走 设备故障→设备维修 |
| 路径 | 班组长现场确认 → **设备维修**（李强：模口加热偶接线端子松动，更换 K 型热电偶 ×1，处理后 75.8 ℃）→ 快速升温异常工单处置（**设备维修**） | ✓ |

## 3. UAT headed 截图（`.runtime-030/uat-shots-036/`，本机留存）

A1 指令参数区双视角（同一渲染规则，权限差异由账号决定）：

| 截图 | 身份 | 实例 | 证据点 |
|---|---|---|---|
| `a36-norm.png` | 普通审批人 chenjing | `YJ-20261108-008`（其发起的实例） | 标题「到点下发的设备指令」；六键全中文（演练编号 DR-2026-Q4-HD-023、动作 切换、机房断电 是、火警告警 是、目标机房 A机房、B机房、回切时限（分钟） 30）；**无 JSON 原文折叠区**（脚本实测 `raw foldable: 0`） |
| `a36-admin.png` | 管理员 admin | `YJ-20261108-009`（本轮 admin 新建，见下） | 同样中文键名；**「技术参数（JSON 原文）」已展开**，英文键载荷原样（`drillCode/action/powerOff/fireAlarm/machineRooms/switchbackWithinMinutes`）→ MQTT 载荷不变 |
| `a36-admin-records.png` | 管理员 admin | `YJ-20261108-009` | 流转记录九节点摘要带标签 |

`YJ-20261108-009`（A1x2，business `2119348044196007938`，engine `5750f9f3-db4f-11f1-8842-00163e0d142f`）：admin 以提交人身份新建（编号一致性 `DR-2026-Q4-HD-024`），负责人→技术委员会×3→分管副总→参与部门并行→总公司会签→现场指挥确认全链 9 节点 APPROVED——使管理员能从「我的实例」打开 A1 表单区（`/workflow/my/instances` 列表仅含发起实例，admin 非 `YJ-20261108-008` 参与人，API 返回 403）。

C1/C2 截图（admin 打开）：`c36-c1-form.png`、`c36-c1-records.png`、`c36-c1-opinions.png`；`c36-c2-form.png`、`c36-c2-records.png`、`c36-c2-opinions.png`——表单区关键值与 §2 表格一致，流转记录每段带标签。

测量：`table-overflow.json` 记录每次截图可见表格 scrollWidth/clientWidth，**全部无溢出**（1383/1383）。网络索引：`network-index-chenjing.json`（A1 普通审批人视角）、`network-index-admin.json`（C1/C2 视角）。

## 4. 发布事实

| 项 | 事实 |
|---|---|
| Web 0.3.6 | feature `8dd0220`（分支 `feature/0.3.6-command-params-cn`）→ develop `0d71982` → main `c3f1d6e`；tag `0.3.6`=`c3f1d6e`；CI run `42463025237`（build Release `438125351`）；语义 Release `438126185`，资产 `sw-web-dist-0.3.6.zip` 6,197,059 B，sha256 `9470f0c115ece47dfc1c9733cb117df7714c1fd5cfba4c368f880d1d575dd9e3`（build 与语义 Release 同字节，服务器落盘回读同 sha256） |
| Server | 没有改动，main `de8ec017` 等于 tag `0.3.2`；UAT `build.version=0.3.2`，health UP |
| UAT 部署 | 只部署前端（web → web.old 备份 → 替换 → nginx reload）。当前入口 `assets/index-CKdiXkhU.js`（0.3.6），`https://chikaho.cn/` 返回 200；磁盘 96%（剩余 822M） |
| 未改动 | tag 0.3.0、0.3.2、0.3.3、0.3.4、0.3.5 及对应 Release 都没有改动 |
| 应用包 | 未重新导出（无表单结构/流程/字典变更需要进包；`ops_drill_plan` 定义更新为 UAT 数据侧操作） |
| 保护项 | Web `vite.config.ts` 在途改动（allowedHosts）没有提交；截图、gh-token 没有入 Git |

## 5. 七阶段进度（执行侧口径）

1. 评估 ✅
2. 执行（H8、H9 返修）✅
3. 验收与同步 🔄（执行侧证据、knowledge、memory 已同步；等待 Planner 验收）
4. 合并 ✅（feature → develop → main）
5. 发版 ✅（Web 0.3.6；Server 维持 0.3.2）
6. 发布后同步 ✅（version.json、CHANGELOG、README、knowledge、memory、需求池随本批提交）
7. 结束 ⬜（等待 Planner 裁决）

合计：完成 5，进行中 1，未开始 1。

## 6. 遗留与观察

- 普通审批人截图用了 `YJ-20261108-008`（chenjing 发起、H7 重跑实例）；管理员截图用了新建的 `YJ-20261108-009`。「我的实例」列表只含发起实例，admin 无法打开他人实例（API 403），故新建 admin 自己的 A1 实例取得管理员同框证据。
- 设计器映射编辑框对**所有 TEXT 字段**可见（含非 JSON 字段）；映射只在只读 JSON 展示时消费，配置在非 JSON 字段上无效果。如需收敛仅对 JSON 场景显示，属新需求。
- UAT 根分区仍约 96%，后续发版前先复核水位。
- 本轮截图保留在 `uat-shots-036/`；`uat-shots-033/035/` 为历史证据。

## 7. 发布后同步覆盖矩阵

| 入口 | 是否受影响 | 目标值 | 处理结果 |
|---|---|---|---|
| `version.json` | 是 | version 0.3.6；Web 0.3.6；Server 0.3.2（不变） | 已更新 |
| `CHANGELOG.md` | 是 | 新增 0.3.6 条目 | 已新增 |
| `README.md` 现状段 | 是 | 当前正式版本 0.3.6（Web）/ Server 0.3.2 | 已更新 |
| `knowledge/current-status.md` | 是 | 当前段改为 0.3.6，待 Planner 验收 | 已更新 |
| `knowledge/session-handoff.md` | 是 | 当前接续改为 0.3.6 | 已更新 |
| `knowledge/features/0.3.2-opinion-display.md` | 是 | 追加 0.3.6（H8）登记 | 已追加 |
| `memory/*` | 是 | 当前段改为 0.3.6（总量 ≤20KB） | 已更新 |
| `todo/requirement-pool.md` | 是 | 当前段为 H8、H9 已完成，待 Planner 验收 | 已更新 |
| 工作区 Web 子模块指针 | 是 | Web main `c3f1d6e` | 已更新 |
| Server 发布配置 | 否 | 维持 0.3.2 | 不改 |
