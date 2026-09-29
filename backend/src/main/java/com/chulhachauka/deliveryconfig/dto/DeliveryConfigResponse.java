package com.chulhachauka.deliveryconfig.dto;

import com.chulhachauka.deliveryconfig.DeliveryConfig;

public record DeliveryConfigResponse(
    long deliveryFeeRupees,
    long deliveryFeePaise,
    long minOrderRupees,
    long minOrderPaise,
    int estimatedMinutes
) {
    public static DeliveryConfigResponse from(DeliveryConfig c) {
        if (c == null) return null;
        return new DeliveryConfigResponse(
            c.getDeliveryFeePaise() / 100,
            c.getDeliveryFeePaise(),
            c.getMinOrderPaise() / 100,
            c.getMinOrderPaise(),
            c.getEstimatedMinutes()
        );
    }
}
