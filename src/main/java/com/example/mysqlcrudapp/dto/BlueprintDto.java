package com.example.mysqlcrudapp.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BlueprintDto {
    private Long id;

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 255, message = "Name must be between 1 and 255 characters")
    private String name;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private String createdBy;
    private Integer activeVersion;
    private List<BlueprintVersionDto> versions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
