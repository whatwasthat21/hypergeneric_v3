package com.example.mysqlcrudapp.service;

import com.example.mysqlcrudapp.entity.Field;
import com.example.mysqlcrudapp.exception.ResourceNotFoundException;
import com.example.mysqlcrudapp.repository.FieldRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FieldService {
    private final FieldRepository fieldRepository;
    private final ObjectMapper objectMapper;
    private final AuthenticationService authenticationService;

    public List<Field> findAll() {
        return fieldRepository.findAll();
    }public Field findById(Long id) {
        return fieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Field not found with id: " + id));
    }
      @Transactional
    public Field create(Field field) {
        // Automatically set createdBy to current user's full name
        field.setCreatedBy(authenticationService.getCurrentUserFullName());
        
        // Ensure JSON fields are properly formatted
        field.setDefaultJson(ensureValidJson(field.getDefaultJson()));
        field.setValidationJson(ensureValidJson(field.getValidationJson()));
        field.setOptionsJson(ensureValidJson(field.getOptionsJson()));
        field.setSettingsJson(ensureValidJson(field.getSettingsJson()));
        
        return fieldRepository.save(field);
    }

    @Transactional
    public Field update(Long id, Field fieldDetails) {
        return fieldRepository.findById(id)
                .map(field -> {
                    field.setKey(fieldDetails.getKey());
                    field.setLabel(fieldDetails.getLabel());
                    field.setDescription(fieldDetails.getDescription());
                    field.setType(fieldDetails.getType());
                    field.setWidget(fieldDetails.getWidget());
                    
                    // Ensure JSON fields are properly formatted
                    field.setDefaultJson(ensureValidJson(fieldDetails.getDefaultJson()));
                    field.setValidationJson(ensureValidJson(fieldDetails.getValidationJson()));
                    field.setOptionsJson(ensureValidJson(fieldDetails.getOptionsJson()));
                    field.setSettingsJson(ensureValidJson(fieldDetails.getSettingsJson()));
                    
                    field.setMinNumber(fieldDetails.getMinNumber());
                    field.setMaxNumber(fieldDetails.getMaxNumber());
                    field.setOrderIndex(fieldDetails.getOrderIndex());
                    field.setGroupName(fieldDetails.getGroupName());                    return fieldRepository.save(field);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Field not found with id: " + id));
    }

    public boolean existsById(Long id) {
        return fieldRepository.existsById(id);
    }

    @Transactional
    public void deleteById(Long id) {
        if (!existsById(id)) {
            throw new ResourceNotFoundException("Field not found with id: " + id);
        }
        fieldRepository.deleteById(id);
    }

    /**
     * Ensures that a string is valid JSON or returns a default value
     * 
     * @param input The JSON string to validate
     * @return A valid JSON string, or "{}" if input is invalid
     */
    private String ensureValidJson(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "{}";
        }
        
        try {
            // Parse and re-stringify to normalize format
            Object parsed = objectMapper.readValue(input, Object.class);
            return objectMapper.writeValueAsString(parsed);
        } catch (JsonProcessingException e) {
            return "{}";
        }
    }
}
