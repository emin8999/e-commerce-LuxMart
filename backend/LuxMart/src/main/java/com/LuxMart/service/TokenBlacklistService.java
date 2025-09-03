package com.LuxMart.service;

public interface TokenBlacklistService {

    void blacklistToken(String token);
    boolean isTokenBlacklisted(String token);
    void cleanupExpiredTokens();

}

