# P59 第四轮规划验收

日期：2026-09-04；Planner。状态：**VERIFYING**。本轮本地剩余工作收敛为两项，真实发布仍为授权依赖。

输入：提示02、`supplement-p59-03.md`、`evidence-03/`及恢复后的两份旧workflow附件。Planner实际回读SHA256清单17/17通过，解析对象表和候选JSON，并核对验证脚本及八份运行日志。没有运行这些工程/发布脚本。

## 1. 新增锁定项

- **A1b通过**：实际diff已明确工作区clone使用develop-sw，两个代码仓指定原本地目录名。命令与后续入口的目录/分支矛盾已消除。本地clone附件仍为摘要，接受范围是本次可直接审查的说明修正，不将其冒称为联网clone验证；该低风险说明无需为补格式再跑clone。
- **H1通过**：Planner从实际附件字节重算Git blob：恢复后Server为`d91bb60e8f0af8c6b68eb3a617921217762cd4ab`，Web为`99b8f829cbba5100a6d68599d923f0e0e5d84161`，与声明原来源一致，内容恢复为此前已审查版本；新证据独立保全6afe910/d6becd0副本，blob分别为`63ab0b31617281cbb994e5f6af990e90dbd39a99`、`8b590fec1aad1c78ffaead8ca370e2081bec417b`。
- **C1b2普通项锁定**：TSV实际211删除、11恢复、25保留，路径集合与原附件双向差集均空。209删除行源/保留blob一致；11恢复和25合法保留行对象均相等。后续只补两个演进例外，不再要求输出247行。
- **D3a/E2固定候选核销**：JSON六分支计数6+1+1+5+1+3=17；完整SHA、提交列表和name-status齐备。分类为docs8、fix2、ci7；候选范围符合P59。工作区develop-sw实际47文件（3M+44A），正文的“10”是过期转录，直接以机器清单为准，不因此重开实现或要求重新提交整个包。候选外规划文件已披露，此处只核销当前固定候选，不授权推送。
- **D2b拒绝路径部分锁定**：两仓conflict和queryfail日志均有真实完整SHA、发布段exit1、gh调用0；conflict结束tag仍为原S2。该四个局部行为无需默认重跑。日志中的工作流指纹为Server `ab46b1fe96ef2f3e19b8c9e8e72c7e51b29ad36e428611e1055d849debbfb03c`、Web `f31aa7e4f672b4a4d19af3a01567435c0d651b50907f8a2db9835e6180c0081f`，最终完整源码绑定仍由下项补全。

既有E1、B1、C1a/C1b1、D1后端957/0/0/0、A1a、D2a继续锁定。

## 2. 两项本地剩余缺口

### C1b2-ex：两个演进内容保存点

机器表仍将这两行标为当前blob不同；尾部所谓“机器证据”仍使用`474b8e00...`和`b9783c38...`，未提供实际完整对象查询及祖先可达结果。

只需补：

1. `knowledge/features/p57-bpm-node-extension.md`：给出`b2311d72ad1eaa2ded00e1b2ea5252976bb986af`同路径对象等于`474b8e00440ae5229cdcee6123a27945a636aea7`，并证明该提交可从`0712bb9ed2b888252d4d8be6fe431610e269ddc0`到达。
2. `knowledge/session-handoff.md`：给出保留点`0712bb9ed2b888252d4d8be6fe431610e269ddc0`下`knowledge/history/session-handoff-before-knowledge-full-reconciliation-20260904.md`对象等于`b9783c3844fcaafef3a3f28bf7c8c32e8c217841`。

这是缺原始证据，不是已证实丢失。不得因此重新整理main。

### D2b-asset：验证抽取完整性与产物参数

`d2b-sim-script.sh`正则要求发布段每行必须以换行结束。当前保全workflow副本无EOF换行，Planner用同一正则对副本进行纯文本抽取，确认最后一行产物参数被漏掉；四个fresh/rerun日志的`GH_CALL create`也全部止于notes，没有jar/zip参数。脚本还未保存最终6ab9ae5/f9dca42的完整workflow副本，只有指纹。

因此这四个运行只能证明部分tag/Release命令控制流，不能证明已执行完整发布段或传入资产。诊断为**验证工具截断/证据不完整**，不是已确认真实工作流漏发产物；不要求先修改产品实现。

修复抽取方式，保存最终源码副本/抽取段/指纹；只补两仓fresh和rerun四个完整发布段运行，核对create实际收到产物参数，替身检查文件存在并在缺失参数时失败。允许隔离非空样本文件，不将其冒称正式构建产物。D3b仍另需真实GitHub运行。

## 3. 当前入口

下发`planning-execution-prompt-p59-03.md`为唯一剩余入口，替代提示02。其余计数/说明问题由本审查定值，不增加待办。当前本地仍有两项可执行补证，暂不请求发布授权；完成后可围绕已固定六分支17提交评估发布请求。

P59不核销、不归档、不进入阶段三；41业务功能和已锁定基线不变。
