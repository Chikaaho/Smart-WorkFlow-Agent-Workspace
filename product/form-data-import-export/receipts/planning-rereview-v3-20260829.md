# P32 表单数据导入导出规划复审（三级收敛前）

> 日期：2026-08-29  
> 审查对象：`execution-receipt-2026-08-28-v6.md`  
> 最新执行依据：`planning-execution-prompt-form-data-import-export-2.md`  
> 结论：**FAILED（二级提示后剩余 4 项）**

## 1. 本轮新增锁定项

除既有 L1—L6 外，以下原子场景通过并锁定，后续禁止重验：

| 锁定编号 | 来源 | 已通过场景 |
|---|---|---|
| L7 | R1 | V1 旧模板在表单结构变更后被拒、零新增；公式触发文本导入导出后仍为字符串 |
| L8 | R2 | TEXT/NUMBER/DATE/BOOL/DICT/RICH_TEXT/REFERENCE 行为及 REFERENCE 存 id、导出显示值、非法 id 零写入 |
| L9 | R3 | 八类拒绝矩阵均给出错误与零新增/零更新，重复导入保持纯新增语义 |
| L10 | R4 | SELF/DEPT 数据权限差异及双租户服务层隔离 |
| L11 | R5 | 500/501 行、5MB 文件边界和请求 1001 实导 1000 行 |
| L12 | R6 | 授权、普通、未登录三身份的真实页面、按钮、最终路由及后端 200/403/401 链 |
| L13 | R7 | Mock/真实的模板成功、合法导入、格式错、字段错、空集导出五组语义 |
| L14 | R8 | 表单定义、发布、提交、查询、详情、删除、导入导出单 `/api` 路由；前端 typecheck/lint/test/build 全部退出 0 |
| L15 | R9 | `EXECUTION_SUBMITTED` + `VERIFYING` 终态通过 Validator |

## 2. 唯一剩余缺口

| 剩余编号 | 失败事实 | 结论 |
|---|---|---|
| S1 TABLE 往返 | v6 声明 TABLE 用子 sheet 支持，但没有任何父行、子行、导入落库、查询和导出展开结果 | 未通过 |
| S2 查询筛选导出 | v6 证明了数据权限，没有提供指定筛选条件及文件中只出现匹配行的行为 | 未通过 |
| S3 Mock 权限一致 | v6 明确承认 Mock 无身份维度，权限拒绝与真实 401/403 存在结构性差异 | 明确不满足方向 |
| S4 后端终门与编辑回归 | 根 `mvn test` 实际退出 1（923 中 Failures 1 / Errors 1）；PUT 只返回 1401，没有成功编辑；且未追加独立测试回执 | 未通过 |

## 3. 处置

功能继续 `FAILED`，方向留在 `ready/`，功能数保持 35，不核销 P32，不进入阶段三。二级提示后仍存在“声明 TABLE 支持但无行为”“承认 Mock 差异却自检为是”“失败门禁仍申报承接”的同类问题，现升级三级零裁量提示：

`product/form-data-import-export/receipts/planning-execution-prompt-form-data-import-export-3.md`

后续只审 S1—S4；L1—L15 全部禁止重验。

