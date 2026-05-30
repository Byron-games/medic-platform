package com.medic.gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class GatewayInfoController {

    @GetMapping("/")
    public Mono<Map<String, String>> info() {
        return Mono.just(Map.of(
            "service", "M.E.D.I.C. API Gateway",
            "version", "1.0.0",
            "status",  "UP"
        ));
    }
}
