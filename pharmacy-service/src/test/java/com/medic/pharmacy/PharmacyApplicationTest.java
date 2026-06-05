package com.medic.pharmacy;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class PharmacyApplicationTest {

    @Test
    void contextLoads() {
        // Verifies Spring context loads without errors
    }
}
