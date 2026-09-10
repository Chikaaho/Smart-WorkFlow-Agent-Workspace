# I2 五身份权限矩阵取证（E6/E7 服务端约束）

> 日期：2026-09-10（UTC+8）；执行环境：dev profile 真实运行实例（H2 + Redis）
> 身份装载：真实登录链（challenge → RSA-OAEP(SHA-256) 密文 → 验证码 → login → JWT）
> 依据定义：`fieldPermissions`：`total`/`external_dept` 仅 `role:admin` 可查看/编辑；记录范围角色 `i2_filler` = SELF；动作种子 V68（form:data:submit/edit/delete/query = 菜单 350–353）
> 原始输出：本目录 20—33 号 `.json` 文件（curl 原始响应逐字节落盘）

## 对象（object-map.txt）

- 表单：`i2_live_20260909b`（FORM_ID=7347120a-…，PUBLISHED，15 字段）
- 身份：admin（超管）、filler1（i2_filler 角色，SELF 范围，动作 350–353 已授权）、nobody1（零角色）
- 记录：ADMIN_RECORD（6ac8328a 前轮 → 28418673 本轮）、FILLER_RECORD

## 矩阵结果（本目录 .json 为准）

| # | 身份 | 动作 | 实际结果 | 判定 |
|---|---|---|---|---|
| 20 | filler1 | 提交有效记录 | code=0，记录创建 | ✓ 已授权动作放行 |
| 21 | filler1 | 查询列表 | total=1（仅本人记录）；响应键**不含** `total`/`external_dept`（服务端投影剥离） | ✓ 记录范围 SELF + 字段查看权限 |
| 22 | filler1 | 以 `total` 筛选 | 1501「过滤字段不在表单定义中」（与未知字段同口径，不确认存在性） | ✓ 无权字段筛选侧漏阻断 |
| 23 | filler1 | 读管理员记录详情 | 1507「记录不存在或已删除」（fail-closed，不暴露存在性） | ✓ 记录范围强制 |
| 24 | filler1 | 构造携带 `total` 的更新 | **1105「当前身份无字段 'total' 的编辑权限」**（整请求拒绝） | ✓ 字段编辑权限闸门 |
| 25 | filler1 | 正常更新（不含受限字段，带 version） | code=0 | ✓ 已授权动作放行 |
| 26 | filler1 | 导出（未授权 form:data:export） | 403 | ✓ 未授权动作拒绝 |
| 27 | filler1 | 删除本人记录（已授权 form:data:delete） | code=0 | ✓ 与授权一致 |
| 30 | nobody1（零角色） | 提交 | **403** | ✓ 服务端动作闸门收敛 |
| 31 | nobody1 | 查询 | **403** | ✓ |
| 32 | nobody1 | 读管理员记录详情 | **403** | ✓ |
| 33 | admin | 查询对照 | 全量记录；`total`/`external_dept` 键**在**响应中 | ✓ 与受限身份形成对照 |

## 跨租户身份（第五类）

按 I1 锁定裁决与产品边界（`knowledge/current-status.md`「非零租户登录无受支持入口为认证产品边界」）：
登录链仅承载租户 0 账号；非零租户双向隔离（403/null/零写入）已由 I1 终态证据锁定（`product/v0.3.0-oa-completion/receipts/`），本轮不重复采集。表单数据面（动态宽表裸 SQL）每条 SQL 手写 `tenant_id=?` 过滤，属既有锁定口径。

## 本轮修复记录（矩阵驱动）

1. **严重缺口修复（P0）**：`FormSubmitController`/`FormDataQueryController`/`FormDataController`/`FormDataDeleteController` 此前**未挂** `@PreAuthorize`——任何登录用户（含零角色）可提交/查询/读取全部表单数据（修复前矩阵 [30]—[32] 为 code=0，见上一轮矩阵记录）。修复：四个控制器补 `@ss.hasPermi('form:data:submit'|'form:data:query'|'form:data:edit'|'form:data:delete')`；修复后 nobody1 三项全部 403。
   - 修复前的原始证据：审查留痕 `30-nobody-submit-403.json` 等在修复后重跑被覆盖；修复前结果已在回执 02 正文如实记录（nobody1 提交/查询/详情 code=0）。
2. **公式更新 500 修复**：`FormDataUpdateService` 对 `data=null` 落 `Map.of()`（不可变），公式重算 `remove()` 抛 `UnsupportedOperationException` → 更新路径 500。修复：改 `HashMap`。
3. **查询 id 过滤**：`FormDataQueryService` 放行系统主键 `id` 的 EQ（引用显示名解析依赖）；非 EQ 仍拒绝；记录数据范围仍强制并入 WHERE。

## 与既有锁定项关系

- 数据范围语义（ALL/SELF/DEPT/DEPT_AND_CHILD/CUSTOM）复用 I1 `FormDataScopeSupport`，本轮为行为级复验（21/23）。
- `@ss.hasPermi` 空权限集 fail-closed 语义经本轮 nobody1 修复后实证（30—32）。
