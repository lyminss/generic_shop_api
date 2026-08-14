package com.example.generic_shop.repository;

import com.example.generic_shop.entity.StockReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockReceiptRepository extends JpaRepository<StockReceipt, Long> {
    Optional<StockReceipt> findByReceiptCode(String receiptCode);
    List<StockReceipt> findAllByOrderByCreatedAtDesc();
}
