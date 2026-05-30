package com.medic.auth.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import com.medic.auth.domain.AccountStatus;
import com.medic.auth.domain.Role;
import com.medic.auth.domain.User;
import com.medic.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;

    @Override
    public void run(String... args) {
        if (userRepo.existsByUsername("admin")) {
            log.info("Admin user already exists — skipping seed");
            return;
        }

        User admin = User.builder().username("admin").email("admin@medic.health")
                .password(encoder.encode("Admin@2026!")).fullName("System Administrator")
                .role(Role.ADMIN).requestedRole(Role.ADMIN).accountStatus(AccountStatus.ACTIVE)
                .facilityId("CMR-SYS-000").facilityName("M.E.D.I.C. National")
                .staffId("SYS-ADM-2026-0001").build();

        userRepo.save(admin);
        log.info("=================================================");
        log.info(" ADMIN SEEDED: username=admin / Admin@2026!");
        log.info("=================================================");
    }
}
