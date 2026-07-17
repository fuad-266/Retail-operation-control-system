package com.shop.retailbackend.repository;

import com.shop.retailbackend.entity.SaleOrder;
import com.shop.retailbackend.entity.SaleOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SaleOrderRepository extends JpaRepository<SaleOrder, UUID> {

    List<SaleOrder> findAllBySellerId(UUID sellerId);

    List<SaleOrder> findAllByStatus(SaleOrderStatus status);

    @Query("SELECT o FROM SaleOrder o WHERE o.status = 'RESERVED' AND o.reservationExpiresAt < :now")
    List<SaleOrder> findExpiredReservations(@Param("now") LocalDateTime now);
}
