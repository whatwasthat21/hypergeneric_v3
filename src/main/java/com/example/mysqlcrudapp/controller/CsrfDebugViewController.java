package com.example.mysqlcrudapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controller for CSRF debugging views
 */
@Controller
@RequestMapping("/debug")
public class CsrfDebugViewController {

    /**
     * CSRF debug page
     */
    @GetMapping("/csrf")
    public String csrfDebugPage(Model model) {
        model.addAttribute("title", "CSRF Debug");
        return "csrf-debug";
    }
}
