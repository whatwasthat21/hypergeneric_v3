package com.example.mysqlcrudapp.config;

import com.example.mysqlcrudapp.entity.Blueprint;
import com.example.mysqlcrudapp.entity.BlueprintVersion;
import com.example.mysqlcrudapp.entity.User;
import com.example.mysqlcrudapp.repository.BlueprintRepository;
import com.example.mysqlcrudapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final BlueprintRepository blueprintRepository;

    @Override
    public void run(String... args) {
        // Create default admin user if no users exist
        if (userService.findAll().isEmpty()) {
            User admin = new User();
            admin.setLogin("admin");
            admin.setEmail("admin@example.com");
            admin.setPasswordHash(passwordEncoder.encode("admin"));
            admin.setFullName("Administrator");
            admin.setUserType(1); // 1 = ADMIN
            userService.create(admin);
            
            System.out.println("Created default admin user");
        }
          // Create a sample blueprint if none exist
        if (blueprintRepository.count() == 0) {
            try {
                Blueprint blueprint = new Blueprint();
                blueprint.setName("Sample Blueprint");
                blueprint.setDescription("This is a sample blueprint created by the system for testing.");
                blueprint.setCreatedBy("system");
                
                // Initialize the versions collection if it's null
                if (blueprint.getVersions() == null) {
                    blueprint.setVersions(new ArrayList<>());
                }
                
                // Save the blueprint first to get an ID
                blueprint = blueprintRepository.save(blueprint);
                
                // Create a version for this blueprint
                BlueprintVersion version = new BlueprintVersion();
                version.setBlueprint(blueprint);
                version.setVersionNumber(1);
                version.setActive(true);
                version.setName("Version 1");
                version.setDescription("Initial version");
                version.setCreatedBy("system");
                
                // Add the version to the blueprint
                blueprint.getVersions().add(version);
                
                // Save the blueprint again with the version
                blueprint = blueprintRepository.save(blueprint);
                
                System.out.println("Created sample blueprint: " + blueprint.getId() + 
                                   " with version: " + version.getVersionNumber());
            } catch (Exception e) {
                System.err.println("Error creating sample blueprint: " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
