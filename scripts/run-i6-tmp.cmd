cd /e/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server
MAVEN_OPTS="-Xmx2g" mvn -q test -pl sw-basic/sw-basic-notify/sw-basic-notify-biz -Dtest='I6NotifyClosureIntegrationTest' > /tmp/t3.log 2>&1
echo EXIT=$?
grep -E "符号|错误" /tmp/t3.log | head -6
grep -h "Tests run" sw-basic/sw-basic-notify/sw-basic-notify-biz/target/surefire-reports/com.sw.ck.notify.i6.I6NotifyClosureIntegrationTest.txt
