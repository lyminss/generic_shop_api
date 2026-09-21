package com.example.generic_shop.entity;

import com.example.generic_shop.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "tbl_orders")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Order extends BaseEntity{
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items;

    private OrderStatus orderStatus;
    private Double totalPrice;
    private String shippingAddress;

    /** CASH (tiền mặt) | QR_TRANSFER (chuyển khoản QR) */
    private String paymentMethod;

    /** UNPAID (chưa thanh toán) | WAITING_CONFIRMATION (chờ thu ngân kiểm tra tiền) | PAID (đã thanh toán) */
    private String paymentStatus;

    /** Mã voucher đã áp dụng */
    private String voucherCode;

    /** Số tiền được giảm */
    private Double discountAmount;

    /** Tổng tiền trước khi giảm */
    private Double originalPrice;
}
