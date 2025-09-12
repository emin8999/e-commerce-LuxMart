package com.LuxMart.mapper;

import java.util.List;
import java.util.Set;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.LuxMart.dto.requestDto.user.UserDetails;
import com.LuxMart.dto.requestDto.user.UserListItem;
import com.LuxMart.dto.responseDto.user.AdminNoteResponse;
import com.LuxMart.entity.UserAdminNoteEntity;
import com.LuxMart.entity.UserEntity;

// @Mapper(componentModel = "spring")
// public interface AdminUserMapper {

//     @Mapping(source = "orders", target = "ordersCount", qualifiedByName = "ordersToCount")
//     @Mapping(source = "orders", target = "spendUSD", qualifiedByName = "ordersToSpend")
//     @Mapping(source = "roles", target = "isActive", qualifiedByName = "rolesToIsActive")
//     UserListItem mapToUserListItem(UserEntity userEntity);

//     @Mapping(source = "orders", target = "ordersCount", qualifiedByName = "ordersToCount")
//     @Mapping(source = "orders", target = "spendUSD", qualifiedByName = "ordersToSpend")
//     @Mapping(source = "roles", target = "isActive", qualifiedByName = "rolesToIsActive")
//     @Mapping(target = "adminNotes", ignore = true)
//     UserDetails mapToUserDetails(UserEntity userEntity);

//     AdminNoteResponse mapToAdminNoteResponse(UserEntity noteEntity);

//     @Named("ordersToCount")
//     default Integer ordersToCount(List<?> orders) {
//         return orders != null ? orders.size() : 0;
//     }

//     @Named("ordersToSpend")
//     default Double ordersToSpend(List<?> orders) {
//         // OrderEntity-də amount sahəsi varsa istifadə edə bilərsiniz
//         // Hələlik 0.0 qaytaraq
//         return 0.0;
//     }

//     @Named("rolesToIsActive")
//     default boolean rolesToIsActive(Set<?> roles) {
//         // Əgər rol yoxdursa ban edilib sayırıq
//         return roles != null && !roles.isEmpty();
//     }
// }
@Mapper(componentModel = "spring")
public interface AdminUserMapper {
    @Mapping(source = "orders", target = "ordersCount", qualifiedByName = "ordersToCount")
    @Mapping(source = "orders", target = "spendUSD", qualifiedByName = "ordersToSpend")
    @Mapping(source = "roles", target = "isActive", qualifiedByName = "rolesToIsActive")
    UserListItem mapToUserListItem(UserEntity userEntity);
    @Mapping(source = "orders", target = "ordersCount", qualifiedByName = "ordersToCount")
    @Mapping(source = "orders", target = "spendUSD", qualifiedByName = "ordersToSpend")
    @Mapping(source = "roles", target = "isActive", qualifiedByName = "rolesToIsActive")
    @Mapping(target = "adminNotes", ignore = true)
    UserDetails mapToUserDetails(UserEntity userEntity);
    // :white_check_mark: Burada düzəldirik
    AdminNoteResponse mapToAdminNoteResponse(UserEntity user);
    @Named("ordersToCount")
    default Integer ordersToCount(List<?> orders) {
        return orders != null ? orders.size() : 0;
    }
    @Named("ordersToSpend")
    default Double ordersToSpend(List<?> orders) {
        return 0.0;
    }
    @Named("rolesToIsActive")
    default boolean rolesToIsActive(Set<?> roles) {
        return roles != null && !roles.isEmpty();
    }
}