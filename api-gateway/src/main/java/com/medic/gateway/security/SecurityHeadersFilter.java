package com.medic.gateway.security;

import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

@Component
public class SecurityHeadersFilter implements WebFilter {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        // Intercept the request, modify the response headers before passing it along
        exchange.getResponse().getHeaders().add("X-Frame-Options", "DENY");
        exchange.getResponse().getHeaders().add("X-Content-Type-Options", "nosniff");
        exchange.getResponse().getHeaders().add("X-XSS-Protection", "1; mode=block");
        // exchange.getResponse().getHeaders().add("Strict-Transport-Security", "max-age=31536000;
        // includeSubDomains");
        exchange.getResponse().getHeaders().add("Content-Security-Policy",
                "default-src 'none'; frame-ancestors 'none'");
        exchange.getResponse().getHeaders().add("Server", "M.E.D.I.C.");

        return chain.filter(exchange);
    }
}
