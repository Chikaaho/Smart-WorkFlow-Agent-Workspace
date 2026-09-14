# P60 I5 阶段实现规划验收 05：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-14  
> 验收对象：`stage-i5-v0.0.3-oa-iteration-05.md`  
> 当前提示：`planning-execution-prompt-stage-i5-tenant-safe-sso-03.md`  
> 结论：**部分通过；I5 保持 VERIFYING**

## 1. 总结论

iteration-05 已从上一轮的 service/mock 摘要推进到真实 HTTP、PostgreSQL、Redis、独立进程和浏览器证据，修复了拒绝审计回滚与匿名票据兑换 500 两项真实缺陷，最终六模块 `658/0/0/0`、Web 四门和 41 项 manifest 回读均通过。除下列缺口外，本轮证据可以锁定。

I5 仍不能判定 PASSED：

1. G3b2 没有完成三级提示规定的 Provider 启动配置矩阵；现有证据只有全禁用正向和三个交错负向。
2. G6a1 声明“无会话产生”，但原始结果只有 binding/role/audit，没有 session/cache 的 before/after。
3. G6b1 没有过期租户场景，也没有解绑导致既有会话在权威装载时收敛的结果。
4. G8 三 Provider 真实官方成功链仍缺官方测试应用、HTTPS 回调域和可控身份，按方向保持 PENDING。

## 2. 规划口径更正

两项不计为执行失败：

- **G1c1 CLOB 回读**：三级提示把“布局 SQL 行”绑定到会对 H2 CLOB 序列化 500 的外部只读通道，属于核对工具限制。两租户同 userId 的 HTTP marker 互斥、布局行 `0→2` 与跨租户对象零副作用构成等强替代；撤回“该通道无 SQL 500”要求，G1c1 通过。
- **G2a2/G2a3 tenant 冲突形态**：实际 IoT/异步入口不接收客户端自报 tenant，租户由认证身份和服务端信封派生。匿名入口拒绝、停用/过期身份无法建会话、异租户对象查找为空/404，以及命令/实例零增量，已覆盖真实存在入口的 fail-closed；不要求人为增加可伪造 tenant 参数或用内部注入替代真实入口。

## 3. 原子项核销

| 原子项 | 结论 | 验收事实 |
|---|---|---|
| G1a1/G1a2/G1b1/G1c1 | PASSED（锁定） | 双租户表单对象、PG 唯一性、非零租户全 OA 链及跨租户拒绝均有真实 HTTP/SQL/PG 结果；G1c1 按 §2 更正采用等强替代。 |
| G2a1/G2a2/G2a3/G2b1 | PASSED（锁定） | OpenAPI 签名+PG nonce、IoT、持久命令队列、租户过期与 Redis 权威重载均有正反行为；G2a2/G2a3 按实际入口语义验收。 |
| G3b1 | PASSED（锁定） | 正确 PG 凭据独立 prod 进程成功，错误用户/密码首因均为 PG 认证失败且秘密扫描为零。 |
| G3b2 | 未通过 | 缺 `enabled=true + 有效非秘密配置` 正向；WECOM 只有 missing、FEISHU 只有 placeholder、DINGTALK 只有 missing，未完成每 Provider 的 missing+placeholder 双负向。 |
| G4a1/G4b1 | PASSED（锁定） | 空角色会话权限/数据范围与五类管理 API 拒绝成立；PC/移动工作台、空菜单、深链安全页与截图成立。 |
| G5a1/G5b1/G5c1 | PASSED（锁定本地/受控边界） | 三 Provider 白名单、state 生命周期、唯一外呼与登录前浏览器入口成立；真实成功链不在本锁定范围。 |
| G6a1 | 未通过 | PostgreSQL barrier 并发、唯一绑定、业务冲突、role 零增量和 DENIED 审计成立；session/cache 零增量只有声明，无原始回读字段。 |
| G6b1 | 部分通过 | 票据一次性、有效/停用租户、Redis 权威收敛、解绑行及 role 零增量成立；缺过期租户与解绑后的既有会话收敛。 |
| G7a1/G7b1 | PASSED（锁定） | 真实 DENIED 审计筛选、权限/租户隔离和本轮秘密哨兵零残留成立。 |
| G8 | PENDING（外部依赖） | 未提供三 Provider 官方测试应用、HTTPS 回调域与可控测试身份；不得以受控失败链替代。 |
| G9a1/G9b1 | PASSED（锁定当前候选） | 最终树 `db8b2555…`、41 项 manifest verify exit 0、Server `658/0/0/0` 与 Web 四门 exit 0 可回读。 |

验收标准 #1—#10、#12、#13、#15—#17 在当前候选上锁定；#11 未通过；#14 的本地页面、普通会话和错误安全态锁定，真实 Provider 登录/绑定/解绑页面闭环随 #11 保持未完成。

## 4. 失败分类

| 缺口 | 分类 | 最新事实 |
|---|---|---|
| G3b2 | 缺证据 / 矩阵不完整 | 已有 4 个进程，要求的三 Provider 有效正向与六个独立负向未齐。 |
| G6a1 | 缺证据 | session/cache 零增量未出现于 observed 或独立原始回读。 |
| G6b1 | 缺证据 | 只执行停用租户；解绑只回读绑定行，没有既有会话收敛。 |
| G8 | 合法外部依赖 | 官方应用、HTTPS 域、测试身份均缺。 |

## 5. 下一动作

当前唯一执行入口改为：

`planning-execution-prompt-stage-i5-tenant-safe-sso-04.md`

该提示仅保留 G3b2、G6a1、G6b1 三项可执行缺口与 G8 外部账本，替代提示 03。下一回执固定为 `stage-i5-v0.0.3-oa-iteration-06.md`；不得重验已锁定项，除非新增实现确实使其快照失效。
