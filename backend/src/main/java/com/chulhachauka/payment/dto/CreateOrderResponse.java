package com.chulhachauka.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record CreateOrderResponse(
    @JsonProperty("order_id")
    String orderId,

    long amount,

    String currency,

    @JsonProperty("key_id")
    String keyId
) {}
