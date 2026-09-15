# P60 / 0.1.0 整体验收审查 02：NOT READY（main合并探索复核）

> 审查角色：规划（Planner）  
> 日期：2026-09-15  
> 输入：`search_fallback/v0.1.0-p60-main-merge-readiness.md`及其只读证据  
> 结论：**探索通过；P60第14条仍未通过，三仓当前均不得合并main**

## 1. 探索复核

回传覆盖三仓端点、共同祖先、ahead/behind、只读合并试算、已提交/未提交归属、R7差距、发布工作流与未知分支保护，符合探索任务要求。探索期间未改变refs、reflog或共享工作树。

## 2. 合并裁决

| 仓库 | 裁决 | 原因 |
|---|---|---|
| Workspace | **禁止合并当前项目实例到`origin/main`** | `main@3791d48`是通用Engine分支，已明确移除实例内容；当前分支相对main为ahead114/behind22且试算冲突27处。项目状态回写Engine main违反既定分层 |
| Server | **暂不可合并** | 当前工作树17项未形成候选；相对main ahead26/behind16，试算冲突1处（`application-local.yml`）；main推送自动构建、测试、打`build-*`标签并发布Release |
| Web | **暂不可合并** | 虽试算无冲突，但4项工作树未形成不可变候选；相对main ahead13/behind8；main推送同样触发自动发布 |

此外，R7指纹生成存在文化相关排序与非ASCII路径编码问题，Web在文件内容不变时跨环境整体指纹仍不一致；`release/0.1.0/MANIFEST.json`声明clean及Workspace SHA也与现状不符。二者必须在候选冻结前修正。

## 3. P60整体状态

- 第1—13条继续通过或按Owner例外通过；第8/9真实Provider链仍明确未验证。
- 第14条继续未通过：不存在覆盖当前受测内容的不可变候选，合并目标与发布风险未闭合。
- P60保持`IN_PROGRESS`，不能归档主方向、不能下发整体终态同步。
- I1—I6已确认状态不变，不重验业务能力。

## 4. 推荐发布路径与待授权事项

推荐边界：

1. Workspace保留项目实例在`develop-sw`，不合并通用Engine `main`；如需独立稳定线，应另定项目实例目标分支，而不是覆盖Engine main。
2. Server/Web先分别把当前task-owned工作树固化为本地不可变候选，修正跨环境指纹与0.1.0 manifest，并处理Server唯一冲突方案。
3. 本地候选完成并重跑第14条最小门禁后，再向Owner展示精确候选SHA、源/目标分支、冲突解决和自动Release风险，单独取得push/merge授权。

当前未授权commit、push、merge、tag或Release。Owner若同意推荐路径，下一条明确授权应只覆盖“形成三仓本地候选提交并验证”，不自动授权远端发布。

