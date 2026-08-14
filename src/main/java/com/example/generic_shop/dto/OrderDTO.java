package com.example.generic_shop.dto;

import com.example.generic_shop.enums.OrderStatus;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class OrderDTO {
    private Long id;
    private OrderStatus orderStatus;
    private Double totalPrice;
    private String shippingAddress;
    private Date createdAt;
    private Date updatedAt;
    private List<OrderItemDTO> items;
}
