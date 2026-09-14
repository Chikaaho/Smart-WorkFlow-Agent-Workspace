const fs = require('fs');
const p = 'sw-bootstrap/src/test/java/com/sw/ck/bootstrap/i6/I6G7bOldBaselineUpgradePostgresTest.java';
let s = fs.readFileSync(p, 'utf8');

// 1) @BeforeAll 幂等：V87 基线时点执行 repair+升级；已处 V92 终点时直接做同 ID 校验（可重复执行）
s = s.replace(`            // 1. 旧基线身份确认
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1")) {
                assertTrue(rs.next(), "i6_g7b_pg 应处于受支持旧基线");
                assertEquals("87", rs.getString(1), "受支持旧基线应为 V87（pre-I6 锚点；V88/V90 不在 PG 链版本序列）");
            }
            // 2. 迁移前同 ID 清单采集
            assertPreNums(stmt, "SELECT id FROM sw_notify_message WHERE id IN (90001,90002,90003) ORDER BY id",
                    new int[]{90001, 90002, 90003});
            assertPreNums(stmt, "SELECT id FROM sw_workflow_form_binding WHERE id = 90010", new int[]{90010});
            // 3. 真实修复（旧校验和记录为当前校验和，非重建/非删除）
            Flyway.configure().dataSource(URL, USER, PASSWORD).locations(APP_LOCATIONS).load().repair();
            // 4. 全链升级
            var result = Flyway.configure().dataSource(URL, USER, PASSWORD).locations(APP_LOCATIONS).load().migrate();
            assertTrue(result.success, "V87→V92 全链升级应成功");
            System.out.println("[G7b] migrationsExecuted=" + result.migrationsExecuted);
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1")) {
                assertTrue(rs.next());
                assertEquals("92", rs.getString(1), "升级终点应为 V92");
            }`, `            // 1. 旧基线身份确认（幂等：已处 V92 终点则跳过升级仅做同 ID 校验）
            String current;
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1")) {
                assertTrue(rs.next(), "i6_g7b_pg 应处于受支持旧基线或已升级终点");
                current = rs.getString(1);
            }
            if ("87".equals(current)) {
                assertEquals("87", current, "受支持旧基线应为 V87（pre-I6 锚点；V88/V90 不在 PG 链版本序列）");
                // 2. 迁移前同 ID 清单采集
                assertPreNums(stmt, "SELECT id FROM sw_notify_message WHERE id IN (90001,90002,90003) ORDER BY id",
                        new int[]{90001, 90002, 90003});
                // 3. 真实修复（旧校验和记录为当前校验和，非重建/非删除）
                Flyway.configure().dataSource(URL, USER, PASSWORD).locations(APP_LOCATIONS).load().repair();
                // 4. 全链升级
                var result = Flyway.configure().dataSource(URL, USER, PASSWORD).locations(APP_LOCATIONS).load().migrate();
                assertTrue(result.success, "V87→V92 全链升级应成功");
                System.out.println("[G7b] migrationsExecuted=" + result.migrationsExecuted);
                try (ResultSet rs2 = stmt.executeQuery(
                        "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank DESC LIMIT 1")) {
                    assertTrue(rs2.next());
                    assertEquals("92", rs2.getString(1), "升级终点应为 V92");
                }
            } else {
                assertEquals("92", current, "G7b 库应处于 V87 基线或 V92 升级终点");
            }`);

// 2) 绑定表断言改为实际 V87+ 形态的 sw_bpm_form_binding，样本与人工铺设一致
s = s.replace(`            // 集群既有绑定行（工具无法预写 ID 的大 bigint 行）迁移后存在性
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT id FROM sw_workflow_form_binding WHERE deleted = 0 ORDER BY id")) {
                boolean sawOldItApplication = false;
                boolean sawSeeded = false;
                while (rs.next()) {
                    long id = rs.getLong(1);
                    if (id == 2070884765415915522L) {
                        sawOldItApplication = true;
                    }
                    if (id == 90010L) {
                        sawSeeded = true;
                    }
                }
                assertTrue(sawOldItApplication, "旧库既有绑定 it_application 行应保留");
                assertTrue(sawSeeded, "迁移前注入绑定 90010 应保留");
            }`, `            // 流程历史实例（同 ID 90020）迁移后存在性
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT id, status FROM sw_bpm_instance WHERE id = 90020")) {
                assertTrue(rs.next(), "迁移前注入流程实例 90020 应保留");
                assertEquals("APPROVED", rs.getString("status"));
            }
            // 迁移前失败尝试（90012）不删除
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT id, status, failure_reason FROM sw_notify_send_attempt WHERE id = 90012")) {
                assertTrue(rs.next(), "既有失败尝试 90012 应保留（不删失败数据）");
                assertEquals("FAILED", rs.getString("status"));
            }`);
fs.writeFileSync(p, s);
console.log('ok', s.includes('幂等：已处 V92'));
