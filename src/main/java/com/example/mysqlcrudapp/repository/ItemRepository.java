package com.example.mysqlcrudapp.repository;

import com.example.mysqlcrudapp.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByBlueprintId(Long blueprintId);
    List<Item> findByVersionId(Long versionId);
}
