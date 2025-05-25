package com.example.mysqlcrudapp.repository;

import com.example.mysqlcrudapp.entity.ItemLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemLinkRepository extends JpaRepository<ItemLink, Long> {
    List<ItemLink> findByFromItemId(Long fromItemId);
    List<ItemLink> findByToItemId(Long toItemId);
}
