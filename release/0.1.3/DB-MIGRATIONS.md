# 0.1.3 数据库迁移说明

## 迁移身份变化

| 项 | 0.1.2 | 0.1.3 |
|---|---|---|
| versioned 迁移 | V1—V102（已应用 102 条） | **单一基线 `V0.1.0__baseline_seed.sql`** |
| 可重复迁移 | R__i6_notify_menu_reconciliation | 不变 |
| 全新建库执行数 | 103（102 versioned + R__） | **2（V0.1.0 + R__）** |
| 终点版本 | V102 | **V0.1.0** |

## 等价性

基线内容 = 原 V1—V104（去重后 PG 102 / H2 104 唯一版本，V63 双副本字节一致）按 Flyway 版本序的逐字节拼接，段头注明来源模块。全新库终态对照（目录项 + 全表数据，时间戳归一、行序无关）：

- PostgreSQL（zonky 17.5）：sha256 `ec5b532e549159c69fa11c505909bed86580c6b1e366b6facbc751c3a610a520`（新旧一致，0 diff）
- H2：sha256 `c5c6bf638dc06af452e398c656c30496eaf7d0fa35e29618a622fa1b62dc4e9b`（新旧一致，0 diff）

证据与生成/归一化脚本：`product/v0.1.3-release/receipts/evidence/seed-squash-01/`。

## 兼容性

- **全新建库**：直接应用（V0.1.0 + R__），生产配置 `baseline-on-migrate: true` 对空库无影响。
- **≤0.1.2 存量库**：不支持原地升级——已应用迁移（V1—V104）在 0.1.3 中无对应文件，`validate-on-migrate: true` 将显式失败（该失败是保护行为，证明无静默漂移）。路径：删除并重建库（见 UPGRADE.md），或停留在 0.1.2。
- 测试夹具：BPM H2 20 迁移冻结于 `sw-bpm-process` test resources（原路径）、bootstrap p4overlap 走 `db/migration/bpm-fixture/h2`；system SSO 三迁移冻结于 `sw-biz-system` test resources。均与原主链逐字节一致，不进入生产类路径。
- devseed V900—V903（仅 dev profile 装载）不变。
