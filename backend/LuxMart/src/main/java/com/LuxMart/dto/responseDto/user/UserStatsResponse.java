package com.LuxMart.dto.responseDto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {

    private Long total;
    private Long active;
    private Long banned;
    private Long newThisMonth;
    private Long adminCount;
    private Long clientCount;
    private Long storeOwnerCount;
    
}
