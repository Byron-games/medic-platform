package com.medic.auth.config;

import java.time.Duration;
import java.util.Map;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration defaults =
                RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10))
                        .serializeValuesWith(RedisSerializationContext.SerializationPair
                                .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                        .disableCachingNullValues();

        return RedisCacheManager.builder(factory).cacheDefaults(defaults)
                .withInitialCacheConfigurations(Map.of(
                        // Facilities list changes rarely — cache for 24h
                        "facilities", defaults.entryTtl(Duration.ofHours(24)),
                        // User lookups — 5 minutes
                        "users", defaults.entryTtl(Duration.ofMinutes(5)),
                        // JWT blacklist check — 15 minutes (matches token TTL)
                        "jwt-blacklist", defaults.entryTtl(Duration.ofMinutes(15))))
                .build();
    }
}
