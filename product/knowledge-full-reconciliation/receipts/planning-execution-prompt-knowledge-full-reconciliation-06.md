# 终态入口补充提示06

2026-09-04；Planner；同类入口错误继续收敛。唯一补证入口，替代历史补充提示05；阶段三方向的唯一值仍有效。依据planning-review-terminal-sync-01.md与terminal-sync-01/final快照。

## 诊断与变化

删去已经通过的业务审计、计数、六入口diff、24项封装、memory容量。仅原子化三个当前引用错误T1/T2/T3；由逐轮复制编号改为引用current-status唯一入口，避免重复失配。不存在的06-passed不可通过新建空壳或改写历史裁决补齐。

## 唯一剩余矩阵

| ID/对象 | 正向完成条件 | 反向断言 | 独立最小证据 |
|---|---|---|---|
| T1 knowledge/current-status.md:21 | 最近通过裁决引用真实planning-review-sync-b-07-passed.md | 无06-passed悬空引用、无把06改称通过 | 修改前后真实diff、最终全文、引用路径存在性结果 |
| T2 Smart-WorkFlow-Server/功能清单.md当前焦点 | 下一动作引用knowledge/current-status当前唯一下一动作（终态复核） | 不再把sync-b-01作为当前待复核 | 固定前态→现态diff、当前焦点原文及全文 |
| T3 knowledge/feature-reconciliation-index.md:202 | 本任务执行入口引用current-status当前入口或真实阶段三方向 | 无“本B方向为当前唯一执行入口” | 固定前态→现态diff、对应行原文及全文 |

固定前态为evidence-terminal-sync-01/final内current-status.md、server-checklist.md、index.md；允许等价引用真实终态方向，禁止替代为历史B方向。仅修改这三段；不滚动改其余入口的terminal-sync-01编号。追加terminal-sync-01-correction-01.md作为原回执补丁及evidence-terminal-sync-01-correction-01/，旧文件只读。

## 范围、顺序与提交门

允许读取上述输入/三源文件及被引用的product方向与裁决；只写上述三处当前文字和新证据。工作目录/usr/local/projects/Smart-WorkFlow。允许文档编辑、rg、diff、shasum、sort/uniq、路径存在性检查；读取Server文档前遵守执行角色工程入口规则。禁止业务代码、治理规则、Git提交推送、工程测试构建迁移、方向移动和业务计数/状态变更。

先固定前态哈希→修三处→三份真实diff及源/副本哈希→简短补丁回执→新包清单生成及回读，校验日志在包外。每原子证据独立按T编号定位；全部为是才提交：三个正向条件成立？旧错误引用零残留？diff只改授权三段？源/副本一致？清单集合missing/extra/duplicate为0且全部回读OK？

状态保持COMPLETED（待Planner终态复核），不得称已确认。原PASSED与无变化的终态字段全部锁定，不重跑业务或旧封装。真实工具限制须原始结果、替代尝试和独立工作穷尽，按现有terminal-contract报告；不以普通引用错误自称阻塞。
