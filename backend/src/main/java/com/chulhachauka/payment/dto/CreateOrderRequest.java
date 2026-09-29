package com.chulhachauka.payment.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Min;

public record CreateOrderRequest(
    @Min(value = 100, message = "Amount must be at least 100 paise (₹1)")
    @JsonAlias({"amount_paise", "amountPaise"})
    long amount,

    String currency,

    String receipt
) {}
