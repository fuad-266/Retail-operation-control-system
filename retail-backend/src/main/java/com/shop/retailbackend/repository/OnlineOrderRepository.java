package com.shop.retailbackend.repository;

import com.shop.retailbackend.entity.OnlineOrder;
import com.shop.retailbackend.entity.OnlineOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OnlineOrderRepository extends JpaRepository<OnlineOrder, UUID> {

    List<OnlineOrder> findAllByCustomerId(UUID customerId);

    List<OnlineOrder> findAllByStatus(OnlineOrderStatus status);
}
