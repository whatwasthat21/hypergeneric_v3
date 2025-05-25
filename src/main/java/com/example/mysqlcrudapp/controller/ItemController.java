package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.dto.ItemDto;
import com.example.mysqlcrudapp.dto.BlueprintDto;
import com.example.mysqlcrudapp.dto.BlueprintVersionDto;
import com.example.mysqlcrudapp.entity.Item;
import com.example.mysqlcrudapp.entity.Blueprint;
import com.example.mysqlcrudapp.entity.BlueprintVersion;
import com.example.mysqlcrudapp.service.ItemService;
import com.example.mysqlcrudapp.service.BlueprintService;
import com.example.mysqlcrudapp.service.BlueprintVersionService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {
    private final ItemService itemService;
    private final BlueprintService blueprintService;
    private final BlueprintVersionService versionService;
    private final ModelMapper modelMapper;

    @GetMapping
    public ResponseEntity<List<ItemDto>> getAllItems() {
        List<ItemDto> items = itemService.findAll().stream()
                .map(item -> modelMapper.map(item, ItemDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemDto> getItemById(@PathVariable Long id) {
        return itemService.findById(id)
                .map(item -> modelMapper.map(item, ItemDto.class))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/blueprint/{blueprintId}")
    public ResponseEntity<List<ItemDto>> getItemsByBlueprintId(@PathVariable Long blueprintId) {
        List<ItemDto> items = itemService.findByBlueprintId(blueprintId).stream()
                .map(item -> modelMapper.map(item, ItemDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @GetMapping("/version/{versionId}")
    public ResponseEntity<List<ItemDto>> getItemsByVersionId(@PathVariable Long versionId) {
        List<ItemDto> items = itemService.findByVersionId(versionId).stream()
                .map(item -> modelMapper.map(item, ItemDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(items);
    }

    @PostMapping
    public ResponseEntity<ItemDto> createItem(@RequestBody ItemDto itemDto) {
        // Convert Blueprint ID to Blueprint entity
        Blueprint blueprint = modelMapper.map(blueprintService.findById(itemDto.getBlueprintId()), Blueprint.class);
        // Convert Version ID to Version entity
        BlueprintVersion version = modelMapper.map(versionService.findById(itemDto.getVersionId()), BlueprintVersion.class);
        
        Item item = modelMapper.map(itemDto, Item.class);
        item.setBlueprint(blueprint);
        item.setVersion(version);
        
        Item created = itemService.create(item);
        ItemDto createdDto = modelMapper.map(created, ItemDto.class);
        
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
                
        return ResponseEntity.created(location).body(createdDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemDto> updateItem(@PathVariable Long id, @RequestBody ItemDto itemDto) {
        // Convert Blueprint ID to Blueprint entity
        Blueprint blueprint = modelMapper.map(blueprintService.findById(itemDto.getBlueprintId()), Blueprint.class);
        // Convert Version ID to Version entity
        BlueprintVersion version = modelMapper.map(versionService.findById(itemDto.getVersionId()), BlueprintVersion.class);
        
        Item item = modelMapper.map(itemDto, Item.class);
        item.setBlueprint(blueprint);
        item.setVersion(version);
        
        return itemService.update(id, item)
                .map(updated -> modelMapper.map(updated, ItemDto.class))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        if (itemService.existsById(id)) {
            itemService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
