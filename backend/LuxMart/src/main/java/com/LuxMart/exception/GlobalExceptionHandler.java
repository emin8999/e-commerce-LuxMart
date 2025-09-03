package com.LuxMart.exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;

import jakarta.servlet.http.HttpServletRequest;

public class GlobalExceptionHandler {

 @ExceptionHandler(StoreException.class)
    public ResponseEntity<ErrorResponse>handleStoreException(StoreException exception,HttpServletRequest request){
        ErrorResponse errorResponse = ErrorResponse.builder()
                .statusCode(HttpStatus.UNAUTHORIZED.value())
                .message(exception.getMessage())
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse,HttpStatus.UNAUTHORIZED);
    }

      @ExceptionHandler(UserException.class)
    public ResponseEntity<ErrorResponse>handleUserException(UserException exception,HttpServletRequest request){
        ErrorResponse errorResponse = ErrorResponse.builder()
                .statusCode(HttpStatus.BAD_REQUEST.value())
                .message(exception.getMessage())
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse,HttpStatus.BAD_REQUEST);
    }

       @ExceptionHandler(Exception.class)
public ResponseEntity<ErrorResponse> handleAllOtherException(Exception ex,HttpServletRequest request) {
    ErrorResponse error = ErrorResponse.builder()
        .statusCode(HttpStatus.BAD_REQUEST.value())
        .message(ex.getMessage())
        .timestamp(LocalDateTime.now())
        .path(request.getRequestURI())
        .build();
    return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(error);
}
    
}
