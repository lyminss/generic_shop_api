package com.example.generic_shop.dto;

import com.example.generic_shop.enums.ItemPreparedStatus;
import lombok.Data;

@Data
public class OrderItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String productImage;
    private int quantity;
    private double price;
    private double subtotal;
    private ItemPreparedStatus preparedStatus;
}
