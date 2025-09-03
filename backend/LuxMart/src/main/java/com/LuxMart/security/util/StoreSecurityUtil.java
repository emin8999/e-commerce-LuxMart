package com.LuxMart.security.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.LuxMart.entity.StoreEntity;
import com.LuxMart.security.store.StorePrincipal;

import java.nio.file.AccessDeniedException;

@Component
public class StoreSecurityUtil {

    public StoreEntity getCurrentStore() throws AccessDeniedException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            Object principal = auth.getPrincipal();
            if (principal instanceof StorePrincipal storePrincipal) {
                return storePrincipal.getStore();
            }
        }

        throw new AccessDeniedException("Only stores can perform this action.");
    }
}
