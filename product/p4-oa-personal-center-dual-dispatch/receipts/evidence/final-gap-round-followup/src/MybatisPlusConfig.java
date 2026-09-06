package com.sw.ck.common.config.mybatis;

import com.baomidou.mybatisplus.autoconfigure.MybatisPlusInnerInterceptorAutoConfiguration;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.DataPermissionInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.PaginationInnerInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.TenantLineInnerInterceptor;
import com.sw.ck.common.config.mybatis.datascope.DataScopeHandler;
import com.sw.ck.common.config.mybatis.tenant.CommonTenantLineHandler;
import com.sw.ck.common.config.mybatis.tenant.TenantProperties;
import com.sw.ck.common.datascope.DeptScopeProvider;
import com.sw.ck.common.security.DefaultLoginContextProvider;
import com.sw.ck.common.security.LoginContextProvider;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

/**
 * MyBatis-Plus 全局基础设施：审计字段自动填充 + 拦截器链（租户 / 数据范围 / 乐观锁 / 分页）。
 * <p>
 * 拦截器装载顺序固定为 租户 -&gt; 数据范围 -&gt; 乐观锁 -&gt; 分页：租户/数据范围拦截器都要先于
 * 分页拦截器为 SQL 拼接 where 条件，分页插件生成的 count 查询才会是过滤后的正确结果；租户是
 * 更外层、更基础的隔离边界，故置于数据范围之前；乐观锁拦截器只处理 UPDATE 语句，与这两者顺序
 * 无关，故置于它们之后、分页之前。
 * <p>
 * before = MybatisPlusInnerInterceptorAutoConfiguration.class：MP 官方 starter 自带一个仅含分页的
 * MybatisPlusInterceptor（@ConditionalOnMissingBean 兜底）。必须保证本类先处理，否则两者都是
 * auto-configuration、按官方类的装载顺序可能晚于/早于本类，@ConditionalOnMissingBean 探测不到本类的
 * bean 定义，会导致官方的兜底单一拦截器静默覆盖本类定义的完整拦截器链。
 */
@AutoConfiguration(before = MybatisPlusInnerInterceptorAutoConfiguration.class)
@EnableConfigurationProperties(TenantProperties.class)
public class MybatisPlusConfig {

    /**
     * sw-security 未引入或其实现未生效时的兜底登录上下文，始终取不到用户/租户，
     * 由 {@link CommonMetaObjectHandler} 和 {@link CommonTenantLineHandler} 各自降级处理。
     */
    @Bean
    @ConditionalOnMissingBean(LoginContextProvider.class)
    public LoginContextProvider defaultLoginContextProvider() {
        return new DefaultLoginContextProvider();
    }

    @Bean
    public CommonMetaObjectHandler commonMetaObjectHandler(LoginContextProvider loginContextProvider) {
        return new CommonMetaObjectHandler(loginContextProvider);
    }

    @Bean
    @ConditionalOnProperty(prefix = "sw.tenant", name = "enabled", havingValue = "true", matchIfMissing = true)
    public TenantLineInnerInterceptor tenantLineInnerInterceptor(TenantProperties tenantProperties,
                                                                  LoginContextProvider loginContextProvider) {
        return new TenantLineInnerInterceptor(new CommonTenantLineHandler(tenantProperties, loginContextProvider));
    }

    /**
     * 未由 sw-biz-system 注册具体实现时的兜底 Bean：保证 DataScopeHandler 始终能拿到一个
     * DeptScopeProvider 而不是 NPE，但 DEPT_AND_CHILD 范围一旦真的被使用就显式抛出异常，
     * 不静默放行、也不静默返回错误数据。
     */
    @Bean
    @ConditionalOnMissingBean(DeptScopeProvider.class)
    public DeptScopeProvider noopDeptScopeProvider() {
        return deptId -> {
            throw new UnsupportedOperationException(
                    "DeptScopeProvider 未实现：DEPT_AND_CHILD 数据范围依赖部门树查询，需由 sw-biz-system 模块提供实现");
        };
    }

    @Bean
    @ConditionalOnProperty(prefix = "sw.data-scope", name = "enabled", havingValue = "true", matchIfMissing = true)
    public DataPermissionInterceptor dataPermissionInterceptor(LoginContextProvider loginContextProvider,
                                                                 DeptScopeProvider deptScopeProvider) {
        return new DataPermissionInterceptor(new DataScopeHandler(loginContextProvider, deptScopeProvider));
    }

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor(
            ObjectProvider<TenantLineInnerInterceptor> tenantLineInnerInterceptorProvider,
            ObjectProvider<DataPermissionInterceptor> dataPermissionInterceptorProvider) {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        TenantLineInnerInterceptor tenantLineInnerInterceptor = tenantLineInnerInterceptorProvider.getIfAvailable();
        if (tenantLineInnerInterceptor != null) {
            interceptor.addInnerInterceptor(tenantLineInnerInterceptor);
        }
        DataPermissionInterceptor dataPermissionInterceptor = dataPermissionInterceptorProvider.getIfAvailable();
        if (dataPermissionInterceptor != null) {
            interceptor.addInnerInterceptor(dataPermissionInterceptor);
        }
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        interceptor.addInnerInterceptor(new PaginationInnerInterceptor());
        return interceptor;
    }
}
