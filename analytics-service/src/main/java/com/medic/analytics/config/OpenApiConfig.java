package com.medic.analytics.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. Analytics Service",
    version     = "1.0",
    description = "Disease surveillance, outbreak detection and epidemiological dashboard for Sub-Saharan Africa"
))
public class OpenApiConfig {}
