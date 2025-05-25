package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.dto.ItemLinkDto;
import com.example.mysqlcrudapp.entity.ItemLink;
import com.example.mysqlcrudapp.entity.Item;
import com.example.mysqlcrudapp.service.ItemLinkService;
import com.example.mysqlcrudapp.service.ItemService;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/item-links")
@RequiredArgsConstructor
public class ItemLinkController {
    private final ItemLinkService itemLinkService;
    private final ItemService itemService;
    private final ModelMapper modelMapper;    @GetMapping
    public ResponseEntity<List<ItemLinkDto>> getAllItemLinks() {
        List<ItemLinkDto> links = itemLinkService.findAll().stream()
                .map(link -> modelMapper.map(link, ItemLinkDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(links);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemLinkDto> getItemLinkById(@PathVariable Long id) {
        return itemLinkService.findById(id)
                .map(link -> modelMapper.map(link, ItemLinkDto.class))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/from/{fromItemId}")
    public ResponseEntity<List<ItemLinkDto>> getItemLinksByFromItemId(@PathVariable Long fromItemId) {
        List<ItemLinkDto> links = itemLinkService.findByFromItemId(fromItemId).stream()
                .map(link -> modelMapper.map(link, ItemLinkDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(links);
    }

    @GetMapping("/to/{toItemId}")
    public ResponseEntity<List<ItemLinkDto>> getItemLinksByToItemId(@PathVariable Long toItemId) {
        List<ItemLinkDto> links = itemLinkService.findByToItemId(toItemId).stream()
                .map(link -> modelMapper.map(link, ItemLinkDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(links);
    }

    @PostMapping
    public ResponseEntity<ItemLinkDto> createItemLink(@RequestBody ItemLinkDto itemLinkDto) {
        Item fromItem = itemService.findById(itemLinkDto.getFromItemId())
                .orElseThrow(() -> new ResourceNotFoundException("From Item not found with id: " + itemLinkDto.getFromItemId()));
        Item toItem = itemService.findById(itemLinkDto.getToItemId())
                .orElseThrow(() -> new ResourceNotFoundException("To Item not found with id: " + itemLinkDto.getToItemId()));

        ItemLink itemLink = modelMapper.map(itemLinkDto, ItemLink.class);
        itemLink.setFromItem(fromItem);
        itemLink.setToItem(toItem);

        ItemLink created = itemLinkService.create(itemLink);
        ItemLinkDto createdDto = modelMapper.map(created, ItemLinkDto.class);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();

        return ResponseEntity.created(location).body(createdDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ItemLinkDto> updateItemLink(@PathVariable Long id, @RequestBody ItemLinkDto itemLinkDto) {
        Item fromItem = itemService.findById(itemLinkDto.getFromItemId())
                .orElseThrow(() -> new ResourceNotFoundException("From Item not found with id: " + itemLinkDto.getFromItemId()));
        Item toItem = itemService.findById(itemLinkDto.getToItemId())
                .orElseThrow(() -> new ResourceNotFoundException("To Item not found with id: " + itemLinkDto.getToItemId()));

        ItemLink itemLink = modelMapper.map(itemLinkDto, ItemLink.class);
        itemLink.setFromItem(fromItem);
        itemLink.setToItem(toItem);

        return itemLinkService.update(id, itemLink)
                .map(updated -> modelMapper.map(updated, ItemLinkDto.class))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItemLink(@PathVariable Long id) {
        if (itemLinkService.existsById(id)) {
            itemLinkService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
