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

    @Query("SELECT p FROM Product p WHERE " +
            "(:category IS NULL OR :category = '' OR p.category = :category) AND " +
            "(:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> findFiltered(@Param("category") String category, @Param("search") String search);

    List<Product> findByCategoryIgnoreCase(String category);
}
