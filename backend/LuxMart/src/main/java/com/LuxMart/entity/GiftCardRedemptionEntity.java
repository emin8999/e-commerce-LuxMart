package com.LuxMart.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "gift_card_redemptions")
@Entity
public class GiftCardRedemptionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "gift_card_id")
    private GiftCardEntity giftCard;
    
    @ManyToOne
    @JoinColumn(name = "order_id")
    private OrderEntity order;
    
    @Column(nullable = false)
    private BigDecimal amountUsed;
    
    @CreationTimestamp
    private LocalDateTime usedAt;
    
}
