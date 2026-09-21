set +e
echo "== Q1 WEB_TREE_FINGERPRINT =="
cd /opt/smart-workflow/web && find . -type f -not -path './backup-*' | sort | xargs -r sha256sum | sha256sum
echo "file-count=$(find /opt/smart-workflow/web -type f -not -path './backup-*' | wc -l)"
echo "== Q2 WEB_BACKUP_TREE_FINGERPRINT =="
if [ -d /opt/smart-workflow/web/backup-20260907 ]; then cd /opt/smart-workflow/web/backup-20260907 && find . -type f | sort | xargs -r sha256sum | sha256sum; echo "file-count=$(find . -type f | wc -l)"; fi
echo "== Q3 TOP_SPACE =="
du -xsh /opt/smart-workflow/server/logs /opt/smart-workflow/web /opt/smart-workflow/server/BOOT-INF /root /var/log /usr /data 2>/dev/null | sort -h
echo "== Q4 LOGS_BACKUP_LISTING =="
ls -la /opt/smart-workflow/server/logs/backup/ | tail -15
echo "== Q5 LARGEST_FILES =="
find /opt /var /root -xdev -type f -size +100M 2>/dev/null | head -20 | xargs -r ls -la 2>/dev/null | head -20
echo "== Q6 JAR_ENTRY_TIMESTAMP_SAMPLE =="
unzip -p /opt/smart-workflow/server/bootstrap.jar META-INF/MANIFEST.MF 2>/dev/null | head -20
echo "== Q7 WEB_INDEX_BODYTAIL =="
tail -c 300 /opt/smart-workflow/web/index.html
echo; echo "== DONE6 =="