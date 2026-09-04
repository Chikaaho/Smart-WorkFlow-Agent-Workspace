# 管理员追加回执 02：模板读取路由修正

> 执行角色：管理员（Admin）
> 依据：`planning-review-admin-supplemental-prompt-generation-01.md` 的最小修正交接（仅 A1，不重做内容演练）
> 日期：2026-09-04
> 结论：**修正完成**——模板唯一实体迁移至 Planner 宪法可读路径，规则引用同步，可达性检查通过
> 发布状态：**未提交、未推送、未发布**

## 1. 新唯一模板路径

`product/governance/supplemental-execution-prompt-template.md`

选址依据（按审查最小修正交接）：Planner 读范围（system.md §0.2、roles/planner.md §3 角色铁律）包含 `product/`；模板作为独立治理资产置于 `product/governance/` 子目录，保持单一实体，不复制双份、不绑定任何业务功能通过目录、未开放 `docs/` 读取权限，未修改 system.md 权限边界。

## 2. 旧路径引用处理

- 旧路径 `docs/governance/supplemental-execution-prompt-template.md` 为本次任务新增且未提交文件，已直接移除（`docs/governance/` 目录保留原有 claude-document-migration-2026-08-18.md，未受影响）。
- 现行规则（`roles/`）中全部引用已切换到新路径，grep 检查无 `docs/governance/supplemental` 残留。
- 历史回执 01 与审查 01 中出现的旧路径文字保留在原文件内作追溯，未修改历史文件。

## 3. 相关规则引用片段（现行）

`roles/planner.md` §7.1 导语：

> 本节为**执行补充提示生成规范**的唯一规则来源，模板唯一权威为 `product/governance/supplemental-execution-prompt-template.md`（Planner 可读路径），执行侧对应引用见 roles/executor.md §4.4 第 6 条

`roles/planner.md` §7.1 第 8 条：

> 每份提示按唯一权威模板 `product/governance/supplemental-execution-prompt-template.md` 生成

`roles/executor.md` §4.4 第 6 条：

> 补充提示按唯一权威模板生成（`product/governance/supplemental-execution-prompt-template.md`，配套规则见 roles/planner.md §7.1），提示是唯一当前执行入口，旧版仅作追溯

模板自身头部声明同步更新为「维护于 `product/governance/`（Planner 宪法可读路径）」，修订记录追加迁移条目。

## 4. 模板完整性（合法新路径可读文件）

| 检查项 | 结果 |
|---|---|
| 全工作区唯一 | 仅 `product/governance/supplemental-execution-prompt-template.md` 一份（find 全盘核对） |
| 可读性 | 路径位于 `product/`（Planner 宪法读范围内），无 docs/ 依赖 |
| 完整性 | 145 行 / 12890 字节；SHA-256 `af003e72ae70e65f51cea6facfd860da79fc337c4cf0f9ea7ae9beeab5f440d0`；修订记录含两版条目（初版＋迁移），末行完整 |
| 内容一致性 | 仅头部「维护位置」表述与修订记录变更，§0—§9 正文及附录十项案例与规则内容未改（审查 01 确认内容不重做） |

## 5. 路径可达性检查结果

1. 规则引用唯一指向 `product/` 路径，Planner 按宪法允许路径可找到唯一模板：通过。
2. 模板文件可由合法新路径完整读取（145 行含全部章节）：通过。
3. `roles/` 现行规则无旧路径残留引用：通过。
4. `git diff --check -- roles/planner.md roles/executor.md`：exit 0，无空白错误：通过。

## 6. 未改动边界

- 业务代码、工程门禁、`terminal-contract.json`/Hook/Validator 契约、P58 状态均未触碰。
- 未修改 system.md 权限边界（未为 docs/ 开放读取例外）。
- 九项治理样例与 P58 演练未重跑（审查 01 明确不要求）。

## 7. 治理检查输出

```
$ find . -name "supplemental-execution-prompt-template.md" -not -path "./.git/*"
./product/governance/supplemental-execution-prompt-template.md
$ grep -rn "docs/governance/supplemental" roles/ product/governance/
（无输出）→ 现行规则无残留
$ git diff --check -- roles/planner.md roles/executor.md
（无输出）→ exit 0
```

待复核项：模板与 §7.1 规则一致性（审查 01 确认修正后可关闭，无需再次扩充规范）。