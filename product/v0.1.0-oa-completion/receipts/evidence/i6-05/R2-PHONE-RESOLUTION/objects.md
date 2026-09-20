# R2 accepted object ledger

- Tenants: `T100` and `T200`.
- Fixture users: active unique, inactive, missing-value, duplicate-active, and cross-tenant cases; all values are synthetic and only the user ids/statuses are retained.
- The resolver contract returns status, source, and a digest; it does not expose the registered phone value.
- The six cases were evaluated through the dev-only resolver endpoint with no SMS adapter or send path.

