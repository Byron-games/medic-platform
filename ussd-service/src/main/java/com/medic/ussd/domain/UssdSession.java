package com.medic.ussd.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "ussd_sessions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class UssdSession {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", unique = true, nullable = false, length = 100)
    private String sessionId;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "current_menu", nullable = false, length = 50)
    @Builder.Default
    private String currentMenu = "MAIN";

    @Column(name = "patient_mpi_id", length = 20)
    private String patientMpiId;

    @Column(nullable = false, length = 5)
    @Builder.Default
    private String language = "EN";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "session_data", columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> sessionData = new HashMap<>();

    @Column(name = "input_history", columnDefinition = "TEXT[]")
    @Builder.Default
    private String[] inputHistory = new String[0];

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
