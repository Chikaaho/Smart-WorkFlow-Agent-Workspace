# P53 补证 EV-01 实现身份（采集开始时点 2026-09-17T07:50:57+08:00）

## Web 仓
- HEAD: 381ef74e81f1c289890503c3be3debc55adf5fac
- branch: feature/p61-user-facing-message-humanization
- dirty 文件数: 34

## 变更/新增文件 SHA-256（git status --porcelain 全集）
```
25a72422b6a4a048cc87f6374714c2a7413bb3ab  .gitignore
91135de50c306961a18d909a6b9b5751193a56e0  eslint.config.js
8a6db911bc093e88a2ea354eb758e1ffccd58183  package.json
63c1a9abba708728cfc9b87bee56a639b2aafb0e  pnpm-lock.yaml
3d48d3e104f7a8cffc11a4453afc54e3ab32006a  scripts/p61-locales-manual.json
8f933a0588b74b709c69d3955f7a926572227085  src/foundation/area.ts
7290adcfb74c3cd5f39acf833f7774d7cdb05c04  src/layouts/BasicLayout.vue
30e87ff4a77371db434a986e6e1f906c251a9bb2  src/layouts/components/AppLogo.vue
233073f463dc0fc58f9ae0bbec01b0fe6db93c06  src/layouts/components/AppSidebar.vue
2fdb5cc666f6e29ea112bc6907e28942cce94418  src/layouts/components/AppTopbar.vue
7f43019ef593305add1bd41358caec5de0325c38  src/locales/en-US.ts
c6c91cd4081da0ae3fa3664f2b4715dc2ad4be8b  src/locales/zh-CN.ts
929d2b99d5f2d945bc55edc82aee282538a76529  src/modules/form/views/FormDesigner.vue
049f05c8b80c94f48cb746ea18bb98fa2d2e4c96  src/modules/form/views/FormRender.vue
155dda16fe80435119c0d056e9b8eabac9f4ef27  src/modules/workflow/views/MyInstances.vue
56a316c7819de0bf614385df5d32af173febd460  src/modules/workflow/views/ProcessCatalog.vue
e2a39742a389d4d8b4181fedd57266c94971466a  src/modules/workflow/views/ProcessDesigner.vue
ff01c909cae9bd0c18b540097794dd42fd3794f4  src/modules/workflow/views/TaskDetail.vue
36a19fbe30382506718fc255551f3ad63675aeb0  src/modules/workflow/views/WorkspaceHome.spec.ts
a1d291fcb4c5435410a6241fb78a0deb62f66c7f  src/modules/workflow/views/WorkspaceHome.vue
90be444a96403f83b856b6b4d7029c3df3011782  src/router/index.ts
e99cf87d469cda3f887a0bbef55220879df65034  src/styles/tokens.css
1f28c17f2e233c14a3bee4b944fbb3bdf4c30bcd  src/styles/tokens.spec.ts
22963aca4be0854c1397c3eb830926eda68990a5  src/types/components.d.ts
a4425752c0027e9334f10c18e3fe8175a4a7ee62  src/views/LoginPage.vue
28fc1ff67aff7d802408e0d7ba4330d72d52204a  tsconfig.node.json
01ba35a9ab7f1a915adc0202fba0c23b749d2745  vitest.config.ts
16bbe3985e0fa60d12670b59242060c23c9430c5  e2e/.artifacts/catalog-1440.png
68c0089d35508553cbefb435c6d5a7b236c01352  e2e/.artifacts/shell-admin.png
ec9852a0d2cfbea7e148c141ee6bb91df2a229f2  e2e/.artifacts/shell-portal-home.png
660eefa02ad2731a77a83091f3b076b002fb9fbb  e2e/.artifacts/shell-portal-workspace.png
16a3955e6272baf84a3f7dca2c360c9dfb5732ec  e2e/.artifacts/task-detail-1440.png
c6368d751deef7d1fb1f792b4ef2685a5ed6b219  e2e/visual/auth.ts
ac41e971d4db7da15459e10a363299dacc3dd085  e2e/visual/baselines.spec.ts
4294feaf9c5cde20e3bce97f451d6831fa8dc70e  e2e/visual/baselines.spec.ts-snapshots/login-06-full-chrome-1280-win32.png
e08118b438f556dfd126d87afc673aa3b6d35e78  e2e/visual/baselines.spec.ts-snapshots/login-06-full-chrome-1440-win32.png
6498e5df770c2b5abe98efd2a98ee67bad092b32  e2e/visual/baselines.spec.ts-snapshots/login-06-full-chrome-1920-win32.png
992fee571800d10129942a1ae9f222d95644135d  e2e/visual/baselines.spec.ts-snapshots/login-06-full-chrome-375-win32.png
ff921a1cee092cf4e7ed59d9f2c9c1d55a3da126  e2e/visual/baselines.spec.ts-snapshots/shell-sidebar-chrome-1280-win32.png
39f2d7d34df407356a03925bce47d8383c0cdfdd  e2e/visual/baselines.spec.ts-snapshots/shell-sidebar-chrome-1440-win32.png
ddacb303acc41b97f5a9b58689745d308d2f15cb  e2e/visual/baselines.spec.ts-snapshots/shell-sidebar-chrome-1920-win32.png
10a2bd3e76d90d6c0e9f832fc593a335195e000c  e2e/visual/baselines.spec.ts-snapshots/shell-topbar-chrome-1280-win32.png
defa190e58888594cbf8f585191d406c6d520840  e2e/visual/baselines.spec.ts-snapshots/shell-topbar-chrome-1440-win32.png
2da921b86a042f12c4434b11ccdf8b25c0f55cb9  e2e/visual/baselines.spec.ts-snapshots/shell-topbar-chrome-1920-win32.png
b32f0fc511a129510c271c950d9ea1342d8cb8ec  e2e/visual/baselines.spec.ts-snapshots/workspace-main-chrome-1280-win32.png
820032d659c363b2e3495b1cc065e75066d3bc02  e2e/visual/baselines.spec.ts-snapshots/workspace-main-chrome-1440-win32.png
b3dfc00b4068af2862b35a984c339ccda4d9780b  e2e/visual/baselines.spec.ts-snapshots/workspace-main-chrome-1920-win32.png
f1a8ef951b28a3f5eaaa7dccb0f2c2e1cd85e8fa  e2e/visual/regions.ts
e006ce9cdbc078cd795fa61260bd7bb9c9488127  e2e/visual/shell.spec.ts
a74da6733037eead8ef0aaa1656ea5ddedc15de3  e2e/visual/smoke.spec.ts
55b9c2072fb8daf2ea7f1730fd0afb7e4159b9d8  playwright.config.ts
14502774d3951604178e97caf5c5d69824f9ca77  src/assets/brand/logo-mark.png
504be9feee941b0f4ed38081959fb12216782e5a  src/layouts/AppMainNav.vue
82cebcdeef6ffa5793a21cd34256b0082d939fc5  src/modules/workflow/views/ApproverCandidatesDialog.vue
aa6b4f1ce89b07ac710292e5f7e930a6bae46e5d  src/views/PortalHome.vue
```
