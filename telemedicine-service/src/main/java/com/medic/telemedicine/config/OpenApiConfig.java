package com.medic.telemedicine.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. Telemedicine Service",
    version     = "1.0",
    description = "Jitsi video session management with low-bandwidth mode for rural connectivity"
))
public class OpenApiConfig {}
