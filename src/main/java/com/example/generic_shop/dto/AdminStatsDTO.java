package com.example.generic_shop.dto;

import lombok.Data;

import java.util.List;

@Data
public class AdminStatsDTO {
    private double totalRevenue;
    private long totalOrders;
    private long totalProducts;
    private long totalUsers;
    
    private long newOrdersCount;
    private long processingOrdersCount;
    private long shippingOrdersCount;
    private long completedOrdersCount;
    private long cancelledOrdersCount;
    
    private List<OrderDTO> recentOrders;
}
