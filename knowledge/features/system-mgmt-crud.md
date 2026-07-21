# 系统管理核心 CRUD 做宽闭环

> 工作区统一知识库 — 功能追踪文件。
> 本文件记录系统管理核心 CRUD 做宽闭环的完整规划、Step 状态和测试结果。

---

## 功能摘要

| 项目 | 内容 |
|------|------|
| **功能编号** | M01/M02-F01 系统管理核心 CRUD |
| **功能名称** | 系统管理核心 CRUD 做宽闭环 |
| **功能目标** | 将系统管理模块从仅有字典管理扩展到覆盖用户/角色/部门/岗位四个核心实体的 CRUD，最低可用限度做宽闭环 |
| **当前状态** | **COMPLETED** — 全部 6 个 Step 已通过验收 |
| **总 Step 数** | 6（B1~B3 后端 + F1~F3 前端） |
| **推荐模型** | `deepseek-v4-flash`（全部 6 个 Step） |

---

## Step 状态

| Step | 内容 | 状态 | 方案 |
|:----:|------|:----:|:----:|
| B1 | 后端服务层基础 | **PASSED** | 2026-07-16 执行验收通过：6 新建 + 1 修改，`mvn -q compile` OK |
| B2 | 后端 REST Controllers + Flyway V15 | **PASSED** | 2026-07-16 执行验收通过：4 Controller + 2 Flyway 新建，`mvn -q compile` OK |
| B3 | 后端控制器测试 + 全量验证 | **PASSED** | 2026-07-16 执行验收通过：4 测试文件 25 tests，`mvn -q compile && mvn -q test` OK，零 Spring 上下文 |
| F1 | 前端 Types + API + Specs (12文件) | **PASSED** | 2026-07-16 执行验收通过：12 新建，42 spec files / 377 tests，四连全绿 |
| F2 | 前端 Vue 视图 + 页面单测 (8文件) | **PASSED** | 2026-07-16 执行验收通过：4 views + 4 specs（15 tests），46 files / 392 tests，四连全绿 |
| F3 | 前端 Mock + Handlers + 菜单 | **PASSED** | 2026-07-16 执行验收通过：seeds.ts 新增 4 数组 + 4 菜单节点 + 4 权限；handlers.ts 新增 20 handler；四连全绿 46/392；`pnpm dev:mock` 启动正常 |

---

## 影响范围

### 后端
- 新建 16 文件：4 Service 接口 + 4 Service 实现 + 1 Entity + 1 Mapper + 4 Controller + 4 测试 + 2 Flyway
- 修改 1 文件：SysRole.java

### 前端
- 新建 20 文件：4 types + 4 api + 4 api specs + 4 views + 4 view specs
- 修改 2 文件：seeds.ts + handlers.ts

---

## 范围外
- 部门树拖拽排序、批量导入导出、权限矩阵 UI、数据权限 UI
- 用户头像上传、角色-人员绑定
- 移动端/暗色模式
