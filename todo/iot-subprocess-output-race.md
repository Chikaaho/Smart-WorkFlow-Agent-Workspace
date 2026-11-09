# IoT Java 子进程输出读取竞态（2026-11-09）

## 现象

- `JavaSubprocessSandboxTest.testFileWriteBlockedBySecurityManager` 在 CI 上间歇失败：
  `assertTrue(result.getOutputJson().contains("blocked"), result.getOutputJson())`
  抛 NPE，`outputJson` 为 null。
- 2026-11-09 P66 0.4.0 的 CI run #125（commit `19ae82f3`）首次与第 2 次尝试均在此失败；
  第 3 次重跑通过。同代码本地连续 3 次通过。与 P66 X1/版本/日志改动无关。

## 根因

`JavaSubprocessExecutor.execute`：

1. 启动后台线程 `handleRpcLoop` 读取子进程 stdout，收到 `RESULT` 后写入 `outcome[0]`；
2. 主线程 `process.waitFor(...)` 返回后立即检查 `exitValue()`，随后 `ScriptRunResult.success(outcome[0])`。

子进程写完 `RESULT` 后立即退出时，主线程可能先于 RPC 线程读到该行，导致 `outcome[0]` 仍为 null
而返回 `SUCCESS + null output`。

## 建议修复

- 在 `process.waitFor()` 成功、`exitValue()==0` 后，对 `rpcThread` 做有界 `join`（如 1—2s）
  再读取 `outcome[0]`；
- 若 join 后仍为 null，返回明确失败（“子进程未返回输出”），不要返回 `SUCCESS + null`；
- 补一个并发/快速退出用例，稳定覆盖该竞态。

## 证据

- CI 日志（失败）：`JavaSubprocessSandboxTest.testFileWriteBlockedBySecurityManager`，
  `NullPointer Cannot invoke "String.contains(...)" because ... getOutputJson() is null`。
- 本地 `mvn -o -pl sw-basic/sw-basic-agent ...` 不覆盖该模块；全量 `mvn -o test` 本地通过。
- 代码位置：`sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/JavaSubprocessExecutor.java`
  `execute` 与 `handleRpcLoop`。
