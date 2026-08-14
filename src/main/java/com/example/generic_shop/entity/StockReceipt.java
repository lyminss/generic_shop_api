package com.example.generic_shop.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tbl_stock_receipt")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StockReceipt extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String receiptCode; // PNK-YYYYMMDD-XXX

    private String supplier; // Nhà cung cấp

    private String note;

    private Double totalAmount = 0.0;

    @OneToMany(mappedBy = "stockReceipt", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<StockReceiptDetail> details = new ArrayList<>();
}
