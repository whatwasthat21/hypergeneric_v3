package com.example.mysqlcrudapp.entity;

import javax.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "field")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Field {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;    @Column(name = "field_key", nullable = false)
    private String key;

    @Column(nullable = false)
    private String label;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String type;

    private String widget;

    @Column(name = "default_json", columnDefinition = "json")
    private String defaultJson;

    @Column(name = "validation_json", columnDefinition = "json")
    private String validationJson;

    @Column(name = "options_json", columnDefinition = "json")
    private String optionsJson;

    @Column(name = "min_number")
    private Double minNumber;

    @Column(name = "max_number")
    private Double maxNumber;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "group_name")
    private String groupName;

    @Column(name = "settings_json", columnDefinition = "json")
    private String settingsJson;

    @OneToMany(mappedBy = "field", cascade = CascadeType.ALL)
    @Builder.Default
    private List<BlueprintVersionField> blueprintVersionFields = new ArrayList<>();

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
