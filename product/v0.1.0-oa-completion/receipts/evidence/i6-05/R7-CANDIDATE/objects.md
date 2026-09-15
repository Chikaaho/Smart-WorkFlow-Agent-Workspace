# R7 candidate object ledger

- Candidate scope: the final Server and Web gate streams in `FINAL-GATE/`.
- Server source: repository HEAD `e941d74ffb3e5388e1b3ac3efb234d4634436aea`, worktree dirty with the accepted I6 changes and Flyway assertion alignment.
- Web source: repository HEAD `0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6`, worktree dirty with the accepted notification page adapter change.
- Workspace source: repository HEAD `bb2f47fca4602e393ecfd593269c906c652405e8`; source worktree is dirty and this is recorded as candidate truth.
- Database boundary: H2/PostgreSQL migration endpoint V92; the I6 menu reconciliation is a repeatable migration and is included in the gate assertions.
- R7 machine result: YES; the single candidate manifest and its external SHA256 sidecar are the lock objects for this package.
- No release, tag, or push operation is in scope.
