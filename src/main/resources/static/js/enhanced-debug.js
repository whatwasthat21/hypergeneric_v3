/**
 * Enhanced Debug Utility
 * Provides diagnostics for CRUD operations and CSRF token handling
 */

// Configuration
const DEBUG_CONFIG = {
    // Set to true to show more detailed diagnostics
    verbose: true,
    // Set to true to add a debug button to the page
    showDebugButton: true,
    // Mask part of the CSRF token for security while still showing it's present
    maskTokens: true
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced Debug Utility loaded');
    
    // Check for CSRF token
    diagnoseCsrfTokenAvailability();
    
    // Monitor AJAX requests to diagnose CSRF issues
    monitorFetchRequests();
    
    // Monitor buttons and forms
    attachDiagnosticListeners();
    
    // Add a debug button if enabled
    if (DEBUG_CONFIG.showDebugButton) {
        addDebugButton();
    }
});

/**
 * Diagnose CSRF token availability from various sources
 */
function diagnoseCsrfTokenAvailability() {
    console.log('⚡ CSRF Token Availability Check ⚡');
    let tokenFound = false;
    
    // Check meta tags
    const metaCsrf = document.querySelector('meta[name="_csrf"]');
    const metaCsrfHeader = document.querySelector('meta[name="_csrf_header"]');
    if (metaCsrf && metaCsrfHeader) {
        console.log('✅ CSRF token found in meta tags');
        console.log(`   Header: ${metaCsrfHeader.content}`);
        const tokenValue = metaCsrf.content;
        console.log(`   Token: ${DEBUG_CONFIG.maskTokens ? maskToken(tokenValue) : tokenValue}`);
        tokenFound = true;
    } else {
        console.warn('❌ CSRF token not found in meta tags');
    }
    
    // Check form inputs
    const formCsrf = document.querySelector('input[name="_csrf"]');
    const formCsrfHeader = document.querySelector('input[name="_csrf_header"]');
    if (formCsrf && formCsrfHeader) {
        console.log('✅ CSRF token found in form inputs');
        console.log(`   Header: ${formCsrfHeader.value}`);
        const tokenValue = formCsrf.value;
        console.log(`   Token: ${DEBUG_CONFIG.maskTokens ? maskToken(tokenValue) : tokenValue}`);
        tokenFound = true;
    } else {
        console.warn('❌ CSRF token not found in form inputs');
    }
    
    // Check cookies
    const cookies = document.cookie.split(';');
    let csrfCookie = null;
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('XSRF-TOKEN=')) {
            csrfCookie = cookie.substring('XSRF-TOKEN='.length);
            break;
        }
    }
    
    if (csrfCookie) {
        console.log('✅ CSRF token found in cookies');
        console.log(`   Header: X-XSRF-TOKEN`);
        console.log(`   Token: ${DEBUG_CONFIG.maskTokens ? maskToken(csrfCookie) : csrfCookie}`);
        tokenFound = true;
    } else {
        console.warn('❌ CSRF token not found in cookies');
    }
    
    // Check if centralized CSRF utility is available
    if (typeof getCsrfToken === 'function') {
        console.log('✅ Centralized CSRF utility (getCsrfToken) is available');
        const token = getCsrfToken();
        if (token.value) {
            console.log(`   Header: ${token.header}`);
            console.log(`   Token: ${DEBUG_CONFIG.maskTokens ? maskToken(token.value) : token.value}`);
            tokenFound = true;
        } else {
            console.error('❌ Centralized CSRF utility returned empty token');
        }
    } else {
        console.error('❌ Centralized CSRF utility (getCsrfToken) is NOT available');
        console.error('   This may cause CSRF protection failures for fetch/XHR requests');
    }
    
    if (!tokenFound) {
        console.error('🔴 NO CSRF TOKEN FOUND. POST/PUT/DELETE operations will likely fail!');
    }
}

/**
 * Mask token for display in console for security
 */
function maskToken(token) {
    if (!token) return 'null';
    if (token.length <= 6) return '******';
    return token.substring(0, 3) + '...' + token.substring(token.length - 3);
}

/**
 * Monitor all fetch requests for CSRF token usage
 */
function monitorFetchRequests() {
    // Save original fetch
    const originalFetch = window.fetch;
    
    // Override fetch to monitor requests
    window.fetch = function(url, options = {}) {
        const method = options.method || 'GET';
        
        // Only monitor non-GET requests that need CSRF protection
        if (method !== 'GET') {
            console.log(`🔍 FETCH: ${method} ${url}`);
            
            // Check if CSRF header is present
            const headers = options.headers || {};
            let csrfHeaderFound = false;
            
            // Common CSRF header names
            const csrfHeaderNames = ['X-CSRF-TOKEN', 'X-XSRF-TOKEN', '_csrf', 'X-CSRF'];
            
            for (const key in headers) {
                if (csrfHeaderNames.some(name => key.toLowerCase().includes(name.toLowerCase()))) {
                    csrfHeaderFound = true;
                    console.log(`✅ CSRF header found: ${key}`);
                    break;
                }
            }
            
            if (!csrfHeaderFound) {
                console.warn(`❌ No CSRF header found in ${method} request to ${url}`);
                console.warn('  This request will likely be rejected by the server!');
            }
        }
        
        // Call original fetch with given arguments
        return originalFetch.apply(this, arguments)
            .then(response => {
                if (method !== 'GET' && response.status === 403) {
                    console.error(`🔴 Request to ${url} was forbidden (403) - likely a CSRF token issue`);
                }
                return response;
            });
    };
}

/**
 * Attach diagnostic listeners to forms and buttons
 */
function attachDiagnosticListeners() {
    // Monitor form submissions
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            console.log(`📝 Form submission: id=${form.id}, action=${form.action}, method=${form.method}`);
            
            // Check for CSRF token in form
            const csrfInput = form.querySelector('input[name="_csrf"]');
            if (!csrfInput) {
                console.warn('❌ No CSRF token found in submitted form');
                if (form.method.toLowerCase() !== 'get') {
                    console.error('   This form submission may fail due to CSRF protection!');
                }
            } else {
                console.log('✅ CSRF token found in form');
            }
        }, { passive: true });
    });
    
    // Monitor action buttons
    const actionButtons = document.querySelectorAll(
        'button[onclick*="edit"], button[onclick*="delete"], button[onclick*="view"], ' +
        '.edit-btn, .delete-btn, .view-btn'
    );
    
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Get the action type from the button
            let actionType = 'unknown';
            if (button.classList.contains('edit-btn') || button.getAttribute('onclick')?.includes('edit')) {
                actionType = 'edit';
            } else if (button.classList.contains('delete-btn') || button.getAttribute('onclick')?.includes('delete')) {
                actionType = 'delete';
            } else if (button.classList.contains('view-btn') || button.getAttribute('onclick')?.includes('view')) {
                actionType = 'view';
            }
            
            console.log(`🖱️ ${actionType.toUpperCase()} button clicked`);
            
            // Log the onclick handler
            const onclickAttr = button.getAttribute('onclick');
            if (onclickAttr) {
                console.log(`   Handler: ${onclickAttr}`);
                
                // Check if the referenced function exists
                const functionName = onclickAttr.split('(')[0].trim();
                if (typeof window[functionName] === 'function') {
                    console.log(`✅ Handler function '${functionName}' exists in global scope`);
                } else {
                    console.error(`❌ Handler function '${functionName}' NOT found in global scope`);
                }
            } else {
                // No onclick, probably using event listeners
                console.log(`   Using event listeners (no inline onclick)`);
            }
            
            // Check if CSRF utility is available for edit/delete actions
            if (actionType === 'edit' || actionType === 'delete') {
                if (typeof getCsrfToken === 'function') {
                    const token = getCsrfToken();
                    console.log(`✅ CSRF token available for ${actionType}: ${token.value ? 'Yes' : 'No'}`);
                } else {
                    console.error(`❌ getCsrfToken function not available for ${actionType} action`);
                }
            }
        }, { passive: true });
    });
}

/**
 * Add a debug button to the page
 */
function addDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug CSRF';
    debugBtn.className = 'btn btn-warning btn-sm position-fixed';
    debugBtn.style.bottom = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    debugBtn.style.opacity = '0.8';
    
    debugBtn.addEventListener('click', function() {
        console.clear();
        console.log('🔍 Running CSRF Debug Diagnostics 🔍');
        
        // Re-check CSRF token availability
        diagnoseCsrfTokenAvailability();
        
        // List all global functions for action buttons
        console.log('\n🔍 Checking Global Action Functions:');
        const actionFunctions = ['editUser', 'deleteUser', 'editBlueprint', 'deleteBlueprint', 'viewVersions'];
        actionFunctions.forEach(func => {
            if (typeof window[func] === 'function') {
                console.log(`✅ ${func}: Available`);
            } else {
                console.error(`❌ ${func}: NOT FOUND`);
            }
        });
        
        // Check frontend-backend connectivity
        console.log('\n🔍 Testing API connectivity:');
        fetch('/api/debug/csrf', { credentials: 'same-origin' })
            .then(response => {
                console.log(`✅ API connectivity test: ${response.status}`);
                return response.json();
            })
            .catch(error => {
                console.error('❌ API connectivity test failed:', error);
            });
    });
    
    document.body.appendChild(debugBtn);
}
