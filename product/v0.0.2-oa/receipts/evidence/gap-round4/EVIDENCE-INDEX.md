# v0.0.2 OA gap-round4 evidence index

采集日期：2026-09-07；执行角色：Executor；唯一生效 API 原始流：`api-r4-final.txt`。

| 原子 | 生效证据 | 结论 |
|---|---|---|
| R2a 精确实例筛选 | `api-r4-final.txt` exact/miss；HTTP 200；total=1/0；未认证控制 HTTP 401 | `processInstanceId` 等值过滤成立，未认证仍被安全链拒绝 |
| R2b 同时刻稳定分页 | `api-r4-final.txt` page1/page2/page3/page1-repeat；两条 `createTime` 完全相同 | page1=`990002`、page2=`990001`、page3 空，重复 page1 同序；总数=2 |
| R2b 数据库定向测试 | `CopyRecordMapperIntegrationTest` 2 tests passed | 同时刻 tie-break `id DESC` 与空第三页由 Mapper 集成测试复核 |

本轮运行使用一次性 file-H2 与 loopback dev profile；临时服务已停止，临时认证材料未写入此包。旧 `gap-round3` 文件保持历史原样，本索引不引用其已被纠正的 R2 结论。
