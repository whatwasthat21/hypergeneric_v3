// Debug script to check page loading and DOM structure
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Check if blueprint table exists
    const blueprintTable = document.querySelector('.table-responsive table');
    if (blueprintTable) {
        console.log('Blueprint table found', blueprintTable);
        const rows = blueprintTable.querySelectorAll('tbody tr');
        console.log(`Found ${rows.length} blueprint rows`);
    } else {
        console.error('Blueprint table not found in DOM');
    }
      // Check for CSRF token
    const csrfToken = document.querySelector('input[name="_csrf"]');
    if (csrfToken) {
        console.log('CSRF token found in form:', csrfToken.name, csrfToken.value);
        console.log('For Spring Security with CookieCsrfTokenRepository, use X-XSRF-TOKEN header');
    } else {
        console.warn('CSRF token not found in form, checking meta tags...');
        
        // Check for CSRF token in meta tags
        const metaCsrf = document.querySelector('meta[name="_csrf"]');
        const metaCsrfHeader = document.querySelector('meta[name="_csrf_header"]');
        if (metaCsrf && metaCsrfHeader) {
            console.log('CSRF token found in meta tags:', metaCsrfHeader.content, metaCsrf.content);
            console.log('For Spring Security with CookieCsrfTokenRepository, use X-XSRF-TOKEN header');
        } else {
            console.warn('CSRF token not found in meta tags, checking cookies...');
            
            // Check for CSRF token in cookies
            const cookies = document.cookie.split(';');
            let csrfCookie = null;
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.startsWith('XSRF-TOKEN=')) {
                    csrfCookie = cookie;
                    console.log('CSRF token found in cookie:', cookie);
                    break;
                }
            }
            
            if (!csrfCookie) {
                console.error('No CSRF token found in form, meta tags, or cookies');
            }
        }
    }
    
    // Diagnostic test for centralized CSRF handling
    if (typeof getCsrfToken === 'function') {
        console.log('Centralized CSRF handling available');
        const token = getCsrfToken();
        console.log('CSRF token test:', token);
    } else {
        console.error('Centralized CSRF handling not available - csrf.js may not be loaded');
    }
    
    // Add debug event listener for all forms
    document.querySelectorAll('form').forEach(form => {
        const originalSubmit = form.onsubmit;
        form.onsubmit = function(e) {
            console.log('Form submission intercepted for debugging:', form.id || 'unnamed form');
            console.log('Form has CSRF token:', !!form.querySelector('input[name="_csrf"]'));
            console.log('getCsrfToken available:', typeof getCsrfToken === 'function');
            
            // Let the original handler run
            if (typeof originalSubmit === 'function') {
                return originalSubmit.call(this, e);
            }
        };
    });
      // Add debug event listener for all buttons with specific classes
    document.querySelectorAll('.delete-btn, .edit-btn, .view-btn, [onclick*="delete"], [onclick*="edit"], [onclick*="view"]').forEach(button => {
        const originalClick = button.onclick;
        button.addEventListener('click', function(e) {
            console.log('Action button clicked, checking CSRF availability');
            console.log('Button:', button.outerHTML);
            console.log('getCsrfToken available:', typeof getCsrfToken === 'function');
            if (typeof getCsrfToken === 'function') {
                const token = getCsrfToken();
                console.log('CSRF token for action:', token.value ? 'Available' : 'NOT AVAILABLE');
                console.log('CSRF header:', token.header);
                if (!token.value) {
                    console.error('WARNING: No CSRF token available for this action, it may fail');
                }
            }
            
            // Don't interfere with original handler
        }, true);
    });
    
    // Check for error messages
    const errorAlert = document.querySelector('.alert-danger');
    if (errorAlert && !errorAlert.classList.contains('d-none')) {
        console.error('Error alert is visible:', errorAlert.textContent);
    }
    
    // Add a debug button
    addDebugButton();
});

// Function to add a debug button to the page
function addDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug CSRF';
    debugBtn.className = 'btn btn-warning btn-sm position-fixed';
    debugBtn.style.bottom = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    
    debugBtn.addEventListener('click', function() {
        // Test API call to debug endpoint
        fetch('/api/debug/csrf')
            .then(response => response.json())
            .then(data => {
                console.log('CSRF Debug Info:', data);
                alert('CSRF Token: ' + (data.token || 'Not found') + 
                      '\nHeader Name: ' + (data.headerName || 'Not found') +
                      '\nParameter Name: ' + (data.parameterName || 'Not found'));
            })
            .catch(error => {
                console.error('Error fetching CSRF info:', error);
                alert('Error checking CSRF: ' + error.message);
            });
    });
    
    document.body.appendChild(debugBtn);
}

// Test a safe POST with proper CSRF
function testCsrfPost() {
    // Get CSRF token from cookie
    const cookies = document.cookie.split(';');
    let csrfToken = '';
    let csrfHeader = 'X-XSRF-TOKEN';
    
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('XSRF-TOKEN=')) {
            csrfToken = decodeURIComponent(cookie.substring('XSRF-TOKEN='.length));
            break;
        }
    }
    
    // If not in cookie, try form field
    if (!csrfToken) {
        const tokenInput = document.querySelector('input[name="_csrf"]');
        if (tokenInput) {
            csrfToken = tokenInput.value;
            csrfHeader = tokenInput.name;
        }
    }
    
    if (!csrfToken) {
        console.error('No CSRF token found for test POST');
        return;
    }
    
    // Make a test POST request
    fetch('/api/debug/csrf-test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [csrfHeader]: csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({ test: 'data' })
    })
    .then(response => {
        console.log('Test POST response status:', response.status);
        return response.text();
    })
    .then(text => {
        console.log('Test POST response:', text);
    })
    .catch(error => {
        console.error('Test POST error:', error);
    });
}
