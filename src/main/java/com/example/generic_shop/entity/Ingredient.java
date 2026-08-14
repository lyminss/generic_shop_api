package com.example.generic_shop.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "tbl_ingredient")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Ingredient extends BaseEntity {
    
    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String unit; // g, ml, kg, lon, hộp...

    @Column(nullable = false)
    private Double currentStock = 0.0;

    @Column(nullable = false)
    private Double minStockAlert = 0.0;

    @Column(nullable = false)
    private Double costPrice = 0.0; // Giá vốn trung bình / đơn vị
}
