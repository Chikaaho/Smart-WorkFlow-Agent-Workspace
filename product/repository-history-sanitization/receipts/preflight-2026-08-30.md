# 执行回执：仓库历史地址清理预检

## 1. 任务

检查三个仓库的当前工作树与全部本地 Git 引用，定位旧 PostgreSQL 地址，并确认改写历史的远端影响。

## 2. 检查结果

| 仓库 | 当前工作树 | 首次引入提交 | 受影响引用 | 引入提交后的提交数 |
|---|---:|---|---|---:|
| Smart-WorkFlow-Knowledge | 4 处 | `ced4eb40505da895478baf3f883980caa42a40f4` | `main` / `origin/main` | 40 |
| Smart-WorkFlow-Server | 0 处（本机 local 配置已取消跟踪） | `c86d203702d8fbb1cd3fb81db4644e407947dba1` | `main`、`develop`、`v0.0.1-beta` 及对应远端引用 | 23（当前 main） |
| Smart-WorkFlow-Web | 0 处 | 无 | 无 | 0 |

本地 `HEAD` 与两个仓库的 `origin/main` 均一致；后端 `origin/develop` 与 `v0.0.1-beta` 指向同一提交。

## 3. 已执行验证

- `git grep -F <旧地址>`：检查当前树。
- `git log --all -S<旧地址> --name-only`：定位引入提交与文件。
- `git branch -a --contains <commit>` / `git tag --contains <commit>`：确认受影响引用。
- `git ls-remote --heads --tags origin`：确认远端引用。
- `git rev-list --count <commit>..HEAD`：计算后续历史范围。

## 4. 阻塞原因

彻底替换 Git 历史会改变知识仓至少 41 个提交、后端仓相关分支至少 24 个提交的 commit ID，并要求对以下远端引用执行带租约的强制更新：

- `Smart-WorkFlow-Knowledge`: `origin/main`
- `Smart-WorkFlow-Server`: `origin/main`、`origin/develop`、`v0.0.1-beta`

后端仓还有未提交的 `.gitignore` 修改与 `application-local.yml` 索引删除，历史改写前必须安全保存并在改写后恢复。本轮仅完成只读预检，尚未改写或推送历史。

## 5. 解除条件

Owner 在知悉 commit ID 全部变化、其他克隆需重新同步或重克隆、远端分支与标签需要强制更新后，明确授权上述两个仓库及列明引用的历史改写与强制推送。
