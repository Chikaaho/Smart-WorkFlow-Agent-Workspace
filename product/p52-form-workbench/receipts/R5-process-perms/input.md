# R5 流程管理权限 · 输入与环境

- 环境：真实后端 `sw-bootstrap`（dev/H2，V47 + @PreAuthorize）。
- 对照主体：
  - `rlimited`（R系列查看角色，仅绑菜单 4 `form:design` + 23 `workflow:def:view`；经 admin REST 真实创建）
  - `admin`（superadmin 短路）
- 对象：真实存在的 DRAFT 流程定义 P：defId=`2094824141723742209`（processKey `bpm_5474609da11c4125`，绑定 formKey `p52_r_form_a_1788279969533`，初始图 3 元素，version=1）。
- 依据方向 §3.4「复用现有流程创建、设计、发布、挂起/激活等已存在能力」：现有后端仅提供保存草稿图 / 发布 / 删除（无挂起/激活，方向已声明不得伪装），故对照覆盖保存、发布、删除/管理三类管理操作。
