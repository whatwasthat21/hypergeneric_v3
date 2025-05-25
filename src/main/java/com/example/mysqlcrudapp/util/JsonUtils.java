package com.example.mysqlcrudapp.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for JSON operations
 */
@Component
public class JsonUtils {
    
    private final ObjectMapper objectMapper;
    
    public JsonUtils(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }
    
    /**
     * Ensures that a string is valid JSON or returns a default value
     * 
     * @param input The string to validate as JSON
     * @param defaultValue The default value to return if input is invalid (defaults to "{}")
     * @return A valid JSON string
     */
    public String ensureValidJson(String input, String defaultValue) {
        if (input == null || input.trim().isEmpty()) {
            return defaultValue;
        }
        
        try {
            // Parse and re-stringify to normalize format
            Object parsed = objectMapper.readValue(input, Object.class);
            return objectMapper.writeValueAsString(parsed);
        } catch (JsonProcessingException e) {
            return defaultValue;
        }
    }
    
    /**
     * Ensures that a string is valid JSON or returns "{}"
     * 
     * @param input The string to validate as JSON
     * @return A valid JSON string, or "{}" if input is invalid
     */
    public String ensureValidJson(String input) {
        return ensureValidJson(input, "{}");
    }
    
    /**
     * Formats a JSON string for pretty display
     * 
     * @param input The JSON string to format
     * @return A pretty-formatted JSON string
     */
    public String prettyPrintJson(String input) {
        if (input == null || input.trim().isEmpty()) {
            return "{}";
        }
        
        try {
            Object parsed = objectMapper.readValue(input, Object.class);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(parsed);
        } catch (JsonProcessingException e) {
            return input;
        }
    }
}
