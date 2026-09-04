# P58 执行回执（Z1-Z9）

执行身份：Executor。执行日期：2026-09-04。P58 维持 `VERIFYING`，本回执不是 Planner 验收结论。

## 结果

已完成代码修复、真实运行链证据整理、精确清理以及最终质量门。附件目录中的 Z1-Z9 文件包含本轮字段化原始证据和对象索引：

- [ids-z1-z9.env](/usr/local/projects/Smart-WorkFlow/product/p58-workflow-node-capabilities/receipts/attachments/ids-z1-z9.env)
- [z1-20260904-05.txt](/usr/local/projects/Smart-WorkFlow/product/p58-workflow-node-capabilities/receipts/attachments/z1-20260904-05.txt) 至 [z9-20260904-05.txt](/usr/local/projects/Smart-WorkFlow/product/p58-workflow-node-capabilities/receipts/attachments/z9-20260904-05.txt)

## 代码变更

- Web 参与人策略切换时隔离 FIXED_USER 的 `participantIds` 与其他策略的字符串值，修复浏览器保存/回读串值。
- 默认审批意见在后端补齐 `comment`，保持旧意见契约兼容；v2 意见和初始化字段保留版本信息。
- 会签拒绝改为独立意见结算；并发完成增加乐观锁重试与已处理返回码 2305。
- 条件分支运行期类型错误进入 `FAILED`，不再误走 DEFAULT/End/抄送/通知成功链。
- `prod` profile 排除调试认证、验证 Adapter 和 P58 调试 Adapter 类，生产 jar/classes/resources 扫描无命中。

## 质量门

全后端 `mvn -q test` 退出码 0，151 份 Surefire 报告共 1031 tests、0 failures、0 errors；Flyway H2 15/0/0/0，Flyway PostgreSQL 12/0/0/0。Web `typecheck=0`、`lint=0`（45 warnings/0 errors）、`vitest=117 passed/1 skipped，1108 passed/3 skipped`、`build=0`。三仓库 `git diff --check` 均为 0。生产构建退出码 0，jar/classes/resources 与 Web dist 均无调试 Adapter/fixture 命中。最终专用端口 `15432/18084/5174/5175/5176` 全部 CLOSED。

PostgreSQL P58 作用域逐表查询全部为 0：业务定义、实例、审批动作、参与人快照、分支、抄送、绑定、表单溯源、通知，以及 Flowable 部署、定义、字节数组、运行/历史实例、任务、活动、变量、身份链、评论、附件。动态表 `sw_form_e7d042cvnn`、`sw_form_nhwh67b5r4` 也为 0；Flyway 最高版本为 49。

## 尚未满足的门禁

Z2 按浏览器技能边界未读取 Cookie/localStorage/sessionStorage，因此不声称其内容；Z4、Z8 缺浏览器 UI 动作与 access log 的 method/path/status/requestId 可复核关联；Z5 当前附件缺 ANY/ALL 完整矩阵原始输出；Z7 当前附件缺 Adapter failure/timeout 原始场景。上述缺口未被标记为通过，不能提交 `PASSED` 或 `COMPLETED`。

清理已提交并完成逐表复核；未提交 commit 或 push，未修改既有历史回执。
