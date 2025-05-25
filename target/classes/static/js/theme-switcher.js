/**
 * Theme Switcher
 * Manages the application's light and dark theme preferences
 */

const ThemeSwitcher = (function() {
    // Theme storage key in localStorage
    const THEME_STORAGE_KEY = 'hg_theme_preference';
    
    // Theme options
    const THEMES = {
        LIGHT: 'light',
        DARK: 'dark'
    };
      // Initialize theme from stored preference or default to dark
    function initialize() {
        // Check for stored preference
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        
        if (storedTheme) {
            // Apply stored theme
            setTheme(storedTheme);
        } else {
            // Default to dark theme
            setTheme(THEMES.DARK);
        }
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
            // Only apply if no manual preference is stored
            if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                setTheme(event.matches ? THEMES.DARK : THEMES.LIGHT);
            }
        });
        
        console.log('Theme switcher initialized');
    }
    
    // Set theme and update UI
    function setTheme(theme) {
        // Update data-bs-theme attribute on document body
        if (theme === THEMES.DARK) {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            updateToggleIcon(THEMES.DARK);
        } else {
            document.documentElement.setAttribute('data-bs-theme', 'light');
            updateToggleIcon(THEMES.LIGHT);
        }
    }
    
    // Update the icon in the theme toggle button
    function updateToggleIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;
        
        if (theme === THEMES.DARK) {
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggle.setAttribute('title', 'Switch to Light Mode');
            themeToggle.classList.remove('btn-dark');
            themeToggle.classList.add('btn-light');
        } else {
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggle.setAttribute('title', 'Switch to Dark Mode');
            themeToggle.classList.remove('btn-light');
            themeToggle.classList.add('btn-dark');
        }
    }
    
    // Toggle between light and dark themes
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'dark' ? THEMES.LIGHT : THEMES.DARK;
        
        // Save preference to localStorage
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        
        // Apply the new theme
        setTheme(newTheme);
    }
    
    // Public API
    return {
        initialize: initialize,
        toggleTheme: toggleTheme,
        setTheme: setTheme
    };
})();

// Initialize theme switcher on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize and force dark theme
    ThemeSwitcher.initialize();
    ThemeSwitcher.setTheme('dark');
    localStorage.setItem('hg_theme_preference', 'dark');
    
    // Set up theme toggle button click handler
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', ThemeSwitcher.toggleTheme);
    }
});

// Expose ThemeSwitcher globally for debugging
window.ThemeSwitcher = ThemeSwitcher;
