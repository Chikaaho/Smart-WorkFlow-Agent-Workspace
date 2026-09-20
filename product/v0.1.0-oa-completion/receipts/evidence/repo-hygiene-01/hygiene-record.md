# 仓库健康清理记录（2026-09-15，Owner 指令）

## 1. 触发
Owner 指令：本轮剩余未提交内容提交并推送；推送时 GitHub 以单文件超限拒绝（`product/v0.1.0-oa-completion/receipts/evidence/i4-02/server-dev.log` = 626.9MB > 100MB），并要求去掉 `.git` 中的大体积 workflow/运行产物并加入忽略规则。

## 2. 处置与量化结果

| 项目 | 处理前 | 处理后 | 方式 |
|---|---|---|---|
| Workspace `.git` 体积 | 165 MB | **65 MB** | 未推送历史重写 + 垃圾清理 + gc --prune=now |
| Workspace `.git` 垃圾包（`tmp_pack_*`） | 17 个 / 67,840 KB | **0** | 删除临时包并回收 |
| `i4-02/server-dev.log`（626.9MB） | 在 22 个未推送提交中 | 已从全部未推送提交移除 | `git filter-branch --index-filter`（范围 `origin/develop-sw..develop-sw`，未强推） |
| 其余 4 份 >10MB 运行日志（75.5 / 41.4 / 35.4 / 10.3 MB） | 已跟踪 | 取消跟踪 + 加入忽略（本地文件保留） | `git rm --cached` + `.gitignore` |
| Server `sw-bootstrap/target`（构建产物） | 422 MB（含 2 个 fat jar：208.8MB + 208.0MB） | **5.1 MB** | 删除 jar（构建可再生成；发布产物已存在于 GitHub Release） |
| Server / Web `.git` | 7.5 MB / 2.5 MB（最大 blob 0.2 / 0.3 MB） | 未变更 | 无需处理 |
| **远端已发布历史中的 9 份大日志** | 626.9 / 75.5 / 41.4 / 35.4 / 10.3 / 9.8 / 9.0 / 8.3 / 7.8 MB | **已从远端历史移除** | Owner 2026-09-15 明确授权后，两轮 `filter-branch` + `--force-with-lease` 强推；全新克隆验证远端历史 ≥5MB blob = 0、目标路径 0 命中 |

## 3. 忽略规则（.gitignore 新增）
```
product/**/receipts/evidence/**/*-dev*.log
product/**/receipts/evidence/**/*dev-server*.log
product/**/receipts/evidence/**/*boot*.log
product/**/receipts/evidence/**/*lastrun*.log
```
说明：4 份 >10MB 日志均为开发/启动运行日志；`git check-ignore` 已确认命中。既有 ≤10MB 的 385 份证据日志仍保持跟踪（本次未批量取消跟踪）。
Server/Web 两仓 `.gitignore` 已覆盖 `target/`、`*.log`、`node_modules`、`dist` 等，无需追加。

## 4. 远端历史清理（Owner 2026-09-15 明确授权后执行）
首轮报告 3 份（75.5 / 41.4 / 35.4MB）之外，实际扫描到同类 ≥5MB 日志共 9 份；已分两轮改写 **已发布** 历史并强推
（第一轮范围 `d3b1f9e^..`，第二轮 `34e8994^..`，均使用 `--force-with-lease`）。最终 `origin/develop-sw` = `1cfb257`。
验证：GitHub 全新克隆中 ≥5MB blob = 0、9 个目标日志路径命中均为 0、关键回执与 knowledge 文件在 tip 完整存在。
注意：两轮重写使 2026-09-07 之后的提交 SHA 全部变更，此前文档中的对应 SHA 为历史引用。

## 5. 附
- `rewrite-sha-mapping.md`：22 个被重写提交的旧→新 SHA 对照（主题逐条校验一致）。
- 重写后推送：`origin/develop-sw` `69c3197..d033506`（23 个提交，普通推送，非强推）。
- Server 状态文档同步提交：`origin/develop` `b8015b9..47c8b86`（未推送 main，未触发新 Release；发布身份 `c15428f` / `963df36` 未变）。
