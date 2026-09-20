# R1-RULE-VIEW actual result

- T100 administrator A read the real rule list and completed create, edit, enable/disable, delete, and post-delete readback.
- User B received HTTP 403 for direct list, read, edit, toggle, and delete requests; no write was accepted.
- The deleted rule was not readable and was absent from the subsequent list.
- The run used the repaired permission/menu rows and the real backend; no mock response was used.

