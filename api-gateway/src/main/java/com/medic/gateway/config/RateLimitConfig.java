package com.medic.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.filter.ratelimit.RedisRateLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary; // <-- Imported Primary
import reactor.core.publisher.Mono;

@Configuration
public class RateLimitConfig {

    /**
     * Rate limit key: use IP for unauthenticated, user ID for authenticated. This prevents a single
     * IP from hammering login while not penalising legitimate users on shared hospital WiFi.
     */
    @Bean
    public KeyResolver rateLimitKeyResolver() {
        return exchange -> {
            // Try X-User-Id header first (set by JWT filter after auth)
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null)
                return Mono.just("user:" + userId);

            // Fall back to IP address
            String ip = exchange.getRequest().getRemoteAddress() != null
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
                    : "unknown";
            return Mono.just("ip:" + ip);
        };
    }

    /**
     * Global rate limiter: - 20 requests/second replenish rate - 40 burst capacity (allows short
     * spikes) Tighter limits applied per-route below for sensitive endpoints.
     */
    @Bean
    @Primary // <-- Added this annotation to resolve the auto-wiring conflict
    public RedisRateLimiter defaultRateLimiter() {
        return new RedisRateLimiter(20, 40, 1);
    }

    /** Auth endpoints — very tight to prevent brute force */
    @Bean("authRateLimiter")
    public RedisRateLimiter authRateLimiter() {
        return new RedisRateLimiter(3, 5, 1); // 3 req/sec, burst 5
    }
}
