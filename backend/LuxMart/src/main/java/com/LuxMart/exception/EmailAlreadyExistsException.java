package com.LuxMart.exception;

public class EmailAlreadyExistsException extends UserException {
    public EmailAlreadyExistsException(String email) {
        super("Email already exists: " + email);
    }
}
