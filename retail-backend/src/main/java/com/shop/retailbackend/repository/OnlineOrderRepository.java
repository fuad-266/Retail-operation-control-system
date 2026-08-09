package com.shop.retailbackend.repository;

import com.shop.retailbackend.entity.OnlineOrder;
import com.shop.retailbackend.entity.OnlineOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OnlineOrderRepository extends JpaRepository<OnlineOrder, UUID> {

    @Query("SELECT DISTINCT o FROM OnlineOrder o " +
           "LEFT JOIN FETCH o.customer " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product " +
           "WHERE o.customer.id = :customerId " +
           "ORDER BY o.createdAt DESC")
    List<OnlineOrder> findAllByCustomerId(@Param("customerId") UUID customerId);

    @Query("SELECT DISTINCT o FROM OnlineOrder o " +
           "LEFT JOIN FETCH o.customer " +
           "LEFT JOIN FETCH o.items i " +
           "LEFT JOIN FETCH i.product " +
           "WHERE o.status = :status " +
           "ORDER BY o.createdAt DESC")
    List<OnlineOrder> findAllByStatus(@Param("status") OnlineOrderStatus status);
}
