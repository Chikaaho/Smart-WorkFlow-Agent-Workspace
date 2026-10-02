G6b 视口证据索引（复核03 G6b：指定对象+视口+高度+URL+身份+请求关联）
对象=流程定义 2105507486266904578（属性面板）/ 设备命令 UNKNOWN 人工核实弹窗
身份=debug token test_91001（P62验收操作员 role 2），浏览器=ZCode IAB 可见会话

| 图像 | 视口(WxH实际) | URL | 对象/请求关联 |
|---|---|---|---|
| g6b-viewports/attrs-panel-1920.png | 1920x1080 | /workflow/defs/2105507486266904578/design | 同定义；回读属性 actionId=da166513…(PUT /graph 200 见 g6a-chain/access-log-lines.txt) |
| g6b-viewports/attrs-panel-1366.png | 1366x768 | 同上 | 同定义同节点回读 |
| g6b-viewports/attrs-panel-1024.png | 1024x768 | 同上 | 同定义同节点回读（da166513/instanceBusinessKey/1/BLOCK） |
| g6b-r04-attrs-1280.png（本轮补） | 1280x720 | /workflow/defs/2105507486266904578/design | 同定义；回读含 v2 数量=2（本轮 UI 修改后） |
| g6b-viewports/verify-dialog-1920-filled.png | 1920x1080 | /iot/devices-manage 命令抽屉→人工核实 | 命令 g6b-verify-01；UI 提交后 DB UNKNOWN→SUCCESS 审计 basis=GD-2026-1002 |
| g6b-viewports/verify-dialog-1366.png | 1366x768 | 同上 | 命令 g6b-verify-02 UNKNOWN 行 |
| g6b-viewports/verify-dialog-1024.png | 1024x768 | 同上 | 同上 |
| g6b-r04-verify-1280.png（本轮补） | 1280x720 | 同上 | 命令 g6b-r04-1280（UNKNOWN 经生产补偿调度转换） |
| g6b-viewports/verify-dialog-375-fixed.png | 375x667（额外覆盖） | 同上 | 修复后提交按钮可及 |
