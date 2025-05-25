package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.dto.BlueprintDto;
import com.example.mysqlcrudapp.dto.BlueprintVersionDto;
import com.example.mysqlcrudapp.entity.Blueprint;
import com.example.mysqlcrudapp.entity.BlueprintVersion;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.service.BlueprintVersionService;
import com.example.mysqlcrudapp.service.BlueprintService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BlueprintVersionController {
    private final BlueprintVersionService blueprintVersionService;
    private final BlueprintService blueprintService;
    private final ModelMapper modelMapper;

    @GetMapping("/blueprint-versions")
    public ResponseEntity<List<BlueprintVersionDto>> getAllVersions() {
        List<BlueprintVersionDto> versions = blueprintVersionService.findAll().stream()
                .map(version -> modelMapper.map(version, BlueprintVersionDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(versions);
    }

    @GetMapping("/blueprint-versions/{id}")
    public ResponseEntity<BlueprintVersionDto> getVersionById(@PathVariable Long id) {
        return ResponseEntity.ok(modelMapper.map(blueprintVersionService.findById(id), BlueprintVersionDto.class));
    }

    @GetMapping("/blueprints/{blueprintId}/versions")
    public ResponseEntity<List<BlueprintVersionDto>> getVersionsByBlueprintId(@PathVariable Long blueprintId) {
        List<BlueprintVersionDto> versions = blueprintVersionService.findByBlueprintId(blueprintId).stream()
                .map(version -> modelMapper.map(version, BlueprintVersionDto.class))
                .collect(Collectors.toList());
        return ResponseEntity.ok(versions);
    }    @GetMapping("/blueprints/{blueprintId}/active-version")
    public ResponseEntity<BlueprintVersionDto> getActiveVersion(@PathVariable Long blueprintId) {
        return ResponseEntity.ok(modelMapper.map(blueprintVersionService.findActiveVersion(blueprintId), BlueprintVersionDto.class));
    }

    @PostMapping("/blueprint-versions")
    public ResponseEntity<BlueprintVersionDto> createVersion(@RequestBody BlueprintVersionDto versionDto) {
        try {
            System.out.println("BlueprintVersionController: Creating new version with data: " + 
                              "blueprintId=" + versionDto.getBlueprintId() +
                              ", name=" + versionDto.getName() +
                              ", description=" + versionDto.getDescription());
            
            // Validate required fields
            if (versionDto.getBlueprintId() == null) {
                throw new IllegalArgumentException("Blueprint ID is required");
            }
            
            // Map DTO to entity
            BlueprintVersion version = modelMapper.map(versionDto, BlueprintVersion.class);
            
            // Get the blueprint from the service
            BlueprintDto blueprintDto = blueprintService.findById(versionDto.getBlueprintId());
            Blueprint blueprint = modelMapper.map(blueprintDto, Blueprint.class);
            
            // Set the blueprint reference for the version
            version.setBlueprint(blueprint);
            
            // Create the version using the service
            BlueprintVersion created = blueprintVersionService.create(version);
            
            // Map back to DTO
            BlueprintVersionDto createdDto = modelMapper.map(created, BlueprintVersionDto.class);
            
            // Build location URI for the REST response
            URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(created.getId())
                    .toUri();
            
            System.out.println("BlueprintVersionController: Version created successfully with ID: " + created.getId());
            return ResponseEntity.created(location).body(createdDto);
        } catch (ResourceNotFoundException e) {
            System.err.println("BlueprintVersionController: Resource not found: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("BlueprintVersionController: Error creating version: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create blueprint version: " + e.getMessage(), e);
        }
    }

    @PutMapping("/blueprint-versions/{id}")
    public ResponseEntity<BlueprintVersionDto> updateVersion(@PathVariable Long id, @RequestBody BlueprintVersionDto versionDto) {
        BlueprintVersion version = modelMapper.map(versionDto, BlueprintVersion.class);
        
        // Convert Blueprint ID to Blueprint entity
        Blueprint blueprint = modelMapper.map(blueprintService.findById(versionDto.getBlueprintId()), Blueprint.class);
        version.setBlueprint(blueprint);
        
        BlueprintVersion updated = blueprintVersionService.update(id, version);
        return ResponseEntity.ok(modelMapper.map(updated, BlueprintVersionDto.class));
    }

    @DeleteMapping("/blueprint-versions/{id}")
    public ResponseEntity<Void> deleteVersion(@PathVariable Long id) {
        if (blueprintVersionService.existsById(id)) {
            blueprintVersionService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // Exception handler for this controller
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception e) {
        Map<String, String> errorResponse = new HashMap<>();
        
        if (e instanceof ResourceNotFoundException) {
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        } else if (e instanceof IllegalArgumentException) {
            errorResponse.put("status", "error");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } else {
            // Log unexpected errors
            System.err.println("Unexpected error in BlueprintVersionController: " + e.getMessage());
            e.printStackTrace();
            
            errorResponse.put("status", "error");
            errorResponse.put("message", "An unexpected error occurred: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
