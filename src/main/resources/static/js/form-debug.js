/**
 * Form Debugging Utility
 * This script helps diagnose form submission issues by adding debug logging
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Form Debug Utility Loaded');
    
    // Log all forms on the page
    const forms = document.querySelectorAll('form');
    console.log(`Found ${forms.length} forms on the page:`);
    forms.forEach((form, index) => {
        console.log(`Form #${index + 1}: id=${form.id}, action=${form.action}, method=${form.method}`);
    });
    
    // Log all buttons that might submit forms
    const buttons = document.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons on the page:`);
    buttons.forEach((button, index) => {
        console.log(`Button #${index + 1}: id=${button.id}, type=${button.type}, text=${button.textContent.trim()}`);
    });    // Monitor button clicks (but don't interfere with onclick handlers)
    buttons.forEach(button => {
        // Skip buttons that are known to work with other handlers
        const skipButtons = ['createVersionButton', 'updateVersionButton'];
        if (skipButtons.includes(button.id)) {
            console.log(`Skipping debug logging for button: ${button.id}`);
            // Special handling for createVersionButton - add debug listener but don't interfere
            if (button.id === 'createVersionButton') {
                button.addEventListener('click', function(event) {
                    console.log('Form-debug: Create version button clicked - this is just monitoring');
                    // Make sure we're not preventing other handlers from running
                    event.stopPropagation = false;
                }, { passive: true, capture: false });
            }
            return;
        }
        
        button.addEventListener('click', function(event) {
            console.debug(`Button clicked: id=${button.id}, type=${button.type}, text=${button.textContent.trim()}`);
            // Don't do anything else, just log the click
        }, { passive: true, capture: false });
    });
    
    // Monitor form submissions
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            console.log(`Form submit event on form: id=${form.id}, action=${form.action}, method=${form.method}`);
            
            // Log form data
            const formData = new FormData(form);
            console.log('Form data:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}: ${value}`);
            }
        });
    });
    
    // Log CSRF tokens
    const csrfTokens = document.querySelectorAll('input[name="_csrf"]');
    console.log(`Found ${csrfTokens.length} CSRF tokens on the page:`);
    csrfTokens.forEach((token, index) => {
        console.log(`CSRF Token #${index + 1}: value=${token.value.substring(0, 8)}...`);
    });
});

// Log all modal dialog open/close events
document.addEventListener('shown.bs.modal', function(event) {
    console.log(`Modal shown: id=${event.target.id}`);
});

document.addEventListener('hidden.bs.modal', function(event) {
    console.log(`Modal hidden: id=${event.target.id}`);
});
