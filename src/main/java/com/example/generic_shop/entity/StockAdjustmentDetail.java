package com.example.generic_shop.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.*;

@Entity
@Table(name = "tbl_stock_adjustment_detail")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StockAdjustmentDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_adjustment_id", nullable = false)
    @JsonBackReference
    private StockAdjustment stockAdjustment;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    private Double systemStock; // Tồn hệ thống (sổ sách) lúc kiểm kê

    private Double actualStock; // Tồn thực tế kiểm đếm

    private Double adjustmentQuantity; // Chênh lệch (Actual - System)

    private String note;
}
