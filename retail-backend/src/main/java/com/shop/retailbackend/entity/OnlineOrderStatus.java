package com.shop.retailbackend.entity;

public enum OnlineOrderStatus {
    PENDING_PAYMENT,
    MESSENGER_PENDING, // Cash-via-messenger: waiting for physical delivery to shop
    SCREENSHOT_SUBMITTED,
    PAYMENT_REJECTED,
    PAID,
    PROCESSING,
    READY,
    DELIVERED,
    CANCELLED
}
