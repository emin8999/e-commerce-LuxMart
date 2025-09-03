package com.LuxMart.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.LuxMart.enums.DiscountType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "coupons")
public class CouponEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    @Enumerated(EnumType.STRING)
    private DiscountType discountType;
    
    private BigDecimal discountValue;
    private BigDecimal minimumAmount;
    private Integer usageLimit;
    private Integer usedCount = 0;
    
    @ManyToOne
    @JoinColumn(name = "store_id")
    private StoreEntity store;
    
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    
    private Boolean isActive = true;
}
