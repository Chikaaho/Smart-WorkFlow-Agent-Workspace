#!/bin/bash
# I3-03 运行时环境清理与清理证据落盘（证据冻结后执行）
set -uo pipefail
RT=/tmp/i3-03
OUT=/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-03/env/runtime-down.txt
{
echo "== I3-03 运行时清理 =="
date "+CLEANUP_START=%Y-%m-%dT%H:%M:%S"
echo "== 清理前进程快照 =="
ps aux | grep -E 'sw-bootstrap|redis-server 127.0.0.1:16390|vite' | grep -v grep | awk '{print $2, $11, $12, $13}' | head -10
for f in "$RT/instance-a.pid" "$RT/instance-b.pid"; do
  [ -f "$f" ] && kill "$(cat $f)" 2>/dev/null && echo "KILLED $(cat $f) ($f)"
done
redis-cli -p 16390 shutdown nosave 2>/dev/null && echo "REDIS_16390_SHUTDOWN"
if [ -f "$RT/pgdata/PG_VERSION" ]; then
  /opt/homebrew/opt/postgresql@16/bin/pg_ctl -D "$RT/pgdata" stop -m fast 2>&1 | tail -1
  echo "PG_STOPPED"
  rm -rf "$RT/pgdata" && echo "PGDATA_REMOVED"
fi
[ -f "$RT/rsa.pem" ] && rm -f "$RT/rsa.pem" && echo "RSA_PEM_REMOVED"
sleep 2
echo "== 清理后校验 =="
echo "PORT_8081=$(lsof -i :8081 2>/dev/null | wc -l | tr -d ' ') rows"
echo "PORT_8082=$(lsof -i :8082 2>/dev/null | wc -l | tr -d ' ') rows"
echo "PORT_50886=$(lsof -i :50886 2>/dev/null | wc -l | tr -d ' ') rows"
echo "PORT_16390=$(redis-cli -p 16390 ping 2>&1)"
ps aux | grep -E 'sw-bootstrap|redis-server.*16390' | grep -v grep | wc -l | awk '{print "RESIDUAL_PROC_ROWS="$1}'
date "+CLEANUP_DONE=%Y-%m-%dT%H:%M:%S"
} | tee "$OUT"
