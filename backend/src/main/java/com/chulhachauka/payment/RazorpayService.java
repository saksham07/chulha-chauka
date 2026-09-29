package com.chulhachauka.payment;

import com.chulhachauka.common.exception.BusinessException;
import com.chulhachauka.common.util.HmacUtil;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.util.UUID;

@Slf4j
@Service
public class RazorpayService {

    private final String keyId;
    private final String keySecret;

    public RazorpayService(
            @Value("${razorpay.key-id:}") String keyId,
            @Value("${razorpay.key-secret:}") String keySecret
    ) {
        this.keyId = keyId;
        this.keySecret = keySecret;
    }

    public String createOrder(long amountPaise, String receiptId) {
        if (keyId == null || keyId.isBlank() || keyId.startsWith("rzp_test_your_key") || keySecret == null || keySecret.isBlank()) {
            log.warn("Razorpay credentials not configured. Generating mock order ID for development.");
            return "order_mock_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        }

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", receiptId);
            orderRequest.put("payment_capture", 1);

            com.razorpay.Order order = client.orders.create(orderRequest);
            return order.get("id");
        } catch (RazorpayException e) {
            log.error("Error creating Razorpay order: {}", e.getMessage(), e);
            throw new BusinessException("Failed to initiate payment gateway order: " + e.getMessage());
        }
    }

    public boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String signature) {
        if (keySecret == null || keySecret.isBlank()) {
            log.warn("Razorpay key secret not configured; bypassing signature check in mock mode.");
            return true;
        }

        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        String expectedSignature = HmacUtil.hmacSha256Hex(keySecret, payload);

        return MessageDigest.isEqual(
                expectedSignature.getBytes(),
                signature.getBytes()
        );
    }

    public boolean verifyWebhookSignature(String payload, String signature, String webhookSecret) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Razorpay webhook secret not configured.");
            return false;
        }

        String expectedSignature = HmacUtil.hmacSha256Hex(webhookSecret, payload);
        return MessageDigest.isEqual(
                expectedSignature.getBytes(),
                signature.getBytes()
        );
    }
}
