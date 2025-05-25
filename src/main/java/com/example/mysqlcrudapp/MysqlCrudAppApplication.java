package com.example.mysqlcrudapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class MysqlCrudAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(MysqlCrudAppApplication.class, args);
    }
}
