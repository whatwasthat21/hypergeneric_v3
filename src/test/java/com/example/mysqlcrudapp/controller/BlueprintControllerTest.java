package com.example.mysqlcrudapp.controller;

import com.example.mysqlcrudapp.dto.BlueprintDto;
import com.example.mysqlcrudapp.service.BlueprintService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class BlueprintControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BlueprintService blueprintService;

    @Test
    @WithMockUser
    public void getAllBlueprints_ShouldReturnBlueprints() throws Exception {
        BlueprintDto blueprint = new BlueprintDto();
        blueprint.setId(1L);
        blueprint.setName("Test Blueprint");

        when(blueprintService.findAll()).thenReturn(Arrays.asList(blueprint));

        mockMvc.perform(get("/api/blueprints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Test Blueprint"));
    }

    @Test
    @WithMockUser
    public void createBlueprint_ShouldReturnCreatedBlueprint() throws Exception {
        BlueprintDto input = new BlueprintDto();
        input.setName("New Blueprint");

        BlueprintDto created = new BlueprintDto();
        created.setId(1L);
        created.setName("New Blueprint");

        when(blueprintService.create(any(BlueprintDto.class))).thenReturn(created);

        mockMvc.perform(post("/api/blueprints")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("New Blueprint"));
    }

    @Test
    @WithMockUser
    public void createBlueprint_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        BlueprintDto input = new BlueprintDto();
        input.setName("");  // Invalid: name is required

        mockMvc.perform(post("/api/blueprints")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isBadRequest());
    }
}
