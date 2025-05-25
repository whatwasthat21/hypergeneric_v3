package com.example.mysqlcrudapp.config;

import java.util.ArrayList;
import org.modelmapper.ModelMapper;
import org.modelmapper.PropertyMap;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.example.mysqlcrudapp.dto.BlueprintDto;
import com.example.mysqlcrudapp.dto.BlueprintVersionDto;
import com.example.mysqlcrudapp.entity.Blueprint;
import com.example.mysqlcrudapp.entity.BlueprintVersion;

@Configuration
public class ModelMapperConfig {    @Bean    public ModelMapper modelMapper() {
        ModelMapper mapper = new ModelMapper();
        mapper.getConfiguration()
                .setSkipNullEnabled(true)
                .setAmbiguityIgnored(true);
          // Custom mapping for Blueprint to BlueprintDto
        mapper.createTypeMap(Blueprint.class, BlueprintDto.class)
              .addMappings(mapping -> {
                  // Skip mapping versions to activeVersion to avoid conversion errors
                  mapping.skip(BlueprintDto::setActiveVersion);
              })
              .setPostConverter(context -> {
                  Blueprint src = context.getSource();
                  BlueprintDto dest = context.getDestination();
                  
                  // Null safety - if source is null, return null
                  if (src == null) {
                      return null;
                  }
                  
                  // Ensure ID is properly set
                  if (src.getId() != null) {
                      dest.setId(src.getId());
                  }
                  
                  // Initialize versions list if null
                  if (dest.getVersions() == null) {
                      dest.setVersions(new ArrayList<>());
                  }
                  
                  // Manually set the active version number
                  Integer activeVersion = getActiveVersionNumber(src);
                  dest.setActiveVersion(activeVersion);
                  
                  return dest;
              });
          // Custom mapping for BlueprintVersion to BlueprintVersionDto
        // This prevents circular reference issues
        mapper.addMappings(new PropertyMap<BlueprintVersion, BlueprintVersionDto>() {
            @Override
            protected void configure() {
                // Map only the ID of the blueprint to avoid circular references
                map().setBlueprintId(source.getBlueprint().getId());
            }
        });
        
        return mapper;
    }
    
    // Helper method to extract active version number
    private Integer getActiveVersionNumber(Blueprint blueprint) {
        if (blueprint.getVersions() != null) {
            for (BlueprintVersion version : blueprint.getVersions()) {
                if (version.isActive()) {
                    return version.getVersionNumber();
                }
            }
        }
        return null;
    }
}
