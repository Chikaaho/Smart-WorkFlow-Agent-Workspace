# 工作区 Git 原始证据清理回执

## 当前状态

本地规范与忽略规则已更新；根仓本地提交 `738defd` 已从当前树移除 6,152 个证据路径文件，原始文件仍保留在本机并被忽略。该提交未改写旧提交历史，也未推送到远端；历史改写与强制推送待 Owner 对具体分支和风险作最终授权。

## 盘点结果

- 根仓 `develop-sw` 当前 HEAD 跟踪 6,152 个 `evidence/` 路径文件，合计 677,391,673 字节；其中日志为 124 个、459,040,179 字节，全部位于证据目录。
- 最大来源为 `product/p62-lowcode-transaction-bpm-tiering`，证据文件约 587.7 MB。
- Web 与 Server 所有本地 refs 均未发现已提交的 `node_modules` 路径。
- 根仓 `main` 只有 2 个通用占位说明文件（348 字节），不含项目执行证据或日志；本任务不改写 `main`。

## 本地规则变更

- 根仓 `.gitignore` 忽略 `product/**/evidence/`、`tickets/**/evidence/`、`knowledge/evidence/`、`*.log` 与 `*.log.gz`；保留任务、方向和回执文档的跟踪。
- 根 `project.md`、Web 工程宪法与 Server 工程宪法均规定原始日志和证据附件只本地留存，回执仅记录结论与验证摘要。
- Web 与 Server `.gitignore` 补充压缩日志及原始命令输出扩展名规则。
- Web `develop` 已推送规范提交 `7af86f24bcf33fb068bfe749598fe26e11009572`；Server `develop` 已推送规范提交 `e5e332a991b06c051630a68c04b620d0e8a0c017`，均已回读远端一致。
- `stop-gate.ps1` 与 `validate-terminal.ps1` 中已有的 PowerShell 冲突修复保持原样，不纳入本批次。

## 后续门禁

要让远端克隆体积实际下降，需从 `origin/develop-sw` 历史中清除上述路径，并以 `--force-with-lease` 更新该分支。该动作会重写提交 SHA；协作者需重新克隆或将本地分支重置到改写后的远端。远端动作完成前，本回执记录为待确认状态。
