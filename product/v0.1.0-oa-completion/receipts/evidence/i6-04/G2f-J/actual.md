# G2f-J 实际结果

## 正向
- 同源跳转：合法消息 link 仅由服务端写入（BpmNotifyListener 常量 WF_TASK/WF_PROCESS + 稳定业务 ID），
  前端按受控类型路由（WF_TASK→任务详情、WF_PROCESS→实例详情），服务端只返回 {linkType, linkId}
  （G4a shot-04 / G4b shot-02 真实打开）

## 反向
- 伪造 link_type=EVIL + link_id=javascript:alert(1)：服务端拒绝可跳转语义，前端 toast
  「该消息没有可跳转对象」（shot-01），URL 停留 /inbox、无导航、危险协议零执行
- 伪造消息 ID / 跨租户对象：/notify/inbox/{id}/link 404 不泄露存在性（G3d-A 矩阵）；前端对
  ApiError 统一提示「无权访问该业务对象」
- data:/任意 URL 不存在于任何输入通道（link 字段服务端权威写入；客户端无法保存/注入）

## 覆盖边界
- 邮件正文跳转由 EMAIL 渠道渲染器转义（G2f-R 净化链覆盖）；本原子聚焦站内深链对象
