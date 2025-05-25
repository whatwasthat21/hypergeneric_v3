package com.example.mysqlcrudapp.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BlueprintVersionDto {
    private Long id;

    @NotNull(message = "Blueprint ID is required")
    private Long blueprintId;

    @NotNull(message = "Version number is required")
    private Integer versionNumber;

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private boolean active;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
