# i5-04 证据包对象索引（初始化）

> 采集时间：2026-09-13（+08:00）
> 目的：固定 iteration-04 的对象身份与初始候选；本文件只记录非秘密摘要。

## 候选与环境

- Server 初始 SHA：`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`
- Web 初始 SHA：`5788ead33c4347214a350d124331237e85068bdf`
- Server 环境：dev/test 可控夹具；验证码按 Owner 指令固定使用 `1234`
- 数据库：每个批次独立启动，优先 H2；需要 PostgreSQL 证据时固定单个嵌入式 PG 实例
- 浏览器：真实 Chromium IAB；PC `1280x720`，移动 `375x812`

## 固定对象身份

| 对象 | 固定身份/摘要 | 原子项 |
|---|---|---|
| 租户状态 | 默认 `0`、有效非零 `100`、停用 `200`、过期 `300`、时间过期 `1000` | G1/G2/G4/G6/G7 |
| 用户 | `1`(t0 admin)、`9001`(t100 admin)、`9101`(t100 无权)、`9301`(t300)、`9401`(t1000) | G1—G7 |
| 表单业务键 | 每批次生成同一 `formKey`，双租户分别创建；对象 ID 在采集文件中落盘 | G1a/G1c |
| 工作台布局 | `(tenant=0,user=1)` 与 `(tenant=100,user=9001)`，使用不同 marker | G1c/G4b |
| OpenAPI | 有效租户 `100` 与过期租户 `300` 的已登记应用；仅记录 app/secret 摘要 | G2a1 |
| IoT/异步 | 真实登记设备、生产者、信封与 correlation 摘要；不使用匿名/未知路径替代 | G2a2/G2a3 |
| SSO Provider | `WECOM`、`FEISHU`、`DINGTALK`；state/code/subject 只记录 digest | G5/G6 |
| 审计 | 两租户、有权与未停用无权用户；事件 ID、result、external digest 前缀 | G7a |

## 证据约束

- 每个原子项独立文件；包含 request/response、租户/主体、SQL before/after、正反断言、清理结果和未覆盖边界。
- 不复制历史失败输出中的敏感哨兵；不写出真实 secret、code、token 或完整外部主体。
- 最终候选确定后追加 `oldSHA..finalSHA` 影响清单；manifest、verify stdout/stderr/exit 独立落盘。
