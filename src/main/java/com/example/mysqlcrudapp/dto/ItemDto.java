package com.example.mysqlcrudapp.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ItemDto {
    private Long id;
    private Long blueprintId;
    private Long versionId;
    private String currentState;
    private String dataJson;
    private List<Long> outgoingLinkIds;
    private List<Long> incomingLinkIds;
    private String createdBy;
    private LocalDateTime createdAt;
}
