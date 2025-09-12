package com.LuxMart.dto.requestDto.user;

import java.util.List;

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
public class UserFilterRequest {

    private String search;
    private String role;
    private String dateFrom;
    private String dateTo;
    private String sortBy;
    private String sortDir;
    private String scope; // all, page, selected
    private Integer page;
    private Integer size;
    private List<Long> ids;
    
}
