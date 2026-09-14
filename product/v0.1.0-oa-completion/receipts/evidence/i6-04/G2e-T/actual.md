# G2e-T 实际结果（类型契约 name:TYPE；类型值证据在 g2et*.json）

## 契约合法性（入库前）
- 非法声明 `x:FOO` → 400「非法变量声明」（g2et1.json）

## 正向
- 合法值渲染成功并生成 message（title/content 按目标渲染）
- 模板直发 send-first/8b 幂等：同一稳定身份第二次返回同一 msgId，业务通知仅一条（g2et-final.json 8/8b）
- 最终 DB 消息行数（db-rows.txt）与幂等一致

## 反向（发送前拒绝，落库前置）
- NUMBER 类型不符 → 400「变量 amount 类型不符」
- DATE 类型不符 → 400
- ENUM 之外值 → 400
- EMAIL 形式不符 → 400
- 白名单外变量（evil）→ 400「变量未登记白名单」并带 <script> 字面量被拒
- 类型不符发送：消息/尝试 0 新增（db-rows.txt 中 I6G2ET% 消息仅一条既有幂等行）

## 覆盖边界
- 类型语义：NUMBER/DATE/EMAIL/ENUM(TEXT 默认，仅长度上限)；未知键/缺失/超长由 G2e-V 既证。
- 真实缺陷修复登记：V92 smallint→boolean（PG 发送链 500→可写）；模板直发重复身份 500→幂等回照（NotifyTemplateController.send）。
- 修复牵动的最后实现快照在 G8a 前登记；G9b 门禁覆盖。
