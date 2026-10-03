# RA03b 四视口可见浏览器取证（2026-10-04，隔离自建夹具）

环境=dev后端（仓库dev契约密钥+自生成隔离注入项，H2内存库，18080；启动配方见 evidence-04/ra03b-browser/fixture-startup-resolution.txt）+ web vite dev(15173, proxy→18080)。进程为自建隔离夹具，取证后停止并登记。

会话链（真实可见浏览器，headless=false）：
1. 01-login-form-captcha-1234.png：登录页实际渲染，视觉读取验证码1234，admin/admin123 填入；
2. 登录成功跳转 /workspace（会话身份=系统管理员）；
3. 02-policy-console-empty-list.png：资源策略台（/workflow/resource-policy，菜单'资源策略'）实际渲染，创建表单预填合同画像值；
4. 真实交互：点击'创建版本'→策略版本表出现行『1 草稿（未启用）2000/800 400/400/1200 50/500 16/8』=03-policy-v1-draft-created.png（网络同对象：POST /api/workflow/resource/policy → 列表GET回读）；
5. 真实交互：点击'启用'→启用检查未通过弹窗原文：『异步节点必需消费者未启用：flowable.async-executor-activate=false…；批量消费者未启用：BATCH_INVOKE 处理器未注册（sw.bpm.txn-batch.enabled=false）…；预算与连接池明显不相容：实际池上限 5 < 所需下限 34（实时16+异步8+调度2+余量8）』=dev默认画像(pool5/async OFF)下RG04无效启用明确拒绝的真实UI行为；
6. 资源积压与配额页（/workflow/resource-backlog）：积压汇总/计数勾稽『与事实一致（计数0）』/命令明细（本隔离夹具无在途对象，如实显示空）+拒绝审计表头；viewport-1920x1080-backlog.png。
7. 四视口：viewport-{1920x1080,1280x720,1366x768,1024x768}-policy.png 实际URL=/workflow/resource-policy、会话身份、策略行同对象可见可交互。

边界：本夹具为迁移种子库（无P62测量夹具表单），命令明细为空=如实呈现，非空命令明细由RA03a2真实HTTP矩阵承载；启用拒绝为dev默认画像的合同行为（RG04），非缺陷。

recordedAt=2026-10-04T01:57:27+08:00
