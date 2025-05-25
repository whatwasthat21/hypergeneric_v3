package com.example.mysqlcrudapp.service;

import com.example.mysqlcrudapp.entity.ItemLink;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.repository.ItemLinkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemLinkService {
    private final ItemLinkRepository itemLinkRepository;

    public List<ItemLink> findAll() {
        return itemLinkRepository.findAll();
    }

    public Optional<ItemLink> findById(Long id) {
        return itemLinkRepository.findById(id);
    }

    public List<ItemLink> findByFromItemId(Long fromItemId) {
        return itemLinkRepository.findByFromItemId(fromItemId);
    }

    public List<ItemLink> findByToItemId(Long toItemId) {
        return itemLinkRepository.findByToItemId(toItemId);
    }

    @Transactional
    public ItemLink create(ItemLink itemLink) {
        return itemLinkRepository.save(itemLink);
    }

    @Transactional
    public Optional<ItemLink> update(Long id, ItemLink itemLinkDetails) {
        return itemLinkRepository.findById(id)
                .map(itemLink -> {
                    itemLink.setFromItem(itemLinkDetails.getFromItem());
                    itemLink.setToItem(itemLinkDetails.getToItem());
                    itemLink.setField(itemLinkDetails.getField());
                    return itemLinkRepository.save(itemLink);
                });
    }    public boolean existsById(Long id) {
        return itemLinkRepository.existsById(id);
    }    @Transactional
    public void deleteById(Long id) {
        if (!existsById(id)) {
            throw new ResourceNotFoundException("ItemLink not found with id: " + id);
        }
        itemLinkRepository.deleteById(id);
    }
}
