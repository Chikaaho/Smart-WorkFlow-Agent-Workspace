set +e
echo "### 1 IDENTITY"
hostname; date -Is; uptime; head -3 /etc/os-release
echo "### 2 DISK_MEM"
df -h / | head -5; free -h
echo "### 3 DEPLOY_TREE"
ls -la /opt/smart-workflow/ 2>&1
echo "-- server --"; ls -la /opt/smart-workflow/server/ 2>&1 | head -25
echo "-- web --"; ls -la /opt/smart-workflow/web/ 2>&1 | head -15
echo "### 4 JAR_FINGERPRINTS"
for f in bootstrap.jar bootstrap.jar.bak bootstrap.jar.bak2; do
  p="/opt/smart-workflow/server/$f"
  if [ -f "$p" ]; then echo "== $f"; stat -c 'size=%s mtime=%y' "$p"; sha256sum "$p"; else echo "== $f MISSING"; fi
done
echo "### 5 WEB_ASSETS"
ls -la /opt/smart-workflow/web/ 2>&1 | head -20
echo "-- index.html --"; sha256sum /opt/smart-workflow/web/index.html 2>&1
echo "-- assets --"; ls -la /opt/smart-workflow/web/assets/ 2>&1 | head -12
echo "### 6 PROCESS"
if [ -f /opt/smart-workflow/server/server.pid ]; then PID=$(cat /opt/smart-workflow/server/server.pid); echo "pidfile=$PID"; ps -o pid,lstart,etime,rss,args -p "$PID" 2>&1 | head -5; else echo "pidfile MISSING"; fi
echo "-- listening --"; ss -tlnp 2>/dev/null | head -25
echo "### 7 SERVICES"
for s in nginx redis-server postgresql@14-main; do printf '%s=' "$s"; systemctl is-active "$s" 2>&1; done
echo "### 8 NGINX"
nginx -t 2>&1 | head -5
ls -la /etc/nginx/sites-enabled/ 2>&1 | head -10
echo "### 9 HEALTH"
curl -sS -m 8 -o /dev/null -w 'backend_root_http=%{http_code}\n' http://127.0.0.1:8080/ 2>&1
curl -sS -m 8 -o /dev/null -w 'actuator_health_http=%{http_code}\n' http://127.0.0.1:8080/actuator/health 2>&1
echo "### 10 LOGS"
ls -la /opt/smart-workflow/server/logs/ 2>&1 | head -12
echo "-- tail server.log --"; tail -6 /opt/smart-workflow/server/logs/server.log 2>&1
echo "### 11 BACKUP_ROLLBACK_ASSETS"
echo "-- /data/backup --"; ls -la /data/backup/ 2>&1 | tail -12
echo "-- web.bak --"; ls -d /opt/smart-workflow/web.bak 2>&1; ls /opt/smart-workflow/web.bak 2>&1 | head -5
echo "### 12 DB_MIGRATION"
sudo -u postgres psql -p 5433 -d smart_workflow -tAc "select max(version::int) from flyway_schema_history where success" 2>&1 | head -3
sudo -u postgres psql -p 5433 -d smart_workflow -tAc "select installed_rank||'|'||version||'|'||description||'|'||success||'|'||installed_on from flyway_schema_history order by installed_rank desc limit 6" 2>&1 | head -10
echo "### 13 ENV_KEYS_ONLY"
if [ -f /opt/smart-workflow/server/server.env ]; then stat -c 'server.env size=%s mode=%a mtime=%y' /opt/smart-workflow/server/server.env; sed -E 's/^([A-Za-z0-9_]+)=.*/[key]/' /opt/smart-workflow/server/server.env | sort; else echo "server.env MISSING"; fi
echo "### 14 SERVER_YML"
ls /opt/smart-workflow/server/*.yml /opt/smart-workflow/server/*.properties 2>&1 | head
echo "### 15 UPLOADS"
ls -la /opt/smart-workflow/server/uploads/ 2>&1 | head -8
echo "### 16 CRON"
crontab -l 2>&1 | head -20
echo "### 17 JVM_CMDLINE_MASKED"
ps -eo pid,args 2>/dev/null | grep -i '[b]ootstrap.jar' | sed -E 's/(-D|--)[A-Za-z0-9_.=:/@+-]*/(flag-masked)/g' | head -5
echo "### DONE"