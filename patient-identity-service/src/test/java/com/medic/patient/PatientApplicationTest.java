package com.medic.patient;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PatientApplicationTest {

    @Test
    void contextLoads() {
        // Verifies Spring context loads without errors
    }
}
