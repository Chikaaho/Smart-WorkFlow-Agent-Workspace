set +e
D=$(basename /etc/nginx/conf.d/*.conf .conf)
echo "== P1 VIA_NGINX_443_sw =="
curl -sk -m 10 -o /dev/null -w 'sw_index=%{http_code}\n' -H "Host: $D" https://127.0.0.1/sw/
curl -sk -m 10 -o /dev/null -w 'sw_index_html=%{http_code}\n' -H "Host: $D" https://127.0.0.1/sw/index.html
curl -sk -m 10 -o /dev/null -w 'sw_asset_probe=%{http_code}\n' -H "Host: $D" "https://127.0.0.1/sw/assets/$(ls /opt/smart-workflow/web/assets | head -1)"
echo "== P2 HEALTH_VIA_NGINX =="
curl -sk -m 10 -o /dev/null -w 'sw_server_api_health=%{http_code}\n' -H "Host: $D" https://127.0.0.1/sw-server/api/actuator/health
curl -sk -m 10 -H "Host: $D" https://127.0.0.1/sw-server/api/actuator/health | head -c 160; echo
curl -sk -m 10 -o /dev/null -w 'doc_path_health_no_api=%{http_code}\n' -H "Host: $D" https://127.0.0.1/sw-server/actuator/health
curl -sk -m 10 -o /dev/null -w 'sw_server_api_root=%{http_code}\n' -H "Host: $D" https://127.0.0.1/sw-server/api/
echo "== P3 PORT80_BEHAVIOR =="
curl -s -m 10 -o /dev/null -w 'http80_root=%{http_code}\n' -H "Host: $D" http://127.0.0.1/
curl -s -m 10 -o /dev/null -w 'http80_sw=%{http_code}\n' -H "Host: $D" http://127.0.0.1/sw/
echo "== P4 DEV5173_LISTENING =="
ss -tlnp 2>/dev/null | grep -c ':5173'
echo "== P5 LOG_DIR_TOTAL =="
ls -la /opt/smart-workflow/server/logs/ | head -8
echo "== DONE5 =="