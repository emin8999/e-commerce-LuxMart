package com.LuxMart.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Example;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.LuxMart.config.SecurityService;
import com.LuxMart.dto.requestDto.user.BulkRoleRequest;
import com.LuxMart.dto.requestDto.user.SetRoleRequest;
import com.LuxMart.dto.requestDto.user.UserDetails;
import com.LuxMart.dto.requestDto.user.UserFilterRequest;
import com.LuxMart.dto.requestDto.user.UserListItem;
import com.LuxMart.dto.responseDto.user.AdminNoteResponse;
import com.LuxMart.dto.responseDto.user.UserStatsResponse;
import com.LuxMart.entity.UserAdminNoteEntity;
import com.LuxMart.entity.UserEntity;
import com.LuxMart.enums.Roles;
import com.LuxMart.exception.UserNotFoundException;
import com.LuxMart.mapper.AdminUserMapper;
import com.LuxMart.repository.UserAdminNoteRepository;
import com.LuxMart.repository.UserRepository;
import com.LuxMart.security.util.ExportUtils;
import com.LuxMart.service.AdminUserService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminUserServiceImpl  implements AdminUserService{

    private final UserRepository userRepository;
    private final UserAdminNoteRepository adminNoteRepository;
    private final AdminUserMapper adminUserMapper;
    private final ExportUtils exportUtils;
    private final SecurityService securityService;

    @Override
    public Page<UserListItem> getUsers(UserFilterRequest filter, Pageable pageable) {
        Specification<UserEntity> spec = createUserSpecification(filter);
        Page<UserEntity> userPage = userRepository.findAll(spec, pageable);
        
        List<UserListItem> userListItems = userPage.getContent().stream()
                .map(adminUserMapper::mapToUserListItem)
                .collect(Collectors.toList());
                
        return new PageImpl<>(userListItems, pageable, userPage.getTotalElements());
    }

     @Override
       @Transactional
    public UserDetails getUserDetails(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException());
        
        UserDetails userDetails = adminUserMapper.mapToUserDetails(user);
        
        List<UserAdminNoteEntity> notes = adminNoteRepository.findByUserIdOrderByCreatedAtDesc(id);
        List<AdminNoteResponse> adminNotes = notes.stream()
                .map(note -> adminUserMapper.mapToAdminNoteResponse(user))
                .collect(Collectors.toList());
        userDetails.setAdminNotes(adminNotes);
        
        return userDetails;
    }

     @Override
    @Transactional
    public void changeUserRole(Long id, SetRoleRequest request) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException());
        
        Set<Roles> oldRoles = new HashSet<>(user.getRoles());
        
        // Yeni rol set-ini yarat
        Set<Roles> newRoles = new HashSet<>();
        newRoles.add(request.getRole());
        
        user.setRoles(newRoles);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        // Admin qeydi əlavə et
        String noteText = String.format("Role changed from %s to %s", oldRoles, newRoles);
        if (request.getNote() != null && !request.getNote().trim().isEmpty()) {
            noteText += ". Note: " + request.getNote();
        }
        addAdminNote(id, noteText);
        
        log.info("User {} role changed from {} to {} by admin {}", 
                id, oldRoles, newRoles, securityService.getCurrentUserId());
    }

     @Override
    @Transactional
    public int bulkChangeRole(BulkRoleRequest request) {
        List<UserEntity> users = userRepository.findAllById(request.getIds());
        
        if (users.size() != request.getIds().size()) {
            throw new IllegalArgumentException("Some users not found");
        }
        
        users.forEach(user -> {
            Set<Roles> newRoles = new HashSet<>();
            newRoles.add(request.getRole());
            user.setRoles(newRoles);
            user.setUpdatedAt(LocalDateTime.now());
        });
        
        userRepository.saveAll(users);
        
        // Kütləvi admin qeydi
        String noteText = "Bulk role change to " + request.getRole();
        if (request.getNote() != null && !request.getNote().trim().isEmpty()) {
            noteText += ". Note: " + request.getNote();
        }
        
        final String finalNote = noteText;
        request.getIds().forEach(id -> addAdminNote(id, finalNote));
        
        log.info("Bulk role change: {} users changed to {} by admin {}", 
                users.size(), request.getRole(), securityService.getCurrentUserId());
        
        return users.size();
    }

     @Override
    @Transactional
    public void banUser(Long id, String reason) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException());
        
        // Ban etmək üçün bütün rolları sil
        Set<Roles> oldRoles = new HashSet<>(user.getRoles());
        user.setRoles(new HashSet<>());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        // Ban səbəbini admin qeydi kimi saxla
        String note = "User banned. Previous roles: " + oldRoles;
        if (reason != null && !reason.trim().isEmpty()) {
            note += ". Reason: " + reason;
        }
        addAdminNote(id, note);
        
        log.info("User {} banned by admin {}, reason: {}", 
                id, securityService.getCurrentUserId(), reason);
    }

     @Override
    @Transactional
    public void unbanUser(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException());
        
        // Default olaraq CLIENT rolunu ver
        Set<Roles> newRoles = new HashSet<>();
        newRoles.add(Roles.CLIENT);
        user.setRoles(newRoles);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        
        addAdminNote(id, "User unbanned and given CLIENT role");
        
        log.info("User {} unbanned by admin {}", id, securityService.getCurrentUserId());
    }

     @Override
    @Transactional
    public void addAdminNote(Long userId, String note) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException());
        
        UserAdminNoteEntity adminNote = UserAdminNoteEntity.builder()
                .user(user)
                .authorId(securityService.getCurrentUserId())
                .note(note)
                .createdAt(LocalDateTime.now())
                .build();
                
        adminNoteRepository.save(adminNote);
    }

    public byte[] exportUsersCsv(UserFilterRequest filter) {
        List<UserEntity> users = getUsersForExport(filter);
        List<UserListItem> userListItems = users.stream()
                .map(adminUserMapper::mapToUserListItem)
                .collect(Collectors.toList());
                
        return exportUtils.exportUsersToCsv(userListItems);
    }

    public byte[] exportUsersExcel(UserFilterRequest filter) {
        List<UserEntity> users = getUsersForExport(filter);
        List<UserListItem> userListItems = users.stream()
                .map(adminUserMapper::mapToUserListItem)
                .collect(Collectors.toList());
                
        return exportUtils.exportUsersToExcel(userListItems);
    }

     @Override
     @Transactional
    public UserStatsResponse getUserStats() {
        long total = userRepository.count();
        long active = userRepository.countByRolesIsNotEmpty();
        long banned = userRepository.countByRolesIsEmpty();
        
        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long newThisMonth = userRepository.countByCreatedAtGreaterThanEqual(monthStart);
        
        long adminCount = userRepository.countByRolesContaining(Roles.ADMIN);
        long clientCount = userRepository.countByRolesContaining(Roles.CLIENT);
        long storeOwnerCount = userRepository.countByRolesContaining(Roles.STORE_OWNER);
        
        return UserStatsResponse.builder()
                .total(total)
                .active(active)
                .banned(banned)
                .newThisMonth(newThisMonth)
                .adminCount(adminCount)
                .clientCount(clientCount)
                .storeOwnerCount(storeOwnerCount)
                .build();
    }

    private Specification<UserEntity> createUserSpecification(UserFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (filter.getSearch() != null && !filter.getSearch().trim().isEmpty()) {
                String searchPattern = "%" + filter.getSearch().toLowerCase() + "%";
                jakarta.persistence.criteria.Predicate searchPredicate = criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("surname")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("phone")), searchPattern)
                );
                predicates.add(searchPredicate);
            }

            if (filter.getRole() != null) {
                try {
                    Roles role = Roles.valueOf(filter.getRole().toUpperCase());
                    predicates.add(criteriaBuilder.isMember(role, root.get("roles")));
                } catch (IllegalArgumentException e) {
              
                }
            }

            if (filter.getDateFrom() != null) {
                LocalDateTime dateFrom = LocalDateTime.parse(filter.getDateFrom());
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), dateFrom));
            }

            if (filter.getDateTo() != null) {
                LocalDateTime dateTo = LocalDateTime.parse(filter.getDateTo());
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), dateTo));
            }

            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    private <S> List<UserEntity> getUsersForExport(UserFilterRequest filter) {
        Specification<UserEntity> spec = createUserSpecification(filter);
        
        if ("selected".equals(filter.getScope()) && filter.getIds() != null) {
            return userRepository.findAllById(filter.getIds());
        }
        
        return userRepository.findAll(spec);
    }

    
}