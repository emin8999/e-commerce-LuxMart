package com.LuxMart.exception;

public class AccessDeniedException extends UserException {
    public AccessDeniedException() {
        super("Access denied");
    }
}
