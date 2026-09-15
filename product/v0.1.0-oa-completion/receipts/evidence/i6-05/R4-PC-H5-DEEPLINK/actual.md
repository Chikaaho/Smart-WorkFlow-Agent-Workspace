# R4 actual result

- The visible PC inbox marked the selected workflow message as read through the real `/read` endpoint.
- The visible H5 inbox showed the same notification, opened its protected workflow deep link, and rendered the same approved instance details.
- Refreshing the H5 deep-link page preserved the process reference, `APPROVED` state, initiator, and flow trace; the PC readback remained `read=true`.
- The PC and H5 paths therefore share one server-side message/read/deep-link authority.
