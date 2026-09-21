package com.example.generic_shop.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDate;

@Data
public class VoucherDTO {
    private Long id;
    private String code;
    private String discountType;  // "PERCENT" | "FIXED"
    private Double discountValue;

    @JsonAlias({"minOrderAmount"})
    private Double minOrderValue;

    @JsonAlias({"maxDiscount"})
    private Double maxDiscountAmount;

    private Integer maxUsage;

    @JsonAlias({"usageCount"})
    private Integer usedCount;

    private Boolean active;

    @JsonAlias({"endDate"})
    private LocalDate expiryDate;

    private String description;

    // Computed field: giảm giá tính được (từ validate API)
    private Double computedDiscount;
    private Double rawDiscount;
    private Boolean appliedCap; // true nếu số tiền giảm bị giới hạn bởi maxDiscountAmount
    private String message;

    // Frontend compatibility getters
    @JsonProperty("maxDiscount")
    public Double getMaxDiscount() {
        return maxDiscountAmount;
    }

    @JsonProperty("minOrderAmount")
    public Double getMinOrderAmount() {
        return minOrderValue;
    }

    @JsonProperty("endDate")
    public LocalDate getEndDate() {
        return expiryDate;
    }

    @JsonProperty("usageCount")
    public Integer getUsageCount() {
        return usedCount;
    }
}
