package com.medic.patient.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. Patient Identity Service",
    version     = "1.0",
    description = "Master Patient Index (MPI) — single source of truth for patient identity"
))
public class OpenApiConfig {}
