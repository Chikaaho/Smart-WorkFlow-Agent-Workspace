# 0.2.0 统一执行·批次 16（收起列居中/裁切收敛——承接侧栏批次16读取记录）

2026-10-25｜Executor｜承接 `planning-receipt-read-unified-020-16.md` 指出的视觉残留；Web `691833c..463f205`

## 收敛项（3 文件 +24/−1）

- **收起列统一居中、不裁切**：收起态 `el-menu-item/el-sub-menu__title` padding 归一（`padding: 0 !important` 压过 EP 内联 padding）、tooltip trigger 居中 flex、`design-icon` margin 归零——图标/首字统一为 20px 居中列。
- **确定性收起宽度**：诊断发现 SPA 内 EP 对 collapse 切换的反应性丢失（`el-menu--collapse` 类不应用，menu 停留 240px 以 min-width:auto 撑住 aside 236）——`el-menu` 以 collapse 态为 `:key` 强制重挂载；aside 收起宽度改**内联绑定**（类规则在部分会话被未知层压过，内联确定性生效）。
- **底部箭头**：收起态底部条 padding 8px 0、箭头 18px 居中——右向展开箭头独立成列清晰呈现。

## 几何量化（真实浏览器 1280，t100admin /system/tenant 收起态）

- aside **64px**；可见 glyph **11**；**全部可见（零宽 0）、裁切 0**；居中偏差 maxOff **6px**；底部条箭头居中偏差 **0**。
- 上一读取记录的「靠右半截、半露箭头、不统一居中」对应项已按几何消除。

## 边界与如实记录

- **截图表面间歇故障**：本批 IAB 截图连续超时/返回冻结旧帧（与实时 DOM 量化矛盾），本批视觉证据以**DOM 几何量化数据**为准，稳定截图待表面恢复后补取（批次 15 截图可能同样受冻结帧影响，读取记录中的半露观察与该帧一致）。
- 四连 exit=0：**1849 通过/3 跳过**、build 4.04s；log 内含 1 条 prettier 格式告警（BasicLayout :style 绑定折行），已修复并复跑 lint（0 error 0 warning）/typecheck 0；test/build 于同语义源通过。
- 剩余账本不变：A16 第二活跃租户同对象负向、A15 多人办理轨迹、A13/A14 绑定版本核实、A12、富文本、通知、节点高级、像素文案/手册、A03—A05（含 1920/1366）。

## 服务收尾

- 后端（8080）与前端（5175）净停、端口回读不可达；PG/Redis 容器保持。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
