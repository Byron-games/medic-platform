package com.medic.pharmacy.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. Pharmacy Service",
    version     = "1.0",
    description = "e-Prescriptions, drug interaction checking, and dispensing workflow"
))
public class OpenApiConfig {}
