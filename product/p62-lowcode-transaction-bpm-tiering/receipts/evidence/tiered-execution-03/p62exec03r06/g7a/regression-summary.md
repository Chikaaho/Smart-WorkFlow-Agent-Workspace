# G7a 最终产物回归逐类结果(runId=p62exec03r06,buildCommit=7ba52ee118875355313b15b20bba0a177e3eec38,时点2026-10-02 20:04-20:09+08:00)

| 套件 | 命令 | 结果 | 退出码 | 原始输出 |
|---|---|---|---|---|
| sw-bpm-process 模块全量 | mvn -pl sw-biz/sw-bpm/sw-bpm-process test(MAVEN_OPTS=-Xmx2g) | Tests run: 242, Failures: 0, Errors: 0, Skipped: 0;BUILD SUCCESS | 0 | process-module-full-test-run.log |
| P62OverlapEffectsPgTest | mvn -pl sw-bootstrap test -Dtest=…四类合跑 | Tests run: 3, Failures: 0, Errors: 0 | 1(合跑总退出码,见 FrozenSemantics 行) | bootstrap-four-tests-run1-frozen-flake.log |
| CommandOverlapRealEngineTest | 同上 | Tests run: 4, Failures: 0, Errors: 0 | 同上 | 同上 |
| P62CrossChannelIdentityPgTest | 同上(最终HEAD重跑,双向正向) | Tests run: 2, Failures: 0, Errors: 0 | 同上 | 同上;原始证据 g3b-final/ |
| P62FrozenSemanticsPgTest(合跑轮) | 同上 | Tests run: 3, Failures: 1(expected 1 was 2,旧类型命令幂等时序偶发) | 1 | bootstrap-four-tests-run1-frozen-flake.log |
| P62FrozenSemanticsPgTest(单独重跑) | mvn -pl sw-bootstrap test -Dtest=P62FrozenSemanticsPgTest | Tests run: 3, Failures: 0, Errors: 0;BUILD SUCCESS | 0 | frozen-semantics-retry-pass.log |
| P62CrossChannelBoundaryPgTest(新增反向边界) | mvn -pl sw-bootstrap test -Dtest=P62CrossChannelBoundaryPgTest | Tests run: 6, Failures: 0, Errors: 0;BUILD SUCCESS | 0 | ../g3b/surefire-run3-pass.log |

## 偶发说明:合跑轮 FrozenSemantics 1 失败为多 EmbeddedPostgres 并行启动下的时序偶发,单独重跑通过;
## 该测试覆盖 FLOW_START 旧类型命令幂等,与 b6e9a45 审批恢复分支无生产代码交集(diff 映射见 production-diff-mapping.txt)。
## 失败轮日志按不可覆盖原则保留(run1),未删除、未覆盖。
