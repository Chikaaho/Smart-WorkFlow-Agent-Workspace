# 0.2.3 原范围验证继续执行提示 02

2026-11-05｜Planner。依据planning-review-lifecycle-023-02.md及execution-lifecycle-023-05.md。替代提示01作为唯一剩余动作入口；主方向direction-023-agent-execution-lifecycle.md不变。无新增search、无新增产品功能。

## 先复用、再补剩余

先定位.runtime-lc023所属绝对路径和已有原始输出；把必要结果保存到product/0.2.3/receipts/assets/或其他规划允许路径，完整保留，不要求独立证据包。不能因日志位置不合适重跑已成功行为。已删除/覆盖的输出如实标明，结合回执实际结果判断，不伪造原日志。

已过锁定：PG基础受理、同键幂等/冲突400、SUCCESS后取消保持、STATE事件补取；三格式可控协议增量；受控取消恢复夹具；START→END成功与详情刷新结果。只在真实实现改变影响时复验并说明。

剩余动作严格限审查02表：
- LC023-01：原核心标准中用户/租户与订阅权限、真实重启恢复、容量拒绝、无法立即中断调用的状态/资源边界。已存在结果先引用，没有才做有界验证。
- LC023-02：固定两Key可控对端核实运行时429轮换/冷却和已输出不重放；一条真实供应商增量。禁止读取/复制用户库密钥；允许使用已授权配置正常调用，若隔离库需凭据请Owner在页面输入，不在聊天或文件收集。该单项待输入不阻塞其他验证。
- LC023-03：仅持续增量graph的headed展示、断线接续、运行中取消、持久回查。可控对端限定输出条数和结束条件；保存截图、对象和请求结果，不新增视觉阈值，不重复快图验证。
- LC023-04：仅原候选同步兼容、调试运行stop后的新工具调用次数、异步RAG与实际代理流式路径。按实际变化运行必要门禁，保留Notify全量失败原义，不扩修无关通知。

执行自行选择最小充分实现/验证方法，准确声明集成夹具、真实API与真实供应商层级。不启动不可控后台、不用sleep等空转；只管理已确认的任务自有进程、worktree和测试库，不停止用户服务。方向内可执行项全部完成后再交回，不把“服务未启动”“无预存登录态”当外部阻塞。

追加回执按LC023-01—04区分已锁定/本次结果/具体剩余；七阶段保持1/1/5，勿称只剩密钥除非非秘密项确已全部证明。Planner不读代码或完整diff。核销、清单数和正式基线不变。

```planner-convergence
{
 "schema":"agent-coding-engine.planner-handoff.v1",
 "feature":"0.2.3",
 "revision":2,
 "previous_revision":1,
 "decision":"CONTINUE",
 "source_receipt":"product/0.2.3/receipts/execution-lifecycle-023-05.md",
 "items":[
  {"origin_id":"LC023-01","subject":"核心生命周期剩余边界","criterion":"A01/A04/A05/A06","status":"OPEN","failed_rounds":2,"evidence":["execution-lifecycle-023-05.md:50-58","execution-lifecycle-023-05.md:81-89"],"scope":{"targets":["候选权限与订阅","重启状态","容量与中断边界"],"allowed_actions":["复用已存结果","只补剩余有界运行","修复原断言差异"],"forbidden_actions":["重跑基础幂等链","清用户库","批量停止用户服务"],"constraints":{"已锁定":"受理/幂等/冲突/终态后取消","范围":"审查02剩余表"}},"acceptance":["剩余权限/恢复/容量/中断原断言有明确实际结果"]},
  {"origin_id":"LC023-02","subject":"运行时轮换和真实供应商","criterion":"A03/A07","status":"OPEN","failed_rounds":2,"evidence":["execution-lifecycle-023-05.md:91-104","execution-lifecycle-023-05.md:119-123"],"scope":{"targets":["两Key运行时","一条真实供应商链"],"allowed_actions":["可控429次数验证","授权供应商正常调用","必要时请求页面录入凭据"],"forbidden_actions":["重跑三格式装配","读取复制密钥","以客户端429替代轮换"],"constraints":{"Key":"固定两Key可控对端","已锁定":"三格式可控协议增量"}},"acceptance":["轮换冷却和已输出不重放成立","真实供应商链或准确外部输入依赖"]},
  {"origin_id":"LC023-03","subject":"持续增量与取消可见链","criterion":"A03/A04/A08","status":"OPEN","failed_rounds":2,"evidence":["execution-lifecycle-023-05.md:106-117"],"scope":{"targets":["持续增量graph页面"],"allowed_actions":["headed增量/断线/取消验证","保存可回读视觉制品"],"forbidden_actions":["重跑快图成功链","以START-END冒充流式","新增像素要求"],"constraints":{"headless":"false","对端":"有界可控流式"}},"acceptance":["持续增量、接续、运行取消及持久结果可判定"]},
  {"origin_id":"LC023-04","subject":"剩余兼容与结果定位","criterion":"A07/A08及方向第五节","status":"OPEN","failed_rounds":2,"evidence":["execution-lifecycle-023-05.md:26-36","execution-lifecycle-023-05.md:72-77"],"scope":{"targets":["已有日志","同步兼容","调试stop工具次数","异步RAG","代理流式"],"allowed_actions":["定位保存已有输出","仅补未证明行为","必要受影响门禁"],"forbidden_actions":["为路径重跑门禁","扩修Notify","改写全量失败"],"constraints":{"既有输出":"完整且注明所属目录","范围":"原候选受影响链"}},"acceptance":["兼容剩余断言有可回读行为结果"]}
 ]
}
```
