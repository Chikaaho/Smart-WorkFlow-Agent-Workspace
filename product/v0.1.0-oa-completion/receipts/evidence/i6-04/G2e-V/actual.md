# G2e-V 实际结果（stdout.log + exit-code.txt=0）

## 正向
- I6NotifyClosureIntegrationTest 17/0（stdout.log:68-72）覆盖未知键/缺失值/超长值发送前拒绝与合法值成功
  （同一测试类含变量白名单与长度断言，测试发生在最后实现快照——G9b 门禁复核）

## 反向
- 失败场景消息/尝试均 0（落库前置拒绝，测试断言）

## 覆盖边界
- 类型不符（NUMBER/DATE/EMAIL/ENUM）由 G2e-T 独立原子（g2et*.json + db-rows.txt），不互替
