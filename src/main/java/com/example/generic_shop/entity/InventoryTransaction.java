package com.example.generic_shop.entity;

import com.example.generic_shop.enums.InventoryTransactionType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.*;

@Entity
@Table(name = "tbl_inventory_transaction")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InventoryTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InventoryTransactionType type; // IMPORT, EXPORT_PREPARATION, ADJUSTMENT, RETURN

    @Column(nullable = false)
    private Double quantity; // Số lượng biến động (Dương là tăng, Âm là giảm)

    private Double stockBefore;

    private Double stockAfter;

    private String referenceCode; // Mã phiếu nhập / Mã phiếu kiểm kê / Mã đơn hàng

    private String note;
}
