package com.example.generic_shop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class StockAdjustmentDTOs {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AdjustmentItemInput {
        private Long ingredientId;
        private Double actualStock; // Số lượng tồn kiểm kê thực tế
        private String note;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateStockAdjustmentRequest {
        private String reason; // Lý do: Hư hỏng, Hết hạn, Kiểm kê định kỳ...
        private String note;
        private List<AdjustmentItemInput> items;
    }
}
