package com.example.mysqlcrudapp.service;

import com.example.mysqlcrudapp.entity.Item;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ItemService {
    private final ItemRepository itemRepository;

    public List<Item> findAll() {
        return itemRepository.findAll();
    }

    public Optional<Item> findById(Long id) {
        return itemRepository.findById(id);
    }

    public List<Item> findByBlueprintId(Long blueprintId) {
        return itemRepository.findByBlueprintId(blueprintId);
    }

    public List<Item> findByVersionId(Long versionId) {
        return itemRepository.findByVersionId(versionId);
    }

    @Transactional
    public Item create(Item item) {
        return itemRepository.save(item);
    }

    @Transactional
    public Optional<Item> update(Long id, Item itemDetails) {
        return itemRepository.findById(id)
                .map(item -> {
                    item.setBlueprint(itemDetails.getBlueprint());
                    item.setVersion(itemDetails.getVersion());
                    item.setCurrentState(itemDetails.getCurrentState());
                    item.setDataJson(itemDetails.getDataJson());
                    return itemRepository.save(item);
                });
    }

    public boolean existsById(Long id) {
        return itemRepository.existsById(id);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!existsById(id)) {
            throw new ResourceNotFoundException("Item not found with id: " + id);
        }
        itemRepository.deleteById(id);
    }
}
