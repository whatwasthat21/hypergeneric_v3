/**
 * User Global Functions - Standalone Version
 * This file contains global functions for user management with enhanced CSRF handling
 */

// Make functions available globally for inline event handlers
window.editUser = function(id) {
    console.log('Global editUser called with ID:', id);
    
    // Capture current page state before loading user data
    if (window.PageCache) {
        PageCache.captureCurrentPageState();
    }
    
    if (typeof fetchWithCsrf !== 'function') {
        console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
        alert('Error: CSRF utility not available. Please refresh the page.');
        return;
    }
    
    fetchWithCsrf(`/api/users/${id}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById('editUserId').value = user.id;
            document.getElementById('editLogin').value = user.login;
            document.getElementById('editEmail').value = user.email;
            document.getElementById('editFullName').value = user.fullName;
            document.getElementById('editUserType').value = user.userType;
            document.getElementById('editPassword').value = '';
            
            new bootstrap.Modal(document.getElementById('editUserModal')).show();
        })
        .catch(error => {
            console.error('Error loading user details:', error);
            alert('Error loading user details: ' + error.message);
        });
};

window.deleteUser = function(id) {
    console.log('Global deleteUser called with ID:', id);
    if (typeof fetchWithCsrf !== 'function') {
        console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
        alert('Error: CSRF utility not available. Please refresh the page.');
        return;
    }
    
    // Capture current page state before deletion
    if (window.PageCache) {
        PageCache.captureCurrentPageState();
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
        fetchWithCsrf(`/api/users/${id}`, {
            method: 'DELETE'
        }).then(response => {
            if (response.ok) {
                // Clear page cache and trigger success event after deletion
                if (window.PageCache) {
                    PageCache.clearCurrentPageCache();
                    
                    // Trigger AJAX success event
                    if (typeof triggerAjaxSuccess === 'function') {
                        triggerAjaxSuccess({
                            type: 'user',
                            action: 'delete',
                            data: { id: id }
                        });
                    }
                }
                window.location.reload();
            } else {
                return response.text().then(text => {
                    throw new Error(text || 'Error deleting user');
                });
            }
        }).catch(error => {
            console.error('Error deleting user:', error);
            alert('Error deleting user: ' + error.message);
        });
    }
};

window.submitEditUser = function(userId) {
    console.log('Global submitEditUser called with ID:', userId);
    
    // Get form values
    const form = document.getElementById('editUserForm');
    if (!form) {
        console.error('Edit user form not found');
        return;
    }
    
    const loginInput = form.querySelector('#editLogin');
    const passwordInput = form.querySelector('#editPassword');
    const emailInput = form.querySelector('#editEmail');
    const fullNameInput = form.querySelector('#editFullName');
    const userTypeInput = form.querySelector('#editUserType');
    
    // Validate inputs (basic)
    if (!loginInput.value.trim() || !emailInput.value.trim() || !fullNameInput.value.trim()) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Prepare data
    const data = {
        id: userId,
        login: loginInput.value.trim(),
        email: emailInput.value.trim(),
        fullName: fullNameInput.value.trim(),
        userType: userTypeInput.value
    };
    
    // Add password only if provided
    if (passwordInput.value) {
        data.password = passwordInput.value;
    }
    
    console.log('Submitting updated user data:', { ...data, password: data.password ? '***' : undefined });
    
    // Show loading indicator on the button
    const submitBtn = document.querySelector('#editUserModal .btn-primary');
    let originalText = '';
    if (submitBtn) {
        originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Updating...';
    }
    
    fetchWithCsrf(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        if (response.ok) {
            // Clear page cache and trigger success event
            if (window.PageCache) {
                PageCache.clearCurrentPageCache();
                
                // Trigger AJAX success event
                if (typeof triggerAjaxSuccess === 'function') {
                    triggerAjaxSuccess({
                        type: 'user',
                        action: 'update',
                        data: data
                    });
                }
            }
            
            // Close modal and reload page
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            if (modal) {
                modal.hide();
            }
            window.location.reload();
        } else {
            return response.text().then(text => {
                try {
                    const data = JSON.parse(text);
                    throw new Error(data.message || 'Failed to update user');
                } catch (e) {
                    throw new Error('Failed to update user: ' + text);
                }
            });
        }
    }).catch(error => {
        console.error('Error updating user:', error);
        
        // Reset button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
        
        alert('Error updating user: ' + error.message);
    });
};

// Initialize form event handlers when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('User standalone globals loaded - providing global functions');
    
    // Add event listener for create user form
    const form = document.getElementById('createUserForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            submitCreateUser(event);
        });
        console.log('Create user form handler attached');
    }
    
    // Add event listener for edit user button
    const updateUserBtn = document.querySelector('#editUserModal .btn-primary');
    if (updateUserBtn) {
        updateUserBtn.addEventListener('click', function() {
            const userId = document.getElementById('editUserId').value;
            window.submitEditUser(userId);
        });
        console.log('Edit user button handler attached');
    }
    
    function submitCreateUser(event) {
        if (event) {
            event.preventDefault();
        }
        console.log('submitCreateUser function called');
        
        // Get form and validate inputs
        const form = document.getElementById('createUserForm');
        if (!form) {
            console.error('Create user form not found');
            return;
        }
        
        const loginInput = form.querySelector('#login');
        const passwordInput = form.querySelector('#password');
        const emailInput = form.querySelector('#email');
        const fullNameInput = form.querySelector('#fullName');
        const userTypeInput = form.querySelector('#userType');
        const errorAlert = document.getElementById('modalErrorAlert');
        const errorMessage = document.getElementById('errorMessage');
        
        // Clear previous errors
        if (errorAlert) {
            errorAlert.classList.add('d-none');
        }
        
        // Validate inputs
        if (!loginInput.value.trim()) {
            if (errorAlert && errorMessage) {
                errorAlert.classList.remove('d-none');
                errorMessage.textContent = 'Login is required';
            }
            loginInput.focus();
            return;
        }
        
        // Prepare data
        const data = {
            login: loginInput.value.trim(),
            password: passwordInput.value,
            email: emailInput.value.trim(),
            fullName: fullNameInput.value.trim(),
            userType: userTypeInput.value
        };
        
        console.log('Submitting user data:', { ...data, password: '***' });
        
        // Show loading indicator on the button
        const submitBtn = document.getElementById('createButton');
        if (!submitBtn) {
            console.error('Create button not found');
            return;
        }
        
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating...';
        
        // Make API request using fetchWithCsrf
        fetchWithCsrf('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                return response.text().then(text => {
                    try {
                        const data = JSON.parse(text);
                        throw new Error(data.message || 'Failed to create user');
                    } catch (e) {
                        throw new Error('Failed to create user: ' + text);
                    }
                });
            }
            
            return response.json();
        })
        .then(data => {
            console.log('User created successfully:', data);
            
            // Clear page cache and trigger success event
            if (window.PageCache) {
                PageCache.clearCurrentPageCache();
                
                // Trigger AJAX success event
                if (typeof triggerAjaxSuccess === 'function') {
                    triggerAjaxSuccess({
                        type: 'user',
                        action: 'create',
                        data: data
                    });
                }
            }
            
            // Close the modal first
            const modal = document.getElementById('createUserModal');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    console.log('Closing modal with Bootstrap API');
                    bsModal.hide();
                }
            }
            
            // Reset the form
            form.reset();
            
            // Show success message and redirect
            window.location.href = '/users?success=User created successfully';
        })
        .catch(error => {
            console.error('Error creating user:', error);
            
            // Reset submit button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            // Show error message
            if (errorAlert && errorMessage) {
                errorAlert.classList.remove('d-none');
                errorMessage.textContent = error.message || 'An error occurred while creating the user';
            }
        });
    }
});
