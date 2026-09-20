# Preserved failed attempt: internal visual update

- Gate: `pnpm test:visual:update -- --workers=1`
- Failure: all four projects failed the shell CSS assertion for `.app-logo__mark-frame`.
- Expected: `rgb(255,255,255)`; observed: `rgba(0,0,0,0)`.
- Resolution: restored `background-color: #ffffff` in `AppLogo.vue`, then reran update and verify successfully.
- Final result: update `71 passed / 17 skipped / exit 0`; verify `71 passed / 17 skipped / exit 0`.
