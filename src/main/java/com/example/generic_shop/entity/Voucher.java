package com.example.generic_shop.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "tbl_voucher")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Voucher extends BaseEntity {

    /** Mã coupon (duy nhất, in hoa) */
    @Column(unique = true, nullable = false)
    private String code;

    /** PERCENT (giảm %) hoặc FIXED (giảm số tiền cố định) */
    @Column(nullable = false)
    private String discountType; // "PERCENT" | "FIXED"

    /** Giá trị giảm: % (0–100) hoặc số tiền VND */
    @Column(nullable = false)
    private Double discountValue;

    /** Giá trị đơn tối thiểu để áp dụng (null = không giới hạn) */
    private Double minOrderValue;

    /** Giảm tối đa (VND) - chỉ áp dụng với PERCENT, null = không giới hạn */
    private Double maxDiscountAmount;

    /** Số lần sử dụng tối đa (null = không giới hạn) */
    private Integer maxUsage;

    /** Số lần đã dùng */
    @Column(nullable = false)
    private Integer usedCount = 0;

    /** Trạng thái kích hoạt */
    @Column(nullable = false)
    private Boolean active = true;

    /** Ngày hết hạn (null = không hết hạn) */
    private LocalDate expiryDate;

    /** Mô tả nội bộ */
    private String description;
}
