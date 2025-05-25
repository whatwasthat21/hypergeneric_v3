package com.example.mysqlcrudapp.repository;

import com.example.mysqlcrudapp.entity.Field;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FieldRepository extends JpaRepository<Field, Long> {
    List<Field> findByGroupNameOrderByOrderIndex(String groupName);
}
