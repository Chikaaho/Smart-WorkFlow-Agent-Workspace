set +e
PID=$(cat /opt/smart-workflow/server/server.pid 2>/dev/null)
echo "== A PROCESS_ENV_KEY_NAMES_ONLY =="
if [ -r "/proc/$PID/environ" ]; then
  tr '\0' '\n' < "/proc/$PID/environ" | cut -d= -f1 | sort
else
  echo "cannot read /proc/$PID/environ"
fi
echo "== A2 PRESENCE_FLAGS =="
for k in JWT_SECRET SW_SSO_CIPHER_KEY SW_CIPHER_KEY SW_LOGIN_RSA_PRIVATE_KEY SW_LOGIN_DIGEST_SECRET PG_PASSWORD SPRING_PROFILES_ACTIVE OPENAI_API_KEY MQTT_USERNAME MINIO_ACCESS_KEY; do
  if tr '\0' '\n' < "/proc/$PID/environ" 2>/dev/null | grep -q "^$k="; then
    v=$(tr '\0' '\n' < "/proc/$PID/environ" | grep "^$k=" | head -1 | cut -d= -f2-)
    if [ -z "$v" ]; then echo "$k=PRESENT_EMPTY"; else echo "$k=PRESENT_NONEMPTY"; fi
  else
    echo "$k=ABSENT"
  fi
done
echo "== B START_STOP_SCRIPTS =="
echo "--- start.sh ---"; cat /opt/smart-workflow/server/start.sh
echo "--- stop.sh head 30 ---"; head -30 /opt/smart-workflow/server/stop.sh
echo "== C NGINX_SITE_MASKED =="
sed -E 's/server_name.*/server_name MASKED;/' /etc/nginx/sites-available/default | grep -v ssl_certificate | grep -vE '^[[:space:]]*$' | head -70
echo "== D HEALTH_CORRECT_CONTEXT =="
curl -sS -m 8 -o /dev/null -w 'root_http=%{http_code}\n' http://127.0.0.1:8080/ 2>&1
curl -sS -m 8 -w 'api_actuator_health_http=%{http_code} body=' http://127.0.0.1:8080/api/actuator/health 2>&1; echo
curl -sS -m 8 -w 'api_actuator_liveness_http=%{http_code} body=' http://127.0.0.1:8080/api/actuator/health/liveness 2>&1; echo
curl -sS -m 8 -o /dev/null -w 'api_root_http=%{http_code}\n' http://127.0.0.1:8080/api/ 2>&1
echo "== E LOGROTATE_AND_LOGS =="
ls /etc/logrotate.d/ 2>&1 | head -15
grep -l -i 'smart-workflow' /etc/logrotate.d/* 2>/dev/null | head -5
ls -la /opt/smart-workflow/server/logs/backup/ 2>&1 | head -8
echo "== F BOOT_INF_DIR =="
ls -la /opt/smart-workflow/server/BOOT-INF/ 2>&1 | head -10
echo "== G WEB_BACKUP_DIR =="
ls -la /opt/smart-workflow/web/backup-20260907/ 2>&1 | head -10
echo "== H TOP_SPACE_CONSUMERS =="
du -sh /opt/smart-workflow/server/logs 2>/dev/null
du -sh /opt/smart-workflow/server 2>/dev/null
du -sh /opt/smart-workflow/web 2>/dev/null
du -sh /root /var/log /data 2>/dev/null
df -h | head -8
echo "== I WEB_INDEX_HEAD =="
head -c 400 /opt/smart-workflow/web/index.html
echo; echo "== J TOOLING =="
for t in git mvn node java psql; do printf '%s=' "$t"; command -v "$t" 2>/dev/null || echo absent; done
ls -d /opt/apache-maven-* /opt/node-* /opt/maven 2>/dev/null
echo "== K BACKUP_ABSENCE =="
ls -ld /data /data/backup 2>&1
echo "== DONE2 =="