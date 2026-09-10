# E0b3 task-owned crosscheck

冻结边界：三级补充提示 03 的五个业务证据包与本 E0b3 封装；不改写验收 04 及更早锁定证据。

## 本轮直接实现与回归

- `Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDefService.java`
- `Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/impl/FormDefServiceImpl.java`
- `Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDefinitionController.java`
- `Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/test/java/com/sw/ck/form/service/FormDataIsolationIntegrationTest.java`

上述 Server 文件对应 E7b3 同表单新版本发布与 E6b3b 原始跨租户上下文回归；受影响 Server 编译、打包和全量测试的原始输出/退出码单独保存在本目录。

## 本轮新增证据

`e2c3/`、`e5b3/`、`e6b3a/`、`e6b3b/`、`e7b3/` 是本提示要求的五个独立包；每包固定文件、对象映射和 verdict 均在冻结前完成核对。`e0b3/` 保存三仓候选元数据、门禁、终端 Validator、逐字节 cmp 和 manifest。

## 排除边界

根 workspace、Server、Web 的原始 tracked/untracked 状态完整保存在 `workspace-*`、`server-*`、`web-*` 文件中。workspace/Server 中已有的知识库、历史产品删除、uploads 及其他 I2 既有脏改动未冒充本轮直接修复；Web 本轮未读取源码、未修改、未构建。

没有提交或推送 Git，没有修改正式状态、规划文件、knowledge/memory/todo、旧回执或旧 evidence。
