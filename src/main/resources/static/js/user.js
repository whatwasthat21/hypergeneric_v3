// User management functionality

// Make functions available globally for inline event handlers
window.editUser = function(id) {
    console.log('Global editUser called with ID:', id);
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
    
    if (confirm('Are you sure you want to delete this user?')) {
        fetchWithCsrf(`/api/users/${id}`, {
            method: 'DELETE'
        }).then(response => {
            if (response.ok) {
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

// User management functions
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

function submitEditUser(id) {
    console.log('submitEditUser function called for id:', id);
    
    const form = document.getElementById('editUserForm');
    if (!form) {
        console.error('Edit user form not found');
        return;
    }
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Use the ID from the form input
    const userId = data.id;
    delete data.id;
    
    // Remove password if empty
    if (!data.password) {
        delete data.password;
    }
    
    console.log('Submitting edit user data:', { ...data, password: data.password ? '***' : undefined });
    
    // Show loading indicator on the button
    const submitBtn = document.getElementById('updateUserBtn');
    if (submitBtn) {
        const originalText = submitBtn.textContent;
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
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('User management initialized with CSRF protection');
    
    // Add event listener for create user button
    const createUserBtn = document.querySelector('#createUserModal .btn-primary');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', submitCreateUser);
        console.log('Added event listener for create user button');
    }
      // Add event listener for edit user button
    const updateUserBtn = document.querySelector('#editUserModal .btn-primary');
    if (updateUserBtn) {
        updateUserBtn.addEventListener('click', function() {
            const userId = document.getElementById('editUserId').value;
            submitEditUser(userId);
        });
        console.log('Added event listener for edit user button');
    } else {
        console.error('Update user button not found');
    }
    
    // Add form submit handler
    const form = document.getElementById('createUserForm');
    if (form) {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Form submit event triggered');
            submitCreateUser(event);
        });
        console.log('Form submit handler attached');
    } else {
        console.error('Create user form not found');
    }
    
    // Initialize modal reset behavior
    const createModal = document.getElementById('createUserModal');
    if (createModal) {
        createModal.addEventListener('hidden.bs.modal', function () {
            const form = this.querySelector('form');
            if (form) {
                form.reset();
            }
            const errorAlert = this.querySelector('.alert-danger');
            if (errorAlert) {
                errorAlert.classList.add('d-none');
            }
        });
    }
});
