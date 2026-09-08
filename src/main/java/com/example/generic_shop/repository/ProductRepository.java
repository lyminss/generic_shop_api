package com.example.generic_shop.repository;

import com.example.generic_shop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByName(String name);

    /** Lấy tất cả sản phẩm chưa bị xóa mềm */
    List<Product> findByDeletedFalse();

    /** Lấy sản phẩm đang ở Thùng rác (soft deleted) */
    List<Product> findByDeletedTrue();

    /** Lọc sản phẩm chưa xóa theo category & search */
    @Query("SELECT p FROM Product p WHERE p.deleted = false AND " +
            "(:category IS NULL OR :category = '' OR p.category = :category) AND " +
            "(:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> findFiltered(@Param("category") String category, @Param("search") String search);

    List<Product> findByCategoryIgnoreCaseAndDeletedFalse(String category);

    /** Kiểm tra sản phẩm đã từng có trong đơn hàng chưa */
    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.product.id = :productId")
    long countOrderItemsByProductId(@Param("productId") Long productId);
}
