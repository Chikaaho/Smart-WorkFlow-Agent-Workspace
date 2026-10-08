# 工作区 Git 原始证据清理任务

## 授权与目标

Owner 于 2026-10-08 明确授权本次按执行与管理员职责处理，并确认重写及强推根仓 origin/develop-sw。目标是从该分支全部可达历史中移除原始证据附件和日志，保留任务、回执、源码与测试基线；原始本地文件继续留存并由忽略规则排除。

## 范围

- 根仓目标分支：origin/develop-sw。过滤任意路径段名为 evidence 的目录，以及所有 *.log、*.log.gz 文件。
- Web 与 Server 的 develop 分支：仅更新工程规范及日志忽略规则，不改业务源码、测试源码或回归基线。
- 根仓 main 及其他分支不做历史改写。

## 验收条件

1. 改写后 develop-sw 全部可达历史不含 evidence 目录路径或日志文件。
2. 任务与回执 Markdown 保留；根项目说明、前后端工程宪法及三个仓库的 .gitignore 明确原始证据与日志不入库。
3. 对 origin/develop-sw 使用精确旧 SHA 的 --force-with-lease，并在推送后回读确认远端分支 SHA。
