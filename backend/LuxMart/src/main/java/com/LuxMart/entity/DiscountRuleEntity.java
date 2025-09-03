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
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "discount_rules")
public class DiscountRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Enumerated(EnumType.STRING)
    private DiscountType type;
    
    private BigDecimal value; 
    private BigDecimal minimumAmount; 
    
    @ManyToOne
    @JoinColumn(name = "store_id")
    private StoreEntity store;
    
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    
    private Boolean isActive = true;
    
    private Integer buyQuantity;
    private Integer getQuantity;
    
}
