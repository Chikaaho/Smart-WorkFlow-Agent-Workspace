# RA01b 身份映射与证据适用性（evidence-05）

## 缺口→原始文件:键→实际结果→边界

1. window-02（回执04短轮）dirty 解释
   - 原始: evidence/resource-assurance-04/ra02-window-short/run-identity.txt (head/worktree/artifactFingerprint)
   - 实际: HEAD=cbf32ba…、worktree clean=no——差异=本次会话其后才提交的测试装置改动（aaa1945 的 P62ResourceAssurancePgTest 增量），生产源文件在该 run 时点=cbf32ba 无未提交差异（git diff cbf32ba..aaa1945 仅 sw-bootstrap/src/test 一个文件）。
   - 边界: 该 run 的产品行为结论绑定 cbf32ba；装置行为以该 run 自己的 artifact-manifest.sha256 为准；不将 aaa1945 装置倒填该 run。

2. formal-01（回执04正式窗）clean
   - 原始: ra02-window-formal/run-identity.txt（head=aaa1945、clean=yes、manifest 算法=SHA-256(排序清单全文)、文件集=全仓 */target/classes/**+*/target/test-classes/**、清单 328887B 落盘）

3. 旧 fixed/prefix 复现（evidence-04/ra02a1-deadlock）为包装 v1（指纹截断32hex、文件集两目录）
   - 边界: 按其声明算法在各自时点自洽；v2 自 window-01 起适用；不回溯改写。

4. evidence-05 全部运行=p62ra-run.sh v2；本轮候选提交链 32a5db3→cbf32ba→aaa1945→d7c9389→8e46fb4（详见各 run-identity.txt 实际 head）。

5. RG 证据↔运行映射：回执04/05 的 RG02/03 数值分别取自 ra02-window-short（对应 run-identity 的 head）与 ra02-window-formal（aaa1945 clean）；RA03 取自 ra03a-isolation；门禁取自 gate/。

recordedAt=2026-10-04T00:40:33+08:00
