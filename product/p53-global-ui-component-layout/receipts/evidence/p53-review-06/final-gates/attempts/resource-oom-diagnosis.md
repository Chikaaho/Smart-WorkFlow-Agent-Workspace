# Preserved resource failure diagnosis

- Initial parallel typecheck/Vitest/build attempt caused Node native OOM in typecheck and Vitest.
- A long-lived mock Vite process on port 5173 had grown to approximately 1.6 GB resident memory; running the three Node workloads in parallel exhausted available memory.
- The validated old Vite process was stopped. Final gates use sequential execution, Vitest `--maxWorkers=1`, and `NODE_OPTIONS=--max-old-space-size=4096`.
- Final typecheck, Vitest, build, visual update/verify, and lint all completed without another OOM.
