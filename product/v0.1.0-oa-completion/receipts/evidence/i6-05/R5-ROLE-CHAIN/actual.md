# R5 actual result

- The real T100 chain completed in one process: initiator submission, first approval, second-approver task creation, delegate-to-proxy, proxy approval, and copy creation.
- Both distinguishable approvers are represented in the same process trace; the second approver received `TODO_CREATED` for the second task before delegation.
- The proxy received `TASK_DELEGATED`, the initiator received `PROCESS_APPROVED`, and the copy recipient received `COPY_CREATED` for the same process reference.
- The unrelated T200 no-role principal could not read the process or task, could not open the deep link, and its approval attempt ended `FAILED` without inbox or flow side effects.
