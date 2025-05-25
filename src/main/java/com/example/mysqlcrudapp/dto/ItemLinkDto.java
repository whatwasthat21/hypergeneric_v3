package com.example.mysqlcrudapp.dto;

import lombok.Data;

@Data
public class ItemLinkDto {
    private Long id;
    private Long fromItemId;
    private Long toItemId;
    private String type;
    private String metadata;
}
