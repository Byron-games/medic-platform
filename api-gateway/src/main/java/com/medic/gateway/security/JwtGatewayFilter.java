package com.medic.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Component
public class JwtGatewayFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String secret;

    private SecretKey signingKey;

    /** Public paths that bypass JWT validation entirely */
    private static final List<String> PUBLIC_PATHS = List.of(
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh",
        "/api/v1/ussd",          // USSD webhook — Africa's Talking sends POST here
        "/actuator/health",
        "/actuator/prometheus",
        "/v3/api-docs",
        "/swagger-ui"
    );

    @PostConstruct
    public void init() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters");
        }
        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Let public paths through
        boolean isPublic = PUBLIC_PATHS.stream().anyMatch(path::startsWith);
        if (isPublic) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return reject(exchange, "Missing or malformed Authorization header");
        }

        String token = authHeader.substring(7);
        Claims claims;

        try {
            claims = Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        } catch (JwtException e) {
            log.debug("Token rejected at gateway: {}", e.getMessage());
            return reject(exchange, "Invalid or expired token");
        }

        // Propagate user identity downstream as headers (services read these, not the token)
        ServerHttpRequest enrichedRequest = exchange.getRequest().mutate()
            .header("X-User-Id",           safeString(claims.get("userId")))
            .header("X-User-Name",          safeString(claims.get("sub")))
            .header("X-User-Role",          safeString(claims.get("role")))
            .header("X-User-Email",         safeString(claims.get("email")))
            .header("X-Facility-Id",        safeString(claims.get("facilityId")))
            .header("X-Facility-Name",      safeString(claims.get("facilityName")))
            .build();

        return chain.filter(exchange.mutate().request(enrichedRequest).build());
    }

    @Override
    public int getOrder() {
        return -100; // Run before all other filters
    }

    private Mono<Void> reject(ServerWebExchange exchange, String reason) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String body = "{"status":401,"error":"Unauthorized"," +
            ""message":"" + reason + ""}";
        DataBuffer buffer = response.bufferFactory()
            .wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private String safeString(Object value) {
        return value != null ? value.toString() : "";
    }
}
