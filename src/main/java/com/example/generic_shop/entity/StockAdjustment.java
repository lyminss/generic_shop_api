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
@Table(name = "tbl_stock_adjustment")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class StockAdjustment extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String adjustmentCode; // PDC-YYYYMMDD-XXX

    private String reason; // Lý do điều chỉnh: Hư hỏng, Hết hạn, Kiểm kê định kỳ...

    private String note;

    @OneToMany(mappedBy = "stockAdjustment", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<StockAdjustmentDetail> details = new ArrayList<>();
}
