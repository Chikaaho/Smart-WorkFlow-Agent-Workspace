# BF20261013-041 执行回执：流程编号（主题）规则——必填配置 + 变量带入 + 自增位数（**环境受阻，待 Owner 重启服务端**）

2026-10-14/15｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈：配置入口太反人类；应作为这条流程任何版本的必填配置；不应让用户手写 `{yyyyMMdd}`，应给可选按钮点击带入；自增编号需设置位数。执行中 Owner 追加建议：**用灰底文字标识在输入框内直接展示**（例：`JRZX_[发起时间]_[发起人]的流程_[自增序号]`），本批按该交互实现（发起人一项见下方说明）。

## 一、已完成并自验的部分

**服务端（分支 codex/bugfix-20261013，提交 `007c468`）**

1. **`{SEQ:n}` 位数补零**（`ProcessThemeService`）：白名单由 `{SEQ}` 扩为 `{SEQ}`/`{SEQ:n}`（n=1..10），生成时按位数左补零（`{SEQ:3}` → `001`）；同一条规则内多次 `{SEQ}` 共用同一序号值、按各自位数格式化。校验新增位数越界（`{SEQ:0}`/`{SEQ:11}`）拒绝，非法占位符提示同步更新；控制器文档同步。
2. **必填 = 发布门**（`BpmProcessDefServiceImpl.publish`）：**任一版本发布前必须已配置编号规则**，为空/空白 → 新错误码 `2109 bpm.theme_rule_required`「尚未配置流程编号规则，请先设置编号规则后再发布」；检查放在发布门最前（这是列表页一键可补的配置，先给可操作提示而非图校验报错）。
3. **新建定义带默认规则**：`createDef` 落库即写 `{YYYYMMDD}-{SEQ:3}`（如 `20261014-001`），可在列表随时改——这样"任何版本都有编号规则"从创建起成立；历史/外部导入的空规则定义在发布时被门拦住补齐。
4. **单测**：新增 `ProcessThemeServiceTest`（5 例：补零、不补零与多 `{SEQ}` 复用、日期拼接、空规则回退、白名单/越界校验）；`BpmProcessDefServiceImplTest` 新增 `PublishTests`（2 例：`null` 与空白规则均抛 2109）。
5. **回归**：`sw-bpm-process` 模块 **407 用例 0 失败 0 错误**（含既有 P62/P63 发布路径，默认规则使其继续通过）。

**Web（分支 codex/bugfix-20261013，提交 `c51fa05`）**

1. **输入框内灰底变量标识**（Owner 建议的交互）：规则编辑器改为 contenteditable，变量以内联灰底文字标识展示（`[发起日期]`、`[发起时间]`、`[时间戳]`、`[自增序号 3位]`），可与其间固定文字任意混排（如 `JRZX_[发起时间]_[自增序号 3位]`）；标识以 `data-token` 序列化，展示文字不参与规则文本。
2. **变量按钮 + 位数**：按钮行保持「发起日期 / 发起时间 / 时间戳 / 自增序号 + 位数下拉（不补零、2-6 位）」——点击在**光标处**带入（无光标追加到末尾），带位数的自增按钮直接写入 `{SEQ:n}`。
3. **示例预览**：规则下方实时显示演示值（日期取当天、序号 `1` 按位数补零），用户直接看到编号长什么样。
4. **必填提示**：弹窗底部固定提示「该规则为必填配置：未设置时流程不能发布」。
5. **文案**：「发起时间」复用既有键 `common.startTimeShort`（同一文案一个键）；新增 `workflow.themeRuleDesc/themeRuleTokens/themeRuleTokenDate/themeRuleTokenTimestamp/themeRuleTokenSeq/themeRuleSeqNoPad/themeRuleSeqDigits/themeRulePreview/themeRuleRequiredHint`，中英双语 + P61 单源词条同步。
6. **测试**：新增 `theme-rule.spec.ts`（6 例：按钮变量、位数拼装、文案键映射、标识文字、规则拆段、示例预览）；`ProcessDefList.spec.ts` 新增 1 例（灰底标识回显 + 点按钮带入 + 示例更新）。四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1513** 通过 3 跳过、build ✓。

## 二、**环境受阻**：服务端未能按修改重启（需 Owner 注入密钥）

- 按"服务端改动必须重建 jar 并重启"，我重建了 `sw-bootstrap/target/bootstrap.jar`（成功）并重启；**启动失败**：`AesGcmCipher: AES cipher key must not be null or blank. Set SW_CIPHER_KEY environment variable with a base64-encoded 32-byte key`。
- 原因：本机点验实例由 Owner 以环境变量注入凭据启动（台账记录"凭据经环境变量注入不落盘"），**我的执行 shell 没有 `SW_CIPHER_KEY`**，且该密钥不落盘、无法从仓库/脚本/历史恢复。
- 影响：旧的 8080 实例已被我停掉，**当前点验环境的后端处于停止状态**（Web 5173 仍在运行，但 /api 不可用）。这是我的操作失误——重启前未先确认环境变量要求，已如实记录。
- **恢复命令（Owner 执行，密钥替换为你自己的 32 字节 base64）**：
  ```bash
  cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server
  SPRING_PROFILES_ACTIVE=local \
  PG_URL='jdbc:postgresql://localhost:5432/sw_apaas_bugfix?stringtype=unspecified' \
  PG_USERNAME=chikan PG_PASSWORD= \
  SW_CIPHER_KEY='<你的 base64 32 字节密钥>' \
  nohup java -jar sw-bootstrap/target/bootstrap.jar >> /tmp/bugfix-20261013/server.log 2>&1 &
  ```
  （jar 已是含本批改动的新制品；启动后 `/api/actuator/health` 应为 200）
- 服务端就绪后我可以补做：①实景点验编号规则编辑器与保存往返；②`/workflow/defs` 上点「发布」对未设置规则的定义应报「尚未配置流程编号规则…」；③数据面核对（规则落库、编号生成）。

## 三、与 Owner 例子的差异（需确认）

Owner 例子里的 **`[发起人]`** 目前**没有实现**，原因是引擎侧还不具备该变量：
- 现有白名单只有 `{TIMESTAMP}/{YYYYMMDD}/{YYYYMMDDHHMMSS}/{SEQ}`（无发起人）；
- 更关键：**主题（流程编号）目前只在 IoT 触发发起路径生成**（`IotProcessTriggerListener` 里 `instance.setTheme(generate(...))`），**人工发起路径尚未生成编号**——所以"发起人"既没有数据来源，编号本身对人工发起也还没生效。
- 建议作为下一项独立工作：把编号生成接进人工发起链路（发起时用发起人姓名 + 规则生成编号），并在规则白名单加 `{INITIATOR}`。需要 Owner 确认要不要做（涉及引擎发起链路改动，不在本批授权范围）。

## 四、提交

- Server：codex/bugfix-20261013 `007c468`（`{SEQ:n}` 语法 + 发布门 + 默认规则 + 单测）。
- Web：codex/bugfix-20261013 `c51fa05`（灰底变量标识编辑器 + 按钮/位数/示例/必填提示 + 文案 + 测试）。
- 根仓：台账 BF20261013-041 行 + 本回执 + Server/Web gitlink。

## 五、状态

**执行中（环境受阻）**：代码与单测完成；实景点验待 Owner 重启服务端（见 §二命令）。
