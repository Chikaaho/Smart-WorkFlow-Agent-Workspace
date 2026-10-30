# 0.2.0 审查23：305个原对象的完整裁决与有限余项

2026-10-29｜Planner｜原始目标：租户管理T020/P29、表单脚本J020/P65两个新功能，补齐既有表单/流程能力，并完成整版UI/文案的像素级还原。按真实数据验收，移动端不验。

305是上轮尚待规划裁决的原参考对象数，既包含主题/选中态，也包含同一弹窗、原型引用和场景条件，不能解释为305个代码缺陷。本次已逐个读完原图，并与现有业务回执、实际图和几何结果对照；下表没有“尚未审阅”。接下来只按已明确的差异或缺失实际状态处理。

本次305项：**26项继承关闭；19个共用问题主修，涉及109个原引用状态（主修19、等待共用修复复核90）；170项已审，但现有结果未展示匹配状态或真实条件不具备。** 后两类保持开放，不能冒称像素通过；90个依赖态不再各派一次相同整改。23正在修的两个快照属性另行完整继承，不加入这305、不重派或加宽。

生效账本在提示24中：500＝219 RESOLVED /21 REWORK /260 PLANNER_ACTION。21为23在途2＋本次主修19；260为90个共用修复依赖态＋170个具体状态/条件。原ID集合、原断言、失败历史保持；新增ID为0，已过无依据重开为0。CONTINUE/VERIFYING，未整版PASSED。

## 审查方法和规划纠错

原图及当前证据均直接原位读取，下面按共用消费者压缩重复结论，不复制历轮回执。原26冻结快照选中态中，两项已在23修；其余24项已分清真实TEXT/审批/END可复用部分与不存在的控件/网关条件，不能因共用壳层一并标通过。

判定以最后影响该对象的结果为准：12—14已经替代08的冻结全屏壳层；18的字典标题/表头/行高、应用图标、表单菜单不再用08旧图倒退重开。旧图只用于没有后续相关修改的具名表面；执行时若该表面已因后续变化达标，直接引用当前结果关闭，不再重复改实现。

字体报告已自检：登录六个失败的CSS和DOM框已相符，墨迹底边/高度不能代替排版基线；四个insufficient不能当实现失败。流程中心报告把IT/财务顺序、同名不同消费者、真实5+5行带来的96px自然下推，以及白字取色错误混在失败中，已逐类剔除错误推断。真正CSS差仅按S20-F所列属性修；不删数据、不套演示值、不扩大遮罩、不降低原§7与可比固定区域99%/98%标准。

以下参数为1920×1080/DPR1；沿原几何≤1px、稳定色RGB各通道≤3及适用文字标准。1366只核实际受影响的越界/布局，不能另开全量1366巡检。样例条数、姓名、租户名、节点名、系列数及排序不是固定UI，均取真实值；不同数据条件下不做整图分数替代固定区域判定。

## 19处主修：实际、边界和通过条件一次列全

执行顺序：先完成23原两项；然后处理本节主修，每个共用表面只修一次。小节号是本次归并标识，**不是新增缺口ID**；每节列出的主修原ID承担修改，同节原ID只复核共用结果。

### W19-M · 工作台指标坐标轴窗口

原始参考：[675-37048.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/675-37048.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/675:37048**；关联原ID（11）：675:37048、679:40822、679:40974、679:41126、679:41278、679:41581、679:41687、679:41793、679:41914、679:42020、679:42157。

- 实际：现有双指标窗口宽820、行密度紧凑；原图指标窗口宽1120，表头34、输入32、指标行约85。85/86已证双轴、单位、颜色、持久回读。
- 仅允许：只修指标窗口1120宽、24内边距、32输入、34表头与85行距；分类图保留分类/指标字段，数值图保留左右轴；数量按真实指标，禁造第三指标或重跑图表语义。
- 达标即关闭：1920窗口居中x400，内宽1072±1；二指标自然高度，不硬凑参考三指标660高；原有增删/轴/单位有效，1366不越界。
- 原依据：[20-metrics-axis-dialog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/20-metrics-axis-dialog.png>)；[a03-chart-complete-85.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-chart-complete-85.md>)

### W19-C · 工作台自定义颜色窗口

原始参考：[675-37050.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/675-37050.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/675:37050**；关联原ID（6）：675:37050、679:40512、679:40574、679:40636、679:40698、679:40760。

- 实际：现有窗口440宽、预览约73高、紧凑色块；六原变体共用480宽、渐变156高、36色块、32输入。HEX与50%透明度已有真实结果。
- 仅允许：仅窗口480宽、渐变430×156、预览36、六列常用色、32高输入、72×32底栏；真实颜色及11个预设沿用，禁强制紫色或添加白色刷图。
- 达标即关闭：窗口居中；六色变体只改变当前色和HEX，不改变几何；透明度与当前值回显维持85结果。
- 原依据：[22-color-alpha-dialog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/22-color-alpha-dialog.png>)；[a03-chart-complete-85.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-chart-complete-85.md>)

### W19-F · 工作台选择表单

原始参考：[645-28735.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/645-28735.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/645:28735**；关联原ID（1）：645:28735。

- 实际：实际760宽、176目录栏、双列表单卡；原图880宽、192目录栏、单列64高表单行。
- 仅允许：仅880窗口、192目录、单列表单行64高/间距12、搜索32、72×32按钮；使用现有有权10表单、真实分类和计数。
- 达标即关闭：1920居中x520；内部搜索830宽；表单区单列，真实多条自然滚动；原选中与确认绑定不变。
- 原依据：[04-form-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/04-form-picker.png>)

### W19-I · 工作台右侧配置区与图型变体

原始参考：[645-28365.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/645-28365.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/645:28365**；关联原ID（30）：645:28365、645:28403、645:28441、645:28479、645:28517、654:35484、659:33459、659:34075、659:34715、675:34380、675:34381、675:34713、675:34714、675:34715、675:35047、675:35048、675:35380、675:35381、675:35382、675:35383、675:35715、675:35716、675:36048、675:36049、675:36381、675:36382、675:36714、675:36715、675:37047、686:40638。

- 实际：当前数据/样式是标题行里的小按钮；数据区先表单/图型再统计摘要，样式区为紧凑色控件；原图在宽高下方铺满数据/样式页签，再排图型/表单/维度/指标和分组，系统卡显示内容/条数/排序。12/13只修左组件库。
- 仅允许：仅现有336右栏内部顺序、页签、字段卡、样式行布局；内容288宽，32高输入/140×32双页签、样式系列色行44高；图表色沿当前配置。不得改已过224/1360/336框架、18图标、真实数据绘图与配置语义。
- 达标即关闭：图型数据/样式及系统卡三个右栏分支按各原图；图型/表单/维度/指标为真实已选值；分组/堆叠/图例/值/网格控件保留适用性，未支持能力不新增引擎。
- 原依据：[05-chart-with-data.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/05-chart-with-data.png>)；[11-style-tab.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/11-style-tab.png>)；[u020-13-g19.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g19.png>)

### D08-P · 审批人选择窗口

原始参考：[49-240.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/49-240.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/49:240**；关联原ID（1）：49:240。

- 实际：真实选择窗约1020×732，标题大、额外策略页签，候选区为头像卡；原980×590三栏，部门/候选/已选，搜索与18勾选。原人员/角色/动态规则语义保持。
- 仅允许：只改选择窗980宽、三栏200/404/294、候选行56、勾选18、16/24标题、底栏80×32；其他策略入口保留于已有切换区，不删除合法能力。
- 达标即关闭：1920居中x470、各栏顶部同线；真实人员数自然留白，已选/取消/确认继续使用原结果，不要求五个演示人员。
- 原依据：[04-approver-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/node-save/04-approver-picker.png>)；[a03-negative-node-script-chart-84.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-negative-node-script-chart-84.md>)

### D08-F · 流程节点字段页签

原始参考：[549-24449.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/549-24449.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/549:24449**；关联原ID（4）：549:24449、549:24653、549:25061、549:25469。

- 实际：现有字段页签缺顶部字段搜索，复选框28高；原右栏有搜索32与紧凑必填/可编辑/隐藏三列、18勾选。82/84字段权限保存/发布已过。
- 仅允许：仅336右栏内字段搜索与列表密度/18复选框；保留真实字段行与权限绑定、字段过滤，禁止重建权限模型。
- 达标即关闭：首个字段头在搜索下；三列可点击区与视觉框分开；搜索不改变权限；四主题同结构、当前主题色继承。
- 原依据：[07-field-perm-panel.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/node-save/07-field-perm-panel.png>)；[a03-fieldlist-permtree-script-82.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-fieldlist-permtree-script-82.md>)

### D08-B · 流程节点基础属性

原始参考：[366-6765.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/366-6765.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/366:6765**；关联原ID（3）：366:6765、366:7092、366:7419。

- 实际：当前基础面板是节点名/审批策略下拉/选人/退回节点纵向堆叠；原图基础区为审批源分段、选中人、通过条件及意见表单/脚本入口。已过42:4仅壳层，不覆盖面板内部。
- 仅允许：仅现有336右栏基础分支排版；288内容宽，32高输入与分段、14/22标签；现有配置映射到原图分组，额外合法策略保留，不改拓扑/引擎。
- 达标即关闭：基础/字段/高级各页签仍可达；指定人、表单字段、JS来源按真实配置回显，原分组/行序与原图一致；禁伪造样例会签比例或人员。
- 原依据：[u020-08-g08-node.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g08-node.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### S14-H · 发布版本列表

原始参考：[50-429.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/50-429.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/50:429**；关联原ID（1）：50:429。

- 实际：当前历史版本为右侧约540宽抽屉及卡片；原图1000宽居中版本表，版本/时间/发布人/说明/快照五列。真实版本v2和已有恢复/脚本操作合法。
- 仅允许：只把版本列表外壳/表格排版还原1000宽居中、34表头与46行；版本/时间/发布人/说明绑定真实已有值，额外合法操作放原操作区，不删恢复能力。
- 达标即关闭：1920居中x460；列表自然真实版本数；查看打开原冻结对象，恢复仍走原确认，无版本写入回归。
- 原依据：[u020-08-g14-a11-history.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g14-a11-history.png>)

### S14-F · 快照字段清单

原始参考：[505-23628.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core-variants/505-23628.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/505:23628**；关联原ID（1）：505:23628。

- 实际：当前字段清单上方插入大块概览，后串校验/显隐/脚本；原图字段清单是页签下单一冻结字段表，名称/组件/标识/类型/宽度/必填/操作。
- 仅允许：仅当前字段清单页分区与列布局：把概览/原始定义保留在已有独立详情入口，主面呈字段表；禁删冻数据、改版本、扩字段。
- 达标即关闭：表从页签下20起，34表头、46行，字段数真实；属性查看仍只读；校验/脚本从原查看入口到达。
- 原依据：[u020-13-g14-fields.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g14-fields.png>)

### S14-E · 快照流程设置

原始参考：[505-23296.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core-variants/505-23296.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/505:23296**；关联原ID（2）：505:23296、505:23398。

- 实际：当前流程设置同页上通知空态、下长卡片监听及原始配置；原图设置内左200导航分通知/监听，右白卡含只读通知选中或监听表与查看。
- 仅允许：仅只读设置页内两分支和监听表排版；200左导航、24内容间隔、32只读字段、34表头；真实未配置通知保留空态，不伪造开关/渠道。
- 达标即关闭：通知/监听切换各自显示，真实监听名/时机/启停，查看冻结脚本；不影响23两处右栏修复、不能增编辑/执行或写历史。
- 原依据：[u020-13-g14-settings.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g14-settings.png>)

### A11-D · 删除目录确认

原始参考：[527-24255.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/527-24255.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/527:24255**；关联原ID（1）：527:24255。

- 实际：08真实目录删除用420×128通用警告框、60按钮；原图440×172确认窗、80×32取消/删除、危险红，18只闭删除表单，不能假定目录已改。
- 仅允许：只复用已过表单删除确认的440×172/r12外观到目录确认；正文保留真实目录及非空拒绝说明，按钮绑定不变，禁止实际删除。
- 达标即关闭：居中x740/y454；16/24标题、14/22正文，80×32底栏，危险C2303A；目录目标正确，取消关闭；表单确认锁定。
- 原依据：[u020-08-sa-app-dir-delete-confirm.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-dir-delete-confirm.png>)；[u020-named-detail-rework-18.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-18.md>)

### A12-D · 新建/设置应用及已选外观主窗口

原始参考：[272-1642.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/272-1642.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/272:1642**；关联原ID（8）：272:1642、272:1670、471:16801、471:17054、478:15747、478:15806、478:16024、478:16083。

- 实际：当前600×294主窗口几何与控件32/44正确，但外框为4圆角、设置标题为编辑应用、主钮保存；原图12圆角、应用设置/新建应用与确定。外观选择器18已通过不重做。
- 仅允许：仅这两个调用方主窗口圆角12及可见标题/主钮静态文案；600×294/550×32名称/两263×44外观按钮和现有可见范围次级入口锁定；不改真实名称/图标/色值。
- 达标即关闭：600×294居中/r12，设置标题应用设置、新建标题新建应用、主钮确定；额外可见范围入口正常；跨选择窗名称和另一属性保留。
- 原依据：[u020-08-sa-app-create-dialog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-create-dialog.png>)；[u020-08-sa-app-edit-dialog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-edit-dialog.png>)；[u020-app-grid-appearance-04.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-app-grid-appearance-04.md>)

### Y-S · 系统列表固定表面

原始参考：[446-13479.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/446-13479.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/446:13479**；关联原ID（15）：446:13479、459:12874、446:13882、459:13104、446:14254、459:13364、446:14618、459:13590、459:13842、446:15271、459:14071、446:15569、459:14291、446:15891、459:14490。

- 实际：用户/角色/岗位/组当前筛选输入多从x410起且按钮60宽，原按标签自然排布从309/337等起、按钮72；表头用户/角色204对原208，部门222对208；斑马行和状态彩签与原白行/文字状态不同。字典类型446:14964在18已单独修好，不能重开。 459:13842已回读18实际超管图：y164/208/53及白行已正确；这里仅剩超管租户筛选的适用性、72按钮与原纯文字状态表面，不重修标题/表头/行高。
- 仅允许：仅原ID对应的实际余差：用户/角色等筛选间距、72×32按钮、尚未命中18修复的表头间隔/纯色行与状态文字。459:13842继承18的标题y164/表头208/53白行，仅核合法租户筛选和按钮/状态表面；有真实权限/字段来源才承接，缺来源不新增API或改权限。仅这15个原状态，不全局改已过3:2/4:2/6:2或446:14964。真实额外字段/操作保留。
- 达标即关闭：展开236、主区x256；筛选y84/h64、输入32；标题y164/h28、表头外沿208/h44、数据53、白行细边；部门/菜单不因额外操作另加14/12高；超管租户真实列保留，禁造CH科技。
- 原依据：[u020-08-sa-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-user.png>)；[u020-13-g25-dept.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g25-dept.png>)；[u020-14-g26.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g26.png>)；[u020-08-sa-menu.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-menu.png>)；[u020-08-sa-post.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-post.png>)；[u020-08-g30-user-group-list-fixed.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g30-user-group-list-fixed.png>)；[u020-13-g31-dict-data.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g31-dict-data.png>)；[u020-named-detail-rework-18.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-18.md>)；[u020-18-g14964.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-18-g14964.png>)；[459-13842.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/459-13842.png>)

### J22-D · 脚本工作区共享目录表面

原始参考：[273-1305.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/273-1305.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/273:1305**；关联原ID（16）：273:1305、352:8879、352:9025、352:9171、355:6765、355:6910、383:8007、563:26756、563:26825、563:26894、574:27895、574:27965、574:28136、574:28206、574:28377、574:28447。

- 实际：当前08脚本窗1480×800及四区位置正确；函数目录滚条占约14宽，把搜索及目录内宽从原248压到约232，问号锚随之左移。成功undefined是实际合法语义；目录数量/示例脚本不同不比较演示内容。
- 仅允许：仅共享目录280宽内部的搜索248×32、函数行右问号锚、滚条与右16内边距冲突；保持1480×800、代码1134×420、说明98、结果108和按钮80×32。监听/审批人目录适配器与只读快照严格分开。
- 达标即关闭：搜索x261至509±1，问号位于原右锚；长目录可滚动但不挤搜索/行内容；成功/失败/未运行与函数插入沿05/82/84，错误红边/结果真实；不要求return true或重跑脚本持久化。
- 原依据：[u020-08-g22-script-dialog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g22-script-dialog.png>)；[u020-08-g22-script-insert.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g22-script-insert.png>)；[u020-08-g22-script-run.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g22-script-run.png>)；[u020-script-workspace-05.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-script-workspace-05.md>)；[a03-negative-node-script-chart-84.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-negative-node-script-chart-84.md>)

### F07-L · 表单字段清单

原始参考：[49-2.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/49-2.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/49:2**；关联原ID（1）：49:2。

- 实际：当前字段页为白底8列表，主表/明细单独一行、搜索右置并显示表名；原为F4F6FB底、x20/y132/h64工具栏含字段名称/主表/子表，x20/y208字段表。字段ID是合法额外信息。
- 仅允许：仅字段清单工具栏/页面底色/表容器和行密度；原字段标识保留次级/既有列，不删字段长度/必填/描述能力；逻辑类型与TABLE81/82锁定。
- 达标即关闭：工具栏1880×64、字段名输入256×32、主/子表切换32高；表头44/行49，字段输入32；真实3或7行自然高度，保留24栅格与顶部112壳层。
- 原依据：[u020-08-g07-field-list-current.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g07-field-list-current.png>)；[a03-fieldlist-permtree-script-82.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-fieldlist-permtree-script-82.md>)

### F07-P · 表单预览外壳

原始参考：[272-1883.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/272-1883.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/272:1883**；关联原ID（1）：272:1883。

- 实际：当前预览为全屏标题+灰底居中968白卡，原是1120宽居中表单预览弹窗、内部1070白面与真实字段。原表单预览回传/安全已过44。
- 仅允许：只预览外壳改1120宽、内宽1070、24内边距、16/24标题和r12，最大视口内高；真实字段布局/富文本/子表沿既有adapter，不改填写或快照外壳。
- 达标即关闭：1920弹窗x400居中；短表单自然高度、长表单内滚不满屏；32单行/80多行等已过标准继承；预览无持久写入。
- 原依据：[u020-08-g07-preview.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g07-preview.png>)；[ui-structure-completion-44-47.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/ui-structure-completion-44-47.md>)

### F13-L · 业务表单管理列表

原始参考：[272-1401.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/272-1401.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/272:1401**；关联原ID（1）：272:1401。

- 实际：正确超管表单列表仍是236全局侧栏+240分类栏，主区x488；原业务表单列表主区全宽x20、筛选y84/table164。21真实表单、附加合法操作不是差异。
- 仅允许：仅本表单列表消费者退额外占位，分类保留在列表下可折叠次区或原更多入口；原名称筛选32、1880×64筛选、表头44/真实字段表；保留额外创建时间/操作，不删能力或改数据API。
- 达标即关闭：主筛选x20/y84/w1880/h64、表x20/y164；真实名称/应用/创建人/发布态/版本/时间/操作承接已有字段；多行真实长用户名单行省略及可见提示，分页仍10且21条。不得用已过审批表单459:15228代替本业务消费者。
- 原依据：[u020-09-g13-super-form-list.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-09-g13-super-form-list.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### S20-F · 流程中心分类态共享字体

原始参考：[100-2.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/100-2.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/100:2**；关联原ID（5）：100:2、100:387、100:772、100:1157、100:1542。

- 实际：同97:2消费者：当前常用/最近标题15/20/600而原16/24/500；卡内发起Arial13而原Noto Sans SC12/18；表头13/500而原12/18/400；数字计数Arial13，按钮Arial且14行高。字符串坐标误配不采用。
- 仅允许：只修上述共享文字样式，Noto Sans SC及各原字号/行高/字重；卡内标题锚x281/1107只核原内部24内边距，原5行298高/表y478保持。侧栏名称14/22/500已过不改，数量真实，IT/财务顺序真实。
- 达标即关闭：标题16/24/500；卡发起12/18/400；表头12/18/400；计数按Noto14/22、选中500/其他400；按钮14/22/500；不调整真实排序、动态宽度、禁用颜色与真实分页。该差异承接原97失败史，不重置历史。
- 原依据：[a03-s7d-97-2-report.json](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/a03-s7d-97-2-report.json>)；[u020-08-g20-catalog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g20-catalog.png>)；[u020-08-verify.json](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-verify.json>)

### LEGACY-6-2 · 6:2 04 管理后台

原始参考：[6-2.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/6-2.png>)；同节变体沿上列原ID定位当前蓝色包。

主修 **P3/6:2**；关联原ID（1）：6:2。

- 实际：08当前筛选组比原整体右4px：流程名输入x341对337、分类681对677、状态869对865；72/80按钮及表格/真实列已正确。
- 仅允许：只把三筛选组共同左内距减4px，原输入宽296/144/144、高32不动；不改表头/分页/行/合法动作。
- 达标即关闭：输入左缘337/677/865±1，y100/h32、原宽/按钮/列位保持。
- 原依据：[a03-desktop-semantics-78.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-desktop-semantics-78.md>)；[u020-rework-acceptance-87.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-rework-acceptance-87.md>)；[u020-08-g04-defs.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g04-defs.png>)；[6-2.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/6-2.png>)

## 26项继承关闭：只关闭已证明的原断言

这些关闭涵盖对应消费者/同态引用及已裁定的数据适用性，不外推整个页面或不同控件类型。失败历史原值保留。

### A10-G · 应用中心四种网格

原ID：272:717、280:1315、280:1453、280:1590、280:1727。

08r6真实非空admin@0最终实测四列数616/458/363/221，88卡、64筛选，默认6；真实1应用/1表单与自选紫色合法，原图12演示应用不是要求。

关闭边界：锁定现有卡与网格；不新建12应用、不改图标颜色、不再重演偏好保存。 这五个原对象的消费者/非空结果及四列布局适用性已裁决；不把不同真实内容像素直接算成整版99%。

依据：[u020-08-r6.json](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-r6.json>)；[u020-08-sa-app-center-3col.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-center-3col.png>)；[u020-08-sa-app-center-4col.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-center-4col.png>)；[u020-08-sa-app-center-5col.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-center-5col.png>)；[u020-08-sa-app-center-8col.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-center-8col.png>)

### A11-M · 目录/表单行定位菜单三个原变体

原ID：528:24117、528:24137、528:24157。

三参考为同192×122菜单在不同对象行的平移；18已对真实目录和真实表单分别打开，182×36/38步长/红C2303A，表单设计/重命名/删除与目录动作绑定正确。

关闭边界：锁定18修复；239/331是原稿行锚，真实行不强移到演示y。 三个位置变体按目录/表单正确消费者继承18；不重演删除。

依据：[u020-named-detail-rework-18.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-18.md>)；[u020-18-g1709.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-18-g1709.png>)；[u020-18-g1731.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-18-g1731.png>)

### A12-I · 新增/设置图标选择器变体

原ID：471:17052、478:15865、478:16142。

三个图标选择原图共用471:16799，保留另一外观属性是04已证行为；18已修600×386/r12、6×3格/24图标/语义色与无滚条。

关闭边界：继承原图标浮层通过；已选图标/颜色真实，不为匹配样例改成铃铛或蓝色。 相同选择器结构与保留另一属性语义直接继承04/18；调用方主弹窗仍由A12-D单独处理。

依据：[u020-app-grid-appearance-04.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-app-grid-appearance-04.md>)；[u020-named-detail-rework-18.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-18.md>)；[u020-18-g16799.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-18-g16799.png>)

### A12-C · 新增/设置颜色选择器变体

原ID：471:17053、478:15966、478:16243。

三个原图共用471:16800，480×436/r12/430×120渐变/HEX与80×32按钮已修过；当前真实紫色与默认蓝色是配置值差异。

关闭边界：继承已过颜色选择器，保留图标与原色/取消确认；不混工作台480×550透明颜色窗。 共用窗口与04独立确认/取消、保留图标结果适用；不再次保存应用。

依据：[u020-app-grid-appearance-04.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-app-grid-appearance-04.md>)；[planning-review-unified-020-17-result.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/planning-review-unified-020-17-result.md>)

### A12-G · 应用管理普通列表

原ID：272:980。

08真实admin@0非空应用管理已可达，1880×64筛选、88卡与真实表单数；04同网格、偏好。旧普通403不可再用作场景阻塞。

关闭边界：锁定真实应用管理与卡片；额外6列设置保留。 本消费者/真实非空结果已裁决；主弹窗/菜单的独立剩余按A12-D/M/X处理。

依据：[u020-08-sa-app-manage.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-manage.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### T21-N · 主题普通面板

原ID：355:6574。

08当前主题窗560×450，三项默认蓝/青/自定义、32HEX/80按钮、预览与原图一致；自定义真实b45309合法。58恢复/保持行为锁定，旧四选紫色图已过时。

关闭边界：锁定当前普通主题面板，不为样例强改已存色、不补旧紫色预设。 普通窗适用性已裁决，真实色值自然；不将背后的工作台当本项整页像素依据。

依据：[u020-08-g21-theme.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g21-theme.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### F36-V · 文字左/右/常规/24选中态

原ID：490:16659、490:16711、490:16763、490:16815。

08实际右对齐和24已见画布对应变化；13公共文字属性295宽80/36/32控件已修，原左/右/常规/24只改变既有值和active，不是新布局。

关闭边界：继承13公共面板与08对应行为；文字真实内容和当前字号不强配演示标题，禁重做已过控件。 四变体按同文字组件与真实配置继承；没有据旧08未修面板重开13。

依据：[u020-08-g36-align.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g36-align.png>)；[u020-08-g36-align-right.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g36-align-right.png>)；[u020-08-g36-size-24.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g36-size-24.png>)；[u020-13-g36.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g36.png>)

### B41-C · 系统/目录/工作台三折叠侧栏

原ID：710:42626、710:43363、710:43652。

09已实测64收起/48底栏；18系统目录256浮层与20完整名提示，272:1296应用64轨道已过。三原对象分别只是系统收起、目录关闭和工作台收起；不同菜单权限/数量按真实。

关闭边界：只继承同Sidebar折叠/目录状态，系统列表正文由Y-S独立处理；不再截图全站或重跑导航。 侧栏消费者与64/236/48、目录开闭/活动状态等价依据已明确；不宣称背后页面整页通过。

依据：[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-named-detail-rework-18.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-18.md>)；[u020-08-g41-collapsed.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g41-collapsed.png>)

### B03-F · 只读表单详情

原ID：329:6450。

该原对象只读表单与已过5:2相同；10已对真实8字段详情复验32单行/80多行/70富文本/38子表行，1440正文；不同字段值/真实附件合法。

关闭边界：继承10只读消费者结果；不扩为意见、会签或流程图通过。 本普通只读表单对象适用性闭合，原值/真实附件与A09权限保持。

依据：[u020-10-g03-readonly-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-10-g03-readonly-detail.png>)；[planning-review-unified-020-10-result.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/planning-review-unified-020-10-result.md>)

### LEGACY-4-2 · 4:2 02 我发起的

原ID：4:2。

原87三处限定的当前节点真值绑定、216×32日期框与顶栏去实心三角已落地；08正确同页10真实行、各列锚/日期框承接。12示例行不再作失败。

关闭边界：仅核销原scope三处；不把合法更多/真实当前节点与未命名END当新缺陷。 关闭原限定，真实分页及未受影响业务保持。

依据：[u020-rework-acceptance-87.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-rework-acceptance-87.md>)；[u020-full-visual-sweep.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-full-visual-sweep.md>)；[u020-08-g02-my-instances.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g02-my-instances.png>)；[4-2.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/4-2.png>)

### LEGACY-7-2 · 7:2 05 企业门户

原ID：7:2。

78/87及08门户图已证hero1880×144、服务卡80高、下栏1420:440、三摘要41/506/972、14柱宽83.6/间距16/基线794、关注分隔及搜索行±1。数据30日/柱高/服务权限均真实合法。

关闭边界：按原scope关闭布局/趋势/环比已有值断言；旧允许动作中13段已被Owner14柱/真实数据口径替代，不再执行13段；固定UI未整片免验。 原限定已满足；全局正式基线不因本局部晋级。

依据：[a03-desktop-semantics-78.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-desktop-semantics-78.md>)；[u020-rework-acceptance-87.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-rework-acceptance-87.md>)；[u020-full-visual-sweep.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-full-visual-sweep.md>)；[u020-08-g05-portal.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g05-portal.png>)；[7-2.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/design-blue-20261026/core/7-2.png>)

## 170项已审但待匹配状态：有限核实清单

这部分不以缺图推断代码失败，也不允许执行自由补功能。先沿下面已指明的现有对象读取结果；同一个实际消费者可承接多个主题/命名变体，不要求170张截图或重复业务链。现有结果已足够的直接引用；确有缺失时只打开/选择对应状态、记录当前实际，关闭/取消退出。已有场景不存在就明确“当前不具备”及事实，禁止为演示造数据、改授权、保存、发布或删除。不同控件/不同权限条件不能冒充同态；尚无实际结果的对象继续开放。

只读核实随主修一次回传，Planner直接据此验收；不再先派一轮“导出账本”。下列每项的条件已固定；无需再次让执行猜“怎样才过”。

### Q01 · 645:28736 工作台配置 · 筛选数据

原ID：645:28736。

- 已审实际/原因：已读原图并核对85/86结果；现有命名type-picker等图片实际是配置页，未显示本状态，不能据文件名判通过或认定代码缺失。
- 有限动作与保护：只读取既有相应界面结果；确无可读结果时由执行打开此现有状态一次，禁止改业务、造数据或重复66次CRUD。
- 可判定条件：680宽筛选数据窗口，字段/操作符/值180/140/288×32，真实命中数与条件行；只打开现有配置不提交数据。
- 已读依据：[09-type-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/09-type-picker.png>)；[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)

### Q02 · 645:28737 工作台配置 · 列表列头

原ID：645:28737。

- 已审实际/原因：已读原图并核对85/86结果；现有命名type-picker等图片实际是配置页，未显示本状态，不能据文件名判通过或认定代码缺失。
- 有限动作与保护：只读取既有相应界面结果；确无可读结果时由执行打开此现有状态一次，禁止改业务、造数据或重复66次CRUD。
- 可判定条件：880宽列表列头窗口，显示/字段/列名/宽度/排序五列，34表头、32控件，真实字段与现有选中。
- 已读依据：[09-type-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/09-type-picker.png>)；[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)

### Q03 · 653:31851 工作台配置 · 选择分类字段

原ID：653:31851。

- 已审实际/原因：已读原图并核对85/86结果；现有命名type-picker等图片实际是配置页，未显示本状态，不能据文件名判通过或认定代码缺失。
- 有限动作与保护：只读取既有相应界面结果；确无可读结果时由执行打开此现有状态一次，禁止改业务、造数据或重复66次CRUD。
- 可判定条件：680宽分类字段选择窗，搜索32、字段行54；真实单选/部门/日期类型，不造演练字段。
- 已读依据：[09-type-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/09-type-picker.png>)；[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)

### Q04 · 653:31852 工作台配置 · 选择统计字段

原ID：653:31852。

- 已审实际/原因：已读原图并核对85/86结果；现有命名type-picker等图片实际是配置页，未显示本状态，不能据文件名判通过或认定代码缺失。
- 有限动作与保护：只读取既有相应界面结果；确无可读结果时由执行打开此现有状态一次，禁止改业务、造数据或重复66次CRUD。
- 可判定条件：680宽统计字段窗，真实数值/计数字段与统计方式，搜索32、行54。
- 已读依据：[09-type-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/09-type-picker.png>)；[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)

### Q05 · 653:31853 工作台配置 · 排序字段

原ID：653:31853。

- 已审实际/原因：已读原图并核对85/86结果；现有命名type-picker等图片实际是配置页，未显示本状态，不能据文件名判通过或认定代码缺失。
- 有限动作与保护：只读取既有相应界面结果；确无可读结果时由执行打开此现有状态一次，禁止改业务、造数据或重复66次CRUD。
- 可判定条件：680宽排序字段窗，真实字段与选中，搜索32、行54；不改变既有排序偏好。
- 已读依据：[09-type-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/09-type-picker.png>)；[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)

### Q06 · 657:33458 工作台配置 · 选择图表类型

原ID：657:33458。

- 已审实际/原因：已读原图并核对85/86结果；现有命名type-picker等图片实际是配置页，未显示本状态，不能据文件名判通过或认定代码缺失。
- 有限动作与保护：只读取既有相应界面结果；确无可读结果时由执行打开此现有状态一次，禁止改业务、造数据或重复66次CRUD。
- 可判定条件：1072宽图表选择窗，12图型4列×3行；图型功能85/86沿用，只核选择界面。
- 已读依据：[09-type-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/09-type-picker.png>)；[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)

### Q07 · 675:37049 工作台图表 · 配色方案

原ID：675:37049。

- 已审实际/原因：已读原图并核对85/86结果；现有命名type-picker等图片实际是配置页，未显示本状态，不能据文件名判通过或认定代码缺失。
- 有限动作与保护：只读取既有相应界面结果；确无可读结果时由执行打开此现有状态一次，禁止改业务、造数据或重复66次CRUD。
- 可判定条件：760宽配色方案弹层，四方案行与已有色块，真实当前选中；不是自定义颜色窗。
- 已读依据：[09-type-picker.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/charts/09-type-picker.png>)；[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)

### Q08 · 645:28555 工作台配置 · 调整高度 / 645:28593 工作台配置 · 调整顺序 / 645:28631 工作台配置 · 添加组件 / 645:28669 工作台配置 · 预览 / 645:28703 工作台配置 · 已保存 / 645:28738 工作台配置 · 自动滚动 / 654:35834 工作台配置 · 列头已设置 / 654:36173 工作台配置 · 升序列表 / 654:36512 工作台配置 · 列表第2页 / 654:36851 工作台配置 · 移除指标卡

原ID：645:28555、645:28593、645:28631、645:28669、645:28703、645:28738、654:35834、654:36173、654:36512、654:36851。

- 已审实际/原因：85/86与配置覆盖回执已证相关操作/持久化；原图是特定选中、预览、顺序、分页或列表控制状态，当前常规配置页不能代替本状态。
- 有限动作与保护：仅核该原状态既有结果；受W19-I共同修复影响只读复核布局，禁止再次保存/重置整套个人工作台。
- 可判定条件：按本原状态核卡片边框/当前选中/条数或页码、右栏分支；真实组件数量与数据自然排布，预览无左右编辑栏、保存回读不要求演示布局。
- 已读依据：[u020-workspace-config-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-workspace-config-coverage.md>)；[a03-chart-complete-85.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-chart-complete-85.md>)

### Q09 · 流程通知

原ID：50:88。

- 已审实际/原因：当前设置消费者含通知对象/渠道/其他人，26/29/35已保存并真实投递；现有截图未呈本通知配置面。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：既有设置页通知分支，左导航200、内容从x244、通知卡1156宽；真实对象/渠道，禁重发通知。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q10 · 变量与触发器

原ID：273:1051、273:1095。

- 已审实际/原因：变量与触发器持久化已过；快照变量空态不是可编辑变量窗口。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：变量960宽、触发器1120宽；32输入/34表头；只打开实际现有变量/触发器状态，不重跑发布链。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q11 · 意见表单与动态并行

原ID：273:1257、273:1332。

- 已审实际/原因：意见表单和动态并行已有业务结果；指定人选择窗不能代替本表单/取值策略状态。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：意见选择960宽、搜索/32列表；并行820宽、真实集合/对象类型/主表或表格/字段；不保存覆盖原定义。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q12 · 节点操作与子流程三步

原ID：278:1567、278:1634、278:1669、278:1719。

- 已审实际/原因：节点操作和子流程53已证；旧实现事实可证明配置可用，缺匹配的当前四个配置窗口结果。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：操作820宽；子流程1000宽三步目标/映射/等待回写，32输入、34表头；只打开已有配置，映射真实字段，不重复创建子流程。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q13 · 节点高级分支

原ID：352:8058、549:24857、549:25265、549:25673。

- 已审实际/原因：高级配置27/84已证；常规基础属性页不能代替高级分支；主题更换不改变配置语义。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：336右栏高级分支：退回目标、节点操作、开始/结束脚本、子流程/并行与意见表单按已有类型；只核各实际分支，不新建起草/IoT/Agent执行引擎。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q14 · 流程级事件监听与时机

原ID：380:7782、380:7785、380:7786、383:8440、549:26135、549:26167、558:26524、558:26556、558:26591、558:26626、558:26658、558:26693。

- 已审实际/原因：33/41已证新增/编辑/启停/排序/保存；旧event-listener截图是早期设计器内联窗口，不是当前设置页。不能据旧图判断新页面失败。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：设置页监听列表、760宽新增/编辑窗口及32高时机下拉；发起/结束两个真实事件，同组件展开菜单保留选中和32项高，不重复CRUD。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q15 · 编号六种原状态

原ID：273:1368、405:8967、405:8968、405:8969、405:8970、405:8971。

- 已审实际/原因：23/24/29编号业务已过；早期截图仅未配置空态，不能代替六种已有规则编辑状态或据其紫色重开当前蓝色主题。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：720宽编号窗口；日期/流水/常量/时间/发起人/自定义共用32按钮、预览条、要素条和32字段；六个已存要素逐一适用，禁造演示编号或重测连续号。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q16 · 表单组件审批人四主题

原ID：572:26308、572:26728、572:27148、572:27568。

- 已审实际/原因：09回执证FORM_FIELD策略，但所指部分文件实为表单设计器；不能用FIXED_USER或表单编辑页代替本分支。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：读取真实FORM_FIELD对象类型/主表或表格/已选字段；336面板来源分段32，真实字段标签；四主题只读切换，禁保存改审批来源。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q17 · 选择表单组件四主题

原ID：574:27788、574:28035、574:28276、574:28517。

- 已审实际/原因：原680宽表单组件选择窗独立于980人员窗；缺当前此窗展开结果，业务候选来源已有核实。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：680宽、32搜索、实际主表/明细字段分组与44选中行、72×32底栏；四主题同组件，只在既有有权字段中读，取消退出。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q18 · 校验与发布结果

原ID：272:1814、273:2049。

- 已审实际/原因：09真实合法拓扑校验返回0错误；83等真实发布成功已证。结果参考为轻提示层，不是新的业务功能或完整设计器。
- 有限动作与保护：只核原状态当前已有结果；没有现成匹配结果时只打开该配置/反馈的既有消费者，未见结果不判代码失败；保留D08-B/F共同修改依赖。
- 可判定条件：仅复核已有校验成功/发布成功可见反馈是否沿统一32/48提示样式；不要求重新发布或构造错误拓扑。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q19 · 410:9349 发布快照 · v3.1

原ID：410:9349。

- 已审实际/原因：v3.1与272:1518共用查看器，当前示例v2不等于设计样例v3.1；共享壳层已过。23的字段数据区修复完成后只需确认另一现存版本同组件和被冻结值。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：同viewer另一现存历史版本只读；版本号真实，不造v3.1；框架和23公共修复直接继承，版本数据不串。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q20 · 509:18677 快照 · 节点开始前脚本

原ID：509:18677。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1200宽只读JS窗，节点开始前脚本冻结全文、行号、只读标识、仅关闭。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q21 · 509:18714 快照 · 监听器脚本

原ID：509:18714。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1200宽只读JS窗，冻结监听器脚本与事件来源，不能由可运行编辑器代替。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q22 · 509:18825 快照 · 校验规则

原ID：509:18825。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：800宽只读校验规则窗；真实规则标签与32只读值，当前必填true可用。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q23 · 509:18864 快照 · 显示条件

原ID：509:18864。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：800宽显示条件窗；真实未配置可接受，独立查看外壳仍需对应。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q24 · 509:18903 快照 · 明细列配置

原ID：509:18903。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1100宽只读明细列配置表；真实列与宽度/必填，不用字段清单冒充。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q25 · 509:19020 快照 · 节点字段权限

原ID：509:19020。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1100宽节点字段权限表；真实权限布尔，行数随冻结字段，不要求演示十行。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q26 · 509:19229 快照 · 节点操作与高级配置

原ID：509:19229。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1000宽只读节点操作/高级配置，真实操作与退回/并行/子流程，查看脚本只读。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q27 · 509:19335 快照 · 流程变量

原ID：509:19335。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1000宽冻结变量表；真实无变量可空态，不要求样例两行。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q28 · 509:19394 快照 · 流程触发器

原ID：509:19394。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1100宽触发器表与只读子流程/内容，真实9项自然滚动。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q29 · 518:24135 快照 · 审批人脚本

原ID：518:24135。

- 已审实际/原因：本冻结子视图/查看弹窗已审；42/43/46证只读查看与冻结，08可见非空脚本12/规则1/触发器9，但当前文件是分区列表，未展示这个独立查看态。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：1200宽只读审批人脚本窗，冻结脚本与节点绑定，禁止运行/应用。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q30 · 501:19522 View=Form_text / 501:19847 View=Form_type / 501:20232 View=Form_place / 501:20595 View=Form_date / 501:20958 View=Form_dept / 501:21321 View=Form_note / 501:21684 View=Form_rich / 501:22036 View=Form_table / 501:22382 View=Form_upload

原ID：501:19522、501:19847、501:20232、501:20595、501:20958、501:21321、501:21684、501:22036、501:22382。

- 已审实际/原因：原生冻结表单选中变体已审。A11真实只有name/note两个TEXT字段；当前证据不能证明本对象的文字/下拉/日期/部门/富文本/子表/附件专属属性。通用三栏与前五属性框已过，23在修数据与规则三框。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：23完成后只核此控件类型的已存在冻结字段选中态：通用296×32框继承，专属选项/日期格式/明细列/文件限制取真实配置；样例控件不存在时不造字段或写冻结版。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q31 · 502:21983 View=Flow_draft / 502:22267 View=Flow_dept / 502:22588 View=Flow_basic / 502:22894 View=Flow_plan / 502:23215 View=Flow_resource / 502:23536 View=Flow_risk / 502:23857 View=Flow_compliance / 502:24178 View=Flow_hq / 502:24499 View=Flow_end / 502:24767 View=Flow_fork / 502:25049 View=Flow_join

原ID：502:21983、502:22267、502:22588、502:22894、502:23215、502:23536、502:23857、502:24178、502:24499、502:24767、502:25049。

- 已审实际/原因：原生冻结流程选中变体已审。A16当前START/主管审批/END三个真实节点；起草/其他部门/分叉汇合不在此冻结图，不可用节点名称相似伪造同态。23只修通用五框。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：23完成后普通审批/END可核现有对应类型，通用五框继承；审批源/意见/字段权限等专属元数据只读；分叉/汇合使用09已存在合法最小拓扑的真实已发布版本，未冻结不重发。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q32 · 505:23827 View=Number

原ID：505:23827。

- 已审实际/原因：编号快照页独立于可编辑编号窗；当前完整快照已有编号tab但现有图未展开其真实冻结规则。
- 有限动作与保护：仅读取对应已有冻结类型/配置/查看状态；禁止修改快照、另建26种演示数据、重演保存发布或把编辑器结果当冻结结果。
- 可判定条件：只打开已有冻结编号tab：预览、要素条、32只读值、真实规则；缺规则显示未配置，禁补DRILL或重新发布。
- 已读依据：[snapshot-script-dialogs-43.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/snapshot-script-dialogs-43.md>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-14-g14-process.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-process.png>)；[u020-14-g14-design.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g14-design.png>)

### Q33 · 应用排列浮层五个选中状态

原ID：272:1614、282:1699、282:1729、282:1759、282:1789。

- 已审实际/原因：真实浮层显示3/4/5/6/8，当前图6选中，偏好行为04已过；原图五态只差选中。当前打开图边框/锚点尚缺精确当前盒测量，不把它列为五个代码缺陷。
- 有限动作与保护：只核共享排列浮层外盒350×102、五个48×32按钮和锚在实际触发按钮下；四列截图与04偏好结果继承，禁止新造应用。
- 可判定条件：同一浮层3/4/5/8各选择状态可复用同组件/仅active值证明；不需四次保存发布，几何±1、RGB≤3。
- 已读依据：[u020-08-sa-app-center-columns.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-center-columns.png>)；[u020-app-grid-appearance-04.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-app-grid-appearance-04.md>)

### Q34 · 新建/设置目录

原ID：272:1698、272:1722。

- 已审实际/原因：已有真实应用/目录/表单及已过下钻；现有树/菜单结果未显示本特定弹窗或普通表单数据完整布局，不据此判代码缺失。
- 有限动作与保护：仅核该现有状态的当前结果；消费者已明确admin@0/A03验收应用，旧403条件失效，禁止重复找身份、CRUD。
- 可判定条件：540宽、目录名称与上级目录32输入、80×32底栏；真实树与上级，取消退出。
- 已读依据：[u020-08-sa-app-ws-tree.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-ws-tree.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q35 · 表单重命名/新建表单

原ID：527:24177、527:24216。

- 已审实际/原因：已有真实应用/目录/表单及已过下钻；现有树/菜单结果未显示本特定弹窗或普通表单数据完整布局，不据此判代码缺失。
- 有限动作与保护：仅核该现有状态的当前结果；消费者已明确admin@0/A03验收应用，旧403条件失效，禁止重复找身份、CRUD。
- 可判定条件：440宽、名称390×32、80×32底栏；仅打开真实表单/已有新建入口并取消，不创建或改名。
- 已读依据：[u020-08-sa-app-ws-tree.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-ws-tree.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q36 · 应用新建菜单

原ID：273:1773。

- 已审实际/原因：已有真实应用/目录/表单及已过下钻；现有树/菜单结果未显示本特定弹窗或普通表单数据完整布局，不据此判代码缺失。
- 有限动作与保护：仅核该现有状态的当前结果；消费者已明确admin@0/A03验收应用，旧403条件失效，禁止重复找身份、CRUD。
- 可判定条件：192宽、两个36高菜单项与图标、锚定已有底部新建按钮；禁触发创建。
- 已读依据：[u020-08-sa-app-ws-tree.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-ws-tree.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q37 · 应用表单数据页

原ID：272:1144。

- 已审实际/原因：已有真实应用/目录/表单及已过下钻；现有树/菜单结果未显示本特定弹窗或普通表单数据完整布局，不据此判代码缺失。
- 有限动作与保护：仅核该现有状态的当前结果；消费者已明确admin@0/A03验收应用，旧403条件失效，禁止重复找身份、CRUD。
- 可判定条件：展开236侧栏、筛选x256/y84/h64、数据表y164；真实字段与空数据可接受，不造三行；18收起框架继承。
- 已读依据：[u020-08-sa-app-ws-tree.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-ws-tree.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q38 · 应用卡操作菜单及第2至12卡定位

原ID：273:1753、471:17292、471:17306、471:17320、471:17334、471:17348、471:17362、471:17376、471:17390、471:17404、471:17418、471:17432。

- 已审实际/原因：12参考均为同两项菜单在不同卡位置。现有应用1张非空卡与编辑可达已证，目录/表单三项菜单并非本两项菜单；缺当前应用菜单本体展开结果。
- 有限动作与保护：只打开现有A03应用卡菜单一次，核同组件按触发卡锚定；不造12卡、不删除应用、不把目录菜单代替应用菜单。
- 可判定条件：菜单152宽、编辑应用/删除应用两项36高、危险C2303A、原图标；贴触发卡并按视口翻转；位置变体由同一定位消费者与列数结果承接。
- 已读依据：[u020-08-sa-app-manage.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-manage.png>)；[u020-app-grid-appearance-04.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-app-grid-appearance-04.md>)

### Q39 · 删除应用确认

原ID：471:17256。

- 已审实际/原因：现有新建编辑及Mock删除闭环04已证；实际PG证据没有展开删除应用确认，目录/表单确认不能代替这个消费者。
- 有限动作与保护：只打开已有应用删除确认并取消，不实际删除。
- 可判定条件：440×172/r12、真实应用名、80×32取消/删除、危险C2303A；应用id正确。
- 已读依据：[u020-app-grid-appearance-04.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-app-grid-appearance-04.md>)；[u020-08-sa-app-manage.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-manage.png>)

### Q40 · 超管应用管理租户筛选

原ID：459:15041。

- 已审实际/原因：超管实际列表已可达，但当前图只有名称/排列/新建，原图还含租户筛选与卡片租户名。不能用普通卡片证明租户筛选。
- 有限动作与保护：只核当前超管消费者实际租户选择能力及已有数据字段；不改租户权限或新建应用。
- 可判定条件：合法已有租户过滤可见；真实卡片租户名与原固定过滤表面对应；没有筛选能力须明确原消费者缺失位置后按原断言修，不能拿403重复探测。
- 已读依据：[u020-08-sa-app-manage.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-app-manage.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q41 · 超管用户租户筛选三态

原ID：460:14460、460:14689、460:14918。

- 已审实际/原因：当前超管35真实用户/租户列有效，原CH科技/深圳只是样例值。原两种已筛选列表和展开租户选单尚无匹配现有结果；实际全部租户输入可见但未展开。
- 有限动作与保护：沿Y-S共享表面修复，只核现有一个合法租户过滤/展开选单；禁止为原样例新建租户、改角色或跨租户授权。
- 可判定条件：真实租户选择后仅其用户、租户列正确；下拉锚随输入，32项高；不同真实租户名/人数不判差；两样例引用同过滤消费者。
- 已读依据：[u020-08-sa-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-user.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q42 · 部门/菜单收起表格

原ID：447:12034、447:12274。

- 已审实际/原因：当前部门有真实租户根/根部门，菜单有六个根和真实子项；展开表不证明点击收起后的层级。原单根是演示数据，不要求删成一行。
- 有限动作与保护：Y-S样式共用；仅核现有收起控制后的真实根行与再次展开，不保存排序/菜单或造子节点。
- 可判定条件：收起隐藏子层，保留全部真实根；原236侧栏与独立树折叠区分，表头208/44沿Y-S。
- 已读依据：[u020-13-g25-dept.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g25-dept.png>)；[u020-08-sa-menu.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-sa-menu.png>)

### Q43 · 新增用户

原ID：447:12885。

- 已审实际/原因：新增原图已审；12/13/14同类编辑窗口已修并通过，当前所给图是编辑有值状态，尚未展示本新增空值/默认/必填分支。
- 有限动作与保护：继承已过同编辑窗公共尺寸/边框/排版，只读打开现有新增窗核初值后取消；不创建对象、不重跑组织/权限CRUD。
- 可判定条件：760宽，账号/姓名/邮箱/手机/性别/状态/部门/岗位/密码/角色按真实能力；32字段、两列、80底栏，额外租户栏保留。
- 已读依据：[u020-named-detail-rework-14.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-14.md>)；[u020-13-g24-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g24-user.png>)；[u020-13-g30-user-group.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g30-user-group.png>)

### Q44 · 新增部门

原ID：447:13087。

- 已审实际/原因：新增原图已审；12/13/14同类编辑窗口已修并通过，当前所给图是编辑有值状态，尚未展示本新增空值/默认/必填分支。
- 有限动作与保护：继承已过同编辑窗公共尺寸/边框/排版，只读打开现有新增窗核初值后取消；不创建对象、不重跑组织/权限CRUD。
- 可判定条件：760宽、上级/名称/编码/排序/状态/负责人32两列；租户归属真实。
- 已读依据：[u020-named-detail-rework-14.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-14.md>)；[u020-13-g24-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g24-user.png>)；[u020-13-g30-user-group.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g30-user-group.png>)

### Q45 · 新增角色

原ID：447:13219。

- 已审实际/原因：新增原图已审；12/13/14同类编辑窗口已修并通过，当前所给图是编辑有值状态，尚未展示本新增空值/默认/必填分支。
- 有限动作与保护：继承已过同编辑窗公共尺寸/边框/排版，只读打开现有新增窗核初值后取消；不创建对象、不重跑组织/权限CRUD。
- 可判定条件：1000×596左右390/536布局、18树勾选、88×32展开/收起与32字段；新建角色编码可编辑，与编辑禁改编码区分。
- 已读依据：[u020-named-detail-rework-14.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-14.md>)；[u020-13-g24-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g24-user.png>)；[u020-13-g30-user-group.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g30-user-group.png>)

### Q46 · 新增字典类型

原ID：447:13355。

- 已审实际/原因：新增原图已审；12/13/14同类编辑窗口已修并通过，当前所给图是编辑有值状态，尚未展示本新增空值/默认/必填分支。
- 有限动作与保护：继承已过同编辑窗公共尺寸/边框/排版，只读打开现有新增窗核初值后取消；不创建对象、不重跑组织/权限CRUD。
- 可判定条件：760宽名称/编码32两列、状态32；已有备注额外字段保留；与字典项区分。
- 已读依据：[u020-named-detail-rework-14.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-14.md>)；[u020-13-g24-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g24-user.png>)；[u020-13-g30-user-group.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g30-user-group.png>)

### Q47 · 新增岗位

原ID：447:13435。

- 已审实际/原因：新增原图已审；12/13/14同类编辑窗口已修并通过，当前所给图是编辑有值状态，尚未展示本新增空值/默认/必填分支。
- 有限动作与保护：继承已过同编辑窗公共尺寸/边框/排版，只读打开现有新增窗核初值后取消；不创建对象、不重跑组织/权限CRUD。
- 可判定条件：760宽名称/编码/排序/状态32两列，80底栏；已有备注保留。
- 已读依据：[u020-named-detail-rework-14.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-14.md>)；[u020-13-g24-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g24-user.png>)；[u020-13-g30-user-group.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g30-user-group.png>)

### Q48 · 新增用户组

原ID：447:13529。

- 已审实际/原因：新增原图已审；12/13/14同类编辑窗口已修并通过，当前所给图是编辑有值状态，尚未展示本新增空值/默认/必填分支。
- 有限动作与保护：继承已过同编辑窗公共尺寸/边框/排版，只读打开现有新增窗核初值后取消；不创建对象、不重跑组织/权限CRUD。
- 可判定条件：760宽名称/业务标识/状态32，已有成员/备注保留自然高度，空组合法。
- 已读依据：[u020-named-detail-rework-14.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-14.md>)；[u020-13-g24-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g24-user.png>)；[u020-13-g30-user-group.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g30-user-group.png>)

### Q49 · 新增字典项

原ID：447:13609。

- 已审实际/原因：新增原图已审；12/13/14同类编辑窗口已修并通过，当前所给图是编辑有值状态，尚未展示本新增空值/默认/必填分支。
- 有限动作与保护：继承已过同编辑窗公共尺寸/边框/排版，只读打开现有新增窗核初值后取消；不创建对象、不重跑组织/权限CRUD。
- 可判定条件：760宽字典/标签/键值/排序/状态/默认32，已有CSS/备注保留，自然高度不硬压演示364。
- 已读依据：[u020-named-detail-rework-14.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-14.md>)；[u020-13-g24-user.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g24-user.png>)；[u020-13-g30-user-group.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g30-user-group.png>)

### Q50 · 角色成员窗口

原ID：446:16226。

- 已审实际/原因：角色权限树82/84不是角色成员管理；当前角色列表成员入口可见，未有本成员窗的匹配实际输出。
- 有限动作与保护：只开既有合法角色成员窗口并取消，不增删成员、不碰内置超管保护。
- 可判定条件：860宽、人员选择+添加按钮、34表头/53真实成员行、80×32保存/取消；真实成员与待提交状态清楚。
- 已读依据：[u020-14-g26.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g26.png>)；[a03-fieldlist-permtree-script-82.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-fieldlist-permtree-script-82.md>)

### Q51 · 主题自定义展开面板

原ID：355:6575。

- 已审实际/原因：普通面板与58有效/无效颜色行为已证；原图自定义是同窗内430×176渐变/色相/HEX展开，当前普通HEX修改区不能证明此展开形态。
- 有限动作与保护：仅核现有自定义颜色展开消费者；不重跑保存/刷新/低对比拒绝，禁新增预设。
- 可判定条件：560宽自定义展开窗，430宽渐变与色相、32HEX、预览及80底栏；真实HEX，自定义生效/取消继承58。
- 已读依据：[u020-08-g21-theme.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g21-theme.png>)；[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)

### Q52 · 文字蓝色/字号下拉/颜色浮层

原ID：490:16867、490:16919、490:16934。

- 已审实际/原因：13文字面板已修，08颜色图是原生大色板，不能拿富文本495颜色浮层通过结果冒充文字颜色。字号原图为140×228六项菜单，本菜单尚未展开。
- 有限动作与保护：仅核文字专属字号下拉、颜色浮层与选择蓝色后的真实画布；不得改富文本/应用颜色组件或保存表单。
- 可判定条件：字号140宽六项14/16/18/20/24/28且32项高；文字颜色430×286水平色相/预设/HEX，保留真实选值；蓝色选中14/22标签与画布色对应。
- 已读依据：[u020-08-g36-color-open.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g36-color-open.png>)；[u020-13-g36.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-13-g36.png>)

### Q53 · 子表字段权限清单

原ID：273:1463。

- 已审实际/原因：原图是1120宽字段名/必填/可编辑/显示的受控勾选清单；当前1120宽子表编辑器是名称/组件/必填/操作，字段清单页另有8列。三种消费者不能互代；覆盖回执明确权限/默认列表分开承接。
- 有限动作与保护：只核现有子表权限/默认列表清单真实入口与当前输出；不改已过273:1396子表编辑器，不新增字段或重新保存。
- 可判定条件：1120宽清单、34头/48行、18勾选，真实子表列与已存权限，三种勾选含义与原一致；不存在独立消费者先回明确当前承接路径。
- 已读依据：[u020-design-coverage.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-design-coverage.md>)；[u020-14-g17.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-14-g17.png>)；[f020-subfield-field-list-blue-1920.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/theme-blue/screens/f020-subfield-field-list-blue-1920.png>)

### Q54 · JS审批来源四主题面板

原ID：572:26514、572:26934、572:27354、572:27774。

- 已审实际/原因：四原图是336右栏内JS审批来源选中，非脚本大窗。41/84已证脚本保存与适配器；当前FIXED_USER/普通字段面板不能证明JS选中回显。
- 有限动作与保护：随D08-B基础面板同一修复消费；只核已有脚本来源/代码摘要/预览结果与开始结束脚本入口，不新增脚本引擎或修改定义。
- 可判定条件：JS来源分段active、摘要与已选真实审批脚本、288×32控件；四主题同结构只颜色不同；打开脚本沿J22-D，不用字段脚本代替。
- 已读依据：[a03-negative-node-script-chart-84.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-negative-node-script-chart-84.md>)；[u020-08-g08-node.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g08-node.png>)

### Q55 · 离开/发布确认与脏状态

原ID：272:1575、272:1594、280:1863。

- 已审实际/原因：已有未保存状态实际出现，保存/发布结果锁定；未提供匹配的离开确认和发布确认现态，不能用保存成功提示代替。
- 有限动作与保护：只核现有脏状态与两确认窗并取消；不再次发布或丢弃已有修改。
- 可判定条件：离开600宽/保存修改标题与取消/不保存/保存80按钮；发布580宽、说明与取消/发布80按钮；脏状态在原112工具栏、不遮保存/发布。
- 已读依据：[18-publish-new-version.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/multiline/18-publish-new-version.png>)；[u020-08-g07-designer-current.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g07-designer-current.png>)

### Q56 · 内嵌流程未配置/创建流程

原ID：472:15663、472:15867。

- 已审实际/原因：09已取得内嵌流程列表与独立设计器；部分g08-form-field命名图实为表单设计器。未配置空态与点击创建后的内嵌最小图未在匹配结果中展示。
- 有限动作与保护：只核既有未配置表单的内嵌分支/创建入口承接事实；不为视觉另建流程、不改已过独立设计器220/336壳层。
- 可判定条件：内嵌入口保留表单顶部字段/表单/流程页签；空态原“尚未配置流程/创建流程”；创建承接现有最小流程与正常导航，真实定义已有则对应现态而不抹除。
- 已读依据：[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-09-g08-form-workspace-process-list.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-09-g08-form-workspace-process-list.png>)

### Q57 · 272:1746 48 驳回申请

原ID：272:1746。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：560宽驳回确认、驳回原因510×32与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q58 · 272:1767 49 同意申请

原ID：272:1767。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：560宽同意确认、80取消/确定；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q59 · 273:1877 74 转办

原ID：273:1877。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：640宽转办，人员590×32、备注与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q60 · 273:1901 75 委托

原ID：273:1901。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：640宽委托，人员/备注与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q61 · 273:1925 76 沟通

原ID：273:1925。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：640宽沟通，对象/内容与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q62 · 273:1949 77 加签

原ID：273:1949。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：640宽加签，人员/备注/方式32与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q63 · 273:1977 78 补签

原ID：273:1977。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：640宽补签，人员/备注与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q64 · 273:2001 79 退回申请

原ID：273:2001。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：640宽退回申请，现有可退回目标/备注32与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q65 · 273:2025 80 催办

原ID：273:2025。

- 已审实际/原因：38/52/53与A14/A15已有办理、意见、会签业务结果；当前审批页面/更多菜单未显示本独立操作窗口。
- 有限动作与保护：只在已有可办理任务打开该原窗口并取消；不实际转办/委托/加补签/退回/催办/同意/驳回，不重演任务链。
- 可判定条件：640宽催办，对象/备注32与80底栏；真实可选人/节点依权限；不存在合法可办理任务则回具体任务条件，不伪造按钮。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q66 · 意见详情三原记录/会签列表

原ID：60:48、60:413、60:592、60:190。

- 已审实际/原因：原意见详情为760宽冻结意见表单、会签为1000宽成员表。38/52/53证明真实人员/意见/附件可用，08任务页未点开这些独立详情。
- 有限动作与保护：只读现存审批历史中的意见/会签明细；三个人名仅数据变体，不能要求造陈曦/李宁记录。
- 可判定条件：意见760宽、32只读单行/80意见、检查项与真实附件；会签1000宽/34表头/53行、状态汇总及查看；同意见组件可共用，非空真实记录不可由空历史代替。
- 已读依据：[task-detail-approver-gaps-38.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/task-detail-approver-gaps-38.md>)；[cross-repo-completion-48-52.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/cross-repo-completion-48-52.md>)；[real-consumption-53.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/real-consumption-53.md>)

### Q67 · 数据详情流程图/审批明细/校验态

原ID：90:68、90:311、300:1808。

- 已审实际/原因：08任务图当前是流转空态，09/10普通只读详情只证控件高度；原对象是详情里的流程图、非空审批明细和审批校验。不同消费者不能互代。
- 有限动作与保护：只读已有有历史记录，分别打开流程图与明细；校验只观察既有本地必填提示，不提交审批；控件10已过不重做。
- 可判定条件：1440详情正文、原页签分组；流程图使用真实执行图和状态，审批明细34表头/53行/真实意见查看；本地校验定位当前必填，不造演示历史。
- 已读依据：[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)；[u020-10-g03-readonly-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-10-g03-readonly-detail.png>)；[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)

### Q68 · 审批更多菜单

原ID：299:1725。

- 已审实际/原因：已有更多动作可达，早期1920图是90宽原生菜单，当前08图未展开；原菜单192宽六项及图标。旧图过早不能当当前缺陷结论。
- 有限动作与保护：只打开当前已有更多菜单；不实际执行业务动作，不要求无权/不适用动作出现。
- 可判定条件：192宽，适用项36高/38步长、原图标，真实转办/委托/沟通/加签/补签/催办能力按权限，底部不越界。
- 已读依据：[w020-approval-more-actions-1920.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/e2e/screens/w020-approval-more-actions-1920.png>)；[u020-08-g03-task-detail.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g03-task-detail.png>)

### Q69 · 超管流程定义列表

原ID：459:14712。

- 已审实际/原因：原超管态还含租户过滤与租户列。当前普通定义列表真实数据已看，超管应用/租户列表均非这个流程定义消费者；旧普通通过不替代。
- 有限动作与保护：仅核已有超管流程定义列表的租户条件及结果；普通6:2只修4px筛选边距，禁止重做已过45行/真字段。
- 可判定条件：真实租户过滤/列、x256主区、y84/h64筛选、y164/44表头、45行；示例3条不强制，额外编号/操作合法。
- 已读依据：[u020-full-visual-sweep.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-full-visual-sweep.md>)；[u020-08-g04-defs.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g04-defs.png>)

### Q70 · 登录页原文字判定收口

原ID：32:2。

- 已审实际/原因：已逐读b09六个失败和四个不足：六失败的family/weight/size/line-height均ok，DOM框已同原，失败主要来自墨迹底边/高度2px；墨迹底边不能冒充排版基线。英语行缺独立基线、两长句定位失败、登录按钮normal行高未核。87弧线纹理结果锁定。
- 有限动作与保护：保留原allowed_actions的只读文字核定；不改已过42/60主标题、背景、卡片或字体数值来追墨迹边，不重跑登录。
- 可判定条件：6项只按原§7.1 DOM框/独立基线裁决，原6个名称已固定；英语SMART WORKFLOW PLATFORM、说明长句、协议长句、登录按钮4项仅补现有几何/独立基线事实，不能把insufficient当fail或把inkbottom当baseline。
- 已读依据：[a03-s7d-32-2-report.json](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/a03-s7d-32-2-report.json>)；[u020-08-verify.json](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-verify.json>)；[visual-acceptance-020.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/ready/visual-acceptance-020.md>)

### Q71 · 流程中心原文字判定收口

原ID：97:2。

- 已审实际/原因：已逐读44失败/12不足：IT/财务交换、表格文本误配侧栏或常用行、全部+96及其后累计移位均受真实排序/5行密度影响，不是相应位置缺陷；ref白字/gray错误采样也不能直接修色。真实CSS差另有明确数值，头像块修复继续继承。
- 有限动作与保护：原允许动作只保留文字核定和已授权头像几何；不因错误配对移动真实数据、删成3行或改用户显示名。S20-F只修同原消费者已核实字体属性，父失败史1继续保留。
- 可判定条件：按消费者/真实行序配对而非字符串跨区匹配；常用最近5行多96像素自然下推；真实CSS差与配对不足分开，不能用整卡遮罩或声称全页99%。
- 已读依据：[a03-s7d-97-2-report.json](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/a03-s7d-97-2-report.json>)；[u020-08-verify.json](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-verify.json>)；[visual-acceptance-020.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/ready/visual-acceptance-020.md>)

### Q72 · 流程中心多数据两页

原ID：445:13402、445:13732。

- 已审实际/原因：当前8真实项、默认10/页只有1页；原128项/第二页是演示密度。分页默认子断言已过，不能造120项为截图。共享字体待S20-F。
- 有限动作与保护：仅继承原分页组件和S20-F结果；现存数据不足第二页时明确该比较条件不适用，无创建/删除/重排数据。
- 可判定条件：第1页真实8项/总量8/默认10，不可点下一页合理；多页几何可按已有同Pager与真实10/页结果继承，不要求当前不存在第2页；字体受影响局部复核。
- 已读依据：[u020-visual-followup-09.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-visual-followup-09.md>)；[u020-08-g20-catalog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g20-catalog.png>)

### Q73 · 流程中心分类收起与完整名数量提示

原ID：726:45273、726:45573。

- 已审实际/原因：56旧图为重构前卡片流与内嵌侧栏，87后已经表格化，不用旧图重开。当前完整页只显示展开侧栏，尚缺新表格版64收起/分类提示结果。
- 有限动作与保护：只核当前流程中心收起与一个已有分类hover/键盘提示；既有64轨道/20提示机制继承，禁止重采所有分类或动分类数量。
- 可判定条件：收起64、主区x84/y84，原流程分类菜单与真实名/计数完整提示；提示随真实触发行定位而不硬套样例y；展开恢复236。
- 已读依据：[formal-56-category-collapsed-1920.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/formal-56-category-collapsed-1920.png>)；[u020-08-g20-catalog.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g20-catalog.png>)；[u020-rework-acceptance-87.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-rework-acceptance-87.md>)

### Q74 · 填写校验/提交结果

原ID：272:1784、300:1692。

- 已审实际/原因：88和21正确process填写框架/日期铺满已过；实际提交链与A10校验已过。当前完整填写图没有本必填报错或提交结果弹窗，不能用空输入页代替。
- 有限动作与保护：只核已有提交结果/校验反馈证据；本地空值校验不发送提交请求；不再次写记录、重演提交幂等或改已过日期/富文本/底栏。
- 可判定条件：必填红边+就近提示，不遮底栏；提交结果520宽/172高说明与80×32查看（按真实去向），实际单号不配样例；缺现成结果时只报告该反馈状态条件。
- 已读依据：[u020-named-detail-rework-21.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-21.md>)；[u020-09-g15-fill-correct-entry.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-09-g15-fill-correct-entry.png>)

### Q75 · 保存草稿反馈

原ID：272:1799。

- 已审实际/原因：草稿保存/未知恢复A11已有输出，18/20草稿列表已过；本参考是保存成功轻提示，不是草稿列表。现有证据未给本轻提示几何。
- 有限动作与保护：只读取既有保存反馈消费者和当前统一提示表面；不重新保存草稿或重演未知恢复。
- 可判定条件：保存草稿成功用现有轻反馈、14/22文字与统一成功表面；仅本状态不足，不追补整条业务链。
- 已读依据：[a03-logical-type-multiline-81.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/a03-logical-type-multiline-81.md>)；[04-draft-saved.png](<E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/families-78/controls/04-draft-saved.png>)

### Q76 · 应用数据查询受限真实身份条件

原ID：273:1642。

- 已审实际/原因：18/20已核现有data-forbidden消费者；租户9001/9002无应用/表单且无权，t100serial无角色，nobody已获query，管理员全权。当前确无合法有应用填写权但无查询权的已有身份，普通403不是原表面。
- 有限动作与保护：条件已具体化，停止重复身份探测；不改授权、不创建探针应用、不发query试探、不用无应用403充当受限UI。
- 可判定条件：仅当已有合法可达身份/应用满足“可填写且不可查询”时，读受限标题/说明和已有填写入口；A09隔离/拒绝结果锁定；不伪标当前像素通过。
- 已读依据：[unified-020-state-facts-18.md](<E:/code/Smart-WorkFlow-Agent-Workspace/search_fallback/unified-020-state-facts-18.md>)；[u020-named-detail-rework-20.md](<E:/code/Smart-WorkFlow-Agent-Workspace/product/0.2.0/receipts/u020-named-detail-rework-20.md>)

## 305项逐项状态对照

“待共用修复复核”已完成审查，仅依赖同节主修结果，原failed_rounds不加；“已审，待匹配实际状态”对应上节的具名核实，不是“未读”。全部305原ID只出现一次于本表。

| 原ID | 对象 | 本次状态 | 对应裁决 |
|---|---|---|---|

| P3/273:1642 | 273:1642 66 应用表单 · 查询受限 | 已审，待匹配实际状态 | Q76 |
| P3/4:2 | 4:2 02 我发起的 | 继承关闭 | LEGACY-4-2 |
| P3/6:2 | 6:2 04 管理后台 | 主修 | LEGACY-6-2 |
| P3/7:2 | 7:2 05 企业门户 | 继承关闭 | LEGACY-7-2 |
| P3/97:2 | 97:2 21 用户端 · 流程中心 | 已审，待匹配实际状态 | Q71 |
| P3/32:2 | 32:2 06 登录页 | 已审，待匹配实际状态 | Q70 |
| P3/49:2 | 49:2 11 字段属性列表 | 主修 | F07-L |
| P3/49:240 | 49:240 12 审批人选择 | 主修 | D08-P |
| P3/50:88 | 50:88 13 流程设置 · 通知 | 已审，待匹配实际状态 | Q09 |
| P3/50:429 | 50:429 14 发布版本 | 主修 | S14-H |
| P3/60:48 | 60:48 15 审批意见详情 | 已审，待匹配实际状态 | Q66 |
| P3/60:190 | 60:190 16 会签列表详情 | 已审，待匹配实际状态 | Q66 |
| P3/60:413 | 60:413 17 部门负责人审批意见 | 已审，待匹配实际状态 | Q66 |
| P3/60:592 | 60:592 18 李宁会签审批意见 | 已审，待匹配实际状态 | Q66 |
| P3/90:68 | 90:68 19 数据详情 · 流程图 | 已审，待匹配实际状态 | Q67 |
| P3/90:311 | 90:311 20 数据详情 · 审批详情列表 | 已审，待匹配实际状态 | Q67 |
| P3/100:2 | 100:2 22 用户端 · 流程中心 · 行政办公 | 主修 | S20-F |
| P3/100:387 | 100:387 23 用户端 · 流程中心 · 财务管理 | 待共用修复复核 | S20-F |
| P3/100:772 | 100:772 24 用户端 · 流程中心 · IT 运维 | 待共用修复复核 | S20-F |
| P3/100:1157 | 100:1157 25 用户端 · 流程中心 · 设备管理 | 待共用修复复核 | S20-F |
| P3/100:1542 | 100:1542 26 用户端 · 流程中心 · 平台权限 | 待共用修复复核 | S20-F |
| P3/272:717 | 272:717 33 应用中心 | 继承关闭 | A10-G |
| P3/272:980 | 272:980 35 应用管理 | 继承关闭 | A12-G |
| P3/272:1144 | 272:1144 36 应用管理 · 目录与表单 | 已审，待匹配实际状态 | Q37 |
| P3/272:1401 | 272:1401 38 表单管理 | 主修 | F13-L |
| P3/272:1575 | 272:1575 41 离开编辑器 | 已审，待匹配实际状态 | Q55 |
| P3/272:1594 | 272:1594 42 发布新版本 | 已审，待匹配实际状态 | Q55 |
| P3/272:1614 | 272:1614 43 应用排列设置 | 已审，待匹配实际状态 | Q33 |
| P3/272:1642 | 272:1642 44 新建应用 | 主修 | A12-D |
| P3/272:1670 | 272:1670 45 应用设置 | 待共用修复复核 | A12-D |
| P3/272:1698 | 272:1698 46 新建目录 | 已审，待匹配实际状态 | Q34 |
| P3/272:1722 | 272:1722 47 目录设置 | 已审，待匹配实际状态 | Q34 |
| P3/272:1746 | 272:1746 48 驳回申请 | 已审，待匹配实际状态 | Q57 |
| P3/272:1767 | 272:1767 49 同意申请 | 已审，待匹配实际状态 | Q58 |
| P3/272:1784 | 272:1784 50 申请提交结果 | 已审，待匹配实际状态 | Q74 |
| P3/272:1799 | 272:1799 51 保存草稿结果 | 已审，待匹配实际状态 | Q75 |
| P3/272:1814 | 272:1814 52 流程校验结果 | 已审，待匹配实际状态 | Q18 |
| P3/272:1883 | 272:1883 54 表单预览 | 主修 | F07-P |
| P3/273:1051 | 273:1051 55 流程变量 | 已审，待匹配实际状态 | Q10 |
| P3/273:1095 | 273:1095 56 流程触发器 | 已审，待匹配实际状态 | Q10 |
| P3/273:1257 | 273:1257 58 审批意见表单选择 | 已审，待匹配实际状态 | Q11 |
| P3/273:1305 | 273:1305 59 节点触发脚本 | 主修 | J22-D |
| P3/273:1332 | 273:1332 60 动态并行配置 | 已审，待匹配实际状态 | Q11 |
| P3/273:1368 | 273:1368 61 编号设置 · 日期 | 已审，待匹配实际状态 | Q15 |
| P3/273:1463 | 273:1463 63 子表字段清单 | 已审，待匹配实际状态 | Q53 |
| P3/273:1753 | 273:1753 69 应用操作菜单 | 已审，待匹配实际状态 | Q38 |
| P3/273:1773 | 273:1773 70 应用中新建菜单 | 已审，待匹配实际状态 | Q36 |
| P3/273:1877 | 273:1877 74 转办 | 已审，待匹配实际状态 | Q59 |
| P3/273:1901 | 273:1901 75 委托 | 已审，待匹配实际状态 | Q60 |
| P3/273:1925 | 273:1925 76 沟通 | 已审，待匹配实际状态 | Q61 |
| P3/273:1949 | 273:1949 77 加签 | 已审，待匹配实际状态 | Q62 |
| P3/273:1977 | 273:1977 78 补签 | 已审，待匹配实际状态 | Q63 |
| P3/273:2001 | 273:2001 79 退回申请 | 已审，待匹配实际状态 | Q64 |
| P3/273:2025 | 273:2025 80 催办 | 已审，待匹配实际状态 | Q65 |
| P3/273:2049 | 273:2049 81 发布结果 | 已审，待匹配实际状态 | Q18 |
| P3/278:1567 | 278:1567 84 节点操作与退回目标 | 已审，待匹配实际状态 | Q12 |
| P3/278:1634 | 278:1634 86 子流程配置 · 目标流程 | 已审，待匹配实际状态 | Q12 |
| P3/278:1669 | 278:1669 87 子流程配置 · 字段映射 | 已审，待匹配实际状态 | Q12 |
| P3/278:1719 | 278:1719 88 子流程配置 · 等待与回写 | 已审，待匹配实际状态 | Q12 |
| P3/280:1315 | 280:1315 89 应用中心 · 每行 3 个 | 继承关闭 | A10-G |
| P3/280:1453 | 280:1453 90 应用中心 · 每行 4 个 | 继承关闭 | A10-G |
| P3/280:1590 | 280:1590 91 应用中心 · 每行 5 个 | 继承关闭 | A10-G |
| P3/280:1727 | 280:1727 92 应用中心 · 每行 8 个 | 继承关闭 | A10-G |
| P3/280:1863 | 280:1863 93 表单设计器 · 未保存修改 | 已审，待匹配实际状态 | Q55 |
| P3/282:1699 | 282:1699 94 应用排列设置 · 3 列 | 已审，待匹配实际状态 | Q33 |
| P3/282:1729 | 282:1729 95 应用排列设置 · 4 列 | 已审，待匹配实际状态 | Q33 |
| P3/282:1759 | 282:1759 96 应用排列设置 · 5 列 | 已审，待匹配实际状态 | Q33 |
| P3/282:1789 | 282:1789 97 应用排列设置 · 8 列 | 已审，待匹配实际状态 | Q33 |
| P3/299:1725 | 299:1725 98 审批更多操作 | 已审，待匹配实际状态 | Q68 |
| P3/300:1692 | 300:1692 99 表单填写 · 校验提示 | 已审，待匹配实际状态 | Q74 |
| P3/300:1808 | 300:1808 100 审批 · 校验提示 | 已审，待匹配实际状态 | Q67 |
| P3/329:6450 | 329:6450 101 表单详情 | 继承关闭 | B03-F |
| P3/352:8058 | 352:8058 102 流程设计器 · 高级 | 已审，待匹配实际状态 | Q13 |
| P3/352:8879 | 352:8879 103 JS 脚本 · 运行成功 | 待共用修复复核 | J22-D |
| P3/352:9025 | 352:9025 104 JS 脚本 · 运行错误 | 待共用修复复核 | J22-D |
| P3/352:9171 | 352:9171 105 审批人 · JS 脚本 | 待共用修复复核 | J22-D |
| P3/355:6574 | 355:6574 106 主题 | 继承关闭 | T21-N |
| P3/355:6575 | 355:6575 107 主题 · 自定义 | 已审，待匹配实际状态 | Q51 |
| P3/355:6765 | 355:6765 108 JS 脚本 · 插入函数 | 待共用修复复核 | J22-D |
| P3/355:6910 | 355:6910 109 审批人脚本 · 运行结果 | 待共用修复复核 | J22-D |
| P3/366:6765 | 366:6765 110 流程设计器 · 蓝色主题 | 主修 | D08-B |
| P3/366:7092 | 366:7092 111 流程设计器 · 预设主题设置 | 待共用修复复核 | D08-B |
| P3/366:7419 | 366:7419 112 流程设计器 · 自定义主题 | 待共用修复复核 | D08-B |
| P3/380:7782 | 380:7782 113 流程设置 · 事件监听 | 已审，待匹配实际状态 | Q14 |
| P3/380:7785 | 380:7785 116 新增监听器 | 已审，待匹配实际状态 | Q14 |
| P3/380:7786 | 380:7786 117 监听器 · 选择时机 | 已审，待匹配实际状态 | Q14 |
| P3/383:8007 | 383:8007 事件监听 · JavaScript | 待共用修复复核 | J22-D |
| P3/383:8440 | 383:8440 121 监听器 · 流程结束 | 已审，待匹配实际状态 | Q14 |
| P3/405:8967 | 405:8967 122 编号设置 · 流水号 | 已审，待匹配实际状态 | Q15 |
| P3/405:8968 | 405:8968 123 编号设置 · 常量 | 已审，待匹配实际状态 | Q15 |
| P3/405:8969 | 405:8969 124 编号设置 · 时间 | 已审，待匹配实际状态 | Q15 |
| P3/405:8970 | 405:8970 125 编号设置 · 发起人 | 已审，待匹配实际状态 | Q15 |
| P3/405:8971 | 405:8971 126 编号设置 · 自定义 | 已审，待匹配实际状态 | Q15 |
| P3/410:9349 | 410:9349 发布快照 · v3.1 | 已审，待匹配实际状态 | Q19 |
| P3/445:13402 | 445:13402 流程中心 · 多数据 · 第1页 | 已审，待匹配实际状态 | Q72 |
| P3/445:13732 | 445:13732 流程中心 · 多数据 · 第2页 | 已审，待匹配实际状态 | Q72 |
| P3/446:13479 | 446:13479 系统管理 · 用户管理 | 主修 | Y-S |
| P3/446:13882 | 446:13882 系统管理 · 部门管理 | 待共用修复复核 | Y-S |
| P3/446:14254 | 446:14254 系统管理 · 角色管理 | 待共用修复复核 | Y-S |
| P3/446:14618 | 446:14618 系统管理 · 菜单管理 | 待共用修复复核 | Y-S |
| P3/446:15271 | 446:15271 系统管理 · 岗位管理 | 待共用修复复核 | Y-S |
| P3/446:15569 | 446:15569 系统管理 · 用户组管理 | 待共用修复复核 | Y-S |
| P3/446:15891 | 446:15891 系统管理 · 字典项 | 待共用修复复核 | Y-S |
| P3/446:16226 | 446:16226 系统管理 · 角色成员 | 已审，待匹配实际状态 | Q50 |
| P3/447:12034 | 447:12034 系统管理 · 部门管理 · 收起 | 已审，待匹配实际状态 | Q42 |
| P3/447:12274 | 447:12274 系统管理 · 菜单管理 · 收起 | 已审，待匹配实际状态 | Q42 |
| P3/447:12885 | 447:12885 系统管理 · 新增用户 | 已审，待匹配实际状态 | Q43 |
| P3/447:13087 | 447:13087 系统管理 · 新增部门 | 已审，待匹配实际状态 | Q44 |
| P3/447:13219 | 447:13219 系统管理 · 新增角色 | 已审，待匹配实际状态 | Q45 |
| P3/447:13355 | 447:13355 系统管理 · 新增字典 | 已审，待匹配实际状态 | Q46 |
| P3/447:13435 | 447:13435 系统管理 · 新增岗位 | 已审，待匹配实际状态 | Q47 |
| P3/447:13529 | 447:13529 系统管理 · 新增用户组 | 已审，待匹配实际状态 | Q48 |
| P3/447:13609 | 447:13609 系统管理 · 新增字典项 | 已审，待匹配实际状态 | Q49 |
| P3/459:12874 | 459:12874 超管 · 系统管理 · 用户管理 | 待共用修复复核 | Y-S |
| P3/459:13104 | 459:13104 超管 · 系统管理 · 部门管理 | 待共用修复复核 | Y-S |
| P3/459:13364 | 459:13364 超管 · 系统管理 · 角色管理 | 待共用修复复核 | Y-S |
| P3/459:13590 | 459:13590 超管 · 系统管理 · 菜单管理 | 待共用修复复核 | Y-S |
| P3/459:13842 | 459:13842 超管 · 系统管理 · 字典管理 | 待共用修复复核 | Y-S |
| P3/459:14071 | 459:14071 超管 · 系统管理 · 岗位管理 | 待共用修复复核 | Y-S |
| P3/459:14291 | 459:14291 超管 · 系统管理 · 用户组管理 | 待共用修复复核 | Y-S |
| P3/459:14490 | 459:14490 超管 · 系统管理 · 字典项 | 待共用修复复核 | Y-S |
| P3/459:14712 | 459:14712 超管 · 04 管理后台 | 已审，待匹配实际状态 | Q69 |
| P3/459:15041 | 459:15041 超管 · 35 应用管理 | 已审，待匹配实际状态 | Q40 |
| P3/460:14460 | 460:14460 超管 · 用户管理 · CH 科技 | 已审，待匹配实际状态 | Q41 |
| P3/460:14689 | 460:14689 超管 · 用户管理 · 深圳中心 | 已审，待匹配实际状态 | Q41 |
| P3/460:14918 | 460:14918 超管 · 租户筛选 | 已审，待匹配实际状态 | Q41 |
| P3/471:16801 | 471:16801 应用设置 · 外观已选择 | 待共用修复复核 | A12-D |
| P3/471:17052 | 471:17052 新建应用 · 选择图标 | 继承关闭 | A12-I |
| P3/471:17053 | 471:17053 新建应用 · 选择颜色 | 继承关闭 | A12-C |
| P3/471:17054 | 471:17054 新建应用 · 外观已选择 | 待共用修复复核 | A12-D |
| P3/471:17256 | 471:17256 删除应用 | 已审，待匹配实际状态 | Q39 |
| P3/471:17292 | 471:17292 应用操作菜单 · 2 | 已审，待匹配实际状态 | Q38 |
| P3/471:17306 | 471:17306 应用操作菜单 · 3 | 已审，待匹配实际状态 | Q38 |
| P3/471:17320 | 471:17320 应用操作菜单 · 4 | 已审，待匹配实际状态 | Q38 |
| P3/471:17334 | 471:17334 应用操作菜单 · 5 | 已审，待匹配实际状态 | Q38 |
| P3/471:17348 | 471:17348 应用操作菜单 · 6 | 已审，待匹配实际状态 | Q38 |
| P3/471:17362 | 471:17362 应用操作菜单 · 7 | 已审，待匹配实际状态 | Q38 |
| P3/471:17376 | 471:17376 应用操作菜单 · 8 | 已审，待匹配实际状态 | Q38 |
| P3/471:17390 | 471:17390 应用操作菜单 · 9 | 已审，待匹配实际状态 | Q38 |
| P3/471:17404 | 471:17404 应用操作菜单 · 10 | 已审，待匹配实际状态 | Q38 |
| P3/471:17418 | 471:17418 应用操作菜单 · 11 | 已审，待匹配实际状态 | Q38 |
| P3/471:17432 | 471:17432 应用操作菜单 · 12 | 已审，待匹配实际状态 | Q38 |
| P3/472:15663 | 472:15663 表单设计 · 演练资源清单 · 流程未配置 | 已审，待匹配实际状态 | Q56 |
| P3/472:15867 | 472:15867 表单设计 · 演练资源清单 · 创建流程 | 已审，待匹配实际状态 | Q56 |
| P3/478:15747 | 478:15747 应用设置 · 已选图标 | 待共用修复复核 | A12-D |
| P3/478:15806 | 478:15806 应用设置 · 已选颜色 | 待共用修复复核 | A12-D |
| P3/478:15865 | 478:15865 应用设置 · 选择图标 · 保留颜色 | 继承关闭 | A12-I |
| P3/478:15966 | 478:15966 应用设置 · 选择颜色 · 保留图标 | 继承关闭 | A12-C |
| P3/478:16024 | 478:16024 新建应用 · 已选图标 | 待共用修复复核 | A12-D |
| P3/478:16083 | 478:16083 新建应用 · 已选颜色 | 待共用修复复核 | A12-D |
| P3/478:16142 | 478:16142 新建应用 · 选择图标 · 保留颜色 | 继承关闭 | A12-I |
| P3/478:16243 | 478:16243 新建应用 · 选择颜色 · 保留图标 | 继承关闭 | A12-C |
| P3/490:16659 | 490:16659 表单设计器 · 文字 · 左对齐 | 继承关闭 | F36-V |
| P3/490:16711 | 490:16711 表单设计器 · 文字 · 右对齐 | 继承关闭 | F36-V |
| P3/490:16763 | 490:16763 表单设计器 · 文字 · 常规 | 继承关闭 | F36-V |
| P3/490:16815 | 490:16815 表单设计器 · 文字 · 24 px | 继承关闭 | F36-V |
| P3/490:16867 | 490:16867 表单设计器 · 文字 · 蓝色 | 已审，待匹配实际状态 | Q52 |
| P3/490:16919 | 490:16919 文字字号 | 已审，待匹配实际状态 | Q52 |
| P3/490:16934 | 490:16934 文字颜色 | 已审，待匹配实际状态 | Q52 |
| P3/509:18677 | 509:18677 快照 · 节点开始前脚本 | 已审，待匹配实际状态 | Q20 |
| P3/509:18714 | 509:18714 快照 · 监听器脚本 | 已审，待匹配实际状态 | Q21 |
| P3/509:18825 | 509:18825 快照 · 校验规则 | 已审，待匹配实际状态 | Q22 |
| P3/509:18864 | 509:18864 快照 · 显示条件 | 已审，待匹配实际状态 | Q23 |
| P3/509:18903 | 509:18903 快照 · 明细列配置 | 已审，待匹配实际状态 | Q24 |
| P3/509:19020 | 509:19020 快照 · 节点字段权限 | 已审，待匹配实际状态 | Q25 |
| P3/509:19229 | 509:19229 快照 · 节点操作与高级配置 | 已审，待匹配实际状态 | Q26 |
| P3/509:19335 | 509:19335 快照 · 流程变量 | 已审，待匹配实际状态 | Q27 |
| P3/509:19394 | 509:19394 快照 · 流程触发器 | 已审，待匹配实际状态 | Q28 |
| P3/518:24135 | 518:24135 快照 · 审批人脚本 | 已审，待匹配实际状态 | Q29 |
| P3/527:24177 | 527:24177 表单重命名 | 已审，待匹配实际状态 | Q35 |
| P3/527:24216 | 527:24216 新建表单 | 已审，待匹配实际状态 | Q35 |
| P3/527:24255 | 527:24255 删除目录确认 | 主修 | A11-D |
| P3/528:24117 | 528:24117 Form菜单 · 239 | 继承关闭 | A11-M |
| P3/528:24137 | 528:24137 Directory菜单 · 285 | 继承关闭 | A11-M |
| P3/528:24157 | 528:24157 Form菜单 · 331 | 继承关闭 | A11-M |
| P3/549:24449 | 549:24449 09 流程设计器 · 字段 | 主修 | D08-F |
| P3/549:24653 | 549:24653 110 流程设计器 · 蓝色主题 · 字段 | 待共用修复复核 | D08-F |
| P3/549:24857 | 549:24857 110 流程设计器 · 蓝色主题 · 高级 | 已审，待匹配实际状态 | Q13 |
| P3/549:25061 | 549:25061 111 流程设计器 · 预设主题设置 · 字段 | 待共用修复复核 | D08-F |
| P3/549:25265 | 549:25265 111 流程设计器 · 预设主题设置 · 高级 | 已审，待匹配实际状态 | Q13 |
| P3/549:25469 | 549:25469 112 流程设计器 · 自定义主题 · 字段 | 待共用修复复核 | D08-F |
| P3/549:25673 | 549:25673 112 流程设计器 · 自定义主题 · 高级 | 已审，待匹配实际状态 | Q13 |
| P3/549:26135 | 549:26135 事件监听 · 编辑发起前检查 | 已审，待匹配实际状态 | Q14 |
| P3/549:26167 | 549:26167 事件监听 · 编辑结束后同步 | 已审，待匹配实际状态 | Q14 |
| P3/558:26524 | 558:26524 事件监听 · 发起前检查 · 修改时机 | 已审，待匹配实际状态 | Q14 |
| P3/558:26556 | 558:26556 事件监听 · 发起前检查 · 时机选项 | 已审，待匹配实际状态 | Q14 |
| P3/558:26591 | 558:26591 事件监听 · 发起前检查 · 修改时机选项 | 已审，待匹配实际状态 | Q14 |
| P3/558:26626 | 558:26626 事件监听 · 结束后同步 · 修改时机 | 已审，待匹配实际状态 | Q14 |
| P3/558:26658 | 558:26658 事件监听 · 结束后同步 · 时机选项 | 已审，待匹配实际状态 | Q14 |
| P3/558:26693 | 558:26693 事件监听 · 结束后同步 · 修改时机选项 | 已审，待匹配实际状态 | Q14 |
| P3/563:26756 | 563:26756 事件监听 · JavaScript · 插入函数 | 待共用修复复核 | J22-D |
| P3/563:26825 | 563:26825 事件监听 · JavaScript · 运行结果 | 待共用修复复核 | J22-D |
| P3/563:26894 | 563:26894 事件监听 · JavaScript · 插入函数运行结果 | 待共用修复复核 | J22-D |
| P3/572:26308 | 572:26308 流程设计器 · 默认 · 表单组件审批人 | 已审，待匹配实际状态 | Q16 |
| P3/572:26514 | 572:26514 流程设计器 · 默认 · 脚本审批人 | 已审，待匹配实际状态 | Q54 |
| P3/572:26728 | 572:26728 流程设计器 · 蓝色 · 表单组件审批人 | 已审，待匹配实际状态 | Q16 |
| P3/572:26934 | 572:26934 流程设计器 · 蓝色 · 脚本审批人 | 已审，待匹配实际状态 | Q54 |
| P3/572:27148 | 572:27148 流程设计器 · 预设设置 · 表单组件审批人 | 已审，待匹配实际状态 | Q16 |
| P3/572:27354 | 572:27354 流程设计器 · 预设设置 · 脚本审批人 | 已审，待匹配实际状态 | Q54 |
| P3/572:27568 | 572:27568 流程设计器 · 自定义 · 表单组件审批人 | 已审，待匹配实际状态 | Q16 |
| P3/572:27774 | 572:27774 流程设计器 · 自定义 · 脚本审批人 | 已审，待匹配实际状态 | Q54 |
| P3/574:27788 | 574:27788 审批人 · 选择表单组件 · 默认 | 已审，待匹配实际状态 | Q17 |
| P3/574:27895 | 574:27895 审批人脚本 · 蓝色 | 待共用修复复核 | J22-D |
| P3/574:27965 | 574:27965 审批人脚本 · 蓝色 · 运行结果 | 待共用修复复核 | J22-D |
| P3/574:28035 | 574:28035 审批人 · 选择表单组件 · 蓝色 | 已审，待匹配实际状态 | Q17 |
| P3/574:28136 | 574:28136 审批人脚本 · 预设设置 | 待共用修复复核 | J22-D |
| P3/574:28206 | 574:28206 审批人脚本 · 预设设置 · 运行结果 | 待共用修复复核 | J22-D |
| P3/574:28276 | 574:28276 审批人 · 选择表单组件 · 预设设置 | 已审，待匹配实际状态 | Q17 |
| P3/574:28377 | 574:28377 审批人脚本 · 自定义 | 待共用修复复核 | J22-D |
| P3/574:28447 | 574:28447 审批人脚本 · 自定义 · 运行结果 | 待共用修复复核 | J22-D |
| P3/574:28517 | 574:28517 审批人 · 选择表单组件 · 自定义 | 已审，待匹配实际状态 | Q17 |
| P3/645:28365 | 645:28365 工作台配置 · 柱状图 | 主修 | W19-I |
| P3/645:28403 | 645:28403 工作台配置 · 折线图 | 待共用修复复核 | W19-I |
| P3/645:28441 | 645:28441 工作台配置 · 饼图 | 待共用修复复核 | W19-I |
| P3/645:28479 | 645:28479 工作台配置 · 数据列表 | 待共用修复复核 | W19-I |
| P3/645:28517 | 645:28517 工作台配置 · 系统卡片 | 待共用修复复核 | W19-I |
| P3/645:28555 | 645:28555 工作台配置 · 调整高度 | 已审，待匹配实际状态 | Q08 |
| P3/645:28593 | 645:28593 工作台配置 · 调整顺序 | 已审，待匹配实际状态 | Q08 |
| P3/645:28631 | 645:28631 工作台配置 · 添加组件 | 已审，待匹配实际状态 | Q08 |
| P3/645:28669 | 645:28669 工作台配置 · 预览 | 已审，待匹配实际状态 | Q08 |
| P3/645:28703 | 645:28703 工作台配置 · 已保存 | 已审，待匹配实际状态 | Q08 |
| P3/645:28735 | 645:28735 工作台配置 · 选择表单 | 主修 | W19-F |
| P3/645:28736 | 645:28736 工作台配置 · 筛选数据 | 已审，待匹配实际状态 | Q01 |
| P3/645:28737 | 645:28737 工作台配置 · 列表列头 | 已审，待匹配实际状态 | Q02 |
| P3/645:28738 | 645:28738 工作台配置 · 自动滚动 | 已审，待匹配实际状态 | Q08 |
| P3/653:31851 | 653:31851 工作台配置 · 选择分类字段 | 已审，待匹配实际状态 | Q03 |
| P3/653:31852 | 653:31852 工作台配置 · 选择统计字段 | 已审，待匹配实际状态 | Q04 |
| P3/653:31853 | 653:31853 工作台配置 · 排序字段 | 已审，待匹配实际状态 | Q05 |
| P3/654:35484 | 654:35484 工作台配置 · 环形图 | 待共用修复复核 | W19-I |
| P3/654:35834 | 654:35834 工作台配置 · 列头已设置 | 已审，待匹配实际状态 | Q08 |
| P3/654:36173 | 654:36173 工作台配置 · 升序列表 | 已审，待匹配实际状态 | Q08 |
| P3/654:36512 | 654:36512 工作台配置 · 列表第2页 | 已审，待匹配实际状态 | Q08 |
| P3/654:36851 | 654:36851 工作台配置 · 移除指标卡 | 已审，待匹配实际状态 | Q08 |
| P3/657:33458 | 657:33458 工作台配置 · 选择图表类型 | 已审，待匹配实际状态 | Q06 |
| P3/659:33459 | 659:33459 工作台配置 · 快捷发起 | 待共用修复复核 | W19-I |
| P3/659:34075 | 659:34075 工作台配置 · 业务动态 | 待共用修复复核 | W19-I |
| P3/659:34715 | 659:34715 工作台配置 · 流程效能 | 待共用修复复核 | W19-I |
| P3/675:34380 | 675:34380 工作台图表样式 · 柱状图 | 待共用修复复核 | W19-I |
| P3/675:34381 | 675:34381 工作台配置 · 条形图 | 待共用修复复核 | W19-I |
| P3/675:34713 | 675:34713 工作台图表样式 · 条形图 | 待共用修复复核 | W19-I |
| P3/675:34714 | 675:34714 工作台图表样式 · 折线图 | 待共用修复复核 | W19-I |
| P3/675:34715 | 675:34715 工作台配置 · 面积图 | 待共用修复复核 | W19-I |
| P3/675:35047 | 675:35047 工作台图表样式 · 面积图 | 待共用修复复核 | W19-I |
| P3/675:35048 | 675:35048 工作台配置 · 组合图 | 待共用修复复核 | W19-I |
| P3/675:35380 | 675:35380 工作台图表样式 · 组合图 | 待共用修复复核 | W19-I |
| P3/675:35381 | 675:35381 工作台图表样式 · 饼图 | 待共用修复复核 | W19-I |
| P3/675:35382 | 675:35382 工作台图表样式 · 环形图 | 待共用修复复核 | W19-I |
| P3/675:35383 | 675:35383 工作台配置 · 散点图 | 待共用修复复核 | W19-I |
| P3/675:35715 | 675:35715 工作台图表样式 · 散点图 | 待共用修复复核 | W19-I |
| P3/675:35716 | 675:35716 工作台配置 · 雷达图 | 待共用修复复核 | W19-I |
| P3/675:36048 | 675:36048 工作台图表样式 · 雷达图 | 待共用修复复核 | W19-I |
| P3/675:36049 | 675:36049 工作台配置 · 漏斗图 | 待共用修复复核 | W19-I |
| P3/675:36381 | 675:36381 工作台图表样式 · 漏斗图 | 待共用修复复核 | W19-I |
| P3/675:36382 | 675:36382 工作台配置 · 仪表盘 | 待共用修复复核 | W19-I |
| P3/675:36714 | 675:36714 工作台图表样式 · 仪表盘 | 待共用修复复核 | W19-I |
| P3/675:36715 | 675:36715 工作台配置 · 热力图 | 待共用修复复核 | W19-I |
| P3/675:37047 | 675:37047 工作台图表样式 · 热力图 | 待共用修复复核 | W19-I |
| P3/675:37048 | 675:37048 工作台图表 · 多指标与坐标轴 | 主修 | W19-M |
| P3/675:37049 | 675:37049 工作台图表 · 配色方案 | 已审，待匹配实际状态 | Q07 |
| P3/675:37050 | 675:37050 工作台图表 · 自定义颜色 | 主修 | W19-C |
| P3/679:40512 | 679:40512 工作台图表 · 自定义颜色 2 | 待共用修复复核 | W19-C |
| P3/679:40574 | 679:40574 工作台图表 · 自定义颜色 3 | 待共用修复复核 | W19-C |
| P3/679:40636 | 679:40636 工作台图表 · 自定义颜色 4 | 待共用修复复核 | W19-C |
| P3/679:40698 | 679:40698 工作台图表 · 自定义颜色 5 | 待共用修复复核 | W19-C |
| P3/679:40760 | 679:40760 工作台图表 · 自定义颜色 6 | 待共用修复复核 | W19-C |
| P3/679:40822 | 679:40822 工作台图表指标 · 柱状图 | 待共用修复复核 | W19-M |
| P3/679:40974 | 679:40974 工作台图表指标 · 条形图 | 待共用修复复核 | W19-M |
| P3/679:41126 | 679:41126 工作台图表指标 · 折线图 | 待共用修复复核 | W19-M |
| P3/679:41278 | 679:41278 工作台图表指标 · 面积图 | 待共用修复复核 | W19-M |
| P3/679:41581 | 679:41581 工作台图表指标 · 饼图 | 待共用修复复核 | W19-M |
| P3/679:41687 | 679:41687 工作台图表指标 · 环形图 | 待共用修复复核 | W19-M |
| P3/679:41793 | 679:41793 工作台图表指标 · 散点图 | 待共用修复复核 | W19-M |
| P3/679:41914 | 679:41914 工作台图表指标 · 雷达图 | 待共用修复复核 | W19-M |
| P3/679:42020 | 679:42020 工作台图表指标 · 漏斗图 | 待共用修复复核 | W19-M |
| P3/679:42157 | 679:42157 工作台图表指标 · 仪表盘 | 待共用修复复核 | W19-M |
| P3/686:40638 | 686:40638 工作台配置 · 图表多色样式 | 待共用修复复核 | W19-I |
| P3/710:42626 | 710:42626 侧栏 · 系统管理 · 收起 | 继承关闭 | B41-C |
| P3/710:43363 | 710:43363 侧栏 · 系统管理 · 目录折叠 | 继承关闭 | B41-C |
| P3/710:43652 | 710:43652 侧栏 · 工作台 · 收起 | 继承关闭 | B41-C |
| P3/726:45273 | 726:45273 流程中心 · 分类侧栏收起 | 已审，待匹配实际状态 | Q73 |
| P3/726:45573 | 726:45573 流程中心 · 分类收起 · 名称与数量提示 | 已审，待匹配实际状态 | Q73 |
| P3/501:19522 | 501:19522 View=Form_text | 已审，待匹配实际状态 | Q30 |
| P3/501:19847 | 501:19847 View=Form_type | 已审，待匹配实际状态 | Q30 |
| P3/501:20232 | 501:20232 View=Form_place | 已审，待匹配实际状态 | Q30 |
| P3/501:20595 | 501:20595 View=Form_date | 已审，待匹配实际状态 | Q30 |
| P3/501:20958 | 501:20958 View=Form_dept | 已审，待匹配实际状态 | Q30 |
| P3/501:21321 | 501:21321 View=Form_note | 已审，待匹配实际状态 | Q30 |
| P3/501:21684 | 501:21684 View=Form_rich | 已审，待匹配实际状态 | Q30 |
| P3/501:22036 | 501:22036 View=Form_table | 已审，待匹配实际状态 | Q30 |
| P3/501:22382 | 501:22382 View=Form_upload | 已审，待匹配实际状态 | Q30 |
| P3/502:21983 | 502:21983 View=Flow_draft | 已审，待匹配实际状态 | Q31 |
| P3/502:22267 | 502:22267 View=Flow_dept | 已审，待匹配实际状态 | Q31 |
| P3/502:22588 | 502:22588 View=Flow_basic | 已审，待匹配实际状态 | Q31 |
| P3/502:22894 | 502:22894 View=Flow_plan | 已审，待匹配实际状态 | Q31 |
| P3/502:23215 | 502:23215 View=Flow_resource | 已审，待匹配实际状态 | Q31 |
| P3/502:23536 | 502:23536 View=Flow_risk | 已审，待匹配实际状态 | Q31 |
| P3/502:23857 | 502:23857 View=Flow_compliance | 已审，待匹配实际状态 | Q31 |
| P3/502:24178 | 502:24178 View=Flow_hq | 已审，待匹配实际状态 | Q31 |
| P3/502:24499 | 502:24499 View=Flow_end | 已审，待匹配实际状态 | Q31 |
| P3/502:24767 | 502:24767 View=Flow_fork | 已审，待匹配实际状态 | Q31 |
| P3/502:25049 | 502:25049 View=Flow_join | 已审，待匹配实际状态 | Q31 |
| P3/505:23296 | 505:23296 View=Settings_notice | 主修 | S14-E |
| P3/505:23398 | 505:23398 View=Settings_events | 待共用修复复核 | S14-E |
| P3/505:23628 | 505:23628 View=Fields | 主修 | S14-F |
| P3/505:23827 | 505:23827 View=Number | 已审，待匹配实际状态 | Q32 |

## 已过保护、业务状态与下一动作

原193项继续锁定；本次26项按限定断言再锁定。原85/86图表语义、A06—A16业务、G17列宽、菜单、图标、密码、草稿、分类、日期框及12—14快照外壳继续继承各最近有效结果。主修触及共用消费者时仅核实际影响，不能把既有合法能力删掉来凑原图。

最新业务依据仍是回执21：Web 5cd8187e04321500362dfa5630dfea87c8576a2a，typecheck0/eslint0/1956通过3跳过/build3.99s，提交推送与ls-remote按执行回执层级；Server fe2bba4d未改。本轮没有新的实现或Git事实。正式49、46/22/22=90、ADV64/问题57、P62延期/OFF不变；版本0.2.0已确认。

7阶段：评估、实施提交完成；验收同步进行中；合并develop/main、发布0.2.0、发布后同步、结束未开始（2/1/4）。唯一后续入口为[提示24](planning-execution-prompt-unified-020-24.md)：承接23在途两项，然后按已列19主修及有限状态核实收尾。Planner本次305审阅已完成；未验收的实际状态保持开放，不能因此宣称整版通过。
