package com.shop.retailbackend.service;

import com.shop.retailbackend.dto.report.*;
import com.shop.retailbackend.entity.Product;
import com.shop.retailbackend.entity.Receipt;
import com.shop.retailbackend.entity.SaleOrder;
import com.shop.retailbackend.entity.SaleOrderStatus;
import com.shop.retailbackend.repository.ProductRepository;
import com.shop.retailbackend.repository.ReceiptRepository;
import com.shop.retailbackend.repository.SaleOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@PreAuthorize("hasRole('OWNER')")
public class ReportService {

    private final SaleOrderRepository saleOrderRepository;
    private final ReceiptRepository receiptRepository;
    private final ProductRepository productRepository;
    private final ExchangeRateService exchangeRateService;

    public SalesReportDto getSalesReport(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        List<SaleOrder> orders = saleOrderRepository.findAll().stream()
                .filter(o -> o.getStatus() == SaleOrderStatus.PAID)
                .filter(o -> o.getCreatedAt().isAfter(start) && o.getCreatedAt().isBefore(end))
                .toList();

        BigDecimal totalKes = orders.stream()
                .map(SaleOrder::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEtb = exchangeRateService.convertKesToEtb(totalKes);

        Map<LocalDate, List<SaleOrder>> byDay = orders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate()));

        List<SalesReportDto.DailySaleDto> breakdown = byDay.entrySet().stream()
                .map(e -> {
                    BigDecimal dayRevenue = e.getValue().stream()
                            .map(SaleOrder::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return SalesReportDto.DailySaleDto.builder()
                            .date(e.getKey().format(DateTimeFormatter.ISO_LOCAL_DATE))
                            .orderCount(e.getValue().size())
                            .revenueKes(dayRevenue)
                            .build();
                })
                .sorted((a, b) -> a.getDate().compareTo(b.getDate()))
                .collect(Collectors.toList());

        return SalesReportDto.builder()
                .totalOrders(orders.size())
                .totalRevenueKes(totalKes)
                .totalRevenueEtb(totalEtb)
                .breakdown(breakdown)
                .build();
    }

    public RevenueReportDto getRevenueReport(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();

        List<Receipt> receipts = receiptRepository.findAll().stream()
                .filter(r -> r.getCreatedAt().isAfter(start) && r.getCreatedAt().isBefore(end))
                .toList();

        BigDecimal totalKes = receipts.stream()
                .map(Receipt::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEtb = exchangeRateService.convertKesToEtb(totalKes);

        // Calculate COGS (only for products with buyingPrice set)
        BigDecimal cogs = BigDecimal.ZERO;
        for (Receipt receipt : receipts) {
            if (receipt.getOrder() != null) {
                for (var item : receipt.getOrder().getItems()) {
                    if (item.getProduct().getBuyingPrice() != null) {
                        cogs = cogs.add(item.getProduct().getBuyingPrice()
                                .multiply(BigDecimal.valueOf(item.getQuantity())));
                    }
                }
            } else if (receipt.getOnlineOrder() != null) {
                for (var item : receipt.getOnlineOrder().getItems()) {
                    if (item.getProduct().getBuyingPrice() != null) {
                        cogs = cogs.add(item.getProduct().getBuyingPrice()
                                .multiply(BigDecimal.valueOf(item.getQuantity())));
                    }
                }
            }
        }

        BigDecimal profit = totalKes.subtract(cogs);
        BigDecimal profitMargin = totalKes.compareTo(BigDecimal.ZERO) > 0
                ? profit.divide(totalKes, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return RevenueReportDto.builder()
                .totalRevenueKes(totalKes)
                .totalRevenueEtb(totalEtb)
                .cogs(cogs)
                .profit(profit)
                .profitMarginPercent(profitMargin)
                .build();
    }

    public List<SellerReportDto> getSellerReport() {
        List<SaleOrder> paidOrders = saleOrderRepository.findAll().stream()
                .filter(o -> o.getStatus() == SaleOrderStatus.PAID)
                .toList();

        Map<String, List<SaleOrder>> bySeller = paidOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getSeller().getId().toString()));

        return bySeller.entrySet().stream()
                .map(e -> {
                    SaleOrder first = e.getValue().get(0);
                    BigDecimal totalKes = e.getValue().stream()
                            .map(SaleOrder::getTotalAmount)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal totalEtb = exchangeRateService.convertKesToEtb(totalKes);
                    return SellerReportDto.builder()
                            .sellerId(first.getSeller().getId())
                            .sellerName(first.getSeller().getFullName())
                            .orderCount(e.getValue().size())
                            .totalRevenueKes(totalKes)
                            .totalRevenueEtb(totalEtb)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public InventoryReportDto getInventoryReport() {
        List<Product> products = productRepository.findAllByIsActiveTrue();

        List<InventoryReportDto.ProductStockDto> items = products.stream()
                .map(p -> InventoryReportDto.ProductStockDto.builder()
                        .id(p.getId().toString())
                        .name(p.getName())
                        .category(p.getCategory())
                        .stockQuantity(p.getStockQuantity())
                        .minStockAlert(p.getMinStockAlert())
                        .isLowStock(p.getStockQuantity() <= p.getMinStockAlert())
                        .build())
                .collect(Collectors.toList());

        return InventoryReportDto.builder()
                .products(items)
                .build();
    }
}
