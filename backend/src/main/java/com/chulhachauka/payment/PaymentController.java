package com.chulhachauka.payment;

import com.chulhachauka.common.dto.ApiResponse;
import com.chulhachauka.payment.dto.CreateOrderRequest;
import com.chulhachauka.payment.dto.CreateOrderResponse;
import com.chulhachauka.payment.dto.VerifyPaymentRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final RazorpayService razorpayService;

    /**
     * Create Razorpay Order endpoint.
     * Supports both /api/create-order and /api/payments/create-order
     */
    @PostMapping({"/api/create-order", "/api/payments/create-order"})
    public ResponseEntity<ApiResponse<CreateOrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest req) {
        String currency = req.currency() != null && !req.currency().isBlank() ? req.currency().toUpperCase() : "INR";
        String orderId = razorpayService.createOrder(req.amount(), req.receipt());

        CreateOrderResponse response = new CreateOrderResponse(
                orderId,
                req.amount(),
                currency,
                razorpayService.getKeyId()
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Verify Razorpay Payment Signature endpoint.
     * Supports both /api/verify-payment and /api/payments/verify
     */
    @PostMapping({"/api/verify-payment", "/api/payments/verify"})
    public ResponseEntity<ApiResponse<String>> verifyPayment(@Valid @RequestBody VerifyPaymentRequest req) {
        paymentService.verifyAndCapture(req);
        return ResponseEntity.ok(ApiResponse.ok("Payment verified successfully"));
    }

    /**
     * Razorpay Webhook endpoint.
     */
    @PostMapping("/api/payments/webhook")
    public ResponseEntity<String> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok("OK");
    }
}
