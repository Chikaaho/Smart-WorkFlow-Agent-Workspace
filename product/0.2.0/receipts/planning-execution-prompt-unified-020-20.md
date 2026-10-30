# 0.2.0 执行提示20：日期原项授权接续，5个有限动作

2026-10-29｜Planner｜revision21接续20，替代提示19为唯一执行入口。配套[审查19：日期授权接续](planning-review-unified-020-19-result.md)。没有新执行回执，来源仍是回执18；此次仅接入Owner已批准的原日期宽度动作，原4项范围/失败次数不变。

原目标：T020/P29租户管理＋J020/P65表单脚本两个新功能，补齐既有表单流程能力，整版UI/文案像素还原。按真实数据验收，UI和字体符合原图，不要求演示值相同。

## 已过锁定与当前5项

回执18的15实施项关闭13：目录菜单、表单菜单、删除确认、图标选择、超管表单、字典、选择表单、待办行、系统目录浮层、超管只读、应用收起、列设置、应用子树，具体结论沿审查18。密码/草稿的几何及业务也全部锁定，只剩下表静态UI。提示12起17节点、回执17关闭3项、G03/T01/A07/A06—A16及正确process框架继续锁定；不重做、不重拍、不重演已过业务。

当前实施5项＝原4项＋原日期项许可接续，新增产品要求0。失败次数沿原项：密码2、草稿3、分类1、提示1均不变；日期1→2，属于原失败史延续，不是新执行轮次。

| 原ID | 只剩动作 | 保护 |
|---|---|---|
| 135:2 | 只补三输入placeholder：请输入原密码、请输入新密码、请再次输入新密码；第一标签原密码，主按钮修改；新密码/确认新密码标签保留。保留当前必填标识/校验和全部尺寸坐标。 | 本轮只允许上述静态标签/placeholder，禁止修改520×354/r12、470×32及三y/80×32底栏、密码校验/认证/必填语义或实际密码。 |
| 278:1437 | 仅把该页主操作可见标签改为继续编辑，调用现有同一草稿编辑动作；更多及查看/提交/删除原集合、位置和其他字段保持。 | 本轮仅一处主操作标签；禁止重排六列、改字段/显示名元数据、筛选/输入/行/日期/分页、更多集合或保存提交恢复逻辑。 |
| 278:1591 | 只为现有分类列表提供流程分类维护800宽居中弹窗及明确入口，内宽750/左右25，原分类名称/操作主列、44表头/45数据行；原16/24标题/12圆角、新建96×32及取消确定80×32。真实5条自然高度，不强压3行373高；排序/事项数/删除等现有额外能力放次级详情/更多并完整保留。 | 只复用现有分类查询/增改删/排序/归属能力，禁止新建分类模型/API/权限、造示例3类、把事项归属页改成分类弹窗；不重跑CRUD。取消确定关闭管理清单，不新增批量事务模型。 |
| 712:43454 | 仅复用既有侧栏提示机制承接收起入口完整名：岗位管理测试点x72、72×34，深色#111B3B，12/18字与左右12/上下8内距、r6；y按真实触发行居中，完整名称动态宽度，不强放原示例y300。悬停或键盘焦点显示，离开/失焦关闭，目录展开浮层仍按既有行为。 | 不改菜单集合/权限/顺序、64收起/236展开/底栏、导航或已过目录浮层，不依赖浏览器原生title样式冒充原稿；只回看一个既有岗位入口及浮层关闭。 |
| 101:2 | 仅使原正确process填写页日期控件铺满既有半列，保持32px高。 | 日期外框与其所属半列实际宽度差≤1px，高32px；不硬编码598/692；日期类型/时区/值、冻结定义、1440容器/48页头/64底栏、设计器/只读日期均保持。 |

## 日期怎么改才算通过

位置只限原灾备演练申请的正确?process=填写消费者。u020-09-g15-fill-correct-entry.png已见日期220宽而半列未填满；18事实确认Element日期默认220、既有配置没有宽度入口，原因核定结束。实施仅令日期外框随其已有半列伸展，保持32高；不得硬编码独立入口598或旧图约692。用同一入口的日期外框与父半列实测宽差≤1px、高32px，且已过框架/日期语义保持，即关闭该项。

Owner已明确授权临时管理员处理此限制；Admin登记已完成并恢复Planner，见[许可接续记录](../../governance/admin-date-width-scope-20261029.md)。此项唯一允许动作替换旧“新建对照表单/改高度/工具栏/子表”，旧禁令/参数保留并加保护。不得沿历史diagnosis重建表单、改工具栏/子表或重新发布冻结定义。独立form-render的1212外框/598半列只作成因事实，不重开已过1440容器/48页头/64底栏、设计器/只读日期。

## 原规划责任

273:1642：服务端权限行为已过，但当前查询受限UI尚缺可比较原件。只复用已有合法无form:data:query且可达的身份，只读打开现有应用受限表面；不增权/撤权、不发query探测、不重演403。旧t100nobody后来已授353/query，不可假定仍无权；确无可达身份时只回具体身份/可达条件，不重复证据根目录或源码声明。保持原PLANNER_ACTION，不伪标像素通过。

机器保留313个原规划责任（含该受限状态与原正式量化/子态），不是313个已证缺陷。Planner沿原ID读取已有结果裁决，不能派执行重扫。5项局部完成不等于整版PASSED。

## 回传与同步

仍合一份短执行回执，按原ID写实际动作、命中表面和结果；复用原件引用，不复制历史原文。几何±1、RGB通道±3满足限定即关闭；日期只观察正确入口，分类只打开/关闭既有真实5类，提示只看一个岗位入口悬停/焦点及退出；不实际改密码、删除、重跑CRUD/提交链。工程检查按改动实际影响，Server未改不重跑。日期实现尚未完成，本提示不提前核销。

沿既有knowledge-first授权传播真实结果、当前入口及剩余责任；保护vite.config.ts、他人成果和用户PG/Redis/服务。Web回执18的fa53ef1edb383c90f993245c14423ce0b8caba9d已推回读、typecheck/eslint0、1956通过3跳过/build4.42s按回执层级继承；Server fe2bba4d未动。治理修复47481abc已推且远端回读一致，41治理回归通过、初始化READY1.3.1；这是治理交付，不替代UI实证。

机器500＝182 RESOLVED/5 REWORK/313 PLANNER_ACTION，CONTINUE/VERIFYING。499项摘要继承revision20，只有日期1项显式变化，原4项scope/失败史不改。正式49、46/22/22=90、ADV64/问题57、P62延期/OFF保持，不核销P/晋级基线/FINISH。0.2.0已确认。7阶段：评估、实施提交完成；验收同步进行中；合并develop/main、发布0.2.0、发布后同步、结束未开始（2/1/4）。

```planner-convergence
{"schema":"agent-coding-engine.planner-handoff.v1","feature":"0.2.0","revision":21,"previous_revision":20,"decision":"CONTINUE","source_receipt":"product/0.2.0/receipts/u020-named-detail-rework-18.md","history_summary":{"revision":20,"review":"product/0.2.0/receipts/planning-review-unified-020-18-result.md","retained_count":499,"status_counts":{"RESOLVED":182,"REWORK":4,"PLANNER_ACTION":313}},"items":[{"origin_id":"P3/101:2","subject":"101:2 27 用户端 · 发起流程","criterion":"对此原参考对象按A02/A03/A04作适用性及已有结果裁决，不等同代码待修","status":"REWORK","failed_rounds":2,"evidence":["E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/101-2.png","E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/a03-runtime-101-2.png","E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/a03-diff-101-2.png","E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/a03-report-101-2.json","product/0.2.0/receipts/u020-rework-acceptance-87.md","product/0.2.0/receipts/planning-receipt-read-unified-020-87.md","product/0.2.0/receipts/planning-review-unified-020-16-result.md","E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-09-g15-fill-correct-entry.png","product/0.2.0/receipts/u020-named-detail-rework-17.md","product/0.2.0/receipts/planning-review-unified-020-17-result.md","product/0.2.0/receipts/u020-named-detail-rework-18.md","search_fallback/unified-020-state-facts-18.md","product/0.2.0/receipts/planning-review-unified-020-18-result.md","E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-18-facts.json","product/governance/admin-date-width-scope-20261029.md","product/0.2.0/receipts/planning-review-unified-020-19-result.md"],"scope":{"targets":["填写页上述各点"],"allowed_actions":["仅使原正确process填写页日期控件铺满既有半列，保持32px高。"],"forbidden_actions":["降低99%/98%/1%等原量化标准","手工画大矩形或遮罩非文字元素","删除授权代理/更多/编号设置/租户标识等合法功能刷分","改动八项业务断言和85/86已锁定行为","重跑与本项无关的业务链","改动vite.config.ts或他人成果","验证或修复移动端","禁止修改日期类型/时区/值、冻结定义、1440容器/48页头/64底栏或设计器/只读日期；仅填满原process日期控件所在半列。"],"constraints":{"富文本安全":"不放宽现有安全限制，不新增图片/表格能力","表单":"只增不改历史表单","文字口径":"文字项按visual-acceptance-020.md第7节判定；非文字像素≥99%、内容区≥99%、关键区≥98%","Owner日期宽度许可":"仅使原正确process填写页日期控件铺满既有半列，保持32px高。","Owner已过保护":"日期外框与其所属半列实际宽度差≤1px，高32px；不硬编码598/692；日期类型/时区/值、冻结定义、1440容器/48页头/64底栏、设计器/只读日期均保持。"}},"next_action":"仅使原正确process填写页日期控件铺满既有半列，保持32px高。","acceptance":["日期外框与其所属半列实际宽度差≤1px，高32px；不硬编码598/692；日期类型/时区/值、冻结定义、1440容器/48页头/64底栏、设计器/只读日期均保持。","只在原正确process填写入口观察日期及所属半列实际外框；宽差≤1px、高32px即关闭本项。沿已过业务结论，不重新发布定义或重演提交链。"],"diagnosis":{"location":"原灾备演练申请正确?process=填写入口的日期控件（101:2）","observed":"已读u020-09-g15-fill-correct-entry.png：日期外框仍220宽，未铺满既有半列；18事实确认EP默认220且无既有宽度配置。独立form-render事实父列598，只说明默认宽度成因，不能替代正确process框架。","expected":"日期外框与其所属半列实际宽度差≤1px，高32px；不硬编码598/692；日期类型/时区/值、冻结定义、1440容器/48页头/64底栏、设计器/只读日期均保持。","cause":"默认日期控件宽度未随填写半列伸展；旧allowed_actions漏记宽度，已由Owner限定许可并经Admin登记接续。","next_action":"仅使原正确process填写页日期控件铺满既有半列，保持32px高。"},"planner_self_audit":"原提示把高度/工具栏/子表列作允许动作，遗漏原日期宽度，且混用独立form-render与正确process入口，造成反复等待。现按Owner仅一个宽度动作接续原ID/失败史1→2，不新增对象；正确process1440/48/64和已过工具栏/子表/业务全部锁定，不再新建表单、核原因或比较整页框架。","owner_scope_amendment":"owner-20261029-u020-date-width"}]}
```
