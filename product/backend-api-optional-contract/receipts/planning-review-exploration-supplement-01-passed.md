# `backend-api-optional-contract` 补充探索 01 规划复核

> Planner · 2026-09-24  
> 审查对象：`search_fallback/backend-api-optional-contract-current-seams-supplement-01.md` 及其 inventory/reference TSV  
> 结论：**`PASSED`（仅指探索 G1—G4 已闭合，可进入正式方向；不表示代码已实施）**

## 1. 复核结论

补充回执已把回执 01 的暂定口径替换为可复算的当前基线：共扫描 7 个 `-api` 模块，其中 6 个模块存在纳入方法，`openapi-api` 为 0；最终纳入 34 个类型、121 个方法。当前仅 AM-097 已返回 `Optional`，其余 120 个方法进入迁移或退休裁决。

规划侧对 inventory/reference TSV 做了独立只读复算，得到：

- 121 个 ID（AM-001—AM-121）连续、唯一，无缺号和重复；34 个 `module + type` 组合；
- 返回类别合计 121：VOID 24、BOOL 14、LONG 4、BOXED_LONG 1、LIST 30、MAP 4、BYTE_ARRAY 1、STRING 24、OBJECT 18、OPTIONAL 1；
- `missing_sem`、`fail_sem`、`migration`、是否 Optional 的各分类计数均与总结回执逐项一致；
- inventory 声明的生产调用 239、测试引用 230，与 reference TSV 按 ID 复算完全一致；IMPL 152 行对应 49 个实现文件；
- reference 共 621 行，无重复引用行、无非法 kind、无越界 ID；覆盖 120 个 ID，唯一无引用的 AM-004 已明确标为 `NO_MAIN_IMPL(SPI)` 与 `ZERO_CALLER:MODULE_INTERNAL_SPI`；
- 13 个零生产调用方法均有显式分类，且不存在“调用数非零却标 ZERO_CALLER”或“调用数为零却漏标”的情况。

## 2. G1—G4 核销

| 缺口 | 核销证据 | 裁决 |
|---|---|---|
| G1 调用面边界不完整 | 统一纳入 public interface/default 与公开类 public static；补入 `RestrictedExpressionEvaluator` 3 个 static；公开类其余候选为 0；排除规则及 0 候选已显式列出 | 通过 |
| G2 缺少逐方法清单 | 121 个稳定 ID 均具备模块、类型、签名、定义、实现、返回/缺失/失败语义、迁移类别、调用与测试计数；长引用用同 ID reference TSV 关联 | 通过 |
| G3 语义计数不可复算 | 所有分类都可直接按 TSV 字段过滤；方法数及各分类闭合为 121，回执 01 的 118→121、实现文件 25→49 等差异均有原因 | 通过 |
| G4 调用方粒度不足 | 239 个生产调用点按接收者声明类型定位到方法调用；13 个零调用方法逐项标识，链式调用与同名误报已有修正说明 | 通过 |

## 3. 偏差与保留边界

- 总结回执及 7 个较长 TSV 超过“目标 <5KB”。该要求是压缩目标而非证据有效性门禁；文件已按模块/类型拆分，超限原因是保留逐方法路径和行号。此次不要求为压缩而删除证据。
- 零调用分类新增 `UNUSED_FACADE_METHOD` 与 `API_DEFAULT_DELEGATED`，比任务预设三类更精确，没有改变统计口径。正式方向要求对 13 项逐一作保留/删除裁决，保留者不得豁免 Optional。
- `TenantValidityFacade` 的方法引用底层、测试引用的断言强度，以及 AM-035/AM-062 的“缺失或校验错误”边界，不影响当前调用面计数。它们已转化为实施期必须落入 Javadoc 和行为测试的验收项，不再作为重复探索理由。

## 4. 状态裁决

探索阶段由 `PLANNING / EXPLORING` 收敛为 **`READY`**。正式实施唯一入口为：

`product/backend-api-optional-contract/ready/direction-backend-api-optional-contract.md`

执行角色应基于该方向自行形成实施计划；不得把本探索通过误写为功能实现 `PASSED`、`COMPLETED` 或测试已通过。
