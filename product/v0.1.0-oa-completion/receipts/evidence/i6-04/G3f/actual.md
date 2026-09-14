# G3f 实际结果（http-exposure.log + pre-fix-leak.txt + postfix-scan.txt）

## 发现并修复的真实缺陷（普通日志）
- 修复前：dev 日志把 sys_user 完整行（邮箱 u*.t100@example.invalid、bcrypt 口令）写进 stdout（命中 141 处，pre-fix-leak.txt）
- 修复：log-impl StdOutImpl→Slf4jImpl（application.yml），mapper 命名空间/行级 SQL 日志收敛 info（dev/local yml）
- 修复后真实 HTTP 链（登录+投递+收件箱+记录）后日志扫描：example.invalid 命中=0、subject_cipher/RSA/JWT 秘密=0（postfix-scan.txt）

## HTTP 响应最小暴露（真实流 http-exposure.log）
- 普通用户 u3：收件箱/偏好不含他人消息、不含联系方式字段
- 管理员记录列表：明细摘要（title、recipientMask=U10001、attemptCount），无完整正文/联系方式
- 摘要详情(/{id})：content=null（正文零返回）
- 必要详情(/{id}/detail，独立权限 notify:record:detail + 审计）：含正文与尝试流水，无 Provider 原文/秘密/收件地址
- u3 无权用户：记录列表/必要详情走 G3d-A 已证 403/404

## 覆盖边界
- 前端状态/前端截图零越界由 G4a/G4b 浏览器包核对（本包为 HTTP+日志面）
- Provider 原文：本轮无真实 Provider 发送（G5b 外部条件），尝试流水 externalMessageId=smtp-* 摘要粒度，未含原文
