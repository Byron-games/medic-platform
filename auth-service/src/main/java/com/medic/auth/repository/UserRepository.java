package com.medic.auth.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.medic.auth.domain.AccountStatus;
import com.medic.auth.domain.Role;
import com.medic.auth.domain.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    // Added to fix the compilation error
    boolean existsByUsername(String username);

    boolean existsByStaffId(String staffId);

    List<User> findByFacilityIdAndAccountStatus(String facilityId, AccountStatus status);

    long countByFacilityIdAndRoleAndStaffIdContaining(String facilityId, Role role,
            String staffIdFragment);
}
