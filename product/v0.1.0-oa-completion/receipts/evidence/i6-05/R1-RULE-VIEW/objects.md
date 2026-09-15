# R1 accepted object ledger

- Tenant: `T100`; authorized administrator: `A`; unauthorized user: `B`.
- Rule: one newly-created dynamic rule object from this run; its accepted id is recorded only in the raw stream.
- The rule was created, edited, disabled, re-enabled, denied to B for read/edit/toggle/delete, then deleted by A.
- The post-delete API read returned not-found and the list excluded the deleted object.
- No credentials, phone values, tokens, or provider secrets are recorded here.

