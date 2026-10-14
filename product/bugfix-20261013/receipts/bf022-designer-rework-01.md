# BF20261013-022 执行回执：流程设计器八项重构（触发器体系/脚本弹窗/参与人收敛/自动保存/变量极简/子流程极简）

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-14 截图×4 + 文字八项。

## 逐项落地

- **①节点触发器**：节点属性新增「节点触发器」区块——节点开始前（NODE_ENTERING，引擎在审批任务创建成功、办理人办理前经 NodeTriggerEventPort 回调评估）与节点结束（NODE_ROUND_COMPLETED），脚本经统一弹窗编写；触发器以 `node_enter_<节点id>` / `node_end_<节点id>` 落图，变量授权默认全部已定义变量；返回值不用于匹配（无动作分支，副作用即用途）。发布校验事件白名单同步扩展。
- **②统一脚本弹窗**：新组件 ScriptDialog——左侧按分类展示函数目录（每项问号悬停显示作用与用法），点击函数行把用法片段插入右侧脚本输入框；已接入 触发器判断脚本 / 子流程判断脚本 / 参与人表达式 / 表单设计器字段脚本（ScriptConfig 改为预览+编辑脚本按钮）。
- **③JSON 配置移除**：节点面板不再渲染 object 型「对象配置（JSON 文本）」项（能力字段过滤）。
- **④参与人收敛**：策略仅五项 选择人员/选择部门（运行期取部门负责人）/选择角色/选择岗位/表达式（脚本弹窗）；「审批人（兼容）」整区移除，参与人与审批人合一（participant 单轨）；旧数据（含 部门岗位/外部适配器/表单字段）仍可回显但不再提供新选。
- **⑤自动保存关闭**：移除 1.5s 防抖自动保存；未保存时 头部显示「未保存的更改」，路由离开弹「您还有未保存的内容，是否退出」（继续编辑/退出），刷新/关闭走浏览器原生确认。实景验证：制造未保存态后全程无任何静默落库。
- **⑥全局触发器两类**：全局触发器=流程发起（PROCESS_START，实例创建成功同事务评估，ProcessStartService 接入）/流程结束（既有 PROCESS_COMPLETED）；触发器弹窗事件仅这两项，新增默认 流程发起；源节点不再选择。
- **⑦变量面板极简**：仅 变量标识（var_ 前缀，保存自动补齐）+ 名称；移除 批量导入/数据类型/数据来源/汇总方式/必填开关与全部括号说明，排版对齐。取值语义（服务端）：脚本写入的实例变量 > 主表单同名字段 > 最新一轮审批意见表单同名字段 > 空（自动来源默认可空，不阻止触发）；旧显式来源定义向后兼容。
- **⑧子流程极简**：移除 目标表单 选择（子流程用其自身绑定表单，服务端按目标定义解析）；判断脚本改弹窗输入。**发起人口径（Owner 2026-10-14 追加确认）**：自动处理操作人=管理员——自动发起（派发数据携带 sourceInstanceId 来源标记）时 ProcessStartService 将操作人强制为系统管理员（种子账号 userId=1），实例 initiatorId 与 submitter 变量同值；主流程信息嵌入子实例——派发数据携带 sourceInstanceId/sourceBusinessKey 并经发起链提升为子实例变量（子流程可读主流程实例编号/业务单号）。测试：派发载荷源嵌入断言（TriggerExecutionServiceChildDispatchTest）+ ProcessStartServiceTest 管理员改写与变量嵌入用例；process 全量测试通过、打包重启（pid 4608）。

## 验证

- Server：engine/process 全量测试通过；全链编译+sw-bootstrap 打包成功；服务重启（pid 2972，8080 监听）。
- Web 四门：lint 0 错 3 警、typecheck 0、vitest 1478 通过 3 跳过、build ✓。
- 实景（应用内浏览器）：③④（JSON 配置与审批人兼容区消失、策略五项）、①（节点触发器区块）、⑥（触发器弹窗两类事件）、②（脚本弹窗分类/插入/问号）、⑤（未保存提醒+全程无静默落库）、⑦（变量面板极简）、⑧（无目标表单+脚本弹窗）逐项核对通过。证据：evidence/bf022-network-index.md + bf022-script-dialog.png、bf022-unsaved-guard.png、bf022-node-panel.png。

## 数据说明（如实披露）

- 本会话全程未点保存；自动保存已移除并实测无静默落库。会话期间测得 Owner 流程定义 graph_json 相对 BF021 收尾发生变化（node_1 参与人/子流程实验痕迹与空目标触发器 subflow_node_1），与 Owner 提交反馈前自己的截图探索吻合——系旧自动保存（本批已移除）静默落库的 Owner 自有操作痕迹，未做回写，请 Owner 在新面板下自行整理或告知代为清理。
- 测试均在本机环境进行，未发布任何流程定义。

## 提交

- Web：codex/bugfix-20261013（ProcessDesigner 重构 + ScriptDialog/script-catalog + ScriptConfig + 契约/locales）。
- Server：codex/bugfix-20261013（NodeTriggerEventPort/TriggerExecutionService 两事件/端口装配/ProcessStartService/ApprovalTaskListener 回调/变量自动取值链/发布校验）。
- 根仓：台账 BF20261013-022 行 + 本回执 + 证据 + 两子仓 gitlink。

## 状态

待 Owner 点验（与 BF001—021 同批）。⑧发起人口径已按 Owner 追加确认落地。
