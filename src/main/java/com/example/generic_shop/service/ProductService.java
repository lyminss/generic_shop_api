package com.example.generic_shop.service;

import com.example.generic_shop.entity.Product;
import java.util.List;

public interface ProductService {
    List<Product> getAll();
    Product getById(Long id);
    Product createProduct(Product product);
    Product updateProduct(Long id, Product product);
    void deleteProduct(Long id);
}
