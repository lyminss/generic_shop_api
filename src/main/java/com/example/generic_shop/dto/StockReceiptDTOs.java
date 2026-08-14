package com.example.generic_shop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class StockReceiptDTOs {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ReceiptItemInput {
        private Long ingredientId;
        private Double quantity;
        private Double unitPrice;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CreateStockReceiptRequest {
        private String supplier;
        private String note;
        private List<ReceiptItemInput> items;
    }
}
