package com.chulhachauka.order.dto;

import com.chulhachauka.order.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PlaceOrderRequest(
    @NotNull(message = "Delivery address is required")
    @Valid
    DeliveryAddressDto deliveryAddress,

    @NotNull(message = "Payment method is required")
    PaymentMethod paymentMethod,

    @Size(max = 500, message = "Special note cannot exceed 500 characters")
    String specialNote
) {}
