package com.example.mysqlcrudapp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.ArrayList;

@Controller
public class HomeController {
    
    @GetMapping("/")
    public String home(Model model) {
        // For now, providing an empty list for recent activity
        // This can be enhanced later to show actual activity from various services
        model.addAttribute("recentActivity", new ArrayList<>());
        return "index";
    }
}