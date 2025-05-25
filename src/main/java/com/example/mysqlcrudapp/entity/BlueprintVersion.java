package com.example.mysqlcrudapp.entity;

import javax.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "blueprint_version")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlueprintVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blueprint_id", nullable = false)
    private Blueprint blueprint;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "blueprintVersion", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<BlueprintVersionField> fields = new ArrayList<>();

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
