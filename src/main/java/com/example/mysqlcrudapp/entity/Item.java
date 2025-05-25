package com.example.mysqlcrudapp.entity;

import javax.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blueprint_id", nullable = false)
    private Blueprint blueprint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "version_id", nullable = false)
    private BlueprintVersion version;

    @Column(name = "current_state")
    private String currentState;

    @Column(name = "data_json", columnDefinition = "json", nullable = false)
    private String dataJson;

    @OneToMany(mappedBy = "fromItem", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ItemLink> outgoingLinks = new ArrayList<>();

    @OneToMany(mappedBy = "toItem", cascade = CascadeType.ALL)
    @Builder.Default
    private List<ItemLink> incomingLinks = new ArrayList<>();

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
