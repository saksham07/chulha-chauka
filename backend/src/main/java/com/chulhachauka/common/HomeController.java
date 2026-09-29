package com.chulhachauka.common;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> index() {
        return ResponseEntity.ok(Map.of(
            "service", "Chulha Chauka Cloud Kitchen Backend API",
            "status", "ONLINE",
            "version", "1.0.0",
            "documentation", "Welcome to Chulha Chauka API! The frontend website runs on http://localhost:5173",
            "publicEndpoints", Map.of(
                "categories", "/api/menu/categories",
                "menuItems", "/api/menu/items",
                "deliveryConfig", "/api/config/delivery",
                "login", "POST /api/auth/login",
                "register", "POST /api/auth/register"
            )
        ));
    }
}
