atomic_id=G9a1
captured_at=2026-09-13T22:08:20+08:00
server_sha=4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889 (HEAD; final behavior is the uncommitted working tree below)
web_sha=5788ead33c4347214a350d124331237e85068bdf (unchanged)
environment=local workspace; no push performed
database=not applicable

## Working-tree change set

Server change set is limited to the authorized OpenAPI/SSO surfaces and direct tests:

- `Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/service/OpenApiAuthService.java`
- `Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/test/java/com/sw/ck/openapi/biz/service/OpenApiServiceTest.java`
- `Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/SsoAuthController.java`
- `Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/sso/SsoAuthService.java`
- `Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/sso/SsoAuthServiceTest.java`

Old iteration-03 evidence is not silently rebound to the new behavior: the five-file diff changes OpenAPI tenant-side-effect ordering and SSO tenant validity/credential/concurrency behavior. Web has no working-tree changes.

## File SHA-256 manifest

```text
1549953b6c338097b0bdc4fc245efecd3b562728630a2ef61bc9e5d2e796d0a4  Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/service/OpenApiAuthService.java
e6230d8dcf5c4b6fce9db11aab3db851cfbe774e6044b214445743be5ea099f9  Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/test/java/com/sw/ck/openapi/biz/service/OpenApiServiceTest.java
b6ed7b8b8f2430f8206295e5697793bd0379d4d541feb6ed6951a1f5aed47a68  Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/SsoAuthController.java
fb11fd9191d889a49b5bd84b0e5ee656741124b204b59dde5d888c52b8cb1a93  Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/sso/SsoAuthService.java
914e728dc6aa5e5b49479c3367fc30abbf628f91939aaa3a572b2280a9493639  Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/sso/SsoAuthServiceTest.java
```

## Direct assertions

- `git diff --check`: exit `0`.
- Server HEAD and Web HEAD were read immediately before evidence finalization; neither repository was pushed.
- Request/response secrets, raw SSO code/state, and external subject values are not present in this manifest.

uncovered=This is a source/diff binding for the current uncommitted candidate, not a commit SHA; a later commit or source edit invalidates the manifest and requires regeneration.
