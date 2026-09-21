set +e
echo "== N1 NGINX_INCLUDES =="
grep -nE 'include|conf\.d|sites-enabled' /etc/nginx/nginx.conf | head -20
echo "== N2 CONF_D_LIST =="
ls -la /etc/nginx/conf.d/ 2>&1 | head -20
echo "== N3 ALL_SERVER_BLOCKS_FILES =="
grep -rln 'server_name\|listen ' /etc/nginx/ 2>/dev/null | grep -v '\.sample' | head -20
echo "== N4 CONFD_CONTENT_MASKED =="
for f in /etc/nginx/conf.d/*.conf; do
  echo "--- $f ---"
  grep -nE 'listen |server_name|root |proxy_pass|location |ssl_certificate|index |alias ' "$f" | sed -E 's/server_name.*/server_name MASKED;/' | head -40
done
echo "== N5 SITES_AVAILABLE_FULL_MASKED =="
grep -nE 'listen |server_name|root |proxy_pass|location |ssl_certificate|index |alias ' /etc/nginx/sites-available/default | sed -E 's/server_name.*/server_name MASKED;/' | head -30
echo "== N6 TLS_CERT_PRESENT =="
for d in /etc/nginx/ssl /etc/letsencrypt/live /etc/ssl/certs; do ls -d "$d" 2>/dev/null; done
echo "== N7 JVM_ENV_FLAGS =="
tr '\0' '\n' < "/proc/$(cat /opt/smart-workflow/server/server.pid)/environ" 2>/dev/null | grep -E '^(_JAVA_OPTIONS|MAVEN_OPTS|LANG)=' | cut -d= -f1 | tr '\n' ' '; echo
echo "== N8 APP_LOG_SIZE =="
ls -la /opt/smart-workflow/server/logs/backup/ 2>&1 | head -6
echo "== N9 FREE =="
free -m | head -3
echo "== DONE4 =="