set +e
echo "== Q4 LOGS_BACKUP_LISTING =="
ls -la /opt/smart-workflow/server/logs/backup/ | tail -12
echo "== Q6 JAR_MANIFEST =="
command -v unzip >/dev/null 2>&1 && unzip -p /opt/smart-workflow/server/bootstrap.jar META-INF/MANIFEST.MF 2>/dev/null | head -12 || echo "unzip absent"
echo "== Q7 WEB_INDEX_TAIL =="
tail -c 260 /opt/smart-workflow/web/index.html
echo; echo "== Q8 DISK_TARGETS =="
du -sh /opt/smart-workflow/server/logs 2>/dev/null
du -sh /opt/smart-workflow/web 2>/dev/null
du -sh /opt/smart-workflow/server 2>/dev/null
du -sh /data 2>/dev/null
echo "== Q9 ROOT_FS_TOPLEVEL =="
du -xsh /root /var /usr /opt 2>/dev/null
echo "== DONE7 =="