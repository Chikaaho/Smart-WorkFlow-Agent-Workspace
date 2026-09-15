# R7 reproducible content fingerprint

`scripts/generate-fingerprint.ps1` snapshots the three dirty Git repositories as separate units. It records each repository's base `HEAD`, worktree state, tracked diff names, untracked candidate names, sorted file list, per-file SHA-256, and a canonical content fingerprint.

The snapshot excludes only the declared build/runtime/cache/database paths and the R7 evidence directory itself. The workspace snapshot excludes the nested server and web repositories so the three units are not double-counted.

Generated outputs:

- `fingerprint-manifest.json` — complete manifest.
- `fingerprint-manifest.sha256` — SHA-256 sidecar for the manifest.
- `recompute-output.json` — command, exit code, repository fingerprints, and manifest hash used for the recomputation check.
- `fingerprint-stdout.txt`, `fingerprint-stderr.txt`, `fingerprint-exit-code.txt` — execution trace.

The manifest records the validated local gates (fixed CAPTCHA local/dev/test, Web typecheck/lint/test/build, and the backend focused CAPTCHA test), database migration V92, and the unchanged L33 R8 boundary.
