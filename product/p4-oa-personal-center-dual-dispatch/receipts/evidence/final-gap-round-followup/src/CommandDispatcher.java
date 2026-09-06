package com.sw.ck.bpm.process.queue;

import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import com.sw.ck.security.spi.UserDetailsProvider;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 命令调度器：持久化队列的默认消费者。
 * <p>
 * 两条独立调度车道：NORMAL（普通 OA 批量轮询）与 P0（更高频、独立容量），
 * P0 不与普通命令共享同一批领取，普通积压不阻塞 P0（D2）。
 * 调度经自有 {@link ScheduledExecutorService} 驱动（不依赖 @EnableScheduling，
 * 调度实际生效以运行日志与行为验证为准）。
 * </p>
 * <p>
 * 每条命令消费前从受理记录还原 LoginUserHolder（租户/发起人），线程复用后在
 * finally 清理，杜绝跨用户/跨租户串用（D5）。失败按指数退避有界重试，超过
 * 上限进入 FAILED 终态；崩溃残留的 PROCESSING 由 stale 恢复路径重新入队。
 * </p>
 */
@Component
public class CommandDispatcher {

    private static final Logger log = LoggerFactory.getLogger(CommandDispatcher.class);

    private final BpmCommandQueue commandQueue;
    private final Map<CommandTypeEnum, BpmCommandHandler> handlers;
    private final UserDetailsProvider userDetailsProvider;

    private static final String P0_PERMISSION = "workflow:p0:dispatch";


    @Value("${sw.bpm.command.poll-interval-millis:500}")
    private long pollIntervalMillis;

    @Value("${sw.bpm.command.p0-poll-interval-millis:100}")
    private long p0PollIntervalMillis;

    @Value("${sw.bpm.command.batch-size:20}")
    private int batchSize;

    @Value("${sw.bpm.command.p0-batch-size:5}")
    private int p0BatchSize;

    @Value("${sw.bpm.command.max-retries:5}")
    private int maxRetries;

    @Value("${sw.bpm.command.backoff-millis:1000}")
    private long backoffMillis;

    @Value("${sw.bpm.command.stale-seconds:60}")
    private long staleSeconds;

    private ScheduledExecutorService scheduler;

    /**
     * Spring 生产构造器：消费前通过正式身份 SPI 回查最新权限，避免受理时快照绕过撤权。
     */
    @org.springframework.beans.factory.annotation.Autowired
    public CommandDispatcher(BpmCommandQueue commandQueue, List<BpmCommandHandler> handlers,
                             UserDetailsProvider userDetailsProvider) {
        this.commandQueue = commandQueue;
        this.userDetailsProvider = userDetailsProvider;
        java.util.HashMap<CommandTypeEnum, BpmCommandHandler> registry = new java.util.HashMap<>();
        for (BpmCommandHandler handler : handlers) {
            for (CommandTypeEnum type : handler.types()) {
                BpmCommandHandler previous = registry.put(type, handler);
                if (previous != null) {
                    throw new IllegalStateException("命令类型重复注册: " + type);
                }
            }
        }
        this.handlers = java.util.Collections.unmodifiableMap(registry);
    }

    /**
     * 保留无 SPI 的隔离测试构造器；生产由 Spring 使用三参构造器。
     */
    public CommandDispatcher(BpmCommandQueue commandQueue, List<BpmCommandHandler> handlers) {
        this(commandQueue, handlers, null);
    }

    @PostConstruct
    public void start() {
        scheduler = Executors.newScheduledThreadPool(2, runnable -> {
            Thread thread = new Thread(runnable, "bpm-command-dispatcher");
            thread.setDaemon(true);
            return thread;
        });
        scheduler.scheduleWithFixedDelay(this::pollNormal, pollIntervalMillis, pollIntervalMillis,
                TimeUnit.MILLISECONDS);
        scheduler.scheduleWithFixedDelay(this::pollP0, p0PollIntervalMillis, p0PollIntervalMillis,
                TimeUnit.MILLISECONDS);
        log.info("命令调度器已启动: normalPoll={}ms, p0Poll={}ms, batch={}, p0Batch={}, maxRetries={}",
                pollIntervalMillis, p0PollIntervalMillis, batchSize, p0BatchSize, maxRetries);
    }

    @PreDestroy
    public void stop() {
        if (scheduler != null) {
            scheduler.shutdownNow();
        }
    }

    /** 普通车道轮询（包内可见，供测试直调）。 */
    void pollNormal() {
        try {
            dispatchLane(CommandChannelEnum.NORMAL, batchSize);
        } catch (Exception e) {
            log.error("普通命令轮询异常", e);
        }
    }

    /** P0 车道轮询（包内可见，供测试直调）。 */
    void pollP0() {
        try {
            dispatchLane(CommandChannelEnum.P0, p0BatchSize);
        } catch (Exception e) {
            log.error("P0 命令轮询异常", e);
        }
    }

    private void dispatchLane(CommandChannelEnum channel, int limit) {
        commandQueue.reclaimStale(LocalDateTime.now().minusSeconds(staleSeconds));
        for (CommandEnvelope envelope : commandQueue.claimDue(List.of(channel), limit)) {
            dispatchOne(envelope);
        }
    }

    private void dispatchOne(CommandEnvelope envelope) {
        BpmCommandHandler handler = handlers.get(envelope.getCommandType());
        if (handler == null) {
            commandQueue.failAndScheduleRetry(envelope.getCommandId(), envelope.getClaimToken(),
                    "无命令处理器: " + envelope.getCommandType(), maxRetries, backoffMillis);
            return;
        }
        LoginUser loginUser;
        try {
            loginUser = restoreCurrentIdentity(envelope);
        } catch (RuntimeException exception) {
            rejectBeforeHandle(envelope, "消费身份回查失败: " + exception.getMessage(), exception);
            return;
        }
        if (loginUser == null) {
            rejectBeforeHandle(envelope, "发起用户不存在、已停用或租户不匹配", null);
            return;
        }
        if (envelope.getChannel() == CommandChannelEnum.P0 && !hasP0Permission(loginUser)) {
            rejectBeforeHandle(envelope, "消费时缺少 P0 调用专用权限: " + P0_PERMISSION, null);
            return;
        }
        LoginUserHolder.set(loginUser);
        long begin = System.currentTimeMillis();
        try {
            log.info("命令开始处理: commandId={}, type={}, channel={}, retry={}",
                    envelope.getCommandId(), envelope.getCommandType(), envelope.getChannel(),
                    envelope.getRetryCount());
            String result = handler.handle(envelope);
            commandQueue.complete(envelope.getCommandId(), envelope.getClaimToken(), result);
            log.info("命令处理完成: commandId={}, 耗时 {}ms", envelope.getCommandId(),
                    System.currentTimeMillis() - begin);
        } catch (Exception e) {
            String reason = e instanceof BaseException base
                    ? base.getMessage() : String.valueOf(e);
            log.warn("命令处理失败: commandId={}, reason={}", envelope.getCommandId(), reason, e);
            boolean retried = commandQueue.failAndScheduleRetry(envelope.getCommandId(),
                    envelope.getClaimToken(), reason, maxRetries, backoffMillis);
            if (!retried) {
                try {
                    LoginUser finalUser = new LoginUser();
                    finalUser.setUserId(envelope.getInitiatorId());
                    finalUser.setTenantId(envelope.getTenantId());
                    LoginUserHolder.set(finalUser);
                    handler.onFinalFailure(envelope, reason);
                } finally {
                    LoginUserHolder.clear();
                }
            }
        } finally {
            LoginUserHolder.clear();
        }
    }

    private LoginUser restoreCurrentIdentity(CommandEnvelope envelope) {
        LoginUser fallback = new LoginUser();
        fallback.setUserId(envelope.getInitiatorId());
        fallback.setTenantId(envelope.getTenantId());
        if (userDetailsProvider == null) {
            // 仅隔离单元测试使用；生产 Spring 构造器始终注入正式 SPI。
            return fallback;
        }

        // 先注入租户以便 UserDetailsProvider 的正式查询走同一租户边界。
        LoginUserHolder.set(fallback);
        LoginUser current = userDetailsProvider.loadByUserId(envelope.getInitiatorId());
        if (current == null || !Objects.equals(current.getUserId(), envelope.getInitiatorId())
                || !Objects.equals(current.getTenantId(), envelope.getTenantId())) {
            return null;
        }
        return current;
    }

    private boolean hasP0Permission(LoginUser loginUser) {
        if (userDetailsProvider == null) {
            // 无 SPI 的双参构造器仅供隔离队列测试使用，沿用测试身份语义；
            // Spring 生产构造器始终注入正式 UserDetailsProvider 并执行真实权限校验。
            return true;
        }
        return loginUser.isSuperAdmin()
                || (loginUser.getPermissions() != null && loginUser.getPermissions().contains(P0_PERMISSION));
    }

    private void rejectBeforeHandle(CommandEnvelope envelope, String reason, RuntimeException cause) {
        try {
            commandQueue.reject(envelope.getCommandId(), envelope.getClaimToken(), reason);
            // 消费前拒绝同样是 FAILED 终态：触发处理器补偿（如草稿转 FAILED 可修正重试），
            // 避免 SUBMITTING 永久冻结。以发起人最小身份执行，且不得覆盖真实拒绝原因。
            try {
                LoginUser minimal = new LoginUser();
                minimal.setUserId(envelope.getInitiatorId());
                minimal.setTenantId(envelope.getTenantId());
                LoginUserHolder.set(minimal);
                BpmCommandHandler handler = handlers.get(envelope.getCommandType());
                if (handler != null) {
                    handler.onFinalFailure(envelope, reason);
                }
            } catch (Exception compensationFailure) {
                log.warn("消费前拒绝补偿失败: commandId={}", envelope.getCommandId(), compensationFailure);
            } finally {
                LoginUserHolder.clear();
            }
            if (cause == null) {
                log.warn("命令消费前安全门禁拒绝: commandId={}, reason={}", envelope.getCommandId(), reason);
            } else {
                log.warn("命令消费前身份回查失败，拒绝执行: commandId={}", envelope.getCommandId(), cause);
            }
        } finally {
            LoginUserHolder.clear();
        }
    }
}
