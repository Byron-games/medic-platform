package com.medic.notification.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. Notification Service",
    version     = "1.0",
    description = "SMS delivery via Africa's Talking with bilingual EN/FR templates and automatic retry"
))
public class OpenApiConfig {}
