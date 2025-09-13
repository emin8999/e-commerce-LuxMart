package com.LuxMart.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.LuxMart.dto.requestDto.LoginRequestDto;
import com.LuxMart.dto.requestDto.user.AdminNoteRequest;
import com.LuxMart.dto.requestDto.user.BanRequest;
import com.LuxMart.dto.requestDto.user.BulkRoleRequest;
import com.LuxMart.dto.requestDto.user.SetRoleRequest;
import com.LuxMart.dto.requestDto.user.UserDetails;
import com.LuxMart.dto.requestDto.user.UserFilterRequest;
import com.LuxMart.dto.requestDto.user.UserListItem;
import com.LuxMart.dto.responseDto.LoginResponseDto;
import com.LuxMart.dto.responseDto.UserResponseDto;
import com.LuxMart.service.AdminUserService;
import com.LuxMart.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
 
    private final UserService userService;
    private final AdminUserService adminUserService;

      @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> adminLogin(@RequestBody @Valid LoginRequestDto loginRequestDto) {
        LoginResponseDto response = userService.adminLogin(loginRequestDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            userService.logout(token);
            return ResponseEntity.ok("Admin logged out successfully");
        }
        return ResponseEntity.badRequest().body("No valid token provided");
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserListItem>> getUsers(UserFilterRequest filter, Pageable pageable) {
    Page<UserListItem> users = adminUserService.getUsers(filter, pageable);
    return ResponseEntity.ok(users);
    }
    
//     @GetMapping("/users")
//    // @PreAuthorize("hasRole('ADMIN')")
//     public ResponseEntity<List<UserResponseDto>> getAllUsersForAdmin() {
//         List<UserResponseDto> users = userService.getAllUsersForAdmin();
//         return ResponseEntity.ok(users);
//     }

  //   @GetMapping("/users/{id}")
  //  @PreAuthorize("hasRole('ADMIN')")
  //  public ResponseEntity<UserResponseDto> getUserById(@PathVariable("id") Long id) {
   //     UserResponseDto user = userService.getUserByIdForAdmin(id);
    //    return ResponseEntity.ok(user);
   // }

      @PutMapping("/{id}/role")
    public ResponseEntity<Map<String, Object>> changeUserRole(
            @PathVariable("id") Long id, 
            @Valid @RequestBody SetRoleRequest request) {
        
        adminUserService.changeUserRole(id, request);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // 4) Rolun kütləvi dəyişdirilməsi
    @PostMapping("/role/bulk")
    public ResponseEntity<Map<String, Object>> bulkChangeRole(
            @Valid @RequestBody BulkRoleRequest request) {
        
        int updated = adminUserService.bulkChangeRole(request);
        return ResponseEntity.ok(Map.of("updated", updated));
    }

  
    @PostMapping("/{id}/ban")
    public ResponseEntity<Map<String, Object>> banUser(
            @PathVariable("id") Long id,
            @RequestBody(required = false) BanRequest request) {
        
        adminUserService.banUser(id, request != null ? request.getReason() : null);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/{id}/unban")
    public ResponseEntity<Map<String, Object>> unbanUser(@PathVariable("id") Long id) {
        adminUserService.unbanUser(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    
    @PostMapping("/{id}/note")
    public ResponseEntity<Map<String, Object>> addAdminNote(
            @PathVariable("id") Long id,
            @Valid @RequestBody AdminNoteRequest request) {
        
        adminUserService.addAdminNote(id, request.getNote());
        return ResponseEntity.ok(Map.of("ok", true));
    }

      @GetMapping("/users/{id}")
    public ResponseEntity<UserDetails> getUserDetails(@PathVariable("id") Long id) {
        UserDetails userDetails = adminUserService.getUserDetails(id);
        return ResponseEntity.ok(userDetails);
    }
}
