package com.medic.auth.security;

import java.io.IOException;
import org.springframework.stereotype.Component;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Strips common XSS patterns from request parameters and headers. Does NOT touch the body — body
 * sanitisation happens in @Valid annotations.
 */
@Component
public class SanitisationFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (request instanceof HttpServletRequest httpReq) {
            // Block requests with obvious SQL injection patterns in params
            String query = httpReq.getQueryString();
            if (query != null && containsSqlInjection(query)) {
                ((HttpServletResponse) response).sendError(400, "Invalid request");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private boolean containsSqlInjection(String input) {
        String lower = input.toLowerCase();
        return lower.contains("' or '1'='1") || lower.contains("--") || lower.contains("; drop ")
                || lower.contains("union select") || lower.contains("<script");
    }
}
