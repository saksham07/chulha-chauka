package com.chulhachauka.admin;

import com.chulhachauka.common.dto.ApiResponse;
import com.chulhachauka.common.exception.ResourceNotFoundException;
import com.chulhachauka.user.Role;
import com.chulhachauka.user.User;
import com.chulhachauka.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    public record UserSummary(
        Long id,
        String name,
        String phone,
        String email,
        Role role,
        OffsetDateTime createdAt
    ) {
        public static UserSummary from(User u) {
            return new UserSummary(
                u.getId(),
                u.getName(),
                u.getPhone(),
                u.getEmail(),
                u.getRole(),
                u.getCreatedAt()
            );
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserSummary>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<UserSummary> users = userRepository.findAll(pageable).map(UserSummary::from);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserSummary>> updateRole(
            @PathVariable Long id,
            @RequestParam Role role
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + id));

        user.setRole(role);
        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok(UserSummary.from(updated)));
    }
}
