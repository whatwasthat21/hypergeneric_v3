package com.example.mysqlcrudapp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for debugging CSRF and security issues
 */
@RestController
@RequestMapping("/api/debug")
public class DebugController {

    /**
     * Endpoint to check CSRF token
     */
    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> checkCsrf(HttpServletRequest request) {
        Map<String, String> response = new HashMap<>();
        
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token != null) {
            response.put("status", "CSRF token found");
            response.put("headerName", token.getHeaderName());
            response.put("parameterName", token.getParameterName());
            response.put("token", token.getToken());
        } else {
            response.put("status", "CSRF token not found");
        }
        
        return ResponseEntity.ok(response);
    }
      /**
     * Endpoint to check authentication
     */
    @GetMapping("/auth")
    public ResponseEntity<Map<String, Object>> checkAuth(HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("authenticated", request.isUserInRole("USER"));
        response.put("remoteUser", request.getRemoteUser());
        response.put("userPrincipal", request.getUserPrincipal() != null ? 
                request.getUserPrincipal().getName() : null);
                
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint for CSRF POST requests
     */
    @PostMapping("/csrf-test")
    public ResponseEntity<Map<String, String>> testCsrfPost(@RequestBody(required = false) Map<String, Object> body) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "POST request received successfully with CSRF protection");
        response.put("receivedData", body != null ? body.toString() : "No data received");
        return ResponseEntity.ok(response);
    }
}
