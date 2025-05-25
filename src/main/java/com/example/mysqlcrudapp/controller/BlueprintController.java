package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.dto.BlueprintDto;
import com.example.mysqlcrudapp.service.BlueprintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.validation.Valid;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blueprints")
@RequiredArgsConstructor
public class BlueprintController {
    private final BlueprintService blueprintService;

    @GetMapping
    public ResponseEntity<List<BlueprintDto>> getAllBlueprints() {
        return ResponseEntity.ok(blueprintService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BlueprintDto> getBlueprintById(@PathVariable Long id) {
        return ResponseEntity.ok(blueprintService.findById(id));
    }    @PostMapping
    public ResponseEntity<BlueprintDto> createBlueprint(@Valid @RequestBody BlueprintDto blueprintDto) {
        try {
            System.out.println("Creating blueprint with name: " + blueprintDto.getName() + ", description: " + 
                              (blueprintDto.getDescription() != null ? blueprintDto.getDescription() : "null"));
            
            BlueprintDto created = blueprintService.create(blueprintDto);
            System.out.println("Blueprint created successfully with ID: " + created.getId());
            
            URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(created.getId())
                    .toUri();
            return ResponseEntity.created(location).body(created);        } catch (Exception e) {
            // Log the error with more details
            System.err.println("Error creating blueprint: " + e.getMessage());
            System.err.println("Blueprint data: name=" + blueprintDto.getName() + 
                              ", description=" + (blueprintDto.getDescription() != null ? blueprintDto.getDescription() : "null"));
            e.printStackTrace();
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error creating blueprint: " + e.getMessage(), e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<BlueprintDto> updateBlueprint(@PathVariable Long id, @Valid @RequestBody BlueprintDto blueprintDto) {
        return ResponseEntity.ok(blueprintService.update(id, blueprintDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlueprint(@PathVariable Long id) {
        blueprintService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // CSRF test endpoint
    @GetMapping("/csrf-test")
    public ResponseEntity<Map<String, String>> testCsrf() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "CSRF protection is working");
        return ResponseEntity.ok(response);
    }
}
