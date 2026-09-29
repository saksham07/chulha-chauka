package com.chulhachauka.cart.dto;

import java.util.List;

public record CartResponse(
    List<CartItemResponse> items,
    long subtotal,
    long deliveryFee,
    long total,
    int estimatedMinutes,
    boolean isEmpty
) {}
