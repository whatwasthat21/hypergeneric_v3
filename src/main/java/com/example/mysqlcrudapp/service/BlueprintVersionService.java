package com.example.mysqlcrudapp.service;

import com.example.mysqlcrudapp.entity.BlueprintVersion;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.repository.BlueprintVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BlueprintVersionService {
    private final BlueprintVersionRepository blueprintVersionRepository;
    private final AuthenticationService authenticationService;

    public List<BlueprintVersion> findAll() {
        return blueprintVersionRepository.findAll();
    }

    public BlueprintVersion findById(Long id) {
        return blueprintVersionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found with id: " + id));
    }

    public List<BlueprintVersion> findByBlueprintId(Long blueprintId) {
        return blueprintVersionRepository.findByBlueprintIdOrderByVersionNumberDesc(blueprintId);
    }

    public BlueprintVersion findActiveVersion(Long blueprintId) {
        return blueprintVersionRepository.findActiveVersion(blueprintId)
                .orElseThrow(() -> new ResourceNotFoundException("No active version found for blueprint: " + blueprintId));
    }    @Transactional
    public BlueprintVersion create(BlueprintVersion version) {
        try {
            System.out.println("BlueprintVersionService: Creating new version for blueprint ID: " + 
                              (version.getBlueprint() != null ? version.getBlueprint().getId() : "null"));
            
            // Validate the version object
            if (version.getBlueprint() == null || version.getBlueprint().getId() == null) {
                throw new IllegalArgumentException("Blueprint reference is required");
            }
            
            // If version number is not set, set default or find next available
            if (version.getVersionNumber() == null || version.getVersionNumber() <= 0) {
                List<BlueprintVersion> existingVersions = 
                    blueprintVersionRepository.findByBlueprintIdOrderByVersionNumberDesc(version.getBlueprint().getId());
                
                if (existingVersions.isEmpty()) {
                    version.setVersionNumber(1);
                } else {
                    version.setVersionNumber(existingVersions.get(0).getVersionNumber() + 1);
                }
                
                System.out.println("BlueprintVersionService: Auto-assigned version number: " + version.getVersionNumber());
            }
              // Set default values for missing fields
            if (version.getCreatedBy() == null || version.getCreatedBy().isEmpty()) {
                // Automatically set createdBy to current user's full name
                version.setCreatedBy(authenticationService.getCurrentUserFullName());
            }
            
            // Save version
            BlueprintVersion savedVersion = blueprintVersionRepository.save(version);
            System.out.println("BlueprintVersionService: Version created successfully with ID: " + savedVersion.getId());
            
            return savedVersion;
        } catch (Exception e) {
            System.err.println("BlueprintVersionService: Error creating version: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to create blueprint version: " + e.getMessage(), e);
        }
    }

    @Transactional
    public BlueprintVersion update(Long id, BlueprintVersion versionDetails) {
        return blueprintVersionRepository.findById(id)
                .map(version -> {
                    version.setVersionNumber(versionDetails.getVersionNumber());
                    version.setName(versionDetails.getName());
                    version.setDescription(versionDetails.getDescription());
                    version.setActive(versionDetails.isActive());
                    return blueprintVersionRepository.save(version);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Version not found with id: " + id));
    }

    @Transactional
    public void deleteById(Long id) {
        if (!blueprintVersionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Version not found with id: " + id);
        }
        blueprintVersionRepository.deleteById(id);
    }

    public boolean existsById(Long id) {
        return blueprintVersionRepository.existsById(id);
    }
}
