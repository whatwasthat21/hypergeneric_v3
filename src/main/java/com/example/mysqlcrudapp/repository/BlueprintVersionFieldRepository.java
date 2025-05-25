package com.example.mysqlcrudapp.repository;

import com.example.mysqlcrudapp.entity.BlueprintVersionField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlueprintVersionFieldRepository extends JpaRepository<BlueprintVersionField, Long> {
    List<BlueprintVersionField> findByBlueprintVersionIdOrderByDisplayOrder(Long versionId);
}
