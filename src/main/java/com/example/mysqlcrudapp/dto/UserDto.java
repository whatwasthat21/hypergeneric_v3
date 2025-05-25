package com.example.mysqlcrudapp.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long id;
    private String login;
    private String email;
    private String fullName;
    private Integer userType;
    private LocalDateTime lastLogin;
    private String password; // Only used for create/update operations
}
