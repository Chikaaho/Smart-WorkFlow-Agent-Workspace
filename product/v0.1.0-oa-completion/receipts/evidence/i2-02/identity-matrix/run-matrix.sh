#!/bin/bash
# I2 五身份权限矩阵端到端取证脚本（一次执行，全部原始输出落盘）
set -u
EV=/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i2-02/identity-matrix
CT='Content-Type: application/json'; B=http://localhost:8080/api
AH='Authorization: Bearer test_1'   # dev 调试 token，经 LoginUserLoader 正式回查 → userId=1（admin）
FORM=i2_live_20260909b
log(){ echo "== $1" >> $EV/chain.log; }

# ---------- 1. 外部数据源（真实 H2 文件库，只读） ----------
curl -s -H "$AH" -H "$CT" -X POST $B/api/workflow/external-datasource -d '{"name":"i2-matrix-ext-h2","type":"h2","jdbcUrl":"jdbc:h2:file:/tmp/sw-i2-ext-mobile;IFEXISTS=TRUE;ACCESS_MODE_DATA=R","driverClass":"org.h2.Driver","username":"sa","password":"","readOnly":1,"enabled":1}' > $EV/01-datasource.json
DS_ID=$(python3 -c "import json;print(json.load(open('$EV/01-datasource.json'))['data'])")

# ---------- 2. 查询契约 + 预览 ----------
curl -s -H "$AH" -H "$CT" -X POST $B/form/ext/query-contract -d "{\"datasourceId\":$DS_ID,\"queryKey\":\"i2_dept_source_exact\",\"sql\":\"SELECT ID, DISPLAY_NAME FROM I2_DEPT WHERE STATUS='ACTIVE' ORDER BY ID\",\"outputFields\":[{\"name\":\"ID\",\"type\":\"STRING\"},{\"name\":\"DISPLAY_NAME\",\"type\":\"STRING\"}]}" > $EV/02-contract.json
curl -s -H "$AH" "$B/form/ext/query/i2_dept_source_exact" > $EV/03-preview.json

# ---------- 3. 目标表单 + 记录 ----------
curl -s -H "$AH" -H "$CT" -X POST $B/form/def -d '{"formKey":"i2-live-target","name":"I2 Live Target","logicalTableName":"i2_live_target","description":"REFERENCE target"}' > $EV/04-target-create.json
TARGET_ID=$(python3 -c "import json;print(json.load(open('$EV/04-target-create.json'))['data']['id'])")
printf '{"definition":"{\\"fields\\":[{\\"name\\":\\"tname\\",\\"type\\":\\"TEXT\\",\\"required\\":true,\\"label\\":\\"目标名称\\"}]}"}' > $EV/05-target-config.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$TARGET_ID/config -d @$EV/05-target-config.json > $EV/06-target-save.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$TARGET_ID/publish > $EV/07-target-publish.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/data/i2-live-target -d '{"tname":"目标记录甲"}' > $EV/08-target-record.json
TARGET_REC=$(python3 -c "import json;print(json.load(open('$EV/08-target-record.json'))['data'])")

# ---------- 4. 主表单（同一定义：字段权限 total/external_dept → role:admin） ----------
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
ev="/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i2-02/identity-matrix"
open(f"{ev}/09-form-config-body.json","w").write(json.dumps({"definition":json.dumps(definition,ensure_ascii=False)},ensure_ascii=False))
EOF
curl -s -H "$AH" -H "$CT" -X POST $B/form/def -d '{"formKey":"i2_live_20260909b","name":"I2 Live Evidence Final","logicalTableName":"i2_live_20260909b","description":"I2 matrix chain"}' > $EV/10-form-create.json
FORM_ID=$(python3 -c "import json;print(json.load(open('$EV/10-form-create.json'))['data']['id'])")
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$FORM_ID/config -d @$EV/09-form-config-body.json > $EV/11-config-save.json
curl -s -H "$AH" -H "$CT" -X POST $B/form/def/$FORM_ID/publish > $EV/12-publish.json

# ---------- 5. 管理员对照记录 ----------
curl -s -H "$AH" -H "$CT" -X POST $B/form/data/$FORM -d '{"title":"管理员记录-对照","quantity":9,"unit_price":1,"owner":"1","department":"1","note":"admin record","external_dept":{"value":"dept-b","display":"研发二部"}}' > $EV/13-admin-record.json
ADMIN_REC=$(python3 -c "import json;print(json.load(open('$EV/13-admin-record.json'))['data'])")

# ---------- 6. 角色 + 用户 ----------
curl -s -H "$AH" -H "$CT" -X POST $B/system/role -d '{"name":"I2 填报者","code":"i2_filler","sort":90,"status":1,"dataScope":3,"description":"动作 350-353 已授权；字段受限；SELF 记录范围"}' > $EV/14-role.json
FILLER_ROLE=$(python3 -c "import json;print(json.load(open('$EV/14-role.json'))['data'])")
curl -s -H "$AH" -H "$CT" -X PUT $B/system/role/$FILLER_ROLE/menus -H "$CT" -d '[350,351,352,353]' > $EV/15-role-menus.json
curl -s -H "$AH" -H "$CT" -X POST $B/system/user -d "{\"username\":\"filler1\",\"plainPassword\":\"Filler1@2026\",\"realName\":\"I2 填报者\",\"deptId\":1,\"status\":0,\"roleIds\":[$FILLER_ROLE]}" > $EV/16-user-filler1.json
FILLER_ID=$(python3 -c "import json;print(json.load(open('$EV/16-user-filler1.json'))['data'])")
curl -s -H "$AH" -H "$CT" -X POST $B/system/user -d '{"username":"nobody1","plainPassword":"Nobody1@2026","realName":"I2 无权者","deptId":1,"status":0,"roleIds":[]}' > $EV/17-user-nobody1.json
NOBODY_ID=$(python3 -c "import json;print(json.load(open('$EV/17-user-nobody1.json'))['data'])")

# ---------- 7. 真实登录（challenge → RSA-OAEP → login → token） ----------
cd $EV
node login-helper.mjs filler1 'Filler1@2026' > /tmp/filler1-token.txt 2>&1
node login-helper.mjs nobody1 'Nobody1@2026' > /tmp/nobody1-token.txt 2>&1
FT=$(cat /tmp/filler1-token.txt | tr -d '[:space:]'); FH="Authorization: Bearer $FT"
NT=$(cat /tmp/nobody1-token.txt | tr -d '[:space:]'); NH="Authorization: Bearer $NT"

# ---------- 8. filler1 矩阵 ----------
curl -s -H "$FH" -H "$CT" -X POST $B/form/data/$FORM -d '{"title":"filler1 提交","quantity":2,"unit_price":5,"owner":'"$FILLER_ID"',"department":"1","note":"SELF scope record"}' > $EV/20-filler-submit-valid.json
FILLER_REC=$(python3 -c "import json;print(json.load(open('$EV/20-filler-submit-valid.json'))['data'])")
curl -s -H "$FH" -H "$CT" -X POST $B/form/data/$FORM/query -d '{"pageNum":1,"pageSize":10}' > $EV/21-filler-query-self.json
curl -s -H "$FH" -H "$CT" -X POST $B/form/data/$FORM/query -d '{"pageNum":1,"pageSize":10,"filters":[{"field":"total","op":"EQ","value":30.38}]}' > $EV/22-filler-filter-denied-field.json
curl -s -H "$FH" "$B/form/data/$FORM/$ADMIN_REC" > $EV/23-filler-detail-admin-self-denied.json
curl -s -H "$FH" -H "$CT" -X PUT $B/form/data/$FORM/$FILLER_REC -d '{"data":{"title":"filler1 试图改 total","quantity":2,"unit_price":5,"total":999.99,"note":"构造请求"},"version":0}' > $EV/24-filler-edit-denied-field-1105.json
curl -s -H "$FH" -H "$CT" -X PUT $B/form/data/$FORM/$FILLER_REC -d '{"data":{"title":"filler1 正常修改","quantity":2,"unit_price":5,"note":"正常更新（无受限字段）"},"version":0}' > $EV/25-filler-edit-own-ok.json
curl -s -H "$FH" -H "$CT" -X POST $B/form/data/$FORM/export -d '{"columns":["title"],"filters":[]}' > $EV/26-filler-export-403.json
curl -s -H "$FH" -H "$CT" -X DELETE $B/form/data/$FORM/$FILLER_REC > $EV/27-filler-delete-403.json 2>/dev/null || true

# ---------- 9. nobody1 矩阵（应全部 403） ----------
curl -s -H "$NH" -H "$CT" -X POST $B/form/data/$FORM -d '{"title":"越权提交","quantity":1,"unit_price":1}' > $EV/30-nobody-submit-403.json
curl -s -H "$NH" -H "$CT" -X POST $B/form/data/$FORM/query -d '{"pageNum":1,"pageSize":10}' > $EV/31-nobody-query-403.json
curl -s -H "$NH" "$B/form/data/$FORM/$ADMIN_REC" > $EV/32-nobody-detail-403.json

# ---------- 10. admin 对照（全部记录 + 受限字段可见） ----------
curl -s -H "$AH" -H "$CT" -X POST $B/form/data/$FORM/query -d '{"pageNum":1,"pageSize":10}' > $EV/33-admin-query-all.json

# ---------- 11. 汇总对象映射 ----------
cat > $EV/object-map.txt <<EOF
DATASOURCE_ID=$DS_ID
TARGET_FORM_ID=$TARGET_ID
TARGET_RECORD_ID=$TARGET_REC
FORM_ID=$FORM_ID
FORM_KEY=$FORM
ADMIN_RECORD_ID=$ADMIN_REC
FILLER_RECORD_ID=$FILLER_REC
FILLER_ROLE_ID=$FILLER_ROLE
FILLER_USER_ID=$FILLER_ID
NOBODY_USER_ID=$NOBODY_ID
EOF
echo "=== MATRIX DONE ==="; cat $EV/object-map.txt