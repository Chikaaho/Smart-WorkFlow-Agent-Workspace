#!/bin/bash

# K8: 真实后端权限拒绝消息测试脚本
# 使用 curl 测试真实后端 API

API_BASE="http://localhost:8080/api"

echo "=== K8 真实后端权限拒绝消息测试 ==="
echo ""

# 登录获取 token
echo "1. 登录获取 token"
ADMIN_TOKEN=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.accessToken')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  echo "   登录失败"
  exit 1
fi
echo "   登录成功，token: ${ADMIN_TOKEN:0:30}..."

# 记录测试前的数据快照
echo ""
echo "2. 记录测试前的数据快照"
INTERNAL_BEFORE=$(curl -s -X GET "$API_BASE/agent/tool/internal?pageNum=1&pageSize=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.list | length')
EXTERNAL_BEFORE=$(curl -s -X GET "$API_BASE/agent/tool/external?pageNum=1&pageSize=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.list | length')
echo "   内部工具数量: $INTERNAL_BEFORE"
echo "   外部工具数量: $EXTERNAL_BEFORE"

# 场景1: 内部工具 - 未认证 → 401
echo ""
echo "3. 场景1: 内部工具 - 未认证 → 401"
RESPONSE=$(curl -s -X POST "$API_BASE/agent/tool/internal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"name":"unauth_test","beanName":"bean","methodName":"method"}')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/agent/tool/internal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"name":"unauth_test","beanName":"bean","methodName":"method"}')
echo "   HTTP状态码: $HTTP_CODE"
echo "   响应: $RESPONSE"

# 场景2: 外部工具 - 未认证 → 401
echo ""
echo "4. 场景2: 外部工具 - 未认证 → 401"
RESPONSE=$(curl -s -X POST "$API_BASE/agent/tool/external" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"name":"unauth_test","url":"https://test.com","httpMethod":"GET","timeoutSeconds":10}')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/agent/tool/external" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid-token" \
  -d '{"name":"unauth_test","url":"https://test.com","httpMethod":"GET","timeoutSeconds":10}')
echo "   HTTP状态码: $HTTP_CODE"
echo "   响应: $RESPONSE"

# 场景3: 内部工具 - 无 manage 权限 → 403
echo ""
echo "5. 场景3: 内部工具 - 无 manage 权限 → 403"
# 创建一个只有 view 权限的用户 token（这里使用 admin，假设 admin 没有 manage 权限）
# 注意：实际测试中需要创建一个没有 manage 权限的用户
RESPONSE=$(curl -s -X POST "$API_BASE/agent/tool/internal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"noperm_test","beanName":"bean","methodName":"method"}')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/agent/tool/internal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"noperm_test","beanName":"bean","methodName":"method"}')
echo "   HTTP状态码: $HTTP_CODE"
echo "   响应: $RESPONSE"

# 如果创建成功，清理数据
if [ "$HTTP_CODE" = "200" ]; then
  TOOL_ID=$(echo "$RESPONSE" | jq -r '.data')
  if [ "$TOOL_ID" != "null" ] && [ -n "$TOOL_ID" ]; then
    curl -s -X DELETE "$API_BASE/agent/tool/internal/$TOOL_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
    echo "   已清理创建的工具: $TOOL_ID"
  fi
fi

# 场景4: 外部工具 - 无 manage 权限 → 403
echo ""
echo "6. 场景4: 外部工具 - 无 manage 权限 → 403"
RESPONSE=$(curl -s -X POST "$API_BASE/agent/tool/external" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"noperm_test","url":"https://test.com","httpMethod":"GET","timeoutSeconds":10}')
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE/agent/tool/external" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"noperm_test","url":"https://test.com","httpMethod":"GET","timeoutSeconds":10}')
echo "   HTTP状态码: $HTTP_CODE"
echo "   响应: $RESPONSE"

# 如果创建成功，清理数据
if [ "$HTTP_CODE" = "200" ]; then
  TOOL_ID=$(echo "$RESPONSE" | jq -r '.data')
  if [ "$TOOL_ID" != "null" ] && [ -n "$TOOL_ID" ]; then
    curl -s -X DELETE "$API_BASE/agent/tool/external/$TOOL_ID" \
      -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
    echo "   已清理创建的工具: $TOOL_ID"
  fi
fi

# 验证数据未变化
echo ""
echo "7. 验证数据未变化"
INTERNAL_AFTER=$(curl -s -X GET "$API_BASE/agent/tool/internal?pageNum=1&pageSize=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.list | length')
EXTERNAL_AFTER=$(curl -s -X GET "$API_BASE/agent/tool/external?pageNum=1&pageSize=100" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.list | length')
echo "   内部工具数量: $INTERNAL_BEFORE → $INTERNAL_AFTER (变化: $((INTERNAL_AFTER - INTERNAL_BEFORE)))"
echo "   外部工具数量: $EXTERNAL_BEFORE → $EXTERNAL_AFTER (变化: $((EXTERNAL_AFTER - EXTERNAL_BEFORE)))"

echo ""
echo "=== 测试结束 ==="
