# P53 现状探索补充回执 01（G1—G4）

> 回执：执行 → 规划 · P53 · EXPLORING · 2026-09-17 · 原回执结论继续锁定，本文只补四类缺口。
> 工作目录声明：`WS = E:/code/Smart-WorkFlow-Agent-Workspace`；`Web = WS/Smart-WorkFlow-aPaaS-Web`；设计路径相对 `WS/docs/ui/`。
> 只读声明：未修改业务代码/测试/配置/依赖/资产/knowledge/memory/product/Git；未运行构建/测试/迁移；哈希与计数全部来自本次实际工具输出（`sha256sum`/`stat`/`file`，2026-09-17 重采，与 2026-09-16 首采一致，文件未变化）。
> 体积说明：G1 要求 32 组全部哈希逐行呈现，超出探索通道 <5KB 指导值，属任务书明确要求。

## G1. 32 组设计文件逐项身份

通用事实：SVG viewBox 与 PNG 像素 1:1（除 19 号 SVG/PNG 均为 1440×1512，其余 1440×1024）；SVG clip id 即上游 nodeId；每行「配对」=文件名编号一致+尺寸一致+clip nodeId 一致；「差异」=SVG/PNG 抽样目检与结构核对未见实质渲染差异（SVG 全文本转曲、29/32 含内嵌位图，为复用限制而非差异）。

| # | nodeId | 页面 | SVG 路径（字节）· SHA-256 | PNG 路径（字节）· SHA-256 | 配对/差异 |
|---|---|---|---|---|---|
| 01 | 3:2 | 工作台 | `svg/01 工作台.svg`（835,409）· `dbc41a35c14183a448e7cf86a4ae19eaa2f453ca703bac23c85f6764922f24c7` | `png/01 工作台.png`（154,273；1440×1024）· `4c88b1ab78208d328cd9c91db3231e7308ededf4516fe8545b709dfdadd43d7a` | 一致·无 |
| 02 | 4:2 | 数据列表 | `svg/02 数据列表.svg`（694,486）· `52d565ec0890cc102b7a656c1260ce577b50f830ee6581861064c0f7ba95e7f6` | `png/02 数据列表.png`（111,373；1440×1024）· `3dfaa4595e66e949d34fe98f5c13f9344caa1c9c2d9f3962482f970d6ebde39f` | 一致·无 |
| 03 | 5:2 | 数据详情 | `svg/03 数据详情.svg`（1,036,829）· `b58cfaad85781489ae1faad94b23e5371c65f089233e7dd412646e6c41c1877f` | `png/03 数据详情.png`（139,533；1440×1024）· `3ed6737c6fa5b6115af6755c60a5fc0a1c999cd5d09c43c2e433d0bc4b9b93a7` | 一致·无 |
| 04 | 6:2 | 管理后台 | `svg/04 管理后台.svg`（749,625）· `b8dfbac6c9de76d9e41dda5779076324a44046380e1affee345ad0d085786193` | `png/04 管理后台.png`（122,087；1440×1024）· `76ad0f03d886f6ca33b575dfaeb47564d795b2e45f17df76e1ad6c7a0b75367c` | 一致·无 |
| 05 | 7:2 | 企业门户 | `svg/05 企业门户.svg`（608,099）· `fed5f9d3412918dbdb3f8820388d723e3f37c8ae4e9fb7d56d180c07774b01a1` | `png/05 企业门户.png`（104,018；1440×1024）· `2aa87a5ce0d811395729cab2f196c0db81d1b1f87425074491d62fceed2ece4c` | 一致·无 |
| 06 | 32:2 | 登录页 | `svg/06 登录页.svg`（590,185）· `1eea5563a5b2783db93b088d7d11d993a9e805e93f2b4865518258b7bae3a7cc` | `png/06 登录页.png`（670,400；1440×1024）· `f7f53cd32d0e677c7822487f0bc7a038013e7860b1fe44280b3c505455b31f10` | 一致·无 |
| 07 | 42:2 | 表单设计器 | `svg/07 表单设计器.svg`（940,569）· `401f442d242eb03ab6bbdef1183ba82ec787d41cbce59429b073149914253f2b` | `png/07 表单设计器.png`（131,023；1440×1024）· `ccb99518419ef36de52d843ad90f5c5698f53453ce3f5c3a6affdbd778da2943` | 一致·无 |
| 08 | 42:3 | 关联流程列表 | `svg/08 关联流程列表.svg`（659,070）· `7349037f705fb55dba18c0ed688f108d51b671ecc64a4c997945b28f7b6855cc` | `png/08 关联流程列表.png`（89,796；1440×1024）· `175bf38d6a8a5e52a75398be8965e87e439c6ddb492b9e2a6ac05864c445c6db` | 一致·无 |
| 09 | 42:4 | 流程设计器 | `svg/09 流程设计器.svg`（682,382）· `70b24983dd20fc692cb80a2144b948e60bee87d51df6c49aa800074c6886d987` | `png/09 流程设计器.png`（136,142；1440×1024）· `ee3307ff62f6197802926c7a6d052c493421226921201568e60d7b6748331033` | 一致·无 |
| 10 | 42:5 | 完整流程图 | `svg/10 完整流程图.svg`（508,328）· `d18ee05c26ba6ea0b524c63514a132877b364517ede6a936aa1b7d6a416f4793` | `png/10 完整流程图.png`（124,290；1440×1024）· `075048dc8703e67aafd25809b3b0ac84672a04a57d7674d3ffb7bbcc4d6861ca` | 一致·无 |
| 11 | 49:2 | 字段属性列表 | `svg/11 字段属性列表.svg`（1,425,283）· `f235ef2027a68b9e5154d6c18c7522f88e6dd0f9a1f5a32a4398f4e6204baec4` | `png/11 字段属性列表.png`（191,083；1440×1024）· `d5b88501e3f72c5089f7002196638fb525052259cb230ac2eda059edb6c396b0` | 一致·无 |
| 12 | 49:240 | 审批人选择 | `svg/12 审批人选择.svg`（1,159,950）· `01dbb84790239ddc365bb931a9a7d60ee80f3c3e76879cbc161aee8d2b59db41` | `png/12 审批人选择.png`（199,912；1440×1024）· `a7af4f2df140bd20ea653f5ad913efecf6e92554e13a597b7f9d743bc4549fd0` | 一致·无 |
| 13 | 50:88 | 流程高级配置 | `svg/13 流程高级配置.svg`（1,339,673）· `545010063ce564a8ca3f29ffb7ce97df9cd4c88d8a8a15fe912e971151913425` | `png/13 流程高级配置.png`（197,166；1440×1024）· `9d81411dd139164d18e47eaa4053639d7cc64b167d3d6e08e8a06e44df059f7b` | 一致·无 |
| 14 | 50:429 | 草稿历史版本 | `svg/14 草稿历史版本.svg`（1,330,587）· `b55ca6e4d5dbd80add69e6a9e5776766d853ca926e29deef75965c5ee985473b` | `png/14 草稿历史版本.png`（211,670；1440×1024）· `5e08c8d13f32d6c0b34d2bcf529dc6952baeaf7574fef9532196a121c7a8a4db` | 一致·无 |
| 15 | 60:48 | 审批意见详情 | `svg/15 审批意见详情.svg`（1,360,758）· `f1d8e20c36cafa26ee3a718934cc229a9dc6652d61ab3783a8049d0ccc28b4a3` | `png/15 审批意见详情.png`（143,038；1440×1024）· `1f0789b71c033823d454fb62154200ac3e84bb6705ab583fdfa69ec640b1fff1` | 一致·无 |
| 16 | 60:190 | 会签列表详情 | `svg/16 会签列表详情.svg`（1,378,771）· `bde6472078931f4a0944ee6ee2fe62f50929e8795f6ef85053905d9360caffcd` | `png/16 会签列表详情.png`（125,697；1440×1024）· `b51cc948bd89883e11ac46abc3ff27a91124774b5be6ae4bffd38dd7951536cc` | 一致·无 |
| 17 | 60:413 | 部门负责人审批意见 | `svg/17 部门负责人审批意见.svg`（1,336,963）· `5275b6df949b413956c5563610ea7fcd799d5e0166cb1328430547f6722ccccc` | `png/17 部门负责人审批意见.png`（141,754；1440×1024）· `277242030551e14ff021ac32a71f90dc796cc21a7f7c157e15e448e0b2d1160b` | 一致·无 |
| 18 | 60:592 | 李宁会签审批意见 | `svg/18 李宁会签审批意见.svg`（1,364,701）· `d2cf211010cdfae11da43392181788496ded88013f048a4157499f4b7025cf1f` | `png/18 李宁会签审批意见.png`（143,126；1440×1024）· `d0904836c2bdbffb43a537685ac19c4b2190c96fecc94172930a251566b97a75` | 一致·无 |
| 19 | 90:68 | 数据详情·流程图 | `svg/19 数据详情 · 流程图.svg`（990,066；1440×1512）· `ca5559005c0ac7e2445a47cb86304335864daa523110bf80db6b077d4180b96a` | `png/19 数据详情 · 流程图.png`（188,194；1440×1512）· `49d076abca80dc7e200eb38f711ba43bdee79862482adcbccec0750018026243` | 一致·无 |
| 20 | 90:311 | 数据详情·审批详情列表 | `svg/20 数据详情 · 审批详情列表.svg`（1,010,639）· `566e07ff76688ce6a3c6398bef31638aba8ab5d33902595e2a216d63937a9712` | `png/20 数据详情 · 审批详情列表.png`（141,402；1440×1024）· `1023275218aa03dd08e9d551ffcb27222f70e5b2f19b45e06ce73f3d8e3dada6` | 一致·无 |
| 21 | 97:2 | 用户端·流程中心 | `svg/21 用户端 · 流程中心.svg`（1,024,870）· `e6802d34c22ca7539caeba6f1ec14a260d4d2a38d719a7f7b932a65fd0e16dbd` | `png/21 用户端 · 流程中心.png`（118,979；1440×1024）· `83de790ada51985980ebb99db5253a8426fdea4dc8498946221583b3e67e6dc1` | 一致·无 |
| 22 | 100:2 | 流程中心·行政办公 | `svg/22 用户端 · 流程中心 · 行政办公.svg`（603,363）· `6f5f1ca86a7df13dc80bdbfb475338776fd445bd23954b448e427a0b7bb07986` | `png/22 用户端 · 流程中心 · 行政办公.png`（83,933；1440×1024）· `2a4788b0ba35930a6ce9761fee4f79ae35b84a61dc72babe2f36862d35053e6b` | 一致·无 |
| 23 | 100:387 | 流程中心·财务管理 | `svg/23 用户端 · 流程中心 · 财务管理.svg`（508,624）· `f01389c5fa06cb5f1255a79abe06d25d1a5d4111c097d2ea8b64200eb8f3bd85` | `png/23 用户端 · 流程中心 · 财务管理.png`（78,610；1440×1024）· `75a9fd2f5d6a16b9e8e36c40902cbeebbff44301e42b6210e9f91d2a831ae5c4` | 一致·无 |
| 24 | 100:772 | 流程中心·IT 运维 | `svg/24 用户端 · 流程中心 · IT 运维.svg`（514,452）· `1dbdd9ccf3d9f18113cbd0e3cb4c87baf75f7be6150249cf213935b7b898ea44` | `png/24 用户端 · 流程中心 · IT 运维.png`（78,309；1440×1024）· `5ddf29aff2bbe06482f7360b5183cac50e1be1a40529b1d8f9012ad2d203be08` | 一致·无 |
| 25 | 100:1157 | 流程中心·设备管理 | `svg/25 用户端 · 流程中心 · 设备管理.svg`（501,539）· `a4d6eca62a8673030c9555687be0e2d0fd8bd1a2bf449a0403d4956bf3743cc0` | `png/25 用户端 · 流程中心 · 设备管理.png`（78,160；1440×1024）· `8d99c66b4621382be606eb6f2da618c0222b26179cf35d1fdb5821bc3dcc887c` | 一致·无 |
| 26 | 100:1542 | 流程中心·平台权限 | `svg/26 用户端 · 流程中心 · 平台权限.svg`（495,666）· `f07eaa80083327ba4ad22f04934bf36bbf0fd141434aaa9631f9dae6e5bdf00d` | `png/26 用户端 · 流程中心 · 平台权限.png`（78,199；1440×1024）· `c1fb93c2a6be4d3f839838443d11ae55b1e48ea63a289c39a89910666b322eb6` | 一致·无 |
| 27 | 101:2 | 用户端·发起流程 | `svg/27 用户端 · 发起流程.svg`（632,048）· `ec75fb56bec1322050ecef80b92689d54062d0d0347b14a420a6128e84170b91` | `png/27 用户端 · 发起流程.png`（96,613；1440×1024）· `21a390e9a2f332e4042afcc7c086b563c45ba7743566bf0c09e81c2090f290dc` | 一致·无 |
| 28 | 103:2 | 用户端·个人菜单 | `svg/28 用户端 · 个人菜单.svg`（1,090,106）· `0e2106567db959a7780d65c66746da90fc4da26ad8b3758444eb7937cdec0cc5` | `png/28 用户端 · 个人菜单.png`（125,881；1440×1024）· `411e8115a0cf1436c4bbe216af9c609d3102cbeec7b848e96142a331169fb2eb` | 一致·无 |
| 29 | 103:398 | 管理端·个人菜单 | `svg/29 管理端 · 个人菜单.svg`（805,319）· `01d4eef6ace48b549a46007e92a2a1778b3da24c82dc36b97222d66bd51abdfa` | `png/29 管理端 · 个人菜单.png`（128,576；1440×1024）· `1a60cd8c581bea74972842c24375ffc92de8a165b7c9ab2058ed98f5a9d3c860` | 一致·无 |
| 30 | 134:2 | 用户头像菜单·原型浮层 | `svg/30 用户头像菜单 · 原型浮层.svg`（65,521）· `9adbe5da35a7eeaed9262993f00cec5c9f3dc6049eeeaac0c5044eeba0a2b9cd` | `png/30 用户头像菜单 · 原型浮层.png`（15,543；1440×1024）· `5365868813bfc69488728642638b6ba2a1857095bc3f07d726e68c20ae030718` | 一致·无 |
| 31 | 135:2 | 修改密码·原型浮层 | `svg/31 修改密码 · 原型浮层.svg`（142,522）· `acfd20d611deaec3e1b672416e92e57dc341f982a27d2f71a84ababd1e984381` | `png/31 修改密码 · 原型浮层.png`（30,657；1440×1024）· `aa31bff7e474b6b5c830e4b1334f521200fb8e4941e7fa96ff14061f77df9f12` | 一致·无 |
| 32 | 138:5 | 管理端头像菜单·原型浮层 | `svg/32 管理端头像菜单 · 原型浮层.svg`（55,931）· `fc318083d0b148c080c7ac8354242e668be11ac001a71dd73d77754f29f1ce39` | `png/32 管理端头像菜单 · 原型浮层.png`（15,308；1440×1024）· `55fe46ec3bf4fb99273232e69b33878e8ed8e4295cb37b05769b127de786058f` | 一致·无 |

计数核对：32 行 ×（1 SVG + 1 PNG）= 64 文件，哈希 64 个，全部来自本次 `sha256sum` 输出回读。

## G2. 真实路由紧凑清单（静态/动态/区域/权限 ↔ 32 节点）

来源：`Web/src/router/index.ts:17-463`（静态全表）；动态=守卫经 `loadMenu()` 对菜单叶子**按原始 path 扁平 addRoute**（`router/guard.ts:85-107`、`foundation/menu/index.ts:94-151`，组合路径如 `/system/dict` 即真实 URL；目录节点 redirect 到 DFS 首叶；BUTTON 行不注册）。区域判定：`foundation/area.ts:17-27`（portal 清单）+`:30` 静态深链前缀；权限：静态看 `meta.authority`，动态看服务端菜单过滤（前端不裁剪）+`hasRouteAccess`（`guard.ts:58-75`）。下表「权限」列只列非空门禁。

**壳外（无 BasicLayout）**：
| path | name | 来源 | 归属 | 权限 | 节点 |
|---|---|---|---|---|---|
| /login | login | 静态 | 壳外公共 public | — | 06 |
| /sso/return · /sso/bind | sso-return · sso-bind | 静态 | 壳外公共 public | — | — |
| /403 · /404 · /500 | forbidden · not-found · server-error | 静态（ErrorPage） | 壳外公共 public | — | — |
| /account/bindings | account-bindings | 静态 | 壳外已认证 | — | 28（账号绑定项） |
| /m/form/:formKey | mobile-form-render | 静态 | 移动 H5 | — | — |
| /m/workflow | mobile-workflow-center | 静态 | 移动 H5 | — | — |
| /m/notify | mobile-notify-inbox | 静态 | 移动 H5 | — | — |

**壳内静态（BasicLayout 子路由，`router/index.ts:27-377`）**：
| path | name | 归属 | 权限 | 节点 |
|---|---|---|---|---|
| /workspace | workspace | 用户端 | — | 01 |
| /workflow/catalog/:processKey? | process-catalog-static | 用户端 | 菜单 workflow:catalog:view（动态同名段并存） | 21–26 |
| /workflow/catalog-admin | process-catalog-admin | 管理端 | workflow:catalog:manage | — |
| /workflow/my-cc | my-cc-static | 用户端 | 菜单 workflow:cc:view（动态同名段并存） | — |
| /form/designer/:id? | form-designer-workbench | 管理端 | 菜单 form:design:view（动态 form/designer 并存） | 07/08/11/14 |
| /form/form-render/:formKey | form-render | 用户端（portal 前缀 area.ts:30） | — | 27 |
| /form/form-data/:formKey | form-data | 管理端 | form:data:template/import/export 任一 | — |
| /form/form-def-list | form-def-list | 管理端 | 菜单 form:view（动态同 path 并存） | — |
| /agent/graph-designer/:id | agent-graph-designer | 管理端 | — | — |
| /workflow/defs/:defId/design | workflow-def-designer | 管理端 | workflow:def:design | 09/12/13 |
| /workflow/task/:taskId | TaskDetail | 用户端（深链前缀） | — | 03/10/15–18/20 |
| /workflow/processed | ProcessedList | 用户端 | — | — |
| /workflow/instances | ProcessInstanceList | 管理端 | — | 10（图内嵌） |
| /workflow/templates | TemplateCenter | 管理端 | — | — |
| /workflow/monitor | InstanceMonitor | 管理端 | — | — |
| /workflow/analytics | ProcessAnalytics | 管理端 | — | — |
| /workflow/batch-approval | BatchApproval | 管理端 | — | — |
| /workflow/handover | TaskHandover | 管理端 | — | — |
| /workflow/center | WorkflowCenter | 用户端聚合 | — | — |
| /agent/executions/list | agent-execution-list | 管理端 | — | — |
| /agent/executions/detail/:executionId | agent-execution-detail | 管理端 | agent:model:view | — |
| /agent/conversations/list · /detail/:sessionId | agent-conversation-list · -detail | 管理端 | agent:model:view | — |
| /agent/debug/:sessionId | agent-debug-session | 管理端 | agent:model:view | — |
| /agent/tool | agent-tool-list | 管理端 | agent:tool:view | — |
| /notify/template | notify-template-list | 管理端 | notify:template:view | 13（模板引用） |
| /notify/batch-send | notify-batch-send | 管理端 | notify:batch:send | — |
| /notify/rule | notify-rule-list | 管理端 | notify:rule:view | — |
| /notify/channel | notify-channel-list | 管理端 | notify:channel:view | — |
| /notify/preference | notify-preference | 用户端 | notify:preference | — |
| /notify/record | notify-record-list | 管理端 | notify:record:view | — |

**壳内动态（菜单叶子原始 path 扁平注册；种子=`foundation/mock/seeds.ts:215-926`，真实模式同构来自 GET /system/auth/menus；种子仅为前端独立验收基线）**：
| 真实 URL（=/叶子path） | name | 组件 | 归属 | 种子 permission | 节点 |
|---|---|---|---|---|---|
| /system/dict · /system/user · /system/role · /system/dept · /system/post · /system/user-group | dict/user/role/dept/post/user-group 各自 name | system/views/*List | 管理端 | system:dict:view · system:user:list · system:role:list · system:dept:list · system:post:list · system:userGroup:list | 04（用户与组织/数据字典） |
| /form/designer | form-designer | form/views/FormDesigner | 管理端 | form:design:view | 同 07 |
| /workflow/todo | todo-list | workflow/views/TodoList | 用户端 | workflow:view | — |
| /workflow/defs | process-def-list | workflow/views/ProcessDefList | 管理端 | workflow:view | 04 |
| /workflow/processed（与静态双注册） | processed-list | workflow/views/ProcessedList | 用户端 | workflow:view | — |
| /workflow/my-instances | my-instances | workflow/views/MyInstances | 用户端 | workflow:view | 02 |
| /workflow/my-drafts | my-drafts | workflow/views/MyDrafts | 用户端 | workflow:view | — |
| /workflow/my-processed | my-processed | workflow/views/MyProcessed | 用户端 | workflow:view | — |
| /workflow/catalog（与静态参数路由并存） | process-catalog | workflow/views/ProcessCatalog | 用户端 | workflow:catalog:view | 21–26 |
| /workflow/my-cc（与静态双注册） | my-cc | workflow/views/MyCc | 用户端 | workflow:cc:view | — |
| /notify/inbox | NotifyInbox | notify/views/NotifyHome | 用户端 | notify:view | — |
| /notify/record · /notify/template · /notify/batch-send | 各自 name | notify/views/* | 管理端 | notify:record:view · notify:template:view · notify:batch:send | 与静态同 path 双注册 |
| /agent/graph-def · /agent/model · /agent/tool（与静态双注册） | AgentGraphDef 等 | agent/views/* | 管理端 | agent:model:view · agent:tool:view | — |
| /iot | iot | iot/views/IotHome（目录带组件页） | 管理端 | iot:view | — |
| /openapi | openapi | openapi/views/OpenapiHome | 管理端 | openapi:view | — |
| /form/form-def-list（与静态双注册） | form-def-list | form/views/FormDefList | 管理端 | form:view | — |
| /storage | storage | storage/views/StorageList | 管理端 | storage:view | — |
| /job/list · /job/log | job-list · job-log | job/views/* | 管理端 | job:list · job:log | 04（定时任务） |

区域清单（portal，`area.ts:17-27`）：workspace、workflow/catalog、workflow/my-cc、workflow/todo、workflow/my-instances、workflow/my-drafts、workflow/my-processed、workflow/processed、notify/inbox；静态深链前缀 `/workflow/task/`、`/form/form-render/`（`area.ts:30`）。其余菜单叶子均 admin。404 为守卫动态注册的 catchall redirect（`guard.ts:100-104`），静态表无 catchall。UNKNOWN：真实服务端菜单树与 mock 种子的差异（需运行真实后端确认；本任务不启动服务）。

## G3. 节点 22—26 逐项核对

共同机制（适用于五行，但每行独立给结论）：现有流程中心为**单一路由** `/workflow/catalog/:processKey?`（静态 `router/index.ts:43-51`；动态 `/workflow/catalog` 种子并存），分类切换是**页内 el-tag 状态**（`activeCategory`，`ProcessCatalog.vue:30,105-132`），不是五个独立路由/路径参数（`:processKey` 参数组件未消费为分类）；分类数据=`GET /workflow/catalog/categories`（`api/oa.ts:65-69`）+计数=`GET /workflow/catalog/category-counts`（`:49-53`）；事项=`GET /workflow/catalog/items?categoryId=`（`:35-45`）；权限过滤=服务端可见集（mock `handlers.ts:5271-5314` portalVisible 过滤、受限事项按不存在处理）+菜单行 `workflow:catalog:view`；卡片来源=`items.list`（name/分类/formKey，`ProcessCatalog.vue:145-158`）。设计示例数据（灾备演练申请、资产采购申请等）为设计演示集，与现有目录数据（mock 事项 bpm_leave01 等）不同属数据差异。

| # | nodeId | 精确设计文件 | 现有分类键/参数 | 真实卡片来源 | 权限过滤 | 设计 vs 真实差异 |
|---|---|---|---|---|---|---|
| 22 | 100:2 | `svg/22 用户端 · 流程中心 · 行政办公.svg`、`png/22 …行政办公.png`（SHA 见 G1） | categoryId=1（mock `seeds.ts:3999`「行政办公」同名） | items categoryId=1 可见 PUBLISHED 行 | 服务端可见集+菜单 workflow:catalog:view | 卡片缺图标/版本号/最近使用/「发起流程」实底按钮（现为 name+分类 tag+formKey+「进入表单」文字）；计数徽标语义一致（counts 服务端聚合） |
| 23 | 100:387 | `svg/23 …财务管理.svg`、`png/23 …财务管理.png` | 无同名分类；mock 最近似「人事财务」id=2（`seeds.ts:4000`） | items categoryId=2 行（名称映射不同） | 同上 | 分类名「财务管理」与现有「人事财务」不一致，属数据/命名差异；卡片差异同 22；真实环境是否存在该分类 UNKNOWN（分类为运行时数据） |
| 24 | 100:772 | `svg/24 …IT 运维.svg`、`png/24 …IT 运维.png` | 当前分类种子无此键（mock 仅 id 1/2，`seeds.ts:3998-4001`） | 无对应数据行（空集） | 同上 | 分类本身缺失（数据项，非代码缺失）；卡片差异同 22 |
| 25 | 100:1157 | `svg/25 …设备管理.svg`、`png/25 …设备管理.png` | 同上，无此分类键 | 无对应数据行 | 同上 | 同 24 |
| 26 | 100:1542 | `svg/26 …平台权限.svg`、`png/26 …平台权限.png` | 同上，无此分类键 | 无对应数据行 | 同上 | 同 24 |

计数核对：22—26 各 1 行，共 5 行，无合并。设计五分类落为初始数据（迁移/管理端配置）属产品裁决项，本回执不裁决。

## G4. 可判定的视觉回归输入

**1) 工具与当前可用性（真实工具结果）**：`ls Web/node_modules/.bin | grep -iE 'playwright|puppeteer|cypress|chrom'` 与 `ls node_modules | grep -iE '^playwright|^puppeteer|^cypress'` 均零命中（exit 1）——当前无浏览器自动化/截图/像素比较依赖；vitest 4 + jsdom（`vitest.config.ts`，css:false、mock-css 拦截）为既有测试链；`vitest.live.config.ts` 仅用于真实后端链路 spec（VITE_USE_MOCK=false），非视觉用途。结论：像素级对比当前不可运行，属「依赖未引入」而非外部阻塞。等强度三层方案：
- **L1 零新依赖（可立即落地）**：vitest+jsdom DOM 结构回归——关键选择器/布局类/aria/locale 键渲染断言，可阻断「关键状态缺失、结构错位（结构层）、文案回退」；与现有 page-layout.spec 模式一致。
- **L2 建议引入（一个 devDependency 裁决项）**：`@playwright/test`，用 `toHaveScreenshot` 原生像素 diff（支持 clip 分区、maxDiffPixels/maxDiffPixelRatio、主动画禁用）；引入与否由工程裁决，本回执只给参数。
- **L3 会话采证（正式验收层）**：ZCode 受治理浏览器会话（headless=false 用户可见会话）按视口矩阵截图存 `product/.../receipts/evidence/`，符合工程宪法 §2.1「dev:mock 人工肉眼验收」与 system.md 正式浏览器证据契约；headless 结果只能按 ISOLATED_REGRESSION/COMPONENT_TEST 分级。

**2) 视口集合**（设计输入仅桌面 1440；移动只有 H5 专用页，禁止桌面缩放冒充移动）：
| 视口 | 覆盖页面族 |
|---|---|
| 1440×1024（设计基线，dpr=1） | 全部 32 节点对应真实页（19 号长页对应详情页全高滚动 1440×1512） |
| 1920×1080 | 壳+列表页族（弹性栅格、分页边界） |
| 1280×800 | 壳窄桌面（侧栏 220px 布局下限、表格横向滚动） |
| 375×812 | 仅 `/m/form/:formKey`、`/m/workflow`、`/m/notify` 三页族 |

**3) 基准状态集合**（按页面族实际适用者取舍，不适用标 N/A）：默认（登录+首屏）；加载（v-loading/骨架）；空态（ListEmpty/el-empty，`page-layout.spec.ts:163-294` 已锁结构）；错误（LoadErrorState/ApiError alert）；无权限态（v-perm fail-closed display:none，对齐「暗态 gating」铁律）；禁用态（表单提交中/按钮 disabled）；弹窗/浮层打开态（el-dialog、用户下拉菜单、分类 tag 悬停）；双语各一套（zh-CN/en-US）。

**4) 数值阈值与单独阻断条件**（Playwright 语义，数值为初值、首基线后校准一次并记录）：
- 分区 diff：顶栏区（0,0,1440,64）≤0.5%；侧栏区（0,64,220,960）≤0.5%；主区（220,64,1220,960）≤2%；长文本区（en-US）≤3%。超限即失败。
- 单独阻断（任一命中即失败，不允许整页百分比放行）：
  1. 裁切：关键元素 `boundingBox` 超出视口或父 clip 边界 1px；
  2. 遮挡：关键交互元素与浮层/兄弟矩形相交面积 >4px²，或 `document.elementFromPoint(中心)` 未命中自身；
  3. 错位：关键容器 x/y 与基准偏差 >2px（含网格基线）；
  4. 错误断点：767px 下侧栏隐藏、375px 单列满宽、≥768px 侧栏可见——选择器断言+该视口截图 diff 双重校验（现状断点仅 `BasicLayout.vue:58`）；
  5. 状态缺失：空态/错误/加载/无权限各自选择器存在性断言（L1 即可跑）；
  6. 文本回退：locale 键渲染断言（`getByText` 键值），防硬编码文案绕过 i18n。
- 基准纪律：基线随 P53 切片更新并在回执记录 diff 统计；禁止手改基线掩盖失败。

**5) 人工复核点**：新壳首屏（顶栏主导航+深色侧栏视觉一致性）；登录页品牌区渐变与图形；表单/流程设计器画布（SVG 图元、吸附指示、连线）；深色侧栏文字对比度（#7E89A1 on #17213A ≈4:1，需令牌层校正后复检）；en-US 长文本换行/溢出；弹窗遮罩层级与焦点。

**6) 能力缺口与替代对照**：像素 diff（当前不可运行，真实结果见上）→ L2 引入 Playwright 或 L1+L3 过渡；基线管理 → Playwright 内置（若引入）；跨视口并行 → Playwright projects。在 L2 未裁决前，正式验收走 L3（用户可见会话）+L1 常驻结构回归，不构成阻塞。

## 失败/UNKNOWN 汇总

- UNKNOWN：真实服务端菜单树与 mock 种子差异（需真实后端运行；本任务未启动）；真实环境流程中心分类全集（数据项）。
- 无文件变化、无动态服务端数据干扰本次结论；全部哈希/计数/命中数为本次工具输出。
- 需 Planner 裁决的最小问题：① 是否批准引入 `@playwright/test` 作为 L2 视觉基线工具（一个 devDependency）；② 设计五分类是否落为初始数据（接 G3 结论）。
