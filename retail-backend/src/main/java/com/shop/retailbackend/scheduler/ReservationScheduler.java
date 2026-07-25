package com.shop.retailbackend.scheduler;

import com.shop.retailbackend.entity.SaleOrder;
import com.shop.retailbackend.entity.SaleOrderStatus;
import com.shop.retailbackend.repository.ProductRepository;
import com.shop.retailbackend.repository.SaleOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationScheduler {

    private final SaleOrderRepository saleOrderRepository;
    private final ProductRepository productRepository;

    private static final String CANCELLATION_REASON = "Auto-cancelled: order unpaid/unclaimed after 6 hours";

    /**
     * Runs every 15 minutes. Cancels all RESERVED and unpaid PENDING orders created
     * > 6 hours ago,
     * restoring stock if reserved. The entire batch runs in one transaction.
     */
    @Scheduled(fixedRate = 900_000)
    @Transactional
    public void cancelExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sixHoursAgo = now.minusHours(6);
        List<SaleOrder> expired = saleOrderRepository.findExpiredOrders(now, sixHoursAgo);

        if (expired.isEmpty()) {
            return;
        }

        log.info("Scheduler: cancelling {} expired/unpaid order(s)", expired.size());

        for (SaleOrder order : expired) {
            // Restore stock if it was RESERVED
            if (order.getStatus() == SaleOrderStatus.RESERVED) {
                for (var item : order.getItems()) {
                    var product = item.getProduct();
                    product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                    productRepository.save(product);
                }
            }

            order.setStatus(SaleOrderStatus.CANCELLED);
            order.setCancellationReason(CANCELLATION_REASON);
            saleOrderRepository.save(order);

            log.debug("Auto-cancelled orderId={}", order.getId());
        }
    }
}
