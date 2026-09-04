# 修正证据附件元信息（G1—G5）

- 工作目录（audit 复算执行点）：/usr/local/projects/Smart-WorkFlow
- 生成时间：2026-09-04 16:39—16:50 CST
- 源文件只读：Smart-WorkFlow-Server/功能清单.md、todo/requirement-pool.md、knowledge/known-issues.md、knowledge/features/*.md、product/、search_task/、search_fallback/、search_task/.archive/
- 命令退出码：
  - raw-checklist-90.txt（grep+awk 管道）：exit=0；wc -l=90；分布 ✅34/🟦23/⬜33
  - raw-p-rows.txt / raw-p-unique.txt / raw-p-duplicates.txt / raw-p-missing.txt：物理行 57、唯一 56、重复 P48、缺号 P13/P23
  - raw-p-row-classified.tsv：单归属分类，唯一编号合计 56（19 已核销/14 未排期/6 待对账/4 待排期/3 未开发候选/2 部分关闭/2 待设计/2 待规划/1 待开发/1 待决策/1 待Owner确认/1 仅骨架）
  - raw-i-ids.txt：54 行（I1—I55 区间，缺 I27、I56 无行）；无重复
  - raw-product-dirs.txt：57（总）；raw-product-dirs-audited.txt：55
  - raw-features.txt：41
  - raw-search-*.txt：task 8（含 .archive 4）+ fallback 51；有任务无回传=notification-personal-workflow-reconciliation-20260904.md 1 份；扣除 .archive 归档链后有回传无任务=11 份
  - SHA256SUMS：shasum -a 256 生成 exit=0；shasum -a 256 -c 回读 6/6 OK exit=0
- 复算（G4）：目标行 5 个确认唯一（grep -c=1 每行）；✅34/🟦28/⬜28=90（34+28+28=90）
