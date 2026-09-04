diff --git a/README.md b/README.md
index b54fd59..bc488c9 100644
--- a/README.md
+++ b/README.md
@@ -40,24 +40,24 @@ Smart-WorkFlow-sPaaS-server (:8080/api)
 
 ## 快速开始
 
-先克隆知识仓库：
+先克隆工作区仓库并检出实例分支（本示例实例在 `develop-sw`，远端默认 `main` 为通用 Engine，不含本项目内容）：
 
 ```bash
-git clone git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git
+git clone --branch develop-sw git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git
 ```
 
 ```bash
 cd Smart-WorkFlow-Agent-Workspace
 ```
 
-再将后端与前端仓库放入工作区根目录：
+再将后端与前端仓库克隆到工作区根目录，并指定本地目录名以便 README 配套入口可解析：
 
 ```bash
-git clone git@github.com:Chikaaho/Smart-WorkFlow-sPaaS-server.git
+git clone git@github.com:Chikaaho/Smart-WorkFlow-sPaaS-server.git Smart-WorkFlow-Server
 ```
 
 ```bash
-git clone git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git
+git clone git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git Smart-WorkFlow-Web
 ```
 
 进入对应工程后，按后端或前端 README 准备环境并启动服务：
