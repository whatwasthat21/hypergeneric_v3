package com.example.mysqlcrudapp.repository;

import com.example.mysqlcrudapp.entity.BlueprintVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlueprintVersionRepository extends JpaRepository<BlueprintVersion, Long> {
    List<BlueprintVersion> findByBlueprintIdOrderByVersionNumberDesc(Long blueprintId);
    
    @Query("SELECT bv FROM BlueprintVersion bv WHERE bv.blueprint.id = :blueprintId AND bv.active = true")
    Optional<BlueprintVersion> findActiveVersion(Long blueprintId);
}
