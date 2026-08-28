#!/usr/bin/env bash
# 最小业务闭环 · 真实 HTTP 链路行为取证（v2）
set -u
BASE="http://localhost:8080/api"
EV=/tmp/evidence.md
: > "$EV"
RUN=$RANDOM
UKEY="evidence_user_${RUN}"
FKEY="ev_form_${RUN}"
FKEY_DEL="ev_form_del_${RUN}"
DKEY="ev_device_${RUN}"

log() { echo -e "$@" >> "$EV"; }
step() { log "\n## $1\n"; }
jqget() { python3 -c "import sys,json;d=json.load(sys.stdin);print(eval('d'+sys.argv[1]))" "$1" 2>/dev/null; }

req() {
  local m=$1 p=$2 t=$3 d=$4
  if [ -n "$d" ]; then
    curl -s -X "$m" "$BASE$p" -H "Content-Type: application/json" -H "Authorization: Bearer ${t}" -d "$d"
  else
    curl -s -X "$m" "$BASE$p" -H "Content-Type: application/json" -H "Authorization: Bearer ${t}"
  fi
}
show() {
  echo "### $1" >> "$EV"
  echo '```json' >> "$EV"
  echo "$2" | head -c 1500 >> "$EV"
  echo -e '\n```' >> "$EV"
}

step "0. 前置：admin 登录"
R=$(req POST /auth/login "" '{"username":"admin","password":"admin123"}')
show "POST /auth/login admin" "$R"
ADMIN=$(echo "$R" | jqget "['data']['accessToken']")

step "1. 创建部门（组织准备）"
R=$(req POST /system/dept "${ADMIN}" "{\"name\":\"验证部门-${RUN}\",\"parentId\":1,\"sort\":1,\"status\":0}")
show "POST /system/dept" "$R"
DEPT_ID=$(echo "$R" | jqget "['data']")

step "2. 创建用户（初始部门=根部门1）"
R=$(req POST /system/user "${ADMIN}" "{\"username\":\"${UKEY}\",\"realName\":\"链路验证用户\",\"plainPassword\":\"Init#12345\",\"status\":0,\"deptId\":1,\"roleIds\":[],\"postIds\":[]}")
show "POST /system/user" "$R"
USER_ID=$(echo "$R" | jqget "['data']")

step "3. 分配角色 + 分配部门（真实权限链）"
R=$(req PUT "/system/user/${USER_ID}/roles" "${ADMIN}" "[2]")
show "PUT /system/user/${USER_ID}/roles body=[2]" "$R"
R=$(req PUT "/system/user" "${ADMIN}" "{\"id\":${USER_ID},\"username\":\"${UKEY}\",\"realName\":\"链路验证用户\",\"status\":0,\"deptId\":${DEPT_ID},\"roleIds\":[2],\"postIds\":[]}")
show "PUT /system/user（分配部门 deptId=${DEPT_ID}）" "$R"
R=$(req GET "/system/user/${USER_ID}/roles" "${ADMIN}" "")
show "GET /system/user/${USER_ID}/roles（角色分配回查）" "$R"
R=$(req GET "/system/user/${USER_ID}" "${ADMIN}" "")
show "GET /system/user/${USER_ID}（部门分配回查）" "$R"

step "4. 新用户登录 + 权限生效验证"
R=$(req POST /auth/login "" "{\"username\":\"${UKEY}\",\"password\":\"Init#12345\"}")
show "POST /auth/login ${UKEY}（初始密码）" "$R"
USER=$(echo "$R" | jqget "['data']['accessToken']")
R=$(req GET /system/auth/me "${USER}" "")
show "GET /system/auth/me（当前用户）" "$R"
R=$(req POST /system/user/page "${USER}" '{"pageNum":1,"pageSize":5}')
show "POST /system/user/page（普通用户，预期 403 无权限）" "$R"
R=$(req GET /workflow/defs "${USER}" "?pageNum=1&pageSize=5")
show "GET /workflow/defs（普通用户，预期可访问）" "$R"

step "5. 修改密码 + 新密码重登录"
R=$(req POST /auth/password "${USER}" '{"oldPassword":"Init#12345","newPassword":"New#54321"}')
show "POST /auth/password（旧密码改新密码）" "$R"
R=$(req POST /auth/login "" "{\"username\":\"${UKEY}\",\"password\":\"Init#12345\"}")
show "POST /auth/login（旧密码，预期失败）" "$R"
R=$(req POST /auth/login "" "{\"username\":\"${UKEY}\",\"password\":\"New#54321\"}")
show "POST /auth/login（新密码，预期成功）" "$R"
USER=$(echo "$R" | jqget "['data']['accessToken']")

step "6. 审批人确认（admin 作为 DESIGNATED 审批人）"
R=$(req GET /system/auth/me "${ADMIN}" "")
ADMIN_ID=$(echo "$R" | jqget "['data']['user']['id']")
echo "审批人 userId=${ADMIN_ID}" >> "$EV"

step "7. 表单管理：创建/修改/发布/删除"
R=$(req POST /api/form/def "${USER}" "{\"formKey\":\"${FKEY}\",\"name\":\"链路验证表单${RUN}\",\"logicalTableName\":\"${FKEY}\",\"description\":\"端到端验证\"}")
show "POST /api/form/def（创建草稿）" "$R"
FORM_ID=$(echo "$R" | jqget "['data']['id']")
R=$(req PUT "/api/form/def/${FORM_ID}" "${USER}" "{\"name\":\"链路验证表单${RUN}-已改名\",\"logicalTableName\":\"${FKEY}\",\"description\":\"端到端验证\"}")
show "PUT /api/form/def/${FORM_ID}（修改表单）" "$R"
R=$(req POST "/api/form/def/${FORM_ID}/config" "${USER}" "{\"definition\":\"{\\\"fields\\\":[{\\\"name\\\":\\\"title\\\",\\\"type\\\":\\\"TEXT\\\"},{\\\"name\\\":\\\"device_key\\\",\\\"type\\\":\\\"TEXT\\\"},{\\\"name\\\":\\\"command_key\\\",\\\"type\\\":\\\"TEXT\\\"}]}\"}")
show "POST /api/form/def/${FORM_ID}/config（保存字段定义）" "$R"
R=$(req POST "/api/form/def/${FORM_ID}/publish" "${USER}" "")
show "POST /api/form/def/${FORM_ID}/publish（发布，建宽表）" "$R"
R=$(req POST /api/form/def "${USER}" "{\"formKey\":\"${FKEY_DEL}\",\"name\":\"待删除表单\",\"logicalTableName\":\"${FKEY_DEL}\"}")
DEL_FORM_ID=$(echo "$R" | jqget "['data']['id']")
R=$(req DELETE "/api/form/def/${DEL_FORM_ID}" "${USER}" "")
show "DELETE /api/form/def/${DEL_FORM_ID}（删除草稿表单）" "$R"
R=$(req GET "/api/form/def/by-key/${FKEY}" "${USER}" "")
show "GET /api/form/def/by-key/${FKEY}（表单状态回查）" "$R"

step "8. 设备注册（模拟设备）"
R=$(req POST /iot/devices "${ADMIN}" "{\"deviceKey\":\"${DKEY}\",\"name\":\"验证开关${RUN}\",\"deviceType\":\"switch\"}")
show "POST /iot/devices（注册设备）" "$R"
R=$(req GET "/iot/devices/${DKEY}" "${ADMIN}" "")
show "GET /iot/devices/${DKEY}（设备状态）" "$R"

step "9. 流程管理：创建/修改/绑定表单/发布/删除"
R=$(req POST /workflow/defs "${USER}" "{\"name\":\"链路验证流程${RUN}\",\"formKey\":\"${FKEY}\"}")
show "POST /workflow/defs（创建流程定义，绑定表单 ${FKEY}）" "$R"
DEF_ID=$(echo "$R" | jqget "['data']['defId']")
GRAPH=$(echo "$R" | python3 -c "
import sys,json
d=json.load(sys.stdin)
g=d['data']['graph']
g['elements']=[
 {'id':'node_start','kind':'node','type':'START','style':{'x':100,'y':300},'config':{}},
 {'id':'node_approval','kind':'node','type':'APPROVAL','style':{'x':400,'y':300},'config':{'name':'主管审批','approver':{'type':'DESIGNATED','value':['${ADMIN_ID}']}}},
 {'id':'node_end','kind':'node','type':'END','style':{'x':700,'y':300},'config':{}},
 {'id':'e1','kind':'edge','source':'node_start','target':'node_approval','style':{},'config':{}},
 {'id':'e2','kind':'edge','source':'node_approval','target':'node_end','style':{},'config':{}}
]
print(json.dumps(g))")
R=$(req PUT "/workflow/defs/${DEF_ID}/graph" "${USER}" "$GRAPH")
show "PUT /workflow/defs/${DEF_ID}/graph（保存含审批节点图，审批人=${ADMIN_ID}）" "$R"
R=$(req PUT "/workflow/defs/${DEF_ID}" "${USER}" "{\"name\":\"链路验证流程${RUN}-已改名\"}")
show "PUT /workflow/defs/${DEF_ID}（修改流程定义名称）" "$R"
R=$(req POST "/workflow/defs/${DEF_ID}/validate" "${USER}" "")
show "POST /workflow/defs/${DEF_ID}/validate（图校验）" "$R"
R=$(req POST "/workflow/defs/${DEF_ID}/publish" "${USER}" "")
show "POST /workflow/defs/${DEF_ID}/publish（发布，Flowable 部署+表单绑定）" "$R"
R=$(req POST /workflow/defs "${USER}" "{\"name\":\"待删除流程\",\"formKey\":\"${FKEY}\"}")
DEL_DEF_ID=$(echo "$R" | jqget "['data']['defId']")
R=$(req DELETE "/workflow/defs/${DEL_DEF_ID}" "${USER}" "")
show "DELETE /workflow/defs/${DEL_DEF_ID}（删除流程定义）" "$R"

step "10. 发起流程：提交表单数据（携带 deviceKey/commandKey）"
R=$(req POST "/api/form/data/${FKEY}" "${USER}" "{\"title\":\"设备采购申请\",\"device_key\":\"${DKEY}\",\"command_key\":\"power_on\"}")
show "POST /api/form/data/${FKEY}（提交→触发流程发起）" "$R"
sleep 4
R=$(req GET "/workflow/instances" "${USER}" "?pageNum=1&pageSize=10")
show "GET /workflow/instances（发起人查实例列表）" "$R"

step "11. 审批人待办 → 通过审批"
R=$(req GET "/workflow/tasks/todo" "${ADMIN}" "?pageNum=1&pageSize=10")
show "GET /workflow/tasks/todo（审批人待办）" "$R"
TASK_ID=$(echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin);rs=d['data']['records'];print(rs[0]['taskId'] if rs else '')")
echo "待办 taskId=${TASK_ID}" >> "$EV"
if [ -n "${TASK_ID}" ]; then
  R=$(req GET "/workflow/tasks/${TASK_ID}" "${ADMIN}" "")
  show "GET /workflow/tasks/${TASK_ID}（审批详情）" "$R"
  R=$(req POST "/workflow/tasks/${TASK_ID}/complete" "${ADMIN}" "")
  show "POST /workflow/tasks/${TASK_ID}/complete（通过审批）" "$R"
fi
sleep 3

step "12. 结果落库回看（发起人视角 + 实例状态）"
R=$(req GET "/workflow/instances" "${USER}" "?pageNum=1&pageSize=10&initiatorId=${USER_ID}")
show "GET /workflow/instances?initiatorId=${USER_ID}（发起人视角）" "$R"
PID=$(echo "$R" | python3 -c "import sys,json;d=json.load(sys.stdin);rs=d['data']['records'];print(rs[0]['processInstanceId'] if rs else '')")
if [ -n "${PID}" ]; then
  R=$(req GET "/workflow/instances/${PID}" "${USER}" "")
  show "GET /workflow/instances/${PID}（实例详情+流转历史）" "$R"
fi

step "13. 设备执行结果回查（审批结果驱动设备）"
R=$(req GET "/iot/devices/${DKEY}/commands" "${ADMIN}" "")
show "GET /iot/devices/${DKEY}/commands（命令+执行结果）" "$R"
R=$(req GET "/iot/devices/${DKEY}" "${ADMIN}" "")
show "GET /iot/devices/${DKEY}（设备最终状态）" "$R"

step "14. 设备命令手动下发 + 结果回写（独立设备链）"
R=$(req POST "/iot/devices/${DKEY}/commands" "${ADMIN}" '{"commandKey":"power_off","payload":"{\"reason\":\"manual\"}"}')
show "POST /iot/devices/${DKEY}/commands（手动下发）" "$R"
CMD_ID=$(echo "$R" | jqget "['data']['id']")
R=$(req POST "/iot/devices/commands/${CMD_ID}/result" "${ADMIN}" '{"status":"FAILED","result":"{\"error\":\"hardware_fault\"}"}')
show "POST /iot/devices/commands/${CMD_ID}/result（设备回写失败结果）" "$R"
R=$(req GET "/iot/devices/${DKEY}/commands" "${ADMIN}" "")
show "GET /iot/devices/${DKEY}/commands（最终命令列表）" "$R"

echo "DONE" >> "$EV"
