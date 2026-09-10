# I2-04 object-map-before

生成时点：2026-09-10；代码与行为验证前；本轮新应用尚未启动。

## 旧对象边界

回执 03 的运行实例已由旧进程退出销毁，销毁证据见 `../i2-03/e8b/04-process-exit-port-check.txt`。
旧 `FORM_ID=ed2d65a0-5853-411d-8dcd-1c4d8eb4279a`、旧 `TARGET_FORM_ID=358a7751-e71f-4873-ab5d-429d19d076b9`、旧
`TARGET_RECORD_ID=628c5fc2-a6b1-43cb-970f-ebeececc3a6e`、旧 `MATRIX_FORM_ID=86729041-d1b6-48f2-a28a-891199198fa9`、
旧 `DATASOURCE_ID=2097879832553148418` 以及旧 `FORM_KEY=i2_live_20260909b` 均只作历史追溯，本轮不复用其 ID。

## 本轮固定对象（行为开始前）

| 类型 | tenantId | userId/roleId | formKey/definitionId | version | draftId/recordId | datasource/query | process/instance/task | runtime |
|---|---|---|---|---|---|---|---|---|
| 新对象 | 待新进程运行后登记 | 待新进程运行后登记 | 待新进程运行后登记 | old/new 均待新发布链生成 | 待新进程运行后登记 | 受控 H2 / queryKey 待登记 | 待绑定后登记 | PID/JDBC 类型待登记 |

约束：E2c2、E5b2、E6b2、E7b2 使用同一组新表单/记录族；若某类真实引用无法由公开接口建立，保留真实请求、响应、计数与退出码，不以另一表单拼接结论。
