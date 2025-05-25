package com.example.mysqlcrudapp.repository;

import com.example.mysqlcrudapp.entity.Blueprint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlueprintRepository extends JpaRepository<Blueprint, Long> {    @Query("SELECT DISTINCT b FROM Blueprint b LEFT JOIN FETCH b.versions ORDER BY b.createdAt DESC")
    List<Blueprint> findAllWithVersions();
    
    @Query("SELECT b FROM Blueprint b LEFT JOIN FETCH b.versions WHERE b.id = :id")
    Optional<Blueprint> findByIdWithVersions(Long id);
    
    @Override
    @Query("SELECT b FROM Blueprint b ORDER BY b.createdAt DESC")
    List<Blueprint> findAll();
}
