# R6 accepted object ledger

- Tenant: `T100`; template: one accepted template with released versions V1 and V2; rule and process definition ids are recorded in the raw stream.
- Accepted process instances: the first instance pins V1 and the second instance, created after the update, pins V2.
- Recipient: the fixed copy recipient represented by the numeric id in the raw stream.
- Each accepted message records `COPY_CREATED`, `WF_TODO`, `WF_PROCESS`, the process id, channel `IN_APP`, template id/version, occurrence 1, and a channel-inclusive idempotency identity.
- Duplicate approval returned the same command identity and did not create another business notification; the V1 row remained unchanged after V2 release.

