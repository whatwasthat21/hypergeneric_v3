// Blueprint management functionality

// Utility function to get CSRF token
function getCsrfToken() {
    console.log('Retrieving CSRF token for API request');
    
    // Try to get token from form field
    const csrfInput = document.querySelector('input[name="_csrf"]');
    if (csrfInput) {
        console.log('Found CSRF token in form input:', csrfInput.name, csrfInput.value);
        return {
            header: 'X-XSRF-TOKEN', // Spring Security with CookieCsrfTokenRepository expects X-XSRF-TOKEN
            value: csrfInput.value
        };
    }
    
    // Try to get token from meta tag
    const metaCsrf = document.querySelector('meta[name="_csrf"]');
    const metaCsrfHeader = document.querySelector('meta[name="_csrf_header"]');
    if (metaCsrf && metaCsrfHeader) {
        console.log('Found CSRF token in meta tags:', metaCsrfHeader.content, metaCsrf.content);
        return {
            header: 'X-XSRF-TOKEN', // Spring Security with CookieCsrfTokenRepository expects X-XSRF-TOKEN
            value: metaCsrf.content
        };
    }
    
    // Try to get token from cookies
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('XSRF-TOKEN=')) {
            const token = decodeURIComponent(cookie.substring('XSRF-TOKEN='.length));
            console.log('Found CSRF token in cookies as XSRF-TOKEN:', token);
            return {
                header: 'X-XSRF-TOKEN',
                value: token
            };
        }
    }
    
    console.warn('CSRF token not found in form, meta tags, or cookies');
    return {
        header: 'X-XSRF-TOKEN',
        value: ''
    };
}

// Helper function to add CSRF token to fetch options
function addCsrfToFetchOptions(options = {}) {
    const csrf = getCsrfToken();
    
    // Initialize headers if not present
    if (!options.headers) {
        options.headers = {};
    }
    
    // Add CSRF token to headers
    options.headers[csrf.header] = csrf.value;
    
    // Ensure credentials are included
    options.credentials = 'include';
    
    return options;
}

// Helper function to perform fetch with CSRF token
function fetchWithCsrf(url, options = {}) {
    return fetch(url, addCsrfToFetchOptions(options));
}

// Create Blueprint
function submitCreateBlueprint() {
    console.log('submitCreateBlueprint function called');
    
    // Get form and validate inputs
    const form = document.getElementById('createBlueprintForm');
    if (!form) {
        console.error('Create blueprint form not found');
        return;
    }
    
    const nameInput = document.getElementById('name');
    const descInput = document.getElementById('description');
    const errorAlert = document.getElementById('modalErrorAlert');
    const errorMessage = document.getElementById('errorMessage');
    
    // Clear previous errors
    if (errorAlert) {
        errorAlert.classList.add('d-none');
    }
    
    // Validate inputs
    if (!nameInput || !nameInput.value.trim()) {
        if (errorAlert && errorMessage) {
            errorAlert.classList.remove('d-none');
            errorMessage.textContent = 'Name is required';
        }
        if (nameInput) nameInput.focus();
        return;
    }
    
    // Prepare data
    const data = {
        name: nameInput.value.trim(),
        description: descInput ? descInput.value.trim() : ''
    };
    console.log('Submitting blueprint data:', data);
    
    // Use the CSRF utility from csrf.js
    const csrf = getCsrfToken();
    if (!csrf.value) {
        console.error('CSRF token not found');
        if (errorAlert && errorMessage) {
            errorAlert.classList.remove('d-none');
            errorMessage.textContent = 'Authentication error. Please refresh the page.';
        }
        return;
    }
    console.log('Using CSRF token:', csrf.header, csrf.value);
    
    // Show loading indicator
    const submitBtn = document.getElementById('createButton');
    if (!submitBtn) {
        console.error('Create button not found');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
    
    // Use fetchWithCsrf utility from csrf.js if available, otherwise use regular fetch with CSRF token
    const fetchFn = typeof fetchWithCsrf === 'function' ? fetchWithCsrf : fetch;
    
    const fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
    };
    
    // Add CSRF token to headers
    fetchOptions.headers[csrf.header] = csrf.value;
    
    console.log('Request headers:', fetchOptions.headers);
    
    fetchFn('/api/blueprints', fetchOptions)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', 
                Array.from(response.headers.entries())
                    .map(([key, val]) => `${key}: ${val}`)
                    .join(', ')
            );
            
            // Handle specific HTTP status codes
            if (response.status === 403) {
                throw new Error('Authentication error (403 Forbidden). Please refresh the page and try again.');
            } else if (response.status === 400) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Invalid blueprint data. Please check your input.');
                });
            } else if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to create blueprint');
                }).catch(e => {
                    if (e instanceof SyntaxError) {
                        // JSON parse error (no body or invalid JSON)
                        throw new Error(`Error ${response.status}: ${response.statusText}`);
                    }
                    throw e;
                });
            }
            
            return response.json();
        })
        .then(data => {
            console.log('Blueprint created successfully:', data);
            
            // Reset submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
              // Close the modal
            const modal = document.getElementById('createBlueprintModal');
            if (modal) {
                try {
                    const bsModal = bootstrap.Modal.getInstance(modal);
                    if (bsModal) {
                        bsModal.hide();
                    } else {
                        // Try direct DOM approach
                        modal.classList.remove('show');
                        modal.style.display = 'none';
                        document.body.classList.remove('modal-open');
                        const backdrop = document.querySelector('.modal-backdrop');
                        if (backdrop) {
                            backdrop.remove();
                        }
                    }
                } catch (e) {
                    console.error('Error closing modal:', e);
                }
            }
            
            // Reset the form
            form.reset();
            
            // Show success message and reload
            window.location.href = '/blueprints?success=Blueprint created successfully';
        })
        .catch(error => {
            console.error('Error creating blueprint:', error);
            
            // Reset submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            // Show error message in the modal
            if (errorAlert && errorMessage) {
                errorAlert.classList.remove('d-none');
                errorMessage.textContent = error.message || 'An error occurred while creating the blueprint';
            }
        });
}

// View Versions
function viewVersions(id) {
    // Get CSRF token for potential navigation security
    const csrf = getCsrfToken();
    
    // Add token to URL if needed (this is just for demonstration, not typically needed for GET)
    let url = `/blueprints/${id}`;
    if (csrf.value) {
        // Using URLSearchParams to safely add parameters
        const params = new URLSearchParams();
        params.append(csrf.header, csrf.value);
        url = `${url}?${params.toString()}`;
    }
    
    window.location.href = url;
}

// Edit Blueprint
function editBlueprint(id) {
    // Get CSRF token for security
    const csrf = getCsrfToken();
    if (!csrf.value) {
        console.warn('CSRF token not found for edit operation');
    }
    
    // This is just a placeholder for now
    alert('Edit functionality will be implemented soon');
}

// Delete Blueprint
function deleteBlueprint(id) {
    if (confirm('Are you sure you want to delete this blueprint?')) {
        // Get CSRF token
        const csrf = getCsrfToken();
        if (!csrf.value) {
            console.error('CSRF token not found for delete operation');
            alert('Authentication error. Please refresh the page and try again.');
            return;
        }
        console.log('Using CSRF token for delete:', csrf.header, csrf.value);
        
        // Use fetchWithCsrf utility from csrf.js if available
        const fetchFn = typeof fetchWithCsrf === 'function' ? fetchWithCsrf : fetch;
        
        const fetchOptions = {
            method: 'DELETE',
            headers: {},
            credentials: 'include'
        };
        
        // Add CSRF token to headers
        fetchOptions.headers[csrf.header] = csrf.value;
        
        fetchFn(`/api/blueprints/${id}`, fetchOptions)
            .then(response => {
                if (response.ok) {
                    window.location.reload();
                } else {
                    alert('Error deleting blueprint');
                }
            });
    }
}

// Initialize event listeners when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Blueprint.js loaded');
    
    // Add event listeners for blueprint modal buttons
    const createButton = document.getElementById('createButton');
    if (createButton) {
        createButton.addEventListener('click', submitCreateBlueprint);
        console.log('Create button event listener attached');
    }
    
    // Add event listeners for view buttons
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            viewVersions(id);
        });
    });
    
    // Add event listeners for edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editBlueprint(id);
        });
    });
    
    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteBlueprint(id);
        });
    });
});
