# 富文本预设色板含 #6F2DFF（0.2.0 遗留，非阻塞）

- 登记：2026-10-28，Owner 授权“不影响使用的话记 todo 修复”。
- 现象：表单填写/设计富文本工具栏的颜色浮层预设色含 `#6F2DFF`，HEX 输入显示 `#6F2DFF`；当前全局主题为默认蓝/青/自定义，紫色已不作为主题预设。
- 影响：仅内容色预设，现有富文本值 `data-rt-color` 受控白名单包含该色；不影响主题、权限或使用。
- 证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-08-g37-color-open.png`；回执 `product/0.2.0/receipts/u020-full-visual-sweep.md`（G37）。
- 待定：是否将预设色板调整为蓝色系、是否保留旧值兼容；需规划确认后处理，不在本轮扩大范围。
