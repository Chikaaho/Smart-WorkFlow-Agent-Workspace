# P61 执行完成回执（自验通过，待规划验收）

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 功能：p61-user-facing-message-humanization
> 任务等级：XL
> 唯一执行入口：receipts/planning-execution-prompt-p61-user-facing-message-humanization-01.md
> 证据根目录：receipts/evidence/p61-r9-01/（最终门禁）、p61-r1-02 / p61-r2a-01 / p61-r2b-01 / p61-r2c-01 / p61-r3-* / p61-r4a-r8b-01 / p61-r4b-r6b-01 / p61-r7-01 / p61-r8b-01 / p61-r8c-*
> 自验结论：**自验通过，待规划验收**。执行角色不写 PASSED/COMPLETED、不核销 P 编号、不移动方向。

## 0. 本轮对自身此前结论的更正（如实记录）

1. **R8b「0 命中」无效**：原扫描复用了只收 `.ts/.vue` 的遍历器，`.sql` 从未进入集合。更正后为 **365 处 DML 中文**，分类结论见 §R8b。
2. **R1「未治理 0 行」曾两次被高估**：门禁先后漏检「跨行文本节点」（66 行）与「含插值文本节点」（44 处）。两处盲区均已修补，现以更严口径归零。
3. **误称 R3a/R3b/R4a/R8b/R8c「未开始」**：规划审查 02 已记载其部分完成；本轮先读代码核实再推进。

## 1. 原子项逐项结果

| 原子项 | 正向结果 | 反向结果 | 证据 |
|---|---|---|---|
| **R1** 文案单一权威 | 1445 整串 + 156 参数化文案进入 zh-CN/en-US；38 条路由标题取自目录 | 硬编码门禁 0（含跨行与插值两类补扫）；键覆盖 0 缺键；目录对账「消失的键都由收敛映射解释」 | p61-r1-02、p61-r9-01 |
| **R2a** 术语收敛 | 同文异译 36 键收敛、创建动作统一为「新建」、枚举经 `enumLabel` 统一 | 同文多键 0、同文异译 0、枚举直出 0；5 组同义分叉逐组写明依据 | p61-r2a-01 |
| **R2b** 失败态/空态 | 8 个 IoT 列表页补错误态+重试；请求失败必反馈 | 静默吞错 33→0、猜成因 1→0、伪装空态 10→0（豁免 10 条均写明依据） | p61-r2b-01 |
| **R2c** 批量结果 | 导入结果面板（总量/成功/失败+逐行明细）、批量审批汇总 | 计数取服务端返回值；失败明细不直出原始异常 | p61-r2c-01 |
| **R3a** 权限字段显示名 | 筛选/操作符拒绝消息改用 definition label | 无权限路径不回显内部字段键 | p61-r3-*、form-biz 133/133 |
| **R3b** 显隐规则显示名 | `parseAndValidate` 接受显示名映射，8 处消息改造 | 未定义字段只回显设计者输入，不泄露其他字段存在性 | 同上传；FormVisibilityRulesTest 8/8 |
| **R4a** 支撑模块文案 | 六模块泄漏扫描 0 命中；openapi 回调原文只进日志 | 持久层用 `callbackFailureSummary` 分类摘要 | p61-r4a-r8b-01 |
| **R4b** 双身份诊断 | A（admin）可读持久化诊断；B（无权限）被拒 403 | 无权响应零栈/零租户秘密 | p61-r4b-r6b-01 |
| **R6b** 认证后真实链 | 401/403/业务失败/持久化诊断全部走真实 HTTP；errorKey+eventRef 齐备；同错误双语一致 | 非 ApiError 不猜成特定业务原因 | p61-r4b-r6b-01 |
| **R7** 可见浏览器 | 同会话 zh-CN/en-US 成对证据（/workspace、/role、/job/list、/inbox） | 无横向溢出、lang 与 localStorage 同步、无文案级混语 | p61-r7-01 |
| **R8b** 种子/迁移 | 365 处逐类分类（菜单权限/字典/租户/dev 夹具/注释） | devseed 与 test 资源按路径证明非生产面 | p61-r8b-01 |
| **R8c** 设备可控 error | 受控标记注入：存储/API 层保留可定位标记、栈帧与绝对路径被剥除、长度受限 | 无权身份读取同一对象 403 | p61-r8c-*、p61-r4b-r6b-01 |
| **R9** 封装 | 最终快照门禁全绿；计数单值来自工具聚合 | 不再出现 1406/1415、7/8 双值 | p61-r9-01 |

## 2. 本轮修复的真实缺陷（均由证据发现，非预设）

1. **`R.fail(code,msg)` 缺 errorKey/eventRef**（67 处生产调用点，含 IoT 全部控制器，msg 恒为中文不随语言变化）→ 新增运行期 `ErrorKeyRegistry`（122 码，5 个冲突码不猜测含义）+ `R.fail` 补齐 eventRef 并按目录本地化。
2. **`IotDeviceController` 零授权** → 按同级口径补 `iot:view` / `iot:device:manage`；无权身份由 200 变 403。
3. **设备回写文本未净化** → `DiagnosticText.sanitize(result, 2000)`，与 MQTT ingest 同口径。
4. **模块加载期求值（切语言失效）** → 244 处属性改 getter/键映射（WorkspaceHome、graphAdapter、node-panel-registry、process-graph、error-code-map、failure-category、路由 meta、各页状态映射）；新增 `p61-frozen-locale-audit.mjs` 常驻门禁，现为 0。
5. **数据库菜单/权限文案在英文下不翻译**（同屏混语）→ Web 侧 `NODE_TITLE_KEYS`（119 条 name→语义键，已有键复用不另立同义键），服务端 title 作回退。

## 3. 最终快照门禁（唯一单值）

**Server**：`mvn -q compile` → 0；`mvn -q test` → 0；234 份 surefire 聚合 **tests=1418 / failures=0 / errors=0 / skipped=0**。

**Web**：12 项门禁退出码全 0（typecheck / lint / test / build / 硬编码门禁 / 目录单源 / 字典校验 / 键覆盖 / 术语审计 / 失败态审计 / 目录对账 / 冻结语言审计）；**tests=1207 passed / 3 skipped / 0 failed**。

原始流、退出码与计数见 `evidence/p61-r9-01/`（server-gates.txt、web-gates.txt、final-counts.txt）。

## 4. 偏差与边界（诚实声明）

1. **本会话模型不支持图像输入**：视觉制品（PNG）已落证据目录可人工复核，但执行侧所有「无溢出 / 无混语 / lang 同步」断言均来自 DOM 与页面上下文探针，非目视。
2. **R7 覆盖页面族为 4 个**（/workspace、/role、/job/list、/inbox）。方向 §8 若指定更多页面族，需扩大采集。
3. **菜单/权限文案的权威仍在服务端数据**（Web 侧映射 + 服务端回退）。若规划要求服务端接口直接返回本地化菜单，属接口形状变更，需方向修订。
4. **字典标签与租户名**（迁移种子）判定为运行时数据，权威在对应管理界面，未纳入静态目录。
5. 真实 Provider 成功链按补充提示不在本轮。
6. 运行期夹具（dev 内存库、调试身份通道、一次性本地密钥）均随进程销毁；未触碰远端分支/tag/Release 与历史证据。
