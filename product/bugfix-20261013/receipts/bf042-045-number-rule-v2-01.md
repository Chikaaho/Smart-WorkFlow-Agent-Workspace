# BF20261013-042~045 执行回执：流程编号规则 v2（按钮进框 + 手写 {xxx} 当普通字符串）+ 表单侧入口 + 全链路编号 + 发起人变量

2026-10-14/15｜执行者提交（fix-loop 持续修复批次）。Owner 本轮四条反馈（编号 042~045）：
1. 按钮放进输入框、灰底文字样式；用户看不到占位格式；**手写的 `{xxx}` 一律当普通字符串**；
2. 把主题规则放到**表单的流程设计列表**上，**发布时校验**是否已填写；
3. **所有流程链路**都要有这个流程编号；
4. bpm 中**必有发起人**（`[发起人]` 必须支持）。

## 一、已完成并自验的部分

**服务端（分支 codex/bugfix-20261013，提交 `eb7f87a`）**

1. **`{INITIATOR}` 发起人变量**（045）：白名单加 `{INITIATOR}`；`generate(processKey, rule, initiatorId)` 经 `UserQueryFacade.getUserDisplayNames` 解析**展示名**（real_name 优先）；`initiatorId=0`（IoT 等受控租户系统身份）→「系统」；查不到或 facade 缺失 → 回退 ID 字符串，不伪造姓名。
2. **调用点全链路**（044）：`ProcessStartService`（表单提交 / 子流程 / 自动发起）传 `cmd.getSubmitter()`；`IotProcessTriggerListener` 传 `0L`（与 `setInitiatorId(0L)` 同值，先设发起人再生成编号）。
3. **字面量花括号转义**（042）：`{{` / `}}` 为字面量 `{` / `}`；物化改为单遍扫描（转义对与占位符按出现顺序消费，`{{SEQ}}` 这类转义串**不会被当变量、也不消费自增序号**）；非法占位符判定加环视，转义对不再误报；校验提示同步补充。
4. **空规则回退默认规则**（044）：规则为空按 `DEFAULT_RULE = {YYYYMMDD}-{SEQ:3}` 生成（不再回退流程名）——历史/外部定义的所有发起链路也必有编号；默认规则常量收敛到 `ProcessThemeService.DEFAULT_RULE`（`createDef` 同引用）。
5. **测试**：`ProcessThemeServiceTest` 扩到 **7 例**（位数补零、不补零与复用、日期拼接、**空规则默认规则**、**发起人展示名/系统身份/回退 ID**、**转义字面量与不消费序号**、白名单/越界）；`sw-bpm-process` 模块 **409 用例 0 失败 0 错误**。
6. **jar 重建 + 重启**：`mvn -pl sw-bootstrap -am package -DskipTests` 后以 local profile 重启（pid 36874，health 200）；已从 fat jar 内嵌模块 jar 反编译核对新类（`DEFAULT_RULE`/`SYSTEM_INITIATOR_NAME`/新构造器）在位。

**Web（分支 codex/bugfix-20261013，提交 `34d54c5`）**

1. **编辑器 v2**（042，抽为共用组件 `ThemeRuleDialog.vue`，流程定义列表与表单工作台共用）：
   - **变量按钮与输入框同框**：内容区 + 按钮条同处一个描边框内，按钮 = 与带入标识同款的**灰底文字**（5 个：发起日期/发起时间/时间戳/**发起人**/自增序号 + 位数下拉）；
   - **灰底样式生效**：标识节点为 DOM 动态创建、没有 scoped 属性——BF041 的 `background` 因此未落上（实景看着是普通文字），本批经 `:deep()` 落样式（实测底色 `rgb(238,241,247)`）；
   - **手写 `{xxx}` 当普通字符串**：编辑区文字节点保存时转义 `{{`/`}}`、回显还原为普通文字（不生成标识）；`parseRuleSegments` 重写为与服务端同文法的单遍扫描；未识别的手写记法不再被当变量；
   - **实景缺陷补修**：点中标识再打字曾把文字插进标识内部（把标识文字改坏、且不参与规则文本 = 静默丢失）——`mousedown` 把光标定位到标识前/后 + 标识 `user-select:none` + `beforeinput` 兜底；
   - 位数下拉并入框内（既有 7-10 位规则回显不丢）；标题/列头改「流程编号设置 / 流程编号」；示例预览追加发起人（取当前登录用户展示名）。
2. **表单侧入口**（043）：`RelatedProcessesPanel` 头部「流程编号设置」（新建流程左侧）：无流程禁用；单流程直达编辑器；多流程弹选择列表（名称 + 当前编号（标识化展示）/未设置 + 编辑）。
3. **我的发起编号列**（044）：`MyInstances` 流程编号列由 `businessKey` 改为实例编号（`theme`），业务标识仍在详情弹窗；列表编号列/规则列一律**标识化展示**（`themeRuleDisplay`），不暴露 `{YYYYMMDD}` 记法。
4. **文案**：`themeRuleTitle/Column/Action/Placeholder/Required/Saved/SaveFailed/Desc` 改「流程编号」口径；新增 `form.relatedProcessNumberSetting`；P61 字典单源（`scripts/p61-copy-dictionary-batch6.json`）同步改键；发起人复用 `common.initiator`。
5. **测试**：`theme-rule.spec.ts`（8 例：含转义往返、展示文字、位数回显）、新增 `ThemeRuleDialog.spec.ts`（5 例：回显/按钮同框带入/手写字符串转义保存/空规则拦截/**标识光标守卫**）、`RelatedProcessesPanel.spec.ts` 新增单流程直开用例、`ProcessDefList` 两处 spec 适配组件化与 pinia。四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1522** 通过 3 跳过、build ✓。
6. **顺带修复**（实景发现）：删除确认标题用的 `common.warningTitle` 键不存在（标题显示为键名）→ 复用 `common.deleteConfirmTitle`。

## 二、实景证据（应用内浏览器 1280×720，管理员会话；验证 tab 专用，未动 Owner 页签）

| 项 | URL | 结果 | 截图/读数 |
|---|---|---|---|
| 编号设置弹窗（042） | 表单「脚本验证表单A」→ 流程设计 → 流程编号设置 | 标题「流程编号设置」；框内 `编号{临时}_[发起人][自增序号 2 位]`；5 个按钮**全部在框内**（`addsInsideBox=true`）且与标识同灰底 `rgb(238,241,247)`；位数 2 位；示例 `编号{临时}_系统管理员01`；必填提示完整 | evidence/bf042-number-rule-dialog.png |
| 手写 `{xxx}` 往返（042） | 同上（手打 `编号{临时}_` + 按钮带入 → 保存 → 重开） | 保存成功（「流程编号规则已保存」）；DB `theme_rule = 编号{{临时}}_{INITIATOR}{SEQ:2}`（字面量已转义）；重开：`编号{临时}_` 仍是**普通文字**（无标识，`hasChipForLiteral=false`）、两个灰底标识、位数回显 2 位 | —（DB + DOM 读数） |
| 标识光标守卫（042 补修） | 同上（点「[发起人]」中部再打字 `X`） | `X` 落在标识**之前**、标识文字仍 `[发起人]`（补修前会插进标识内部改坏） | —（DOM 读数） |
| 表单侧入口（043） | 同一面板 | 0 流程时按钮 `disabled=true`；建流程后点击直达编辑器；多流程时弹选择列表（两行含各自编号）→ 编辑进入对应流程编辑器 | evidence/bf042-number-rule-dialog.png（面板同屏） |
| 发布门复核（043） | /workflow/defs 行「发布」（对未配置规则的「123」） | 弹出「尚未配置流程编号规则，请先设置编号规则后再发布」；行仍「草稿」；DB `status=DRAFT / theme_rule=NULL` 未变 | —（DB 读数） |
| 全链路编号 + 发起人（044/045） | 临时流程「编号验证流程」绑定测试表单「脚本验证表单A」→ 发布 v1 → 填报页填两字段 → 「发起流程」 | 「提交成功，流程已发起」；DB `sw_bpm_instance.theme = 编号{临时}_系统管理员01`（`{临时}` 字面量原样、`{INITIATOR}`=real_name 系统管理员、`{SEQ:2}` 补零）、`initiator_id=1`；`sw_bpm_theme_seq` 计数行随首次生成创建（`next_val=2`）；实例状态 APPROVED（START→END） | evidence/bf044-instance-number-my-instances.png |
| 编号在列表可见（044） | /workflow/my-instances | 「流程编号」列显示 `编号{临时}_系统管理员01`（修复前该列错绑 businessKey、显示业务 UUID） | evidence/bf044-instance-number-my-instances.png |
| IoT 链路（044，同源） | — | 与表单链路共用 `ProcessThemeService.generate`，发起人=0 → 「系统」；本轮未实景触发 IoT（环境无触发记录），由 `ProcessThemeServiceTest`（系统身份→系统）覆盖 | —（单测覆盖） |
| 定义列表编号列（042 回归） | /workflow/defs | 「编号验证流程」行显示 `编号{临时}_[发起人][自增序号 2 位]`（标识化展示，不暴露占位记法）；「123」行仍「未设置」 | —（DOM 读数） |

## 三、数据与环境说明（重要）

- **实景全链路验证用的临时数据留环境供点验**：流程定义「编号验证流程」（`bpm_2eeb38dfcce944fb`，绑定测试表单「脚本验证表单A」（BF021 遗留测试表单），已发布 v1，编号规则 `编号{{临时}}_{INITIATOR}{SEQ:2}`）+ 1 条实例（编号 `编号{临时}_系统管理员01`，APPROVED）+ 该表单 1 条记录 + `sw_bpm_theme_seq` 1 行。**如不希望保留请告知**（发布态定义的可删性以服务端校验为准；删除该定义会使其实例失去流程名回显）。
- **Owner 数据零改动**：定义「123」（`2109918105039376386`）本次只做「发布」尝试（被门拦下、无状态变更），`status=DRAFT / theme_rule=NULL` 复核未变；表单「测试1」全程未写入。
- 验证过程中另建的「编号验证流程B」已按界面删除（DB 复核仅剩 123 与 编号验证流程 两条定义）。
- **一次环境事故（已恢复，说明见下）**：重建 jar 时旧进程仍在运行并从同一 jar 懒加载类，导致 `/workflow/defs` 的删除请求触发 `NoClassDefFoundError`（HTTP 200/异常），表现为删除无反应；**新 jar 重启（pid 36874）后同一删除操作正常**（「流程已删除」）。教训：重建前后必须重启进程（本批已按「重建 → 重启 → 复验」执行）。
- 本机点验环境：Server 8080（`/tmp/bugfix-20261013/local-env.sh` 注入密钥，health 200）、Web 5173。

## 四、提交

- Server：codex/bugfix-20261013 `eb7f87a`（发起人变量 + 转义 + 空规则默认规则 + 调用点 + 单测）。
- Web：codex/bugfix-20261013 `34d54c5`（编辑器 v2（含光标守卫）+ 表单侧入口 + 我的发起编号列 + 文案 + 测试）。
- 根仓：台账 BF20261013-042~045 行 + 本回执 + 证据索引 + Server/Web gitlink。

## 五、状态

**待 Owner 点验**：服务端 409 用例、Web 1522 用例与四门、实景全链（表单发起 → 编号含发起人 → 我发起的可见）均已完成。遗留观察（未改）：服务端 400 的具体理由仍被前端请求层统一兜底（另项待决，见 BF041 行）。
