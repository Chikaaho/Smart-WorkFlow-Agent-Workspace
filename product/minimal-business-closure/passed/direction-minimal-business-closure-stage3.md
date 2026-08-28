# Owner 最小业务闭环阶段三终态同步方向

> 本会话角色：规划（Planner）
> 前置裁决：`minimal-business-closure` 功能级 `PASSED`
> 任务性质：只做终态同步，不修改业务代码，不运行或重复测试
> 终态复核：`PASSED`（2026-08-28，已归档；不得再次执行）

## 一、唯一终态值清单

以下值必须逐字落实，不得由执行角色重新计算、替换或解释：

| 字段 | 当前值 | 唯一目标值 |
|---|---|---|
| 正式功能状态 | `PASSED` | `COMPLETED`（待规划终态复核） |
| 已完成功能数 | 34 | 35 |
| 清单计数 | ✅31 / 🟦20 / ⬜39 | ✅31 / 🟦25 / ⬜34 |
| P21 | M08 仅骨架、待产品设计 | 部分关闭、未核销；最小腾讯接入已交付，剩余真实账号与物理设备现场联调、原生 MQTT、完整设备管理 |
| 后端正式基线 | 915/0/0/0，agent 346 | 915/0/0/0，agent 346 |
| 前端正式基线 | 108 files / 1039 tests | 109 files / 1050 tests |
| 迁移基线 | H2 V39 / PostgreSQL V39 | H2 V41 / PostgreSQL V40 |
| 活动功能 | `minimal-business-closure` | 无 |
| 阶段三期间唯一下一动作 | 执行本方向 | 规划终态复核 |
| 终态复核通过后的下一动作 | — | 规划比较并选择下一唯一正式功能 |
| 流程子方向 | `product/minimal-business-closure/passed/direction-process-first.md` | 保持原位 |
| 腾讯 IoT 子方向 | `product/minimal-business-closure/passed/direction-tencent-iot-device-control.md` | 保持原位 |
| 本终态同步方向 | `product/minimal-business-closure/ready/direction-minimal-business-closure-stage3.md` | 执行落值后仍在 `ready/`；规划复核通过后移至 `passed/` |

## 二、功能清单唯一晋级项

只允许以下五项从 ⬜ 晋级为 🟦，不得把任何 M08 项写为 ✅：

- `M08-F01-02` 腾讯 IoT 配置：部分完成。
- `M08-F02-01` 设备维护：部分完成。
- `M08-F02-02` 状态监控：部分完成。
- `M08-F04-01` 按钮发送：部分完成。
- `M08-F04-04` 消息日志：部分完成。

其他 M08 明细保持原状态。同步清单表体、表头/注释计数和 M08 模块说明，清除旧焦点与“腾讯接入路径待补全”的绝对表述；必须保留真实账号、物理设备、原生 MQTT 和完整设备管理尚未完成的边界。

## 三、知识与需求池同步

- 将 `knowledge/current-status.md` 更新为单一最新快照；旧 M05 快照完整迁入 `knowledge/history/`，当前文件不得保留旧活动功能、旧下一动作、旧基线或旧迁移口径。
- 新建或更新 `knowledge/features/minimal-business-closure.md`，记录正式功能目标、功能级验收、腾讯 IoT Demo 边界、最终状态和证据路径。
- 更新 `knowledge/session-handoff.md`，明确功能已完成、当前无活动功能、下一动作是规划选择下一正式功能。
- 将 `knowledge/known-issues.md` 的 I14 更新为部分关闭：最小腾讯接入已交付，真实账号和物理设备现场联调继续开放。
- 更新 `todo/requirement-pool.md` 的 P21 为部分关闭但不核销；不创建新的重复 P 编号。
- 清除当前入口中旧 M05 最近任务、旧流程执行提示、旧腾讯补证提示和 `VERIFYING`/`FAILED` 残留；历史回执中的历史状态不修改。

## 四、memory 压缩唯一目标

同步前字节数锁定为：README 437、architecture 341、constraints 503、decisions 494、features 441、handoff 636、issues 325、state 926，总计 4103。

同步后上限固定为：

| 文件 | 最大字节数 |
|---|---:|
| `memory/README.md` | 512 |
| `memory/architecture.md` | 512 |
| `memory/constraints.md` | 768 |
| `memory/decisions.md` | 768 |
| `memory/features.md` | 768 |
| `memory/handoff.md` | 1024 |
| `memory/issues.md` | 512 |
| `memory/state.md` | 1536 |
| 总量 | 8192 |

回执必须报告每个文件同步后的实际字节数、总量、保留摘要和移除范围。memory 只保留 `COMPLETED`、正式终态值、现场联调边界和下一动作，不复制完整证据。

## 五、禁止事项

- 禁止修改业务代码、测试、迁移或依赖。
- 禁止运行 Maven、pnpm、数据库迁移或任何业务测试。
- 禁止重新验收流程主链、腾讯 IoT 或最终补证。
- 禁止修改历史回执中的历史状态。
- 禁止把真实腾讯账号和物理设备联调写成已完成。
- 禁止新增 P 编号、改变清单其他明细、使用统一迁移版本或自行调整任何目标值。

## 六、回执要求

执行回执必须逐项给出：实际写入文件、唯一目标值落实矩阵、旧状态零残留检查、清单行级变化、P21/I14 边界、memory 压缩前后字节数和合法 `TERMINAL_SYNC_SUBMITTED` v2 终态。功能实现与测试证据保持锁定，不得重新提交。
