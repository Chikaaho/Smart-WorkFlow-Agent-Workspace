# RA02b1 目标效果/提交点配对/自动释放/过期

## 缺口→原始文件:键→实际结果→边界

1. 目标对象错配（复核04『3810目标行无效果变化』）：根因=装置配对取提交行而非 target_record_id 所指行。已修（d7c9389）：submitLight 捕获 target_record_id，pairing.csv 新列 target_record_id + 目标行 update_time/version/qty_reserved 读回（ra02-window-short/pairing.csv 列头与行值）。

2. 提交点：lightTargetsWithSubmitPoint/approvalTargetsWithSubmitPoint 见 pairing-summary.txt（目标调用行 update_time + 目标行双读回；审批=任务 end_time+实例 end_time）。

3. 自动释放：修复前 60s 对账节奏使尾批错过 120s 收敛界（ra02 旧 run autoConvergeMs=null、401 残留经一次手调对账全清=对账缺口非泄漏）；8e46fb4 将默认对账间隔 60s→15s 后 autoConvergeMs=96871ms（短轮）——正常路径自动收敛成立，手调对账仅作超时后单列揭示。

4. EXPIRED：本轮 run 库随进程销毁，200 旧对象无法回查；下一正式 run 的 occupancy-responsibility.txt 将含 status=EXPIRED 分类（deadline/到期语义），未在本轮窗口内产生新 EXPIRED（open 命令=0）。

recordedAt=2026-10-04T00:55:58+08:00
