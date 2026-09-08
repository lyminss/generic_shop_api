package com.example.generic_shop.repository;

import com.example.generic_shop.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    List<Category> findAllByOrderByDisplayOrderAscIdAsc();

    List<Category> findByActiveTrueOrderByDisplayOrderAscIdAsc();
}
