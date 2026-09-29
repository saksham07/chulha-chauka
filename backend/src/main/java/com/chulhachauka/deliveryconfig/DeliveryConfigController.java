package com.chulhachauka.deliveryconfig;

import com.chulhachauka.common.dto.ApiResponse;
import com.chulhachauka.deliveryconfig.dto.DeliveryConfigResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class DeliveryConfigController {

    private final DeliveryConfigService deliveryConfigService;

    @GetMapping("/api/config/delivery")
    public ResponseEntity<ApiResponse<DeliveryConfigResponse>> getDeliveryConfig() {
        return ResponseEntity.ok(ApiResponse.ok(deliveryConfigService.getConfig()));
    }

    @PutMapping("/api/admin/config/delivery")
    public ResponseEntity<ApiResponse<DeliveryConfigResponse>> updateDeliveryConfig(
            @RequestParam long deliveryFeePaise,
            @RequestParam(defaultValue = "0") long minOrderPaise,
            @RequestParam(defaultValue = "40") int estimatedMinutes
    ) {
        return ResponseEntity.ok(ApiResponse.ok(
                deliveryConfigService.updateConfig(deliveryFeePaise, minOrderPaise, estimatedMinutes)
        ));
    }
}
