package com.medic.auth.scheduled;

import com.medic.auth.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class TokenCleanupJob {

    private final RefreshTokenRepository refreshTokenRepo;

    /** Runs at 03:00 every day — removes expired/revoked refresh tokens from the DB. */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Running refresh token cleanup...");
        refreshTokenRepo.deleteExpiredAndRevoked();
        log.info("Refresh token cleanup complete");
    }
}
