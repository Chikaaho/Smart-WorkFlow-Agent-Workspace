# 0.2.0 前端主题与表单流程批次审查

2026-10-25｜Planner｜局部行为通过、整版继续实施｜IN_PROGRESS

## 阅读与裁决

已完整读取正式入口 fe020-frontend-batch-04.md，以及 frontend/fe020-theme-blue-01.md、fe020-process-designer-selected-02.md、fe020-forms-flow-settings-03.md 三份明细；对照前端方向、A01—A17和已有中间审查，直接核对本机原始日志、主题/节点取色JSON及关键截图。未读取实现或测试代码，未运行工程验证。

本批消费快照为Web 8b564c5bdffff2e0ffbff720ebc20effede4c288，承接d6ee85d主题及8c51283会签夹具；推送与保护vite.config.ts的事实沿执行回执，未重新核验远端。

1. 默认蓝色主题的首次进入、确认保存后刷新、恢复默认、预览取消和非法自定义色拒绝，在本批隔离环境中通过；主题本地行为不依赖真实后端，可锁定这些结果。默认主色#2563eb，明确保存偏好保留。
2. U020-26-palette-color通过，本项第二次正式审查核销：蓝/紫取色原文均证明会签rgb(148,95,0)，动态并行分别rgb(37,99,235)/rgb(111,45,255)；青及自定义动态并行分别rgb(8,127,140)/rgb(18,52,86)。固定开始/结束语义色未随品牌色改变。整页像素标准另行保留。
3. 13节点多分支会签选中态的夹具覆盖通过，审批人、意见表单、比例、脚本及监听器已进入可见属性栏；不能把夹具中“起草”等标签视为新增引擎节点能力。
4. F020数据源授权/查询契约、子表弹窗增改排序回写、权限/默认列表，以及W020授权代理创建撤销和取消加签的前端交互，按隔离层级采信。J020草稿转正式提交的事件顺序、取消/失败保留和后处理重试，按变更摘要及组件回归层级采信；七项E2E不含该真实提交链。

本次不裁决F020/J020/W020或整版功能PASSED。真实权限、数据库持久化及同对象跨端链仍需联合验收。21/23/24局部通过、后端G1/G2批次PASSED继续锁定；不归档整版主方向，不改变功能数、P编号或正式基线。

## 原始结果及差异

证据目录C:/Users/hjxch/.codex/evidence-020/f020-j020-w020/：

| 原文 | 本次直接读到的结果 |
| --- | --- |
| web-typecheck-final.log | vue-tsc执行，无错误输出；退出0沿执行回执 |
| web-lint-final.log | **0 errors、1 warning**，e2e/visual/f020-w020-workflows.spec.ts:19:87为prettier/prettier格式提示 |
| web-test-final.log | 210文件通过、1跳过；1839测试通过、3跳过 |
| web-e2e-final.log | 7 passed：主题3、会签选中态1、数据源/授权代理/子表3；启动vite --mode mock |
| web-build-final.log | built in 3.62s；保留依赖注释和插件耗时提示 |

回执“lint 0 warning”与最新原文不同，采用实际0错误/1警告；旧web-lint.log只有命令行，不能覆盖较新的完整结果。此差异不推翻已证明的局部行为，工程清洁度仍待执行方按既有规则处理。仅需处理该格式提示并核对lint，不因回执纠正重跑测试或全量业务。

主题原文位于C:/Users/hjxch/.codex/evidence-020/theme-blue/，本次读取theme-default-blue-final.json、theme-preview-final.json、theme-teal-custom.json、theme-recovery-reload.json、process-designer-blue.json、process-designer-purple.json及process-designer-consensus-blue-final.json等。主要运行URL为http://127.0.0.1:5173/workspace和/workflow/defs/1/design，1920×1080/DPR1。实际截图读取screens/process-designer-consensus-selected-blue-final-1920.png、f020-subfield-designer-blue-1920.png、w020-authorize-rules-created-blue-1920.png。

子表截图可见底层表单文字透出，当前证据无法区分过渡帧与稳定表面问题；记入既有A03稳定画面检查，不据单帧裁定实现缺陷。授权代理页截图仍有数字人员显示、侧栏选中项等文案/导航观感待整版A04/A05收敛，不能把操作E2E通过替代该结论。

## 剩余范围与下一动作

- 前端集成负责人承接Server消费快照6995f88的已交付契约，完成运行查询formKey+fieldKey、设计预览授权及PROCESS_COMPLETED审批通过后语义对接。在合法可用后端环境中完成A09—A16的同对象可见联合链，保持真实身份/租户/发布版本及原操作标识；不重复后端已锁定的G1/G2测试。
- 退回目标/轮次、补签候选、单任务DISAPPROVE和授权代理DTO应先对照已有后端回执，缺失的实际契约由双方核实文字交接；不让无Figma能力的后端凭图猜测。富文本格式和三种节点语义继续保留原规划/协作边界。
- 按既有覆盖清单继续258画框/25组件族及A05文案/帮助/手册，使用同态reference/runtime/diff；整页/内容99%、关键区98%、几何≤1px不变。原P53旧基线的5项失败按已有原因保留，不将本批7项E2E视为其修复证明。
- 前端负责人按既有授权先同步knowledge，再投影受影响摘要及根文档/Git；本次唯一口径为“前端局部行为通过，U020-26已核销；整版IN_PROGRESS；lint实际1警告；真实联调及视觉剩余继续”。本审查由规划先维护memory摘要，knowledge传播待执行方回执核实。

尚未提交的整版工作属于继续实施，本次不把它们作为同一正式失败项新增轮次，也不新增证据格式门槛。

总7阶段：已完成1需求评估；进行中1分支实施；未开始5验收与信息同步、开发分支合并、0.2.0发布、发布后同步、结束。0.2.0已确认。
