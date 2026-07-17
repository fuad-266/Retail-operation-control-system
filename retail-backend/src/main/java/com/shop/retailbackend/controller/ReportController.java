package com.shop.retailbackend.controller;

import com.shop.retailbackend.dto.report.*;
import com.shop.retailbackend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/sales")
    public ResponseEntity<SalesReportDto> salesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getSalesReport(from, to));
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueReportDto> revenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(reportService.getRevenueReport(from, to));
    }

    @GetMapping("/sellers")
    public ResponseEntity<List<SellerReportDto>> sellerReport() {
        return ResponseEntity.ok(reportService.getSellerReport());
    }

    @GetMapping("/inventory")
    public ResponseEntity<InventoryReportDto> inventoryReport() {
        return ResponseEntity.ok(reportService.getInventoryReport());
    }
}
