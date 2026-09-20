# P61 阶段 E 回执：双语与全站文案收敛

> 角色：执行（Executor）｜功能：`p61-user-facing-message-humanization`｜等级：XL
> 方向：`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization.md` §6 阶段 E
> 日期：2026-09-15｜代码基线：Server `c15428f…`、Web `963df360…`（均 0.1.0）
> 性质：**阶段回执**，不是功能级 completion receipt。
>
> **结论先行：本阶段交付了双语能力的完整链路与可验证切片，但「全站文案收敛」未完成。
> 阶段 E 不能据此判为通过。**

## 1. 阶段目标与完成度

方向 §6 阶段 E：让 zh-CN/en-US、语言选择、Server locale、Web locale、Element Plus 与各业务模块
共同生效；完成同义异文、裸状态/ID、实现术语、标点和无障碍文本治理。

| Step | 内容 | 状态 |
|---|---|---|
| E1 | Server 消息目录（`MessageSource` + `error.<errorKey>`，zh/en 双份） | 完成 |
| E2 | Server 语言解析（`Accept-Language` → zh-CN/en-US，识别失败回退 zh-CN） | 完成 |
| E3 | Server 接线：统一异常出口按当前语言返回可本地化消息 | 完成 |
| E4 | 消息目录收录 common(9) + auth(4) + system(18) = 31 键 × 2 语言 | 完成 |
| E5 | Web 语言仓库（检测/持久化/回退/切换） | 完成 |
| E6 | Web Element Plus locale 跟随同一语言（`ElConfigProvider`） | 完成 |
| E7 | 语言切换入口：登录页 + 登录后应用壳共用同一组件 | 完成 |
| E8 | `<html lang>` 与语言同步（无障碍标签不脱节） | 完成 |
| E9 | 请求层携带 `Accept-Language` | 完成 |
| E10 | **业务模块静态文案键化（229 文件 / 354 调用点）** | **未完成** |
| E11 | Server 目录收录全部 127 枚举 errorKey（zh + en 各 149 键，含出口专用键） | **完成**（增量见 `evidence/p61-e11-01/`） |
| E12 | **路由 meta 标题（38 条）与模块级同义异文收敛** | **未完成** |
| E13 | **成对双语的真实浏览器证据** | **未取得**（属阶段 F） |

## 2. 实际修改文件与摘要

### Server 新增（4）

| 文件 | 摘要 |
|---|---|
| `sw-common/.../i18n/LocalizedMessages.java` | 语言解析与文案解析：受支持语言恰为 zh-CN/en-US；`Accept-Language` 缺失或非法回退 zh-CN；按 `error.<errorKey>` 查目录，缺失回退枚举中文默认（不出现键名/空文案） |
| `sw-common/src/main/resources/i18n/messages_zh_CN.properties` | 31 键中文目录 |
| `sw-common/src/main/resources/i18n/messages_en_US.properties` | 31 键英文目录（人工撰写，非机器翻译占位） |
| `sw-bootstrap/src/test/.../BilingualMessageContractTest.java` | 7 用例：成对自然文案、code/errorKey/eventRef 不随语言变、缺失键回退、无头/非法头回退 zh-CN、未装配消息源时容错回退 |

### Server 修改（3）

| 文件 | 摘要 |
|---|---|
| `sw-common/.../GlobalExceptionHandler.java` | 注入 `MessageSource`；`BaseException` 与 `CommonErrorCode` 出口按当前语言解析文案；日志仍记解析后文案 + `eventRef` |
| `sw-bootstrap/src/main/resources/application.yml` | `spring.messages.basename=i18n/messages`、UTF-8、不回退系统 locale |
| 6 个既有测试 | `GlobalExceptionHandler` 构造改为可注入消息源（`null` = 容错回退路径） |

### Web 新增/修改（8）

| 文件 | 摘要 |
|---|---|
| `src/locales/index.ts`（重写） | 语言仓库：检测/持久化/回退/切换；Element Plus 语言包映射；`<html lang>` 同步；`i18n` 实例；`useI18n` 再导出 |
| `src/locales/zh-CN.ts` / `en-US.ts` | 双语文案源：语言切换、应用壳、登录/SSO、九类失败结论、错误页/空态（键结构两语言完全一致） |
| `src/components/LocaleSwitch.vue`（新增） | 语言切换组件（登录页与顶栏共用同一入口） |
| `src/App.vue` | `ElConfigProvider` 注入当前语言的 Element Plus 语言包 |
| `src/views/LoginPage.vue` | 登录页文案与无障碍标签键化；加入 `LocaleSwitch`；错误文案改用键 |
| `src/layouts/components/AppTopbar.vue` | 顶栏加入 `LocaleSwitch` |
| `src/foundation/request/index.ts` | 每个请求带 `Accept-Language` |
| `src/locales/index.spec.ts`（新增）+ 2 个既有 spec | 9 用例语言仓库契约；2 个既有 spec 补装 i18n 插件 |

## 3. 实际命令与原始结果

证据：`receipts/evidence/p61-e-01/server-evidence.txt`、`web-evidence.txt`。

| 端 | 命令 | 结果 |
|---|---|---|
| Server | `mvn -q compile` / `mvn test` | exit 0；**BUILD SUCCESS，TESTS=1407 / 0 / 0 / 0** |
| Server | `BilingualMessageContractTest` | 7/7 |
| Web | `typecheck` / `lint` / `test` / `build` | 四门 exit 0；**132 passed + 1 skipped（133 文件）；1200 passed + 3 skipped（1203 测试）** |
| Web | `src/locales/index.spec.ts` | 9/9 |

## 4. 与方向的偏差

1. **消息目录已全量覆盖 127 枚举 errorKey（E11 完成）**。zh 与 en 各 149 键
   （127 枚举键 + 22 个出口专用键），键集完全一致，缺失/多余/重复均为 0，
   由 `BilingualMessageContractTest.catalog_shouldCoverEveryEnumErrorKeyInBothLanguages` 守护。
   英文文案为人工撰写的自然语句（非键名占位、非机翻标记）。
   门禁：**1408 / 0 / 0 / 0**。证据：`evidence/p61-e11-01/`。
2. **业务模块静态文案未键化**。Web 229 个含中文文件、354 个消息调用点仍为硬编码 zh-CN。
   登录页、应用壳与全局词汇已键化并双语言，作为可复制的样板。
3. **`ApiError.category` 未参与文案选择**。九类失败结论已在 locale 中提供（`errors.*`），
   但页面尚未按 `category` 自动选择键——当前仍由各页自选文案。属阶段 F 的收敛项。

## 5. 未完成内容与风险

- **未完成（阶段 E 剩余）**：E10/E11/E12/E13（见 §1）。其中 E13 的成对双语浏览器证据
  需 `headless=false` 的可见会话，属阶段 F。
- **风险**：
  - `spring.messages` 变更影响整个应用的 `MessageSource` 装配；已用「未装配消息源时全部回退」
    的容错测试覆盖，但生产配置变更需在阶段 F 的整体回归中再确认。
  - `Accept-Language` 解析对超长/畸形头做了容错（回退 zh-CN），未见注入面，但未做模糊测试。
  - Element Plus 语言包按需引入新增两个静态导入，构建产物体积小幅增加（build 门禁已过）。

## 6. Git diff 摘要

```
Server: 13 files changed（4 新增；9 修改含 6 个测试构造适配）
Web:    12 files changed（3 新增：LocaleSwitch.vue、en-US.ts、index.spec.ts）
未执行 commit / push / tag / Release；未修改迁移。
```

## 7. 与验收标准对照

| 标准 | 结论 | 证据 |
|---|---|---|
| 11. zh-CN 与 en-US 均可从登录页和登录后应用壳切换并持久化；Web、Server 与 Element Plus 同步切换 | **链路已建成并有契约测试**：切换入口两处共用；持久化 + `<html lang>` + Element Plus 语言包 + 请求 `Accept-Language` 同步；Server 按头返回对应语言。**缺真实浏览器成对证据** | `index.spec.ts` 9/9、`BilingualMessageContractTest` 7/7 |
| 12. 两种语言下代表性主链文案自然、术语一致、不溢出遮挡 | **未完成**：仅登录页与全局词汇有英文；业务模块仍为中文 | — |
| 13. 文案单一权威；未经批准的静态用户文案由自动检查阻止 | **部分完成**：Server 目录/枚举双权威已由契约测试守护；**「自动检查阻止新增硬编码文案」未建** | — |
| 4. 正式启用 zh-CN 与 en-US 两套语言能力 | **服务端错误消息已全量双语**（127 errorKey + 22 出口键，zh/en 各 149，键集一致）；**Web 业务模块静态文案未键化** | `BilingualMessageContractTest` 8/8；— |

## 8. 未取得的行为证据（如实声明）

- **未执行可见浏览器验收**（`headless=false`）：无「同一身份、同一对象、同一错误在 zh-CN/en-US
  下成对展示」的截图级证据（方向 §8 明确要求，且「只展示 locale 文件或键名不构成通过」）。
- 未做真实 Server 运行时验证（未起容器发请求）；双语行为由出口对象级测试证明。

## 9. 自验结论

阶段 E 的 E1—E9 完成：双语链路（语言仓库 → Element Plus → 请求头 → Server 目录 → 统一出口）
已建成并由 16 个契约测试钉死；全局层与登录页具备真实双语文案。

**阶段 E 未完成（E10—E13）**，不满足该阶段完整定义，不提请阶段通过。
本阶段不提请功能 PASSED、不核销 P61。
