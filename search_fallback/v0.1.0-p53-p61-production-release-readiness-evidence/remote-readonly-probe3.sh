set +e
PID=$(cat /opt/smart-workflow/server/server.pid 2>/dev/null)
echo "== A2 ENV_PRESENCE_FLAGS =="
for k in JWT_SECRET SW_SSO_CIPHER_KEY SW_CIPHER_KEY SW_LOGIN_RSA_PRIVATE_KEY SW_LOGIN_DIGEST_SECRET PG_PASSWORD PG_USERNAME SPRING_PROFILES_ACTIVE OPENAI_API_KEY MQTT_USERNAME MQTT_PASSWORD MINIO_ACCESS_KEY; do
  line=$(tr '\0' '\n' < "/proc/$PID/environ" 2>/dev/null | grep "^$k=" | head -1)
  if [ -z "$line" ]; then echo "$k=ABSENT"; else
    v=$(echo "$line" | cut -d= -f2-)
    if [ -z "$v" ]; then echo "$k=PRESENT_EMPTY"; else echo "$k=PRESENT_NONEMPTY"; fi
  fi
done
echo "== A3 ENV_KEY_NAMES =="
tr '\0' '\n' < "/proc/$PID/environ" 2>/dev/null | cut -d= -f1 | sort | tr '\n' ' '; echo
echo "== B START_SH values-masked =="
sed -E 's/(=[^[:space:]]{8})[^[:space:]]*/\1<masked>/g' /opt/smart-workflow/server/start.sh
echo "== B2 STOP_SH values-masked =="
sed -E 's/(=[^[:space:]]{8})[^[:space:]]*/\1<masked>/g' /opt/smart-workflow/server/stop.sh | head -25
echo "== C NGINX_LOCATIONS =="
grep -nE 'location|proxy_pass|root |alias |listen |server_name|index ' /etc/nginx/sites-available/default | sed -E 's/server_name.*/server_name MASKED;/' | head -40
echo "== D HEALTH =="
curl -sS -m 8 -o /dev/null -w 'root_8080=%{http_code}\n' http://127.0.0.1:8080/
curl -sS -m 8 -o /dev/null -w 'api_health=%{http_code}\n' http://127.0.0.1:8080/api/actuator/health
curl -sS -m 8 http://127.0.0.1:8080/api/actuator/health | head -c 200; echo
curl -sS -m 8 -o /dev/null -w 'api_health_liveness=%{http_code}\n' http://127.0.0.1:8080/api/actuator/health/liveness
curl -sS -m 8 -o /dev/null -w 'api_root=%{http_code}\n' http://127.0.0.1:8080/api/
echo "== E LOGROTATE =="
ls /etc/logrotate.d/ 2>&1 | tr '\n' ' '; echo
grep -l -i 'smart-workflow' /etc/logrotate.d/* 2>/dev/null | head -3
echo "== F DIRS =="
ls -la /opt/smart-workflow/server/BOOT-INF/ 2>&1 | head -8
ls /opt/smart-workflow/web/backup-20260907/ 2>&1 | head -6
echo "== H SPACE =="
du -sh /opt/smart-workflow/server/logs /opt/smart-workflow/web 2>/dev/null
df -h / | tail -1
echo "== I INDEX_HTML =="
head -c 300 /opt/smart-workflow/web/index.html
echo; echo "== J TOOLING =="
for t in git mvn node java psql; do printf '%s=' "$t"; command -v "$t" 2>/dev/null || echo absent; done
echo "== K BACKUP_DIR =="
ls -ld /data /data/backup 2>&1
echo "== DONE3 =="