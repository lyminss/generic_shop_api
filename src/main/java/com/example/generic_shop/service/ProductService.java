package com.example.generic_shop.service;

import com.example.generic_shop.entity.Product;
import java.util.List;
import java.util.Map;

public interface ProductService {
    List<Product> getAll();
    List<Product> getFiltered(String category, String search);
    List<String> getCategories();
    Product getById(Long id);
    Product createProduct(Product product);
    Product updateProduct(Long id, Product product);
    Product updateProductStatus(Long id, String status);

    /**
     * Smart delete:
     * - Nếu sản phẩm chưa có đơn hàng → Hard delete (xóa vĩnh viễn)
     * - Nếu đã có đơn hàng → Soft delete (status=DELETED, deleted=true)
     * @return Map với "type" = "HARD" hoặc "SOFT" để frontend biết loại xóa
     */
    Map<String, Object> deleteProduct(Long id);

    /** Kiểm tra sản phẩm có đơn hàng chưa → dùng để hiển thị cảnh báo */
    boolean hasOrders(Long productId);

    /** Lấy danh sách sản phẩm trong Thùng rác (soft deleted) */
    List<Product> getDeletedProducts();

    /** Khôi phục sản phẩm từ Thùng rác → trạng thái STOPPED */
    Product restoreProduct(Long id);

    /** Xóa vĩnh viễn sản phẩm đang trong Thùng rác */
    void hardDeleteProduct(Long id);
}
