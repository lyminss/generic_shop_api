package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.StockAdjustmentDTOs;
import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.entity.InventoryTransaction;
import com.example.generic_shop.entity.StockAdjustment;
import com.example.generic_shop.entity.StockAdjustmentDetail;
import com.example.generic_shop.enums.InventoryTransactionType;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.InventoryTransactionRepository;
import com.example.generic_shop.repository.StockAdjustmentRepository;
import com.example.generic_shop.service.StockAdjustmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockAdjustmentServiceImpl implements StockAdjustmentService {

    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Transactional
    @Override
    public StockAdjustment createStockAdjustment(StockAdjustmentDTOs.CreateStockAdjustmentRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Phiếu điều chỉnh kho phải chứa ít nhất 1 dòng nguyên liệu");
        }

        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String adjustmentCode = "PDC-" + timeStamp;

        StockAdjustment adjustment = new StockAdjustment();
        adjustment.setAdjustmentCode(adjustmentCode);
        adjustment.setReason(request.getReason());
        adjustment.setNote(request.getNote());

        List<StockAdjustmentDetail> details = new ArrayList<>();

        for (StockAdjustmentDTOs.AdjustmentItemInput itemInput : request.getItems()) {
            Ingredient ingredient = ingredientRepository.findById(itemInput.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Nguyên liệu không tồn tại ID: " + itemInput.getIngredientId()));

            double systemStock = ingredient.getCurrentStock();
            double actualStock = itemInput.getActualStock() != null ? itemInput.getActualStock() : 0.0;
            double diff = actualStock - systemStock;

            // Cập nhật tồn thực tế
            ingredient.setCurrentStock(actualStock);
            ingredientRepository.save(ingredient);

            StockAdjustmentDetail detail = new StockAdjustmentDetail();
            detail.setStockAdjustment(adjustment);
            detail.setIngredient(ingredient);
            detail.setSystemStock(systemStock);
            detail.setActualStock(actualStock);
            detail.setAdjustmentQuantity(diff);
            detail.setNote(itemInput.getNote());
            details.add(detail);

            // Ghi nhận lịch sử biến động kho
            InventoryTransaction log = new InventoryTransaction();
            log.setIngredient(ingredient);
            log.setType(InventoryTransactionType.ADJUSTMENT);
            log.setQuantity(diff);
            log.setStockBefore(systemStock);
            log.setStockAfter(actualStock);
            log.setReferenceCode(adjustmentCode);
            log.setNote("Kiểm kê kho - Lý do: " + (request.getReason() != null ? request.getReason() : "Điều chỉnh"));
            inventoryTransactionRepository.save(log);
        }

        adjustment.setDetails(details);
        return stockAdjustmentRepository.save(adjustment);
    }

    @Override
    public List<StockAdjustment> getAllStockAdjustments() {
        return stockAdjustmentRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public StockAdjustment getStockAdjustmentById(Long id) {
        return stockAdjustmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu điều chỉnh kho ID: " + id));
    }
}
