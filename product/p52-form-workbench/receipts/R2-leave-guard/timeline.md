# R2 时间线（本轮回合，均为真实浏览器 + 真实后端）

## 入口 1：发布（C1）
1. 打开 C1（DRAFT，基线 R2草稿）→ 编辑标题 `R2-C1-edit-discard` → 点发布
2. 守卫弹窗「未保存的修改」出现 → 点「放弃修改并继续」
3. 标题还原为 `R2草稿`，isDirty=false；**发布确认框出现（目标动作继续）** → 取消发布确认，C1 仍 DRAFT
4. 编辑标题 `R2-C1-edit-savefail` → `kill -STOP` 后端 → 点发布 → 守卫 → 「保存并继续」
5. 保存请求挂起 → 页面「保存中」，**发布确认框未出现** → `kill -CONT` → 「保存失败」，内容与未保存标记保留，发布确认仍未出现
6. （锁定项复述）取消 / 保存并继续成功分支见首轮补证与审查记录

## 入口 2：切「关联流程」工作区（C2）
1. 编辑标题 `R2-C2-tab-cancel` → 切工作区 → 守卫 → X（取消）→ **留在设计页**，编辑保留，URL 未变
2. 编辑标题 `R2-C2-tab-discard` → 切工作区 → 守卫 → 「放弃修改并继续」→ 切至 processes；切回设计：标题还原 `R2草稿`
3. 编辑标题 `R2-C2-tab-save` → 切工作区 → 守卫 → 「保存并继续」→ 切至 processes，「保存成功」；curl 回查 definition 含 `R2-C2-tab-save`
4. 编辑标题 `R2-C2-tab-savefail` → 切工作区 → 守卫 → 「保存并继续」（后端 STOP）→ **未切换**（停留 design）；CONT 后「保存失败」，编辑保留

## 入口 3：路由离开（C2 → B，页内 $router.push）
1. 编辑标题 `R2-C2-leave-cancel` → push B → 守卫 → X（取消）→ **留在 C2**，编辑保留
2. 编辑标题 `R2-C2-leave-discard` → push B → 守卫 → 「放弃修改并继续」→ **落到 B**；push 回 C2：标题还原为基线 `R2-C2-tab-savefail`；curl：definition 无 leave-discard 残留
3. 编辑标题 `R2-C2-leave-save` → push B → 守卫 → 「保存并继续」→ **落到 B**；curl：definition 含 `R2-C2-leave-save`（持久化成功）
4. 编辑标题 `R2-C2-leave-savefail` → push B → 守卫 → 「保存并继续」（后端 STOP）→ **未离开**（URL 始终 C2）；CONT 后编辑与未保存标记保留；curl：definition 无 leave-savefail 残留（零持久化）

## 截图
- `guard-dialog-unsaved-changes.png`：守卫弹窗「未保存的修改」（放弃修改并继续 / 保存并继续 / X）真实页面呈现
- `save-success-tag.png`：保存并继续成功后的「保存成功」状态
- `publish-invalid-column-blocked.png`：发布链路校验拦截（锁定项配图）
- 其余分支以 `requests.json` 的 DOM/组件状态读取为页面证据（浏览器截图管线在长时间会话后部分失效，如实说明）
