package com.medic.pharmacy.repository;

import com.medic.pharmacy.domain.DrugCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DrugCatalogRepository extends JpaRepository<DrugCatalog, Long> {

    Optional<DrugCatalog> findByGenericNameIgnoreCase(String genericName);

    @Query("SELECT d FROM DrugCatalog d WHERE d.availableInCameroon = true " +
           "AND LOWER(d.genericName) LIKE LOWER(CONCAT('%', :term, '%')) " +
           "ORDER BY d.genericName")
    List<DrugCatalog> searchByName(@Param("term") String term);

    List<DrugCatalog> findByAvailableInCameroonTrueOrderByGenericName();
}
