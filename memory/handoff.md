# 交接

2026-11-07｜Executor（同步）｜本机READY 1.3.4。

## 当前

三示例流程返修 G1—G6 已交付：回执 `product/three-sample-process-uat/receipts/execution-final-02.md`，待规划验收。返修版本号 0.3.0（Owner 已确认）同版本覆盖：Server main `a0ac3a1a`（CI 42326868207 success）、Web main `420e0f9`（CI 42326879133 success），tag `0.3.0` 重指（Server tag 对象 `3f4406af`/Web `fbf5aa3`），Release 资产替换为 CI 制品（Server jar sha256 `0ca4dcc3…`、Web zip `c3728e6d…`，说明含覆盖记录），releases/latest=0.3.0；UAT 运行包与 Release 资产同字节、build.version=0.3.0、health UP、Flyway v0.2.9、磁盘 931M（96%）。代码改动：G2 详情/关系端点回传引擎 formData（Server `a05fb7f4`）+ Web fallbackRecord 回退（`c5eac9b`）；G4 知识库卡片真实数量（同 Web 提交）；G5 字典化与 G1 通知 bizId 为配置级（UAT/本地已同步，图 v5）。上一交付 0.2.4 COMPLETED（7/0/0），终态复核 `product/0.2.4/receipts/planning-final-review-024-completed.md`；方向与同步方向均归档 `product/0.2.4/passed/`。新会话从 `memory/state.md` 与 `todo/requirement-pool.md` 观察区选题。

## 0.2.4（历史）

过程：方向→执行01方案/02自验→审查01（7过7未过）→提示01→执行03→审查02（剩3）→提示02→执行04→审查03 PASSED→Owner确认版本0.2.4、功能51→终态同步01+发布链02→终审COMPLETED。能力：IoT规则启动Agent研判、失败升级（级别+双渠道）、Agent内部工具、渠道凭据密文、规则页研判参数；修MQTT订阅/租户上下文/通知前缀/GET入参等缺陷。发布：Server main `41511bd4`、Web main `f4acc3d`，全量2404测试0失败，UAT Flyway v0.2.9。

常规决定：截图本机留存不入Git；执行列表无菜单、冷却抑制、mes_judge_config不参与判定按已登记边界处理。

## 保留与保护

Owner定保留本机隔离环境（`smart_workflow_lc023_01`、`smart_workflow_024_01`、`.lc023-mock/lc023-server-wt`、`.runtime-lc023`、`.runtime-lc024`），已gitignore，只要求不泄露。继续保护Web vite.config.ts在途改动、`smart_workflow_f1v4b`、用户8080/5173服务和秘密。

## 0.2.3（历史）

COMPLETED，7/0/0，功能保持50（Owner确认）。终态复核 `product/0.2.3/receipts/planning-final-review-023-completed.md`。
