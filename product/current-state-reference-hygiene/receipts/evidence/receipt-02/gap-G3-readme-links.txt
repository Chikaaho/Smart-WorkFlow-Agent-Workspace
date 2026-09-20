GAP G3  files: Smart-WorkFlow-aPaaS-server/README.md , Smart-WorkFlow-aPaaS-Web/README.md
ORIGINAL (failing fact): cross-repo links used non-existent sibling dirs ../Smart-WorkFlow-Web/README.md and ../Smart-WorkFlow-Server/README.md.
ACTUAL after fix (full-line readback):
  server README L70: 从使用者视角了解界面与操作体验，见配套前端：[Smart-WorkFlow-aPaaS-Web](../Smart-WorkFlow-aPaaS-Web/README.md)。
  web README L68: 从平台能力与运行支撑角度了解项目，见配套后端：[Smart-WorkFlow-aPaaS-server](../Smart-WorkFlow-aPaaS-server/README.md)。
LINK TARGET RESOLUTION (resolved from each README parent directory):
  server parent -> E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-Web/README.md   exists=True
  web parent    -> E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/README.md   exists=True
REVERSE ASSERTION  rg Smart-WorkFlow-Server|Smart-WorkFlow-Web  over both READMEs  -> zero matches (rg-exit=1)
BOUNDARY: only the two link tokens changed; locked version sections (H7-H10) and all other README content untouched (see focused-diff.txt).
