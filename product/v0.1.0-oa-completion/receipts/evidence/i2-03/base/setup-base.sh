#!/bin/bash
# I2 补证轮（回执 03）基础链+夹具重建脚本（一次执行）
set -u
EV=/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i2-03
CT='Content-Type: application/json'; B=http://localhost:8080/api
AH='Authorization: Bearer test_1'

# ---------- 1. 外部数据源（真实 H2 文件库只读 + 30 万行 I2_BIG 供超时/超限） ----------
curl -s -H "$AH" -H "$CT" -X POST $B/api/workflow/external-datasource -d '{"name":"i2p3-ext-h2","type":"h2","jdbcUrl":"jdbc:h2:file:/tmp/sw-i2-ext-mobile;IFEXISTS=TRUE;ACCESS_MODE_DATA=R","driverClass":"org.h2.Driver","username":"sa","password":"","readOnly":1,"enabled":1}' > $EV/base/01-datasource.json
DS_ID=$(python3 -c "import json;print(json.load(open('$EV/base/01-datasource.json'))['data'])")

# ---------- 2. 查询契约 + 预览 ----------
curl -s -H "$AH" -H "$CT" -X POST $B/form/ext/query-contract -d "{\"datasourceId\":$DS_ID,\"queryKey\":\"i2_dept_source_exact\",\"sql\":\"SELECT ID, DISPLAY_NAME FROM I2_DEPT WHERE STATUS='ACTIVE' ORDER BY ID\",\"outputFields\":[{\"name\":\"ID\",\"type\":\"STRING\"},{\"name\":\"DISPLAY_NAME\",\"type\":\"STRING\"}]}" > $EV/base/02-contract.json
curl -s -H "$AH" "$B/form/ext/query/i2_dept_source_exact" > $EV/base/03-preview.json

# ---------- 3. 目标表单 + 记录 ----------
curl -s -H "$AH" -H "$CT" -X POST $B/form/def -d '{"formKey":"i2-live-target","name":"I2 Live Target","logicalTableName":"i2_live_target","description":"REFERENCE target"}' > $EV/base/04-target-create.json
TARGET_ID=$(python3 -c "import json;print(json.load(open('$EV/base/04-target-create.json'))['data']['id'])")
printf '{"definition":"{\\"fields\\":[{\\"name\\":\\"tname\\",\\"type\\":\\"TEXT\\",\\"required\\":true,\\"label\\":\\"目标名称\\"}]}"}' > $EV/base/05-target-config.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$TARGET_ID/config -d @$EV/base/05-target-config.json > $EV/base/06-target-save.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$TARGET_ID/publish > $EV/base/07-target-publish.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/data/i2-live-target -d '{"tname":"目标记录甲"}' > $EV/base/08-target-record.json
TARGET_REC=$(python3 -c "import json;print(json.load(open('$EV/base/08-target-record.json'))['data'])")

# ---------- 4. 主表单 v1（发布；PC 设计器改 tags 选项后升 v2，公式矩阵用 v3） ----------
python3 - <<'EOF'
import json
definition = {"fields":[
 {"name":"title","type":"TEXT","required":True,"label":"标题"},
 {"name":"quantity","type":"NUMBER","label":"数量"},
 {"name":"unit_price","type":"NUMBER","label":"单价"},
 {"name":"total","type":"FORMULA","expression":"ROUND(${quantity} * ${unit_price}, 2)","label":"合计"},
 {"name":"visit_time","type":"TIME","label":"时间"},
 {"name":"owner","type":"USER","label":"负责人"},
 {"name":"department","type":"DEPT","label":"部门"},
 {"name":"external_dept","type":"DATASOURCE","label":"外部部门","dsBinding":{"queryKey":"i2_dept_source_exact","version":1,"valueField":"ID","displayField":"DISPLAY_NAME"}},
 {"name":"reference_record","type":"REFERENCE","label":"引用记录","targetFormId":"i2-live-target"},
 {"name":"lines","type":"TABLE","label":"明细","subFields":[{"name":"item","type":"TEXT","label":"项目"},{"name":"amount","type":"NUMBER","label":"金额"}]},
 {"name":"attachments","type":"ATTACHMENT","label":"附件"},
 {"name":"photo","type":"IMAGE","label":"图片"},
 {"name":"tags","type":"MULTISELECT","label":"标签"},
 {"name":"note","type":"RICH_TEXT","label":"备注"},
 {"name":"category","type":"DICT","dictType":"sys_common_status","renderAs":"radio","label":"分类"}],
 "fieldPermissions":{"total":{"view":["role:admin"],"edit":["role:admin"]},"external_dept":{"view":["role:admin"],"edit":["role:admin"]}},
 "recordPermissions":{"view":["role:admin"],"edit":["role:admin"],"delete":["role:admin"]},
 "actionPermissions":{"create":["role:admin"],"view":["role:admin"],"edit":["role:admin"],"delete":["role:admin"],"disable":["role:admin"],"import":["role:admin"],"export":["role:admin"],"flowStart":["role:admin"]}}
ev="/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i2-03"
open(f"{ev}/base/09-form-v1-config-body.json","w").write(json.dumps({"definition":json.dumps(definition,ensure_ascii=False)},ensure_ascii=False))
EOF
curl -s -H "$AH" -H "$CT" -X POST $B/form/def -d '{"formKey":"i2_live_20260909b","name":"I2 Live Evidence Final","logicalTableName":"i2_live_20260909b","description":"I2 p3 chain (new instance; prior instance destroyed 2026-09-10)"}' > $EV/base/10-form-create.json
FORM_ID=$(python3 -c "import json;print(json.load(open('$EV/base/10-form-create.json'))['data']['id'])")
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$FORM_ID/config -d @$EV/base/09-form-v1-config-body.json > $EV/base/11-config-save.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$FORM_ID/publish > $EV/base/12-publish-v1.json
python3 -c "
import json
cfg={'columns':[{'name':'title','label':'标题'},{'name':'quantity','label':'数量'},{'name':'total','label':'合计'},{'name':'category','label':'分类'}],
 'filters':[{'name':'title','op':'like'},{'name':'category','op':'eq'}],
 'defaultSort':{'name':'title','desc':False},
 'actions':['view','edit','delete','export']}
open('$EV/base/13-list-config-body.json','w').write(json.dumps({'config':json.dumps(cfg,ensure_ascii=False)},ensure_ascii=False))"
curl -s -H "$AH" -H "$CT" -X PUT $B/form/def/$FORM_ID/list-config -d @$EV/base/13-list-config-body.json > $EV/base/14-list-config-save.json
# 管理员对照记录（不触发流程：流程稍后绑定）
curl -s -H "$AH" -H "$CT" -X POST $B/form/data/i2_live_20260909b -d '{"title":"管理员基线记录","quantity":9,"unit_price":1,"owner":"1","department":"1","external_dept":{"value":"dept-b","display":"研发二部"}}' > $EV/base/15-admin-record.json
ADMIN_REC=$(python3 -c "import json;print(json.load(open('$EV/base/15-admin-record.json'))['data'])")

# ---------- 5. 身份夹具：filler1(350-353,SELF) / viewer1(353 only 受限查看) / nobody1 ----------
curl -s -H "$AH" -H "$CT" -X POST $B/system/role -d '{"name":"I2 填报者","code":"i2_filler","sort":90,"status":1,"dataScope":3,"description":"动作 350-353；SELF"}' > $EV/base/16-role-filler.json
FILLER_ROLE=$(python3 -c "import json;print(json.load(open('$EV/base/16-role-filler.json'))['data'])")
curl -s -H "$AH" -H "$CT" -X PUT $B/system/role/$FILLER_ROLE/menus -H "$CT" -d '[350,351,352,353]' > $EV/base/17-filler-menus.json
curl -s -H "$AH" -H "$CT" -X POST $B/system/role -d '{"name":"I2 受限查看者","code":"i2_viewer","sort":91,"status":1,"dataScope":3,"description":"仅 form:data:query；字段受限"}' > $EV/base/18-role-viewer.json
VIEWER_ROLE=$(python3 -c "import json;print(json.load(open('$EV/base/18-role-viewer.json'))['data'])")
curl -s -H "$AH" -H "$CT" -X PUT $B/system/role/$VIEWER_ROLE/menus -H "$CT" -d '[353]' > $EV/base/19-viewer-menus.json
curl -s -H "$AH" -H "$CT" -X POST $B/system/user -d "{\"username\":\"filler1\",\"plainPassword\":\"Filler1@2026\",\"realName\":\"I2 填报者\",\"deptId\":1,\"status\":0,\"roleIds\":[$FILLER_ROLE]}" > $EV/base/20-user-filler1.json
FILLER_ID=$(python3 -c "import json;print(json.load(open('$EV/base/20-user-filler1.json'))['data'])")
curl -s -H "$AH" -H "$CT" -X POST $B/system/user -d "{\"username\":\"viewer1\",\"plainPassword\":\"Viewer1@2026\",\"realName\":\"I2 受限查看者\",\"deptId\":1,\"status\":0,\"roleIds\":[$VIEWER_ROLE]}" > $EV/base/21-user-viewer1.json
VIEWER_ID=$(python3 -c "import json;print(json.load(open('$EV/base/21-user-viewer1.json'))['data'])")
curl -s -H "$AH" -H "$CT" -X POST $B/system/user -d '{"username":"nobody1","plainPassword":"Nobody1@2026","realName":"I2 无权者","deptId":1,"status":0,"roleIds":[]}' > $EV/base/22-user-nobody1.json
NOBODY_ID=$(python3 -c "import json;print(json.load(open('$EV/base/22-user-nobody1.json'))['data'])")
cd $EV/base
cp ../../i2-02/identity-matrix/login-helper.mjs ./login-helper.mjs
node login-helper.mjs filler1 'Filler1@2026' > /tmp/p3-filler1-token.txt 2>&1
node login-helper.mjs viewer1 'Viewer1@2026' > /tmp/p3-viewer1-token.txt 2>&1
node login-helper.mjs nobody1 'Nobody1@2026' > /tmp/p3-nobody1-token.txt 2>&1

# ---------- 6. 对象映射 + 销毁映射 ----------
cat > $EV/object-map.txt <<EOF
# 旧运行实例（回执 02 轮 H2 内存实例 PID 见 /tmp/i2-matrix-server.pid 历史）已于 2026-09-10 随进程退出销毁：
# 旧 FORM_ID=7347120a-42ae-4d28-adbc-1365ee38ee45 / ADMIN_RECORD=28418673 / FILLER_RECORD=c7ef6779 / DATASOURCE=2097724780673953793 等全部随之销毁（E8b 提供进程退出+端口证据）。
# 本轮新实例对象映射如下：
DATASOURCE_ID=$DS_ID
TARGET_FORM_ID=$TARGET_ID
TARGET_RECORD_ID=$TARGET_REC
FORM_ID=$FORM_ID
FORM_KEY=i2_live_20260909b
ADMIN_RECORD_ID=$ADMIN_REC
FILLER_ROLE_ID=$FILLER_ROLE
VIEWER_ROLE_ID=$VIEWER_ROLE
FILLER_USER_ID=$FILLER_ID
VIEWER_USER_ID=$VIEWER_ID
NOBODY_USER_ID=$NOBODY_ID
EOF
echo "=== BASE DONE ==="; cat $EV/object-map.txt