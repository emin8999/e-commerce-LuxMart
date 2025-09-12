package com.LuxMart.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.LuxMart.dto.requestDto.user.BulkRoleRequest;
import com.LuxMart.dto.requestDto.user.SetRoleRequest;
import com.LuxMart.dto.requestDto.user.UserDetails;
import com.LuxMart.dto.requestDto.user.UserFilterRequest;
import com.LuxMart.dto.requestDto.user.UserListItem;
import com.LuxMart.dto.responseDto.user.UserStatsResponse;

public interface AdminUserService {

    Page<UserListItem> getUsers(UserFilterRequest filter, Pageable pageable);

    UserDetails getUserDetails(Long id);

    void changeUserRole(Long id, SetRoleRequest request);

    int bulkChangeRole(BulkRoleRequest request);

    void banUser(Long id, String reason);

    void unbanUser(Long id);

    void addAdminNote(Long userId, String note);

    UserStatsResponse getUserStats();

}
