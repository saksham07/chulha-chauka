package com.chulhachauka.order.dto;

import com.chulhachauka.order.Order;
import com.chulhachauka.order.OrderStatus;
import com.chulhachauka.order.PaymentMethod;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public record OrderResponse(
    Long orderId,
    OrderStatus status,
    List<OrderItemResponse> items,
    Map<String, Object> deliveryAddress,
    long subtotal,
    long deliveryFee,
    long total,
    long subtotalPaise,
    long deliveryFeePaise,
    long totalPaise,
    PaymentMethod paymentMethod,
    String specialNote,
    OffsetDateTime createdAt,
    String razorpayOrderId,
    String razorpayKeyId
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static OrderResponse from(Order o) {
        return from(o, null, null);
    }

    public static OrderResponse from(Order o, String razorpayOrderId, String razorpayKeyId) {
        if (o == null) return null;

        Map<String, Object> addressMap;
        try {
            addressMap = MAPPER.readValue(o.getAddressSnapshot(), new TypeReference<>() {});
        } catch (Exception e) {
            addressMap = Collections.emptyMap();
        }

        List<OrderItemResponse> itemResponses = o.getItems() != null
                ? o.getItems().stream().map(OrderItemResponse::from).toList()
                : Collections.emptyList();

        return new OrderResponse(
            o.getId(),
            o.getStatus(),
            itemResponses,
            addressMap,
            o.getSubtotalPaise() / 100,
            o.getDeliveryFeePaise() / 100,
            o.getTotalPaise() / 100,
            o.getSubtotalPaise(),
            o.getDeliveryFeePaise(),
            o.getTotalPaise(),
            o.getPaymentMethod(),
            o.getSpecialNote(),
            o.getCreatedAt(),
            razorpayOrderId,
            razorpayKeyId
        );
    }
}
