package com.chulhachauka.order;

import com.chulhachauka.cart.Cart;
import com.chulhachauka.cart.CartItem;
import com.chulhachauka.cart.CartRepository;
import com.chulhachauka.cart.CartService;
import com.chulhachauka.common.exception.BusinessException;
import com.chulhachauka.common.exception.ResourceNotFoundException;
import com.chulhachauka.deliveryconfig.DeliveryConfigService;
import com.chulhachauka.deliveryconfig.dto.DeliveryConfigResponse;
import com.chulhachauka.menu.MenuItem;
import com.chulhachauka.menu.MenuItemRepository;
import com.chulhachauka.order.dto.OrderResponse;
import com.chulhachauka.order.dto.PlaceOrderRequest;
import com.chulhachauka.payment.Payment;
import com.chulhachauka.payment.PaymentRepository;
import com.chulhachauka.payment.PaymentStatus;
import com.chulhachauka.payment.RazorpayService;
import com.chulhachauka.user.User;
import com.chulhachauka.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartService cartService;
    private final MenuItemRepository menuItemRepository;
    private final DeliveryConfigService deliveryConfigService;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final RazorpayService razorpayService;
    private final ObjectMapper objectMapper;

    @Value("${razorpay.key-id:}")
    private String razorpayKeyId;

    public OrderResponse placeOrder(Long userId, PlaceOrderRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Cart is empty. Add items before checking out."));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BusinessException("Cart is empty. Add items before checking out.");
        }

        DeliveryConfigResponse config = deliveryConfigService.getConfig();

        // 1. Recompute authoritative pricing from the database (never trust client amounts)
        long subtotalPaise = 0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem ci : cart.getItems()) {
            MenuItem freshItem = menuItemRepository.findById(ci.getMenuItem().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item no longer exists: " + ci.getMenuItem().getName()));

            if (!freshItem.isAvailable()) {
                throw new BusinessException("Item '" + freshItem.getName() + "' is currently sold out.");
            }

            long itemTotalPaise = freshItem.getPricePaise() * ci.getQuantity();
            subtotalPaise += itemTotalPaise;

            OrderItem orderItem = OrderItem.builder()
                    .menuItem(freshItem)
                    .nameSnapshot(freshItem.getName())
                    .priceSnapshot(freshItem.getPricePaise())
                    .quantity(ci.getQuantity())
                    .build();

            orderItems.add(orderItem);
        }

        if (subtotalPaise < config.minOrderPaise()) {
            throw new BusinessException("Minimum order amount is ₹" + (config.minOrderPaise() / 100));
        }

        long deliveryFeePaise = config.deliveryFeePaise();
        long totalPaise = subtotalPaise + deliveryFeePaise;

        // 2. Serialize address snapshot
        String addressJson;
        try {
            addressJson = objectMapper.writeValueAsString(req.deliveryAddress());
        } catch (Exception e) {
            throw new BusinessException("Failed to process delivery address");
        }

        // 3. Create initial Order
        OrderStatus initialStatus = (req.paymentMethod() == PaymentMethod.COD)
                ? OrderStatus.CONFIRMED
                : OrderStatus.PENDING;

        Order order = Order.builder()
                .user(user)
                .addressSnapshot(addressJson)
                .status(initialStatus)
                .subtotalPaise(subtotalPaise)
                .deliveryFeePaise(deliveryFeePaise)
                .totalPaise(totalPaise)
                .paymentMethod(req.paymentMethod())
                .specialNote(req.specialNote())
                .build();

        for (OrderItem oi : orderItems) {
            oi.setOrder(order);
        }
        order.setItems(orderItems);

        Order savedOrder = orderRepository.save(order);
        log.info("Created Order ID {} for User {}", savedOrder.getId(), userId);

        // 4. Create Payment record & Razorpay order if online
        String razorpayOrderId = null;
        if (req.paymentMethod() == PaymentMethod.COD) {
            Payment codPayment = Payment.builder()
                    .order(savedOrder)
                    .amountPaise(totalPaise)
                    .status(PaymentStatus.CREATED)
                    .method("COD")
                    .build();
            paymentRepository.save(codPayment);
        } else {
            razorpayOrderId = razorpayService.createOrder(totalPaise, "order_" + savedOrder.getId());
            Payment payment = Payment.builder()
                    .order(savedOrder)
                    .razorpayOrderId(razorpayOrderId)
                    .amountPaise(totalPaise)
                    .status(PaymentStatus.CREATED)
                    .method(req.paymentMethod().name())
                    .build();
            paymentRepository.save(payment);
        }

        // 5. Clear cart
        cartService.clearCart(userId);

        return OrderResponse.from(savedOrder, razorpayOrderId, razorpayKeyId);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getMyOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new BusinessException("Access denied: You do not own this order.");
        }

        return OrderResponse.from(order);
    }

    public OrderResponse cancelMyOrder(Long userId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));

        if (!order.getUser().getId().equals(userId)) {
            throw new BusinessException("Access denied: You do not own this order.");
        }

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException("Order cannot be cancelled because kitchen has already started preparing it.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order updated = orderRepository.save(order);
        log.info("User {} cancelled Order ID {}", userId, orderId);
        return OrderResponse.from(updated);
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));
        return OrderResponse.from(order);
    }

    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + orderId));

        if (newStatus == OrderStatus.CANCELLED) {
            if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
                throw new BusinessException("Orders in status " + order.getStatus() + " cannot be cancelled.");
            }
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        log.info("Order ID {} status transitioned to {}", orderId, newStatus);
        return OrderResponse.from(updated);
    }

    @Transactional(readOnly = true)
    public Page<OrderResponse> getAllOrders(OrderStatus status, int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        if (status != null) {
            return orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                    .map(OrderResponse::from);
        }
        return orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(OrderResponse::from);
    }
}
