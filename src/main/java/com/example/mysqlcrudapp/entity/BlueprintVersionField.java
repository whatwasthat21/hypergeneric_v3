package com.example.mysqlcrudapp.entity;

import javax.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "blueprint_version_field")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlueprintVersionField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blueprint_version_id", nullable = false)
    private BlueprintVersion blueprintVersion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private Field field;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "is_required")
    private Boolean required;

    @Column(name = "settings_json", columnDefinition = "json")
    private String settingsJson;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
