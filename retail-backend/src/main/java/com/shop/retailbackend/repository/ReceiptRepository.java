package com.shop.retailbackend.repository;

import com.shop.retailbackend.entity.Receipt;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {

        // Only fetch-join confirmedBy to fix null cashier name bug.
        // Both getTodayReceipts() and getReceipt() are @Transactional, so the Hibernate
        // session stays open and lazy associations (order.items, etc.) load fine inside
        // toDto().
        // We deliberately do NOT join-fetch both o.items and oo.items together — that
        // would
        // cause org.hibernate.loader.MultipleBagFetchException (two List bags in one
        // query).
        @Query("""
                        SELECT r FROM Receipt r
                        JOIN FETCH r.confirmedBy
                        WHERE r.receiptNumber = :receiptNumber
                        """)
        Optional<Receipt> findByReceiptNumber(@Param("receiptNumber") String receiptNumber);

        boolean existsByOrderId(UUID orderId);

        boolean existsByOnlineOrderId(UUID onlineOrderId);

        /**
         * Counts receipts created on a given calendar day.
         * Used with a pessimistic write lock to generate unique sequential numbers.
         */
        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT COUNT(r) FROM Receipt r WHERE CAST(r.createdAt AS date) = :date")
        long countByCreatedAtDate(@Param("date") LocalDate date);

        @Query("""
                        SELECT r FROM Receipt r
                        JOIN FETCH r.confirmedBy
                        WHERE CAST(r.createdAt AS date) = :date
                        ORDER BY r.createdAt DESC
                        """)
        List<Receipt> findByCreatedAtDateOrderByCreatedAtDesc(@Param("date") LocalDate date);
}
