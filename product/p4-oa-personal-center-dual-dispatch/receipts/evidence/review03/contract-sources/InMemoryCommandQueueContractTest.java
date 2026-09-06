package com.sw.ck.bpm.process.queue;

import com.sw.ck.bpm.process.queue.support.InMemoryCommandQueue;

/**
 * G7：替代内存队列实现运行同一消息边界契约。
 */
public class InMemoryCommandQueueContractTest extends BpmCommandQueueContractTest {

    private final InMemoryCommandQueue queue = new InMemoryCommandQueue();

    @Override
    protected BpmCommandQueue queue() {
        return queue;
    }

    @Override
    protected void forceDue(Long commandId) {
        queue.forceDue(commandId);
    }
}
