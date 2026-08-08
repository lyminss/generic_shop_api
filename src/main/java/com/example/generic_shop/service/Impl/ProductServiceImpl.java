package com.example.generic_shop.service.Impl;

import com.example.generic_shop.entity.Product;
import com.example.generic_shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

import com.example.generic_shop.service.ProductService;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;

    //Get all
    @Override
    public List<Product> getAll(){
        return productRepository.findAll();
    }

    //Get by id
    @Override
    public Product getById(Long id){
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found" +id));
    }

    //Create
    @Override
    public Product createProduct(Product product){
        if (product.getName() == null || product.getName().isEmpty()){
            throw new RuntimeException("Product name is required");
        }
        if (product.getPrice() <= 0) {
            throw new RuntimeException("Product price must be greater than 0");
        }
        if (product.getStockQuantity() < 0) {
            throw new RuntimeException("Stock quantity must not be negative");
        }
        return productRepository.save(product);
    }

    //update
    @Override
    public Product updateProduct(Long id, Product request){
        Product product = getById(id);

        if (request.getName() == null || request.getName().isEmpty()) {
            throw new RuntimeException("Product name is required");
        }
        if (request.getPrice() <= 0) {
            throw new RuntimeException("Product price must be greater than 0");
        }
        if (request.getStockQuantity() < 0) {
            throw new RuntimeException("Stock quantity must not be negative");
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImage(request.getImage());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());

        return productRepository.save(product);
    }

    //delete
    @Override
    public void deleteProduct(Long id){
        Product product = getById(id);
        productRepository.delete(product);
    }

}
