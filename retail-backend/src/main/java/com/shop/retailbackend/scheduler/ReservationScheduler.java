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

    private static final String CANCELLATION_REASON =
            "Auto-cancelled: reservation expired after 6 hours";

    /**
     * Runs every 15 minutes. Cancels all RESERVED orders past their expiry,
     * restoring stock for each. The entire batch runs in one transaction.
     */
    @Scheduled(fixedRate = 900_000)
    @Transactional
    public void cancelExpiredReservations() {
        List<SaleOrder> expired = saleOrderRepository.findExpiredReservations(LocalDateTime.now());

        if (expired.isEmpty()) {
            return;
        }

        log.info("Scheduler: cancelling {} expired reservation(s)", expired.size());

        for (SaleOrder order : expired) {
            // Restore stock for every item in this order
            for (var item : order.getItems()) {
                var product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
                productRepository.save(product);
            }

            order.setStatus(SaleOrderStatus.CANCELLED);
            order.setCancellationReason(CANCELLATION_REASON);
            saleOrderRepository.save(order);

            log.debug("Auto-cancelled reservation orderId={}", order.getId());
        }
    }
}
