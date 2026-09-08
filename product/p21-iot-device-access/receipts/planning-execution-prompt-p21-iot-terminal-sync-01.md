# P21 阶段三验收补证提示 01

> 日期：2026-09-08  
> 唯一依据：`planning-review-terminal-sync-p21-iot-01.md`  
> 原阶段三方向：`../ready/direction-p21-iot-device-access-terminal-sync.md`  
> 本提示为当前唯一补证入口；功能实现提示01—06和completion01—08仅作历史证据

## 一、失败诊断与边界

这是首次阶段三证据补充。删除全部业务、清单值选择和状态同步动作；原子化为TS1全文回读与TS2机器终态；替代路径是只复制已同步文件并执行只读校验；提交条件由文件清单、manifest、机械提取与Validator退出码判定。

规划方向没有预先写明禁读文件的附件格式，属于规划口径遗漏，不计业务或同步失败。不得借补证修改已同步值、重跑验证或重新进入实现。

## 二、唯一剩余原子

| 原子 | 正向断言 | 反向断言 | 最小充分证据 | 合法停止条件 |
|---|---|---|---|---|
| TS1 | Planner能从原样副本复核44、46/22/22、M08 10/1/2、P21核销、I14关闭、四组基线、活动功能无、下一动作等待Owner | 副本不得是摘要重写；manifest不得漏文件；不得修改源文件来迎合回执 | `evidence/terminal-sync-02/` 下规定副本、`manifest.sha256`、`manifest.verify.log`、`checks.log` | 仅源文件不存在或读取失败，且只读排查穷尽时如实报告 |
| TS2 | 新回执末行是现行终态契约允许的阶段三提交载荷，Validator对该精确JSON exit=0 | 不得手写另一份近似input；不得在Validator后修改回执 | `terminal-input.json`、`validator.stdout.log`、`validator.stderr.log`、`validator.exit`、新回执末行 | 现行契约明确拒绝阶段三状态且无合法字段组合时，保留真实诊断，不伪造通过 |

## 三、固定附件清单

在 `product/p21-iot-device-access/receipts/evidence/terminal-sync-02/` 原样复制：

- `knowledge__current-status.md`
- `knowledge__session-handoff.md`
- `knowledge__features__p21-iot-device-access.md`
- `knowledge__feature-reconciliation-index.md`
- `knowledge__known-issues.md`
- `server__功能清单.md`
- `todo__requirement-pool.md`
- `memory__README.md`、`memory__state.md`、`memory__features.md`、`memory__handoff.md`、`memory__issues.md`、`memory__constraints.md`、`memory__decisions.md`、`memory__architecture.md`

`manifest.sha256` 必须覆盖上述15个副本并排除自身。`checks.log` 至少输出：副本数、manifest校验退出码、功能数、清单三类计数及总数、M08十三行逐行状态、P21/I14、四组基线、活动功能、唯一下一动作、阶段三方向仍在ready、秘密精确扫描零命中。历史文字命中不算当前冲突，须显示上下文分类。

## 四、允许与禁止

- 允许读取：原阶段三方向、复核01、回执01、实际已同步文件及现行终态校验入口。
- 允许写入：上述证据目录和 `terminal-sync-p21-iot-device-access-02.md`；除为了追加当前补证回执指针而确有必要外，不修改已同步业务状态。
- 允许命令：文件复制、哈希、只读文本提取/计数、终态Validator。
- 禁止：代码/数据库/浏览器/Broker/API/编译/测试/构建/迁移/部署/Git；禁止更改44、46/22/22、P21、I14、M08、基线及下一动作；禁止移动阶段三方向。

## 五、执行顺序与提交门禁

1. 原样复制15个固定文件，生成并回读manifest。
2. 仅从副本机械生成`checks.log`。
3. 写完 `terminal-sync-p21-iot-device-access-02.md` 正文和唯一机器终态末行并冻结。
4. 从冻结后的末行提取 `terminal-input.json`，运行现行Validator并保存stdout/stderr/exit。
5. 比较 `terminal-input.json` 与回执末行逐字一致，再次校验manifest；此后不得修改回执和副本。

全部满足才提交：15个副本齐全且manifest全OK；目标值全部可从副本复算；memory副本体积符合门槛；新回执只有一个终态机器末行，input与末行一致且Validator exit=0；没有修改状态值或重跑业务。

新回执路径：`product/p21-iot-device-access/receipts/terminal-sync-p21-iot-device-access-02.md`。状态保持 `COMPLETED（待规划确认） / TERMINAL_SYNC_SUBMITTED`，不得写“规划已确认”。

