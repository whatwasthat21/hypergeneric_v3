package com.example.mysqlcrudapp.entity;

import javax.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "item_link")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemLink {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_item_id", nullable = false)
    private Item fromItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_item_id", nullable = false)
    private Item toItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private Field field;

    @Column(name = "created_by")
    private String createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
