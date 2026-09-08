package com.example.generic_shop.service;

import com.example.generic_shop.dto.CategoryDTOs;
import com.example.generic_shop.entity.Category;

import java.util.List;

public interface CategoryService {
    List<CategoryDTOs.CategoryResponse> getAllCategories();
    List<CategoryDTOs.CategoryResponse> getActiveCategories();
    Category getById(Long id);
    CategoryDTOs.CategoryResponse createCategory(CategoryDTOs.CategoryRequest request);
    CategoryDTOs.CategoryResponse updateCategory(Long id, CategoryDTOs.CategoryRequest request);
    CategoryDTOs.StatusToggleResponse setCategoryActive(Long id, boolean active);
    CategoryDTOs.StatusToggleResponse toggleCategoryActive(Long id);
    void deleteCategory(Long id);
}
