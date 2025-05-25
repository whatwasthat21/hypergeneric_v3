// CSRF token management and form utilities

// Get CSRF token from meta tags, form inputs, or cookies
function getCsrfToken() {
    console.log('Getting CSRF token for request...');
    
    // Try to get from form first
    let token = document.querySelector('input[name="_csrf"]');
    let header = document.querySelector('input[name="_csrf_header"]');
    
    if (token && header) {
        console.log('Found CSRF in form inputs:', token.value);
        return {
            value: token.value,
            header: header.value
        };
    }
    
    // Try meta tags next
    token = document.querySelector('meta[name="_csrf"]');
    header = document.querySelector('meta[name="_csrf_header"]');
    
    if (token && header) {
        console.log('Found CSRF in meta tags:', token.content);
        return {
            value: token.content,
            header: header.content
        };
    }
      // Try hidden form fields with specific IDs
    token = document.getElementById('_csrf');
    header = document.getElementById('_csrf_header');
    
    if (token && header) {
        console.log('Found CSRF in hidden fields by ID:', token.value);
        return {
            value: token.value,
            header: header.value
        };
    }
    
    // Try to get from cookies
    const cookies = document.cookie.split(';');
    let xsrfToken = null;
    
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.indexOf('XSRF-TOKEN=') === 0) {
            xsrfToken = decodeURIComponent(cookie.substring('XSRF-TOKEN='.length));
            console.log('Found CSRF in cookies:', xsrfToken);
            return {
                value: xsrfToken,
                header: 'X-XSRF-TOKEN'
            };
        }
    }
    
    console.warn('CSRF token not found in DOM or cookies');
    return { value: '', header: '' };
}

// Add CSRF token to fetch options
function addCsrfToFetchOptions(options = {}) {
    const csrf = getCsrfToken();
    
    if (!csrf.value) {
        console.warn('No CSRF token available for request - this will likely cause a 403 error');
        // Continue anyway but log a warning - don't fail silently
    } else {
        console.log(`Adding CSRF token to request headers: ${csrf.header}=${csrf.value.substring(0, 6)}...`);
    }
    
    // Initialize headers if not present
    options.headers = options.headers || {};
    
    // Add CSRF token to headers if available
    if (csrf.value && csrf.header) {
        options.headers[csrf.header] = csrf.value;
    }
    
    // Ensure credentials are included for cookies to be sent
    options.credentials = 'same-origin';
    
    return options;
}

// Perform fetch with CSRF token automatically added
function fetchWithCsrf(url, options = {}) {
    const csrfOptions = addCsrfToFetchOptions(options);
    const method = options.method || 'GET';
    console.log(`Executing ${method} fetch with CSRF to ${url}`);
    
    return fetch(url, csrfOptions)
        .then(response => {
            if (response.status === 403) {
                console.error('CSRF token validation likely failed - received 403 Forbidden');
            }
            return response;
        })
        .catch(error => {
            console.error(`CSRF-protected fetch to ${url} failed:`, error);
            throw error;
        });
}

// Utility function to help manage modals
function initializeModal(modalId, formId, submitHandler) {
    const modal = document.getElementById(modalId);
    const form = document.getElementById(formId);
    
    if (!modal || !form) {
        console.error(`Modal (${modalId}) or form (${formId}) not found`);
        return;
    }
    
    // Reset form and errors when modal is closed
    modal.addEventListener('hidden.bs.modal', function () {
        form.reset();
        const errorAlert = modal.querySelector('.alert-danger');
        if (errorAlert) {
            errorAlert.classList.add('d-none');
        }
    });
    
    // Handle form submission
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (typeof submitHandler === 'function') {
            submitHandler(event);
        }
    });
}

// Initialize all forms with CSRF tokens
function initializeFormHandling(form) {
    if (!form) return;
    
    // Ensure form has CSRF tokens
    const csrf = getCsrfToken();
    if (!csrf.value) {
        console.warn('No CSRF token available for form initialization');
        return;
    }
    
    let tokenInput = form.querySelector('input[name="_csrf"]');
    let headerInput = form.querySelector('input[name="_csrf_header"]');
    
    if (!tokenInput) {
        tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = '_csrf';
        tokenInput.value = csrf.value;
        form.appendChild(tokenInput);
    }
    
    if (!headerInput) {
        headerInput = document.createElement('input');
        headerInput.type = 'hidden';
        headerInput.name = '_csrf_header';
        headerInput.value = csrf.header;
        form.appendChild(headerInput);
    }
}
