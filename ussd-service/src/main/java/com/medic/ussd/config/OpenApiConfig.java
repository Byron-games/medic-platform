package com.medic.ussd.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. USSD Service",
    version     = "1.0",
    description = "Africa's Talking USSD gateway — bilingual EN/FR feature-phone menus for appointments, prescriptions and facility lookup"
))
public class OpenApiConfig {}
