package com.chulhachauka.payment;

import com.chulhachauka.common.exception.BusinessException;
import com.chulhachauka.common.exception.PaymentVerificationException;
import com.chulhachauka.common.exception.ResourceNotFoundException;
import com.chulhachauka.order.Order;
import com.chulhachauka.order.OrderRepository;
import com.chulhachauka.order.OrderStatus;
import com.chulhachauka.payment.dto.VerifyPaymentRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final RazorpayService razorpayService;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.webhook-secret:}")
    private String webhookSecret;

    public void verifyAndCapture(VerifyPaymentRequest req) {
        boolean valid = razorpayService.verifySignature(
                req.razorpayOrderId(),
                req.razorpayPaymentId(),
                req.razorpaySignature()
        );

        if (!valid) {
            log.error("Signature verification failed for Razorpay order ID {}", req.razorpayOrderId());
            throw new PaymentVerificationException("Razorpay signature mismatch");
        }

        paymentRepository.findByRazorpayOrderId(req.razorpayOrderId()).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.CAPTURED) {
                log.info("Payment for order {} is already CAPTURED (idempotent).", payment.getOrder().getId());
                return;
            }

            payment.setRazorpayPaymentId(req.razorpayPaymentId());
            payment.setRazorpaySignature(req.razorpaySignature());
            payment.setStatus(PaymentStatus.CAPTURED);
            paymentRepository.save(payment);

            Order order = payment.getOrder();
            if (order != null) {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
                log.info("Payment captured and Order {} CONFIRMED via Razorpay payment ID {}", order.getId(), req.razorpayPaymentId());
            }
        });
    }

    public void handleWebhook(String payload, String signature) {
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            boolean valid = razorpayService.verifyWebhookSignature(payload, signature, webhookSecret);
            if (!valid) {
                log.warn("Invalid webhook signature received from Razorpay");
                throw new BusinessException("Invalid webhook signature");
            }
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            String event = root.path("event").asText();
            log.info("Received Razorpay webhook event: {}", event);

            JsonNode paymentEntity = root.path("payload").path("payment").path("entity");
            String razorpayOrderId = paymentEntity.path("order_id").asText();
            String razorpayPaymentId = paymentEntity.path("id").asText();

            if ("payment.captured".equals(event) || "order.paid".equals(event)) {
                paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
                    if (payment.getStatus() != PaymentStatus.CAPTURED) {
                        payment.setRazorpayPaymentId(razorpayPaymentId);
                        payment.setStatus(PaymentStatus.CAPTURED);
                        paymentRepository.save(payment);

                        Order order = payment.getOrder();
                        order.setStatus(OrderStatus.CONFIRMED);
                        orderRepository.save(order);
                        log.info("Webhook marked Order {} as CONFIRMED", order.getId());
                    }
                });
            } else if ("payment.failed".equals(event)) {
                paymentRepository.findByRazorpayOrderId(razorpayOrderId).ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                    log.warn("Webhook marked payment for Order {} as FAILED", payment.getOrder().getId());
                });
            }
        } catch (Exception e) {
            log.error("Failed to parse or process Razorpay webhook: {}", e.getMessage(), e);
        }
    }
}
