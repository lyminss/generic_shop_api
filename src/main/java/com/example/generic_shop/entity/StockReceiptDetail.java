package com.example.generic_shop.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.*;

@Entity
@Table(name = "tbl_stock_receipt_detail")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StockReceiptDetail extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_receipt_id", nullable = false)
    @JsonBackReference
    private StockReceipt stockReceipt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(nullable = false)
    private Double quantity; // Số lượng nhập

    @Column(nullable = false)
    private Double unitPrice; // Đơn giá nhập

    @Column(nullable = false)
    private Double totalPrice; // Thành tiền
}
