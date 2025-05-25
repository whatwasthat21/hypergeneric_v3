package com.example.mysqlcrudapp.service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.mysqlcrudapp.dto.BlueprintDto;
import com.example.mysqlcrudapp.dto.BlueprintVersionDto;
import com.example.mysqlcrudapp.entity.Blueprint;
import com.example.mysqlcrudapp.entity.BlueprintVersion;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.repository.BlueprintRepository;

@Service
@Transactional(readOnly = true)
public class BlueprintService {
    private final BlueprintRepository blueprintRepository;
    private final ModelMapper modelMapper;
    private final AuthenticationService authenticationService;    public BlueprintService(BlueprintRepository blueprintRepository, ModelMapper modelMapper, AuthenticationService authenticationService) {
        this.blueprintRepository = blueprintRepository;
        this.modelMapper = modelMapper;
        this.authenticationService = authenticationService;
    }public List<BlueprintDto> findAll() {
        try {
            System.out.println("BlueprintService: Fetching all blueprints");
            List<Blueprint> blueprints = blueprintRepository.findAllWithVersions();
            System.out.println("BlueprintService: Found " + blueprints.size() + " blueprints in repository");
            
            List<BlueprintDto> dtoList = blueprints.stream()
                    .map(blueprint -> modelMapper.map(blueprint, BlueprintDto.class))
                    .collect(Collectors.toList());
            
            System.out.println("BlueprintService: Mapped " + dtoList.size() + " blueprints to DTOs");
            return dtoList;
        } catch (Exception e) {
            System.err.println("BlueprintService: Error fetching all blueprints: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch blueprints: " + e.getMessage(), e);
        }
    }    public BlueprintDto findById(Long id) {
        try {
            System.out.println("BlueprintService: Finding blueprint by ID: " + id);
            
            // Use the repository method that eagerly loads versions
            Blueprint blueprint = blueprintRepository.findByIdWithVersions(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Blueprint not found with id: " + id));
            
            // Ensure versions list is initialized
            if (blueprint.getVersions() == null) {
                System.out.println("BlueprintService: Initializing empty versions list for blueprint ID: " + id);
                blueprint.setVersions(new ArrayList<>());
            }
            
            try {
                // Map to DTO
                BlueprintDto dto = modelMapper.map(blueprint, BlueprintDto.class);
                
                // Defensive check for DTO versions to avoid serialization issues
                if (dto.getVersions() == null) {
                    dto.setVersions(new ArrayList<>());
                } else {
                    // Ensure version DTOs have createdAt fields populated
                    for (BlueprintVersionDto versionDto : dto.getVersions()) {
                        // Find the corresponding entity to get missing data if needed
                        for (BlueprintVersion versionEntity : blueprint.getVersions()) {
                            if (versionEntity.getId().equals(versionDto.getId())) {
                                // Copy any missing fields that might not have been mapped
                                if (versionDto.getCreatedAt() == null && versionEntity.getCreatedAt() != null) {
                                    versionDto.setCreatedAt(versionEntity.getCreatedAt());
                                }
                                if (versionDto.getUpdatedAt() == null && versionEntity.getUpdatedAt() != null) {
                                    versionDto.setUpdatedAt(versionEntity.getUpdatedAt());
                                }
                                break;
                            }
                        }
                    }
                }
                
                System.out.println("BlueprintService: Found blueprint ID: " + id + 
                                  ", name: " + dto.getName() + 
                                  ", versions count: " + dto.getVersions().size());
                
                return dto;
            } catch (Exception mappingEx) {
                System.err.println("BlueprintService: Error mapping blueprint to DTO: " + mappingEx.getMessage());
                mappingEx.printStackTrace();
                
                // Manually create DTO as fallback in case of mapping errors
                BlueprintDto fallbackDto = new BlueprintDto();
                fallbackDto.setId(blueprint.getId());
                fallbackDto.setName(blueprint.getName());
                fallbackDto.setDescription(blueprint.getDescription());
                fallbackDto.setCreatedBy(blueprint.getCreatedBy());
                fallbackDto.setCreatedAt(blueprint.getCreatedAt());
                fallbackDto.setUpdatedAt(blueprint.getUpdatedAt());
                
                // Manually create version DTOs to avoid mapping issues
                List<BlueprintVersionDto> versionDtos = new ArrayList<>();
                for (BlueprintVersion version : blueprint.getVersions()) {
                    BlueprintVersionDto versionDto = new BlueprintVersionDto();
                    versionDto.setId(version.getId());
                    versionDto.setBlueprintId(blueprint.getId());
                    versionDto.setVersionNumber(version.getVersionNumber());
                    versionDto.setName(version.getName());
                    versionDto.setDescription(version.getDescription());
                    versionDto.setActive(version.isActive());
                    versionDto.setCreatedBy(version.getCreatedBy());
                    versionDto.setCreatedAt(version.getCreatedAt());
                    versionDto.setUpdatedAt(version.getUpdatedAt());
                    versionDtos.add(versionDto);
                }
                fallbackDto.setVersions(versionDtos);
                
                System.out.println("BlueprintService: Created fallback DTO for blueprint ID: " + id + 
                                  " with " + versionDtos.size() + " version(s)");
                return fallbackDto;
            }
        } catch (ResourceNotFoundException e) {
            // Just rethrow resource not found exceptions
            throw e;
        } catch (Exception e) {
            System.err.println("BlueprintService: Error finding blueprint with ID " + id + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error retrieving blueprint with ID " + id + ": " + e.getMessage(), e);
        }
    }    @Transactional
    public BlueprintDto create(BlueprintDto blueprintDto) {
        try {
            // Create a new blueprint entity from the DTO
            Blueprint blueprint = new Blueprint();
            blueprint.setName(blueprintDto.getName());
            blueprint.setDescription(blueprintDto.getDescription());
            // Automatically set createdBy to current user's full name
            blueprint.setCreatedBy(authenticationService.getCurrentUserFullName());
            
            // Initialize empty versions list
            if (blueprint.getVersions() == null) {
                blueprint.setVersions(new ArrayList<>());
            }
            
            // Save the entity
            System.out.println("Saving blueprint to repository: " + blueprint.getName());
            Blueprint saved = blueprintRepository.save(blueprint);
            System.out.println("Blueprint saved with ID: " + saved.getId() + 
                              ", name: " + saved.getName() + 
                              ", description: " + (saved.getDescription() != null ? saved.getDescription() : "null") + 
                              ", createdBy: " + saved.getCreatedBy() + 
                              ", createdAt: " + saved.getCreatedAt());
            
            // Map back to DTO
            BlueprintDto result = modelMapper.map(saved, BlueprintDto.class);
            return result;
        } catch (Exception e) {
            System.err.println("Exception in BlueprintService.create method: " + e.getMessage());
            System.err.println("Stack trace:");
            e.printStackTrace();
            throw new RuntimeException("Failed to create blueprint: " + e.getMessage(), e);
        }
    }

    @Transactional
    public BlueprintDto update(Long id, BlueprintDto blueprintDto) {
        return blueprintRepository.findById(id)
                .map(blueprint -> {
                    modelMapper.map(blueprintDto, blueprint);
                    blueprint = blueprintRepository.save(blueprint);
                    return modelMapper.map(blueprint, BlueprintDto.class);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Blueprint not found with id: " + id));
    }

    public boolean existsById(Long id) {
        return blueprintRepository.existsById(id);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!existsById(id)) {
            throw new ResourceNotFoundException("Blueprint not found with id: " + id);
        }
        blueprintRepository.deleteById(id);
    }
}
