package com.example.generic_shop.service.Impl;

import com.example.generic_shop.entity.Product;
import com.example.generic_shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl {
    private final ProductRepository productRepository;

    //Get all
    public List<Product> getAll(){
        return productRepository.findAll();
    }

    //Get by id
    public Product getById(Long id){
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found" +id));
    }

    //Create
    public Product createProduct(Product product){
        if (product.getName() == null || product.getName().isEmpty()){
            throw new RuntimeException("Product name is required");
        }
        return productRepository.save(product);
    }

    //update
    public Product updateProduct(Long id, Product request){
        Product product = getById(id);

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setImage(request.getImage());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());

        return productRepository.save(product);
    }

    //delete
    public void deleteProduct(Long id){
        Product product = getById(id);
        productRepository.delete(product);
    }

}
