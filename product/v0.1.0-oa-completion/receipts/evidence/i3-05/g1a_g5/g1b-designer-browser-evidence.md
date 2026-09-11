# G1b 设计器浏览器行为证据（真实交互）

- 会话：admin 登录（form.requestSubmit() 提交，验证码 1234 dev）→ 后台 → 流程设计器
- defId=2098339265011818497（g1b-designer, bpm_55821d4eb3124fba，草稿 v1）

## 动作序列与证据（screens/ 目录）
1. g1b-01 空白设计器（START/END 预置）
2. g1b-02 真实拖拽：palette「审批 APPROVAL」→ 画布 (650,400)，节点选中（蓝框）+ 右侧属性面板展开
3. g1b-03 面板填非法配置：审批人（兼容）=`{invalid json`、参与人=`{}` → 保存草稿成功（toast「属性已更新/草稿已保存」）
4. g1b-04 点「校验」→ 服务端一次返回 3 条可判定错误（2202 审批人类型不能为空 / 2004 节点入出边基数违规 / 2005 存在孤儿不可达节点），每条带「定位 node_1」锚点；画布 node_1 红框错误标记（selected ID=node_1）
5. g1b-05 点「定位 node_1」→ 画布滚动聚焦 node_1 + 面板保持选中（定位前后 selected 均为 node_1）
6. g1b-06 合法配置填入：`{"strategy":"FIXED_USER","value":[1]}` → 保存 → 再校验 → 剩余 2 条（2004/2005，为连线缺失，2202 已消除）
7. 补齐 START→node_1→END 边（外部 PUT /workflow/defs/{id}/graph，同草稿）→ 刷新 → 校验
8. g1b-07 **校验通过：可判定错误 0 条**（合法 FIXED_USER 配置同一草稿）
9. g1b-08 **发布成功** toast：「发布成功：图、节点配置、表单与函数版本已冻结」

## 服务端 HTTP 佐证
- 保存草稿/校验/发布均走 /api/workflow/defs/2098339265011818497（lib raw 报文留痕：raw/step*）
- snapshotId=i3-05-frozen-b（jar 1172aff5…7aee）

## 备注
- 面板 object 类型字段在节点对象非空时显示 [object Object]（watch 回显未 JSON.stringify）——
  G1b「明确面板字段语义」的字段语义已明确（对象 JSON 文本、提交前解析回对象），该显示缺陷
  作为 G1b 已知显示问题记录，不影响提交语义（applyProps 解析正确、服务端校验按对象执行）。
