# 就绪探索回执：bugfix-20261013-readiness

2026-10-13｜Executor 只读探索；Git 明细、迁移清单、UAT 巡检原文见同目录[附件](bugfix-20261013-readiness-attachments.md)。已纳入 Owner 补充裁决：①进 main 的迁移即封版，develop 已有迁移除版本号冲突外全部封版，仅新迁移合并为版本号；②本轮版本 0.1.5、UAT 跳过 0.1.4。

## 1. 仓库边界与分支就绪

根=规划仓（develop-sw=2a915ade=origin；远程另一 main=51732b1 为 governance 沿革线，与代码无关）。Server/Web 均在 **develop=b962648 / 8c400b0，与 origin 同步、工作树干净**。`codex/bugfix-20261013` 两仓本地与远程均不存在，可直接从当前 develop 建立。根未提交：memory 4 文件（Planner 本轮登记）、gitlink 漂移×2（index 仍记 feature/p64 值 7a32bf15/628b1d94，子模块已 checkout develop）、product/bugfix-20261013/ 与本任务文件、changed-files/p63 单文件。建议：前两类随规划/下批提交，p63 单文件确认归属后处理。

## 2. 成果完整性（P64 已在 develop）

P64 已完整进入两仓 develop（Server 7a32bf15 为 merge 提交 b962648 祖先、Web 628b1d94 为 8c400b0 祖先）；P61 与 0.1.1/0.1.2-bugfix 均已并。**从 develop 建修复分支即含全部已通过成果**。唯一未并：Server 远程 feature/p62-perf-bounded-20261011（7c305978）与 develop diverged 领先 16/落后 10（GitHub compare 核实；含 V0.1.10 迁移、性能装置、openapi 回调租户修复），按 knowledge 为 VERIFYING/Owner 延期。建议不自动合入，范围 `git log develop..7c305978` 留裁决；V0.1.10 命名已被其占用，新种子须避开。develop→main 差异（合并时进入发布集合的本轮外内容）：Server 163 提交、Web 41 提交（P62 收尾/性能文档、P63、P64 全部及 docs 治理）；main 零领先。

## 3. 版本：0.1.5（Owner 裁决）

tag 序列 v0.0.1(v0.0.1-beta)/0.0.2/0.1.0/0.1.2/**0.1.3**（两仓 tag→main 8e23a2d/e3ae316，附 Release 与 CI success；无 0.1.1 tag）+build-\<sha\> CI tag。开发版本 Server 0.1.3-SNAPSHOT、Web 0.1.3；发布惯例=Server `-Drevision=<版本>` 覆盖、Web 发版批次投影 package.json。0.1.3 已被 tag/Release/UAT 在役占用不可复用；按裁决执行 **0.1.5**：Server `-Drevision=0.1.5`、Web 投影 0.1.5、tag/Release 0.1.5。

## 4. 运维手册与 UAT（已实测）

现行手册=**根仓库 `docs/ops/production-ops.md`**（318 行，0.1.3 发布仍引用，有效）；Server 仓 docs/ops/ 不存在，历史线索路径失效。UAT=手册所述单机（0.1.3 部署回执明示），手册标题"生产运维手册"实按 UAT 使用，单一环境。发布按 §8（备份→停服→替换→启动→冒烟→回滚；迁移随启动自动执行、先备份后启动）；凭据经 `~/ssh/ssh/ssh_personal.sh`/`scp_personal.sh` 封装，值不回传。**2026-10-13 只读巡检**：在役 jar=0.1.3 原件（216,837,921B，09-30 01:37），PID 1576953 运行至今，health 200，磁盘 72%；**flyway_schema_history 已到 V0.1.1**（01:41 删库重建应用 V0.1.0+R__i6 后，当天 15:11 另有一次携带 V0.1.1 的无 tag 增量部署）；独立历史表 flyway_schema_history_prod 存在。限制：jar MANIFEST 无版本条目（字节+PID 交叉认定）；nginx 证书/域名未核实（手册不披露）。

## 5. Flyway 封版兼容：结论可行

develop 主迁移 h2/PG 对称 10 versioned（V0.1.0 baseline_seed+V0.1.1—V0.1.9）+7 R__；main 仅 V0.1.0+R__i6；develop−main=30 文件+1521 行、**V0.1.0 零改动**；devseed/测试夹具均 h2；prod-update 为 DML 红线目录。**决定性核实：V0.1.1 唯一提交 e93824b（09-30 13:34）后零修改 → develop 字节=UAT 已应用版本**（启动 validate 兜底）。按封版口径：**0.1.5 包=V0.1.0+V0.1.1—V0.1.9 原字节封版+本轮新迁移收敛种子 → UAT validate 通过，保留业务数据原地升级成立**（首次应用 V0.1.2—V0.1.9+新种子；R__p62_form_txn_action_menu 因菜单 id 修正幂等重跑，属设计语义）。旧"全压回单 baseline"路径与在役 checksum 冲突须删库，Owner 口径已排除。建议新种子命名 **V0.1.11**（链尾递增；V0.1.10 已被未合入 p62 分支占用），PG+H2 各一份，只合并本轮新迁移不改写封版文件，定名实施批次确认。

## 6. knowledge/memory 与需更新入口

无状态矛盾：knowledge 顶部（P64 整体 COMPLETED、功能 48、唯一下一动作=无）与 memory/state.md 未提交新条目（本轮 PLANNING、唯一下一动作=本次探索、5 阶段 0/1/4）正确衔接。一处时点差异待同步：knowledge 终态条目记 Server 320ffac/Web 628b1d9（终态时点），其后 develop 已发生 P64 合并（现 b962648/8c400b0），按 §0.4.2 属待更新表述。建议更新：knowledge 顶部新增本轮条目并修正焦点值、memory 4 件、根 gitlink。功能状态、计数、P 核销由 Planner 唯一裁决。

## 缺口与限制

09-30 15:11 无 tag 部署的构建来源未核实（兼容性以字节+变更史交叉认定，实施时 validate 把关）；表计数 153 与部署回执 101 属不同口径（information_schema 含视图），不作事实差异；p62 性能 16 提交、p63 遗留单文件归属留裁决。

探索完成，是否继续由 Planner 判定；本回执不是新建聊天或向其他聊天发送消息的授权。
