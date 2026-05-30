package com.medic.appointment.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(info = @Info(
    title       = "M.E.D.I.C. Appointment Service",
    version     = "1.0",
    description = "Scheduling, rescheduling, cancellation and clinician availability"
))
public class OpenApiConfig {}
