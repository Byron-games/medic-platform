package com.medic.emr.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. EMR Service",
    version     = "1.0",
    description = "Electronic Medical Records — SOAP notes, vitals, ICD-10 coding"
))
public class OpenApiConfig {}
