package com.example.generic_shop.dto;

import lombok.Data;
import java.util.List;

@Data
public class PosOrderRequest {
    private String shippingAddress;
    private String customerName;
    private String note;
    private List<PosOrderItemDTO> items;

    @Data
    public static class PosOrderItemDTO {
        private Long productId;
        private Integer quantity;
    }
}
