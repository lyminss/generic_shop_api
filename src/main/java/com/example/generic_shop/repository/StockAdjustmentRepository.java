package com.example.generic_shop.repository;

import com.example.generic_shop.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {
    Optional<StockAdjustment> findByAdjustmentCode(String adjustmentCode);
    List<StockAdjustment> findAllByOrderByCreatedAtDesc();
}
