package com.chulhachauka.payment.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public record VerifyPaymentRequest(
    @NotBlank(message = "Razorpay order ID is required")
    @JsonAlias({"razorpay_order_id", "order_id", "orderId"})
    String razorpayOrderId,

    @NotBlank(message = "Razorpay payment ID is required")
    @JsonAlias({"razorpay_payment_id", "payment_id", "paymentId"})
    String razorpayPaymentId,

    @NotBlank(message = "Razorpay signature is required")
    @JsonAlias({"razorpay_signature", "signature"})
    String razorpaySignature
) {}
