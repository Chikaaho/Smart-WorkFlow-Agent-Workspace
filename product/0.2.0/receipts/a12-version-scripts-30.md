# A12 版本脚本并列：旧/新发布对象各用自己的触发器

2026-10-26｜Executor｜批次30，对应 A12 版本/脚本并列与节点触发器真实执行；补批次27 仅验证“快照含脚本”而未验证“首节点是否执行”的缺口。

## 变更

- Server `49c320f..83f58d0`（`codex/0.2.0-tenant-form-flow`，已推送）：
  - `ProcessStartService` 在实例落库后补评估当前活跃任务的 `NODE_ENTERING` 触发器。
  - 根因：引擎在 `startProcess` 返回前创建首个审批任务并回调 `ApprovalTaskListener`，此时 `sw_bpm_instance` 尚未保存；`NodeTriggerEventPort.onNodeEntering` 按 processInstanceId 查不到实例，静默返回 empty，首节点脚本从未执行。后续节点因实例已存在不受影响。
  - 补评估按当前任务的 `taskDefinitionKey` 去重执行；`execKey` 唯一约束保证与监听器重复回调时幂等。异常不阻断发起主链。
  - `ProcessStartServiceTest` 新增首节点补评估用例，并显式回填可选端口。
- Web 本批零改动；`vite.config.ts` 未触碰。

## 真实链（PG 18.4，t100admin@租户100）

1. **旧发布对象用旧脚本**：v2 实例 `8c0b39b7-d06b-11f1-8452-00ff9e2a8dfb`（defVersion=2）的 `sw_bpm_trigger_exec` 只有 `tg_a13_marker / PROCESS_START` 一行，结果 UNMATCHED（脚本返回 null）。该版本图没有 node_1 节点触发器，实例也没有执行节点脚本。
2. **新发布对象用新脚本**：v7 实例 `e9e0cb29-d0b4-11f1-a397-00ff9e2a8dfb`（defVersion=7）实际执行 `node_enter_node_1 / NODE_ENTERING / node_1`，`result_value=true`，UNMATCHED 说明“返回 true 但未配置分支”，不是未执行。
3. **修复前后对照**：同一 v7 的修复前实例 `9225574e-d0b3-11f1-ab27-00ff9e2a8dfb`（04:35 创建）`sw_bpm_trigger_exec` 为 0 行；修复后实例 `e9e0cb29...`（04:44 创建）有 1 行 NODE_ENTERING。说明补评估真实生效，不是只改了快照 JSON。
4. 旧 v4/v6 实例保持各自 `def_version` 与通知/触发器快照；新 v7 实例使用 v7 快照。旧对象未被新脚本追溯。

## 门禁

- Server 聚焦：`ProcessStartServiceTest` 6/0 + `TriggerExecutionServiceTest` 23/0，共 **29 通过/0 失败**（`/tmp/server-trigger-test-30.log`）；bootstrap-dev.jar 重建并成功启动（Started 17.27s，8080 监听）。
- Web 沿用批次29 四连 **215 文件/1871 通过/3 跳过/build 3.83s**；本批 Web 零改动，未重复跑全量。

## 未验证/边界

- 表单对象的新旧脚本并列：`a11_events_probe` 当前只有一个发布快照（form_version=2），没有可对照的旧发布快照；本批只闭合流程发布对象的旧/新脚本并列，不把表单侧说成已对照。
- 首节点触发器补评估覆盖串行首个任务与并行多当前节点；本批真实链只跑了单节点流程，未造并行网关首节点链。
- 节点脚本 `return true` 的结果为 UNMATCHED（无分支），未验证有分支时的 matched 处置。
- 修复后截图仍受宿主 surface/rAF/OS 捕获限制，无 PNG；A03—A05 正式像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
