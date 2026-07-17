package com.shop.retailbackend.repository;

import com.shop.retailbackend.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findAllByIsActiveTrue();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND p.stockQuantity <= p.minStockAlert")
    List<Product> findLowStockProducts();
}
