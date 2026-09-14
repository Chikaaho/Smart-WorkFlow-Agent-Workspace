# G7b 实际结果（db-backread.txt + baseline-build-boot.log + upgrade-boot.log）

## 正向
- 真实 PostgreSQL 18（docker postgres 容器）从受支持旧基线 V87（pre-I6 schema：sw_notify_message 无
  event_type/template_id 等列）携带既有历史升级至 V92（≥ 方向要求的 V90 终点；V91/V92 属本轮候选迁移）
- 同 ID 可解释：90001/90002/90003 三条既有消息升级后同 ID 在表且可读；V89 I6 收口迁移把既有事件回填为
  SYSTEM、投递状态原样保留（90002 FAILED 保留、失败尝试 90012 保留）；模板 90011（enabled 语义随 V92
  boolean 迁移转换）、流程历史实例 90020 同 ID 保留
- 不重建：V87 基线的历史迁移行保留在 flyway_schema_history（V87 applied=1）；升级阶段无 DROP/重建
- 不删失败数据：deleted=0（无任何消息被删除），FAILED 消息/尝试保留

## 反向
- 旧脚本代克隆库（V11 形态）直接升级在 V13 失败（表名漂移），如实登记为非受支持基线，未伪造升级成功

## 覆盖边界
- 受支持基线取现行脚本 V87 时点（pre-I6 最近锚点；V88/V90 不存在于 PG 链版本序列）
- 迁移前历史数据为按旧形态回灌的固定 ID 集（与旧克隆 pre-ids 同 ID），非旧库全量拷贝
