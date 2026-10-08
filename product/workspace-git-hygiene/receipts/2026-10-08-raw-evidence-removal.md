# 工作区 Git 原始证据清理回执

## 执行结果

Owner 于 2026-10-08 明确确认重写并强推根仓 origin/develop-sw。本次只改写该目标分支；main 未改写。历史过滤后检查 develop-sw 的全部可达对象路径，evidence 目录路径、*.log、*.log.gz 均为 0；任务与回执 Markdown 保留。远端更新使用旧 tip SHA 的精确 --force-with-lease，推送后回读远端分支确认。

原始证据文件仍保留在本机，并由忽略规则排除。GitHub 端未引用的旧对象何时实际回收取决于服务端垃圾回收；新克隆不会从 develop-sw 获取这些对象。

## 盘点与验证

- 清理前根仓 develop-sw 当前树含 6,152 个 evidence 路径文件，合计 677,391,673 字节；其中日志 124 个、459,040,179 字节，均位于 evidence 目录。
- 目标历史在过滤前含 638 个提交；过滤器重写后保留 474 个提交。过滤结果的可达路径扫描中，evidence、*.log、*.log.gz 匹配数为 0。
- 目标分支历史未发现 node_modules 路径。
- 最大来源为 product/p62-lowcode-transaction-bpm-tiering，证据文件约 587.7 MB。
- 根仓 main 仅有 2 个通用占位说明文件（348 字节），本任务没有改写 main。
- Web 与 Server 所有本地 refs 均未发现已提交的 node_modules 路径。

## 规范与忽略规则

- 根仓 .gitignore 忽略 product/**/evidence/、tickets/**/evidence/、knowledge/evidence/、*.log 与 *.log.gz；任务、方向和回执 Markdown 保持可跟踪。
- 根 project.md、Web 工程宪法与 Server 工程宪法规定原始日志和证据附件只在本地留存，回执记录结论与验证摘要。
- Web 与 Server .gitignore 补充压缩日志及原始命令输出扩展名规则。
- Web develop 规范提交为 7af86f24bcf33fb068bfe749598fe26e11009572；Server develop 规范提交为 e5e332a991b06c051630a68c04b620d0e8a0c017，均已回读确认。
- 根仓 PowerShell 终态参数冲突修复随改写历史保留。
