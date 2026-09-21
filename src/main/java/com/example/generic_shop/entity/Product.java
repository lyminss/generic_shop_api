package com.example.generic_shop.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "tbl_product")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Product extends BaseEntity {
    private String name;
    private String description;
    @Column(columnDefinition = "TEXT")
    private String image;
    private long price;
    private int stockQuantity;
    private String category;

    @Column(name = "status")
    private String status = "ACTIVE"; // "ACTIVE" | "STOPPED" | "DELETED"

    /** Soft-delete flag: true = đã xóa mềm, vẫn còn trong DB */
    @Column(name = "deleted", nullable = false)
    private boolean deleted = false;

    /** Thời điểm soft-delete */
    @Column(name = "deleted_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date deletedAt;

    @Transient
    private Boolean available = true;

    @Transient
    private String unavailableReason;

    @Transient
    private Integer maxServingsAvailable;
}

