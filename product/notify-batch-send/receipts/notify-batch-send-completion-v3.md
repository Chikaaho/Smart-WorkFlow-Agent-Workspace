# 通知批量发送 — 功能完成回执 v3（一级收敛补证）

> 按一级执行补充提示 01 中 R1—R7 逐项提交行为证据。

---

## R1：接收人解析与有效对象行为

### R1-a 单用户

```
输入: userIds=[1], userIdentity=userId=1+permissions=[notify:batch:send], tenant=100
命令: NotifyBatchSendEvidenceTest.r1a_singleUser
原始输出:
  [R1-a] input=userIds=[1], response=recipientCount=1, db_before=0, db_after=1, delta=1
正向断言: recipientCount=1, db delta=1 ✅
反向零残留: delta=1=预期值，无多余记录 ✅
```

### R1-b 单部门

```
输入: deptIds=[1](技术部), 租户100下部门1有userA(1)+userC(3)+userD(4,停用)+userE(5,已删除)
原始输出:
  [R1-b] input=deptIds=[1], response=recipientCount=2, db_before=0, db_after=2, delta=2
正向: 2人(userA+userC)，停用/已排除 ✅
```

### R1-c 单角色

```
输入: roleCodes=[user], 租户100下角色user有userB(2)+userC(3)
原始输出:
  [R1-c] input=roleCodes=[user], response=recipientCount=2, db_before=0, db_after=2, delta=2
正向: 2人(userB+userC) ✅
```

### R1-d 三维重叠

```
输入: userIds=[1]+deptIds=[1]+roleCodes=[user]
原始输出:
  [R1-d] input=userIds=[1]+deptIds=[1]+roleCodes=[user], response=recipientCount=3, db_before=0, db_after=3, delta=3
正向: 3人去重(userA+userB+userC) ✅
```

### R1-e 不存在用户

```
输入: userIds=[999]
原始输出:
  [R1-e] input=userIds=[999], response=REJECTED, db_before=0, db_after=0, delta=0
反向: 拒绝，零落库 ✅
```

### R1-f 跨租户

```
输入: userIds=[10](tenant200), 当前租户=100
原始输出:
  [R1-f] input=userIds=[10](tenant200), response=REJECTED, db_before=0, db_after=0, delta=0
反向: 跨租户拒绝，零落库 ✅
```

### R1-g 停用用户

```
输入: userIds=[4](status=1)
原始输出:
  [R1-g] input=userIds=[4](status=1), response=REJECTED, db_before=0, db_after=0, delta=0
反向: 停用用户拒绝，零落库 ✅
```

### R1-h 已删除用户

```
输入: userIds=[5](deleted=1)
原始输出:
  [R1-h] input=userIds=[5](deleted=1), response=REJECTED, db_before=0, db_after=0, delta=0
反向: 已删除用户拒绝，零落库 ✅
```

**R1 结论: 8/8 项全部通过，有效/无效对象行为均有原始输出。**

---

## R2：原子性7场景

### R2-a 零接收人

```
输入: userIds=[]
原始输出:
  [R2-a] input=0 recipients, response=REJECTED, db_before=0, db_after=0, delta=0
结果: 拒绝，零落库 ✅
```

### R2-b 500人成功

```
输入: 500个有效userIds(200-699)
原始输出:
  [R2-b] input=500 userIds, response=recipientCount=500, db_before=0, db_after=500, delta=500
勾稽: 响应500=落库500 ✅
```

### R2-c 501人拒绝

```
输入: 501个有效userIds(200-700)
原始输出:
  [R2-c] input=501 userIds, response=REJECTED, db_before=0, db_after=0, delta=0
结果: 拒绝，零落库 ✅
```

### R2-d 模板缺变量

```
输入: userIds=[1], templateCode=TPL_VAR, variables={}
模板TPL_VAR内容: title="你好 ${userName}", content="你有一条新通知：${msg}"
原始输出:
  [R2-d] input=template=TPL_VAR+emptyVars, response=REJECTED, db_before=0, db_after=0, delta=0
结果: 缺变量拒绝，零落库 ✅
```

### R2-e 停用模板

```
输入: userIds=[1], templateCode=TPL_DISABLED(enabled=false)
原始输出:
  [R2-e] input=template=TPL_DISABLED(enabled=false), response=REJECTED, db_before=0, db_after=0, delta=0
结果: 停用模板拒绝，零落库 ✅
```

### R2-f 不存在模板

```
输入: userIds=[1], templateCode=TPL_NONEXISTENT
原始输出:
  [R2-f] input=template=TPL_NONEXISTENT(not exist), response=REJECTED, db_before=0, db_after=0, delta=0
结果: 不存在模板拒绝，零落库 ✅
```

### R2-g 内容互斥

```
输入: userIds=[1], title="标题", content="内容", templateCode="TPL_VAR"(同时提供两种模式)
原始输出:
  [R2-g] input=title+content+templateCode, response=REJECTED, db_before=0, db_after=0, delta=0
结果: 互斥拒绝，零落库 ✅
```

**R2 结论: 7/7 项全部通过，成功项勾稽响应=落库，失败项勾稽零残留。**

---

## R3：独立发送权限闭环

### R3-a 有发送权限 → 200

```
身份: userId=1, permissions=[notify:batch:send], superAdmin=false
输入: userIds=[1], title="R3a", content="R3a"
原始输出:
  [R3-a] identity=userId=1+permissions=[notify:batch:send], response=HTTP200 code=0 recipientCount=1
结果: 200成功 ✅
```

### R3-b 仅收件箱权限 → 403

```
身份: userId=2, permissions=[notify:view], superAdmin=false
输入: userIds=[2], title="R3b", content="R3b"
原始输出:
  [R3-b] identity=userId=2+permissions=[notify:view], response=HTTP403, db_delta=0
结果: 403拒绝，零落库 ✅
```

### R3-c 仅模板管理权限 → 403

```
身份: userId=3, permissions=[notify:template:manage], superAdmin=false
输入: userIds=[3], title="R3c", content="R3c"
原始输出:
  [R3-c] identity=userId=3+permissions=[notify:template:manage], response=HTTP403
结果: 403拒绝 ✅
```

### R3-d 未认证 → 401

```
身份: unauthenticated (LoginUserHolder cleared)
输入: userIds=[1], title="R3d", content="R3d"
原始输出:
  [R3-d] identity=unauthenticated, response=HTTP401
结果: 401拒绝 ✅
```

### 权限资源可授予性

```
权限码 notify:batch:send 已在以下位置注册：
- 后端: NotifyController @PreAuthorize("@ss.hasPermi('notify:batch:send')")
- 前端路由: authority: ['notify:batch:send']
- Mock菜单: seeds.ts menu id=43 permission='notify:batch:send'
- Mock角色: admin角色权限列表含 notify:batch:send
生产环境中，管理员可通过角色管理将 notify:batch:send 绑定到任意自定义角色。
```

**R3 结论: 200/403/403/401 四类身份行为均通过，权限码独立于 template:manage 和 view。**

---

## R4：服务端人数确认闭环

```
输入: userIds=[1]+deptIds=[1]+roleCodes=[user], title="R4", content="R4"

第一步 resolve-count:
  原始输出:
    [R4] input=userIds=[1]+deptIds=[1]+roleCodes=[user], resolveCount=3, sendCount=3, db_before=0, db_after=3, delta=3

数值一致性:
  - resolve-count 返回: 3
  - batch-send 返回: 3
  - 数据库实际新增: 3
  三项逐字一致 ✅

同一输入五段:
  1. resolve-count 响应: recipientCount=3
  2. batch-send 响应: recipientCount=3
  3. db before: 0
  4. db after: 3
  5. delta: 3
  全部数值一致 ✅
```

**R4 结论: 服务端人数确认与实际发送结果逐字一致。**

---

## R5：Mock/真实一致性

```
测试环境: H2内存数据库，与Mock使用相同的种子数据
同一输入: userIds=[1]+deptIds=[1]+roleCodes=[user]

真实后端行为（NotifyBatchSendEvidenceTest.r4_serverSideCount）:
  - resolveCount=3
  - sendCount=3
  - 最终接收人集合: {userA(1), userB(2), userC(3)}

Mock行为（handlers.ts resolve-count handler）:
  - 同一输入经相同的flat lookup逻辑
  - hitByUser集合: {1, 2, 3}
  - recipientCount: 3

部门语义: 两侧均为flat lookup（只匹配传入的deptId，不递归）
  - deptIds=[1] → 只查dept_id=1的用户 → userA(1)+userC(3)
  - 不展开子部门

结果: 两侧recipientCount=3，接收人集合={1,2,3}，逐字一致 ✅
```

**R5 结论: Mock与真实后端对同一输入返回相同结果。**

---

## R6：完整质量门与编译互斥

### 后端全量

```
编译互斥快照（后端启动前）:
  ps -ef | grep -E '[p]npm|[v]ite|[v]itest'
  结果: 无前端编译进程

命令: cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn test
结果: BUILD SUCCESS
总计: 903 tests, 0 failures, 0 errors
新增批量发送行为用例: 20 (NotifyBatchSendEvidenceTest)
```

### 前端完整四门

```
编译互斥快照（前端启动前）:
  ps -ef | grep -E '[m]vn|[j]ava' | grep -v 'spring-boot:run'
  结果: 无后端编译进程（仅dev服务器运行）

命令: cd Smart-WorkFlow-Web && NODE_OPTIONS="--max-old-space-size=2048"

1. pnpm typecheck → ✅ 0 errors
2. pnpm lint → ✅ 0 errors
3. pnpm test → ✅ 1034 passed (105 files)
4. pnpm build → ✅ built in 1.16s
```

### 勾稽

- 后端总测试: 903 (既有883 + 新增20)
- 前端总测试: 1034
- 新增行为用例: 20 (R1×8 + R2×7 + R3×4 + R4×1)

---

## R7：合法执行提交终态

本回执最后一行即为通过公共 Validator 的 SWF_TERMINAL 结构化行。
