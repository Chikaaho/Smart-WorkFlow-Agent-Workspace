# sso-admin-config 实施回执 10：补充提示03 收尾（R1 轮换完成 / A6 固定字段收敛）

入口：`planning-execution-prompt-sso-admin-config-03.md`（唯一执行入口）。功能状态 **VERIFYING**；P31 开放；企业微信延期。候选：Server `dff266add04a59e0859547f11b647772b20f8e6a`（零改动）、Web `519a8176e33232a94ab4f1a035042fd2a86793d4`（零改动）。运行实例 PID 18938（dff266a 构建）。

## R1（secret 轮换——已完成，含过程曲折如实登记）

- **回执09 结论修正**：「控制台无重置入口」系**坐标偏差漏看**——凭证页 Client Secret 标签旁 ⟳ 图标（class `credentials-section__reset`，位于 (849,323)）即重置入口；此前点击 (843,317) 差 6px 未命中。提示02 的"客户端可重置"建议按提示03 撤回，不再引用
- **轮换执行**（headed，控制台会话存活）：⟳ → 「凭证重置」对话框（立即重置=生成新 Secret 并启用，旧 Secret 即刻停用；截图 `r1-reset-confirm-dialog.png`）→ 确认 → 提示「旧secret已立即失效，新secret已生效」（页面 toast，`r1-reset-icon-clicked.png` 序列在案）
- **新值受控捕获（如实登记三次尝试）**：全值展示弹窗瞬时关闭，前两次轮换未捕获（回执09 后的轮换 #2/#3，掩码相继变为 AzKHyKf-cG\*\*\*\*、NLQr7aIf7r\*\*\*\*）；#4 以 **剪贴板通道**成功——页面「复制」钮将真值写入系统剪贴板，`pbpaste` 受控落盘 `/tmp/sw-sso-dingtalk.secret`（命令文本与输出均无值；len=64、非掩码、head4=Q8nv 与当时掩码一致）
- **本地只写更新**：`PUT /system/sso/config/DINGTALK/secret`（admin token 受控读取；body 经 shell 变量传递，无值入命令文本）→ code=0；**CONFIG_CHECK 全 true**（configExists/appIdValid/secretUsable/enabled，22:51:13 审计）
- **最小真实登录复验**：重新发起授权（clientId 20 位）→ 立即登录 → **EXCHANGE SUCCESS → LOGIN_SUCCESS localUserId=9002**（22:51:28—22:52:37，换票即用新 secret——旧 secret 已停用，成功即证明）→ 工作台落地截图 `r1-post-rotation-login-workspace.png`；审计 `r1-post-rotation-audit.txt`
- 反向：新旧 secret 均未入回执/截图/命令文本/日志；未换全局加密主密钥；未重建应用；轮换所需一次最小登录，未重复准入矩阵

## A6（固定字段逐项回读——含反向旧待办排除）

| 字段（提示03 §6） | 实际值与位置 | 时点 |
|---|---|---|
| 功能状态 | VERIFYING（knowledge/current-status.md 顶部条目、features 标题引语、memory 五文件） | 22:5x |
| 业务项 | 全部锁定（仍非整体终态）：B1/A1/A2/A3/A4/A5/S1 审查 07—09 核销 | 同上 |
| Server 完整 SHA | `dff266add04a59e0859547f11b647772b20f8e6a`（模块 351/0/0/0、bootstrap 173/0/0/0） | 同上 |
| Web 完整 SHA | `519a8176e33232a94ab4f1a035042fd2a86793d4`（四连 exit0、1301+3） | 同上 |
| R1 | **DONE**（本次实际完成+证据路径，见上） | 22:5x |
| 唯一下一动作 | Planner 复核回执 10 | — |
| 当前执行入口 | 补允提示03（→回执10） | — |
| 企业微信 | 延期 | — |
| P31 / 功能数 / 清单 | 开放未核销；45；✅46/🟦22/⬜22 | — |

**反向排除（旧待办残留检索）**：memory 五文件与 knowledge 两文件中「回执07定点补证完成」「仍等 A3」「仍等 B1 普通点击」「等 Owner 安排轮换时机」均 **0 残留**（回读脚本确认）；不写 PASSED/COMPLETED、未核销 P31。

## 门禁

零代码改动（Server dff266a / Web 519a817 不变）——锁定门禁继续适用（模块 351/0/0/0、bootstrap 173/0/0/0、Web 四连 exit0 1301+3），按提示 §3 不重跑。

## 证据（evidence-index-10.json，工具生成并回读；排除索引自身与 volatile 扫描报告）

r1-console-probe-record.txt（探查固化）、r1-console-credentials-page-no-reset.png（凭证页现状）、r1-reset-confirm-dialog.png（重置对话框）、r1-post-rotation-audit.txt（CONFIG_CHECK+复验审计）、r1-post-rotation-login-workspace.png（复验落地）。R1 证据包=记录→动作→结果→结论（能轮换，已完成）；A6 证据包=本表+检索 0 残留。

## 剩余项

0——全部已授权可执行项完成；整体 VERIFYING，待 Planner 复核回执 10。
