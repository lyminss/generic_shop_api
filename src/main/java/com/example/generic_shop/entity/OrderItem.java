package com.example.generic_shop.entity;


import com.example.generic_shop.enums.ItemPreparedStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name = "tbl_order_item")
public class OrderItem extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "order_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Order order;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private int quantity;
    private double price;

    @Enumerated(EnumType.STRING)
    @Column(name = "prepared_status")
    private ItemPreparedStatus preparedStatus = ItemPreparedStatus.PENDING;
}

