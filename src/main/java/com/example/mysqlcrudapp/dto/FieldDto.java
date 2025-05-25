package com.example.mysqlcrudapp.dto;

import lombok.Data;

@Data
public class FieldDto {
    private Long id;
    private String key;
    private String label;
    private String description;
    private String type;
    private String widget;
    private String defaultJson;
    private String validationJson;
    private String optionsJson;
    private String settingsJson;
    private Double minNumber;
    private Double maxNumber;
    private Integer orderIndex;
    private String groupName;
    private String createdBy;
}
