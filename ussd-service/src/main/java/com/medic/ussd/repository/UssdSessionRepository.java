package com.medic.ussd.repository;

import com.medic.ussd.domain.UssdSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UssdSessionRepository extends JpaRepository<UssdSession, Long> {
    Optional<UssdSession> findBySessionId(String sessionId);
    Optional<UssdSession> findByPhoneNumberAndStatus(String phoneNumber, String status);
}
