# 三方 SSO 规划审查 02

日期：2026-09-28；依据：implementation-three-provider-02.md、审查01、主方向 A—F。结论：**VERIFYING**，整体未通过。

## 已核销与锁定

- G7：原始复现显示 logout 后 refresh 返回 HTTP 200，但 body code=401、data=null、system.session_required，没有签发新 token；关闭该观察项，不开展额外认证重构。
- G3 部分：g3-normal-user-permission.txt 第二组真实结果为 roles/perms/menus 空、audit HTTP403/common.forbidden；首组401保留为历史失败，不混用。普通用户无审计权限事实通过。
- G1 部分：已目视 mobile-authorize-consent.png 与 mobile-workspace-session-390.png，均390×844，分别支持真实授权页和普通用户工作台展示。仍须将本轮移动网络语义与图关联，不要求重做已经有据的展示。
- G4 部分：原始日志支持 Server 模块314/0/0/0、Boot测试成功及 Web1301+3、EXIT=0；Git制品列出 Server cb5f17d7b01805c51f39bcded98a977c154e3382、Web d37a57b70de0b11466fac9a9fc98fcdff737031a 与 develop 远端同值（仅该采集时点）。不要求无变化重跑这些门禁。
- G6 表述已更正为后台待扫码、主体待核实；诊断文字差异关闭，真实接入仍未完成。

## 仍未满足项及新差异

1. G2：negative-chain.log 仍为审查01的三条正常回调302。回执再次用它支持重放/Provider失败，属于连续两次证据不匹配。g2-deny-cancel.log 新增HTTP400与回调拒绝日志可以证明发生过失败，不能独自区分所有负向输入。state过期/票据重放等仍需具体断言结果映射；不得由测试类名与总数推断覆盖。权限不足的本地403不是 Provider 缺权限结果，须分别说明适用范围。
2. G3：租户停用、角色撤销、冲突绑定与跨租户结果仍缺逐项可核证据；服务端企业归属校验未建立，第二成员缺失不等于校验实现可以免除。个人测试范围不升级为企业SSO。
3. G1：mobile-error-account-unavailable.png 实际1280×800，能证明桌面错误页，不能证明390×844；本轮网络索引与移动链的关联仍不足。截图不代替停用动作、票据拒绝响应和恢复结果。
4. G4：回执称 SsoAuthServiceTest 32 项，原始 server-system-biz-test.log 明确29项，总314一致。这是转录错误，修正文案，不因此重跑测试。env-config-readback.txt 没有回执所称运行jar/dist指纹，源码到运行产物映射仍为声明；覆盖矩阵仅路径列表，需实际值与核验时点。
5. G4-S：env-config-readback.txt 明确写“真实appId+AES-GCM密文（dev公开密钥加密）”，与前次独立cipher key声明冲突。先核实是文字错误还是实际公开密钥；若属实，对本轮运行秘密改用仓库外独立密钥重新加密并回读非秘密属性，检查旧密文是否曾出现在仓库/证据/公共日志。不能据此直接断言凭据泄露；如存在实际暴露再按范围处置，秘密值禁止回传。
6. G5/G6 实际登录交互仍未解除，不能冻结其他上述可执行项。

## 当前执行入口

G2/G3 同类补证连续两轮未满足，已下发一级 `planning-execution-prompt-three-provider-01.md`，其账本作为当前唯一补证入口。主方向不变；不核销P31，不进入阶段三。飞书应记录“真实链自验已提交，规划补证中”，不得将自验“通过”投影为Planner验收。
