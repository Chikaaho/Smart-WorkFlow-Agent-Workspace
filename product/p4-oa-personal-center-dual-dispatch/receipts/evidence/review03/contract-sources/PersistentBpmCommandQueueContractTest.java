package com.sw.ck.bpm.process.queue;

import com.sw.ck.bpm.process.queue.support.QueueH2TestConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * G7：持久化默认实现运行同一消息边界契约（真实 H2 + 真实迁移）。
 */
@SpringBootTest(classes = QueueH2TestConfig.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class PersistentBpmCommandQueueContractTest extends BpmCommandQueueContractTest {

    @Autowired
    private BpmCommandQueue queue;

    @Autowired
    private javax.sql.DataSource dataSource;

    @Override
    protected BpmCommandQueue queue() {
        return queue;
    }

    @Override
    protected void forceDue(Long commandId) {
        try (var conn = dataSource.getConnection();
             var ps = conn.prepareStatement(
                     "UPDATE sw_bpm_command SET next_retry_at = NULL WHERE id = ?")) {
            ps.setLong(1, commandId);
            ps.executeUpdate();
        } catch (java.sql.SQLException e) {
            throw new IllegalStateException(e);
        }
    }
}
