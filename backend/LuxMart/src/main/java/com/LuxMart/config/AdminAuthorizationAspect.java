package com.LuxMart.config;

import lombok.RequiredArgsConstructor;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.stereotype.Component;

import com.LuxMart.exception.AccessDeniedException;

@Aspect
@Component
@RequiredArgsConstructor
public class AdminAuthorizationAspect {
    
    private final SecurityService securityService;
    
    @Before("@annotation(com.luxmart.annotation.RequireAdmin) || @within(com.luxmart.annotation.RequireAdmin)")
    public void checkAdminAccess() {
        if (!securityService.isAdmin()) {
            throw new AccessDeniedException();
        }
    }
}
