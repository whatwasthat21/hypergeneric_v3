package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.dto.FieldDto;
import com.example.mysqlcrudapp.entity.Field;
import com.example.mysqlcrudapp.service.FieldService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/fields")
@RequiredArgsConstructor
public class FieldController {
    private final FieldService fieldService;
    private final ModelMapper modelMapper;

    @GetMapping
    public ResponseEntity<List<FieldDto>> getAllFields() {
        List<Field> fields = fieldService.findAll();
        List<FieldDto> fieldDtos = fields.stream()
                .map(field -> modelMapper.map(field, FieldDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(fieldDtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FieldDto> getFieldById(@PathVariable Long id) {
        Field field = fieldService.findById(id);
        return ResponseEntity.ok(modelMapper.map(field, FieldDto.class));
    }

    @PostMapping
    public ResponseEntity<FieldDto> createField(@Valid @RequestBody FieldDto fieldDto) {
        Field field = modelMapper.map(fieldDto, Field.class);
        Field created = fieldService.create(field);
        FieldDto createdDto = modelMapper.map(created, FieldDto.class);
        
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
                
        return ResponseEntity.created(location).body(createdDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FieldDto> updateField(@PathVariable Long id, @Valid @RequestBody FieldDto fieldDto) {
        Field field = modelMapper.map(fieldDto, Field.class);
        Field updated = fieldService.update(id, field);
        return ResponseEntity.ok(modelMapper.map(updated, FieldDto.class));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteField(@PathVariable Long id) {
        if (fieldService.existsById(id)) {
            fieldService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
