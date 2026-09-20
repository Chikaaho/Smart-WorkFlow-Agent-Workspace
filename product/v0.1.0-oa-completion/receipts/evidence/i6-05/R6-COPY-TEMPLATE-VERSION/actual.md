# R6-COPY-TEMPLATE-VERSION actual result

- The real workflow chain completed twice against one accepted definition and two released template versions.
- The first copy notification was pinned to V1; the post-update copy notification was pinned to V2. Both rows had explicit event, business object, recipient, channel, link, and delivery fields.
- Repeating the first approval returned the same command identity and did not add a second notification.
- Database readback found two accepted copy messages, one pinned to each version, with two successful copy-audit rows; historical V1 data was unchanged.

