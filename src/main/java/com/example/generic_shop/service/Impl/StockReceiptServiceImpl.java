package com.example.generic_shop.service.Impl;

import com.example.generic_shop.dto.StockReceiptDTOs;
import com.example.generic_shop.entity.Ingredient;
import com.example.generic_shop.entity.InventoryTransaction;
import com.example.generic_shop.entity.StockReceipt;
import com.example.generic_shop.entity.StockReceiptDetail;
import com.example.generic_shop.enums.InventoryTransactionType;
import com.example.generic_shop.repository.IngredientRepository;
import com.example.generic_shop.repository.InventoryTransactionRepository;
import com.example.generic_shop.repository.StockReceiptRepository;
import com.example.generic_shop.service.StockReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockReceiptServiceImpl implements StockReceiptService {

    private final StockReceiptRepository stockReceiptRepository;
    private final IngredientRepository ingredientRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    @Transactional
    @Override
    public StockReceipt createStockReceipt(StockReceiptDTOs.CreateStockReceiptRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Phiếu nhập kho phải có ít nhất 1 mặt hàng nguyên liệu");
        }

        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String receiptCode = "PNK-" + timeStamp;

        StockReceipt receipt = new StockReceipt();
        receipt.setReceiptCode(receiptCode);
        receipt.setSupplier(request.getSupplier());
        receipt.setNote(request.getNote());

        double totalAmount = 0.0;
        List<StockReceiptDetail> details = new ArrayList<>();

        for (StockReceiptDTOs.ReceiptItemInput itemInput : request.getItems()) {
            Ingredient ingredient = ingredientRepository.findById(itemInput.getIngredientId())
                    .orElseThrow(() -> new RuntimeException("Nguyên liệu không tồn tại ID: " + itemInput.getIngredientId()));

            double qty = itemInput.getQuantity();
            double unitPrice = itemInput.getUnitPrice() != null ? itemInput.getUnitPrice() : 0.0;
            double totalPrice = qty * unitPrice;
            totalAmount += totalPrice;

            double stockBefore = ingredient.getCurrentStock();
            double stockAfter = stockBefore + qty;

            // Tính giá vốn trung bình gia quyền (Weighted average cost)
            if (stockAfter > 0 && unitPrice > 0) {
                double newAvgCost = ((ingredient.getCostPrice() * stockBefore) + (unitPrice * qty)) / stockAfter;
                ingredient.setCostPrice(newAvgCost);
            }
            ingredient.setCurrentStock(stockAfter);
            ingredientRepository.save(ingredient);

            StockReceiptDetail detail = new StockReceiptDetail();
            detail.setStockReceipt(receipt);
            detail.setIngredient(ingredient);
            detail.setQuantity(qty);
            detail.setUnitPrice(unitPrice);
            detail.setTotalPrice(totalPrice);
            details.add(detail);

            // Ghi nhận nhật ký biến động kho
            InventoryTransaction log = new InventoryTransaction();
            log.setIngredient(ingredient);
            log.setType(InventoryTransactionType.IMPORT);
            log.setQuantity(qty);
            log.setStockBefore(stockBefore);
            log.setStockAfter(stockAfter);
            log.setReferenceCode(receiptCode);
            log.setNote("Nhập kho từ NCC: " + (request.getSupplier() != null ? request.getSupplier() : "Không rõ"));
            inventoryTransactionRepository.save(log);
        }

        receipt.setDetails(details);
        receipt.setTotalAmount(totalAmount);

        return stockReceiptRepository.save(receipt);
    }

    @Override
    public List<StockReceipt> getAllStockReceipts() {
        return stockReceiptRepository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public StockReceipt getStockReceiptById(Long id) {
        return stockReceiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu nhập kho ID: " + id));
    }
}
