package com.example.generic_shop.repository;

import com.example.generic_shop.entity.Order;
import com.example.generic_shop.entity.Product;
import com.example.generic_shop.entity.User;
import com.example.generic_shop.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomer(User user);

    List<Order> findByCustomerOrderByCreatedAtDesc(User user);

    /**
     * Kiểm tra xem user đã từng mua và hoàn tất đơn hàng có chứa sản phẩm này chưa.
     * Dùng để xác thực quyền đánh giá sản phẩm.
     */
    @Query("SELECT COUNT(o) > 0 FROM Order o JOIN o.items i " +
           "WHERE o.customer = :user AND i.product = :product AND o.orderStatus = :status")
    boolean existsByCustomerAndItemsProductAndOrderStatus(
            @Param("user") User user,
            @Param("product") Product product,
            @Param("status") OrderStatus status);
}
