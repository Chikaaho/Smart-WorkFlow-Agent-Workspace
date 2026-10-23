# U020 资源运维动态说明

2026-10-23｜Executor｜XL｜实施中

总7阶段：已完成1「需求评估」；进行中1「分支实施」；未开始5「验收同步、合并、发布、发布后同步、结束」。A03/A04/A05整体未通过。

Server `8d816388ca5e465bf1971d6fceaba8b45ed23f21` 已推送并回读origin/codex/0.2.0-tenant-form-flow同SHA。2文件：资源运维服务的6处展示说明与既有真实HTTP回归。将测量报告/10分钟正式保障窗口、开发编号RG04、内部类名及CAS机制改为当前时点统计边界、占用核对、启用配置检查、死信排查和公平调度说明。保留命令完成/流程启动/目标完成的不同口径，目标未完成的轻流程继续占用；权限、查询、指标字段、受理和释放条件均未变。此处仍沿用既有后端中文说明出口；资源页其他语言和全量文案未据此视为覆盖完成。

真实HTTP测试P62ResourceOpsAuthPgTest通过3项、0失败/0错误/0跳过，包含合法管理、只读/无权限拒绝、非空跨租户读取及持久审计，显式启用原有手动开关，仅使用该测试创建的独立嵌入式PostgreSQL。命令为2G Maven、sw-bootstrap及依赖、指定该类、p62.ra03.auth=true，原始输出`C:/Users/hjxch/.codex/evidence-020/e2e/server-resource-http-17-02.log`，执行清单同名前缀JSON、XML；57.92秒、exit0。HTTP/SQL取证原文`resource-http-17-02/`。

首轮实际执行3项、1失败，72.99秒exit1，日志`server-resource-http-17.log`、原XML`server-resource-http-17-initial.xml`。失败是历史测试仍要求异常fallback中的详细“保留份额不自洽”出现在HTTP正文，而实际既有消息目录返回统一2430提示。修正为HTTP错误码2430和既有errorKey，同时增加独立审计表断言：当前拒绝策略ID、ENABLEMENT及详细份额原因恰好1条。没有放宽拒绝或删除落库核验；另两条隔离/授权测试继续执行。测试属于ISOLATED_REGRESSION，不代替正常身份可见页面。

包装`server-package-17.json`、`server-package-17.log`为当前提交8d81638，exit0、24.47秒。正常W020审批人1/租户0、headless=false、1920×1080/DPR1在`/workflow/resource-backlog`读取当前统计及两条新说明，并点击刷新。当前未完成命令/工作量均0、计数与事实一致，8已完成/1失败和真实命令明细继续显示；没有启用策略或提交任务。可见索引`resource-runtime-ui-evidence-17.json`、截图`screens/u020-resource-runtime-1920-17.png`、网络`backend-17.log`。其余4处运行画像说明本轮只取得工程/HTTP覆盖，不把积压截图扩大为全部6处可见验证。此前完整反应堆及P64修正复验见回执`u020-server-messages-gates-15.md`；本次只有6处静态消息和1处测试断言衔接，采用受影响的真实HTTP行为链验证，没有把旧完整运行或32跳过改写成本次结果。未改变正式基线与P核销。
