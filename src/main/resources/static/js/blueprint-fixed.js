// Blueprint management functionality with page cache integration
console.log('Loading blueprint-fixed.js management module (with event handler fix)');

// Global blueprint management namespace
(function(window) {
    'use strict';

    // Flag to prevent duplicate initialization
    let initialized = false;
    
    // Set a global flag to prevent multiple script loading issues
    if (window.blueprintScriptLoaded) {
        console.warn('WARNING: Another blueprint script was already loaded. Preventing duplicate initialization.');
        return; // Exit immediately to prevent double initialization
    }
    window.blueprintScriptLoaded = true;
    
    // Make functions available globally for inline event handlers
    window.viewVersions = function(id) {
        console.log('Navigating to blueprint versions:', id);
        
        // Save current page state before navigation (if page cache is enabled)
        if (window.PageCache) {
            PageCache.captureCurrentPageState();
        }
        
        window.location.href = `/blueprints/${id}`;
    };

    // Function to toggle versions visibility
    window.toggleVersions = function(blueprintId) {
        console.log('Toggling versions for blueprint ID:', blueprintId);
        
        const versionsRow = document.getElementById(`versions-row-${blueprintId}`);
        if (!versionsRow) {
            console.error(`Versions row not found for blueprint ID ${blueprintId}`);
            return;
        }
        
        const chevron = document.getElementById(`chevron-${blueprintId}`);
        if (chevron) {
            chevron.classList.toggle('fa-chevron-down');
            chevron.classList.toggle('fa-chevron-right');
        }
        
        // Toggle the visibility
        if (versionsRow.classList.contains('d-none')) {
            // Show the versions row
            versionsRow.classList.remove('d-none');
            
            // Check if versions need to be loaded
            const versionsList = versionsRow.querySelector('.versions-list');
            if (versionsList && versionsList.children.length === 0) {
                loadVersions(blueprintId);
            }
        } else {
            // Hide the versions row
            versionsRow.classList.add('d-none');
        }
    };    // Function to load versions data
    window.loadVersions = function(blueprintId) {
        const versionsRow = document.getElementById(`versions-row-${blueprintId}`);
        if (!versionsRow) return;

        const loadingIndicator = versionsRow.querySelector('.versions-loading');
        const versionsList = versionsRow.querySelector('.versions-list');
        
        if (!versionsList || !loadingIndicator) return;
        
        loadingIndicator.classList.remove('d-none');
        
        // Get CSRF token
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
        const csrfToken = document.querySelector('meta[name="_csrf"]').content;
        
        fetch(`/api/blueprints/${blueprintId}/versions`, {
            headers: {
                [csrfHeader]: csrfToken,
                'Accept': 'application/json' // Add this line
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(versions => {
            loadingIndicator.classList.add('d-none');
            
            if (!versions || versions.length === 0) {
                versionsList.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No versions available
                    </div>
                `;
                return;
            }
            
            // Sort versions by version number (descending)
            versions.sort((a, b) => b.versionNumber - a.versionNumber);
            
            versionsList.innerHTML = `
                <table class="table table-sm table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Version</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Created By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${versions.map(version => `
                            <tr>
                                <td>${version.versionNumber}</td>
                                <td>${version.name || ''}</td>
                                <td>${version.description || ''}</td>
                                <td>
                                    <span class="badge ${version.active ? 'bg-success' : 'bg-secondary'}">
                                        ${version.active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>${version.createdBy || ''}</td>
                                <td>                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-info view-fields-btn" data-id="${version.id}" onclick="viewVersionDetail(${version.id})">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                        ${!version.active ? `
                                            <button class="btn btn-success activate-version-btn" data-id="${version.id}" onclick="activateVersion(${version.id})">
                                                <i class="fas fa-check"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn btn-danger delete-version-btn" data-id="${version.id}" onclick="deleteBlueprintVersion(${version.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>                </table>
            `;
            
            // Dispatch an event to notify that versions have been loaded
            document.dispatchEvent(new CustomEvent('versions:loaded', {
                detail: { blueprintId, versions }
            }));
        })
        .catch(error => {
            console.error('Error loading versions:', error);
            loadingIndicator.classList.add('d-none');
            versionsList.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error loading versions: ${error.message}
                </div>
            `;
        });
    }

    // Global createVersion function for showing the create version form
    window.createVersion = function(id) {
        console.log('Creating version for blueprint ID:', id);
        
        // Toggle versions visibility first
        const versionsRow = document.getElementById(`versions-row-${id}`);
        if (versionsRow && versionsRow.classList.contains('d-none')) {
            toggleVersions(id);
        }
        
        // Set the blueprint ID in the hidden form field
        const blueprintIdField = document.getElementById('versionBlueprintId');
        if (blueprintIdField) {
            blueprintIdField.value = id;
        }
        
        // Clear any previous form values
        const form = document.getElementById('createVersionForm');
        if (form) {
            form.reset();
            // Focus on the first input field
            const firstInput = form.querySelector('input[type="text"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    };

    // Edit blueprint functionality
    window.editBlueprint = function(id) {
        console.log('Edit blueprint:', id);
        if (typeof fetchWithCsrf !== 'function') {
            console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
            alert('Error: CSRF utility not available. Please refresh the page.');
            return;
        }
        
        fetchWithCsrf(`/api/blueprints/${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch blueprint details');
                }
                return response.json();
            })
            .then(blueprint => {
                // Set form values
                document.getElementById('editBlueprintId').value = blueprint.id;
                document.getElementById('editName').value = blueprint.name;
                document.getElementById('editDescription').value = blueprint.description || '';
                
                // Show the modal
                const modal = document.getElementById('editBlueprintModal');
                if (modal) {
                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();
                }
            })
            .catch(error => {
                console.error('Error fetching blueprint:', error);
                alert('Failed to load blueprint details. Please try again.');
            });
    };
    
    // Delete blueprint functionality
    window.deleteBlueprint = function(id) {
        if (!confirm('Are you sure you want to delete this blueprint? This action cannot be undone.')) {
            return;
        }
        
        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="_csrf"]').content;
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]').content;
        
        fetch(`/api/blueprints/${id}`, {
            method: 'DELETE',
            headers: {
                [csrfHeader]: csrfToken,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete blueprint');
            }
            
            // Show success message
            const toast = document.createElement('div');
            toast.className = 'position-fixed bottom-0 end-0 p-3 toast show';
            toast.style.zIndex = '11';
            toast.innerHTML = `
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Blueprint deleted successfully!
                </div>
            `;
            document.body.appendChild(toast);
            
            // Remove the blueprint row and its versions row
            const blueprintRow = document.getElementById(`blueprint-row-${id}`);
            const versionsRow = document.getElementById(`versions-row-${id}`);
            if (blueprintRow) blueprintRow.remove();
            if (versionsRow) versionsRow.remove();
            
            // Remove toast after delay
            setTimeout(() => {
                toast.remove();
            }, 3000);
        })
        .catch(error => {
            console.error('Error deleting blueprint:', error);
            alert(`Failed to delete blueprint: ${error.message}`);
        });
    };    // Submit Create Blueprint with duplicate submission protection
    // Use a debounce mechanism to prevent multiple submissions
    let submitInProgress = false;
    let lastSubmitTime = 0;
    const DEBOUNCE_TIMEOUT = 500; // ms

    function submitCreateBlueprint(event) {
        if (event) {
            event.preventDefault();
        }
        
        // Get current timestamp
        const now = Date.now();
        
        // Check if submission is already in progress or if it's too soon after previous submission
        if (submitInProgress) {
            console.warn('Blocking duplicate submission - already in progress');
            return;
        }
        
        if (now - lastSubmitTime < DEBOUNCE_TIMEOUT) {
            console.warn(`Blocking duplicate submission - too soon (${now - lastSubmitTime}ms since last submit)`);
            return;
        }
        
        // Update submission state
        submitInProgress = true;
        lastSubmitTime = now;
        
        console.log('submitCreateBlueprint function called at ' + new Date().toISOString());
        
        // Get form and validate inputs
        const form = document.getElementById('createBlueprintForm');
        if (!form) {
            console.error('Create blueprint form not found');
            submitInProgress = false;
            return;
        }
        
        const nameInput = form.querySelector('input[name="name"]');
        const descInput = form.querySelector('textarea[name="description"]');
        
        // Validate inputs
        if (!nameInput || !nameInput.value.trim()) {
            alert('Name is required');
            if (nameInput) nameInput.focus();
            return;
        }
        
        // Check if CSRF functionality is available
        if (typeof fetchWithCsrf !== 'function') {
            console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
            alert('Error: CSRF utility not available. Please refresh the page.');
            return;
        }
        
        // Prepare data
        const data = {
            name: nameInput.value.trim(),
            description: descInput ? descInput.value.trim() : ''
        };
        
        console.log('Submitting blueprint data:', data);
    
        // Make API request using fetchWithCsrf
        fetchWithCsrf('/api/blueprints', {
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
                    throw new Error('Failed to create blueprint: ' + text);
                });
            }
            
            return response.json();
        })
        .then(data => {
            console.log('Blueprint created successfully:', data);
              // Close the modal first
            const modal = document.getElementById('createBlueprintModal');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }

            // Reset the form
            form.reset();
            
            // Show a success toast
            const toast = document.createElement('div');
            toast.className = 'position-fixed bottom-0 end-0 p-3 toast show';
            toast.style.zIndex = '11';
            toast.innerHTML = `
                <div class="toast-header bg-success text-white">
                    <strong class="me-auto">Success</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    Blueprint created successfully!
                </div>
            `;
            document.body.appendChild(toast);
            
            // Remove toast after 3 seconds
            setTimeout(() => {
                toast.remove();
            }, 3000);            // Add the new blueprint to the table
            const blueprintsTable = document.querySelector('table tbody');
            if (blueprintsTable) {
                const newRow = document.createElement('tr');
                newRow.id = `blueprint-row-${data.id}`;
                newRow.className = 'blueprint-row';
                newRow.innerHTML = `
                    <td>
                        <button class="btn btn-link p-0" onclick="toggleVersions(${data.id})" style="text-decoration: none;">
                            <i class="fas fa-chevron-right me-2" id="chevron-${data.id}"></i>
                            <span>${data.name}</span>
                        </button>
                    </td>
                    <td>${data.description || ''}</td>
                    <td></td>
                    <td>${data.createdBy || 'Administrator'}</td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-primary" onclick="editBlueprint(${data.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="toggleVersions(${data.id})">
                                <i class="fas fa-code-branch"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteBlueprint(${data.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                `;
                // Insert at the top instead of bottom
                blueprintsTable.insertBefore(newRow, blueprintsTable.firstChild);                // Add the versions row
                const versionsRow = document.createElement('tr');
                versionsRow.id = `versions-row-${data.id}`;
                versionsRow.className = 'versions-row d-none';
                versionsRow.innerHTML = `
                    <td colspan="5">
                        <div class="versions-container bg-light">
                            <!-- Create Version Form -->
                            <div class="versions-form bg-dark text-light rounded shadow">
                                <h5 class="mb-3">Create New Version</h5>
                                <form id="createVersionForm" onsubmit="return false;">
                                    <input type="hidden" id="versionBlueprintId-${data.id}" value="${data.id}">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <label for="name" class="form-label text-light">Name</label>
                                            <input type="text" class="form-control bg-secondary text-light border-0" id="name" name="name" required="">
                                        </div>
                                        <div class="col-md-6">
                                            <label for="description" class="form-label text-light">Description</label>
                                            <input type="text" class="form-control bg-secondary text-light border-0" id="description" name="description">
                                        </div>
                                        <div class="col-12">
                                            <div class="form-check">
                                                <input type="checkbox" class="form-check-input" id="active" name="active">
                                                <label class="form-check-label text-light" for="active">Set as active version</label>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <button type="submit" class="btn btn-primary" onclick="submitCreateBlueprintVersion(event)">
                                                Create Version
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                            
                            <!-- Loading Indicator -->
                            <div class="versions-loading text-center py-3 d-none">
                                <div class="spinner-border spinner-border-sm" role="status">
                                    <span class="visually-hidden">Loading versions...</span>
                                </div>
                            </div>
                            
                            <!-- Versions List -->
                            <div class="versions-list">
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle me-2"></i>
                                    No versions available
                                </div>
                            </div>
                        </div>
                    </td>
                `;                // Insert the versions row right after the blueprint row
                blueprintsTable.insertBefore(versionsRow, newRow.nextSibling);
            }
            
            // Reset submission state on success
            submitInProgress = false;
        }).catch(error => {
            console.error('Error creating blueprint:', error);
            alert(error.message);
            // Reset submission state on error
            submitInProgress = false;
        });
        
        // Set a timeout to reset the flag even if the request hangs
        setTimeout(() => {
            if (submitInProgress) {
                console.log('Resetting submission lock after timeout');
                submitInProgress = false;
            }
        }, 10000); // 10 seconds timeout
    }

    // Submit Edit Blueprint
    function submitEditBlueprint() {
        console.log('submitEditBlueprint function called');
        
        // Get form and validate inputs
        const form = document.getElementById('editBlueprintForm');
        if (!form) {
            console.error('Edit blueprint form not found');
            return;
        }
        
        const nameInput = form.querySelector('input[name="name"]');
        const descInput = form.querySelector('textarea[name="description"]');
        const idInput = document.getElementById('editBlueprintId');
        
        // Validate inputs
        if (!nameInput || !nameInput.value.trim()) {
            alert('Name is required');
            if (nameInput) nameInput.focus();
            return;
        }
        
        if (!idInput || !idInput.value) {
            console.error('Blueprint ID not found');
            return;
        }
        
        // Check if CSRF functionality is available
        if (typeof fetchWithCsrf !== 'function') {
            console.error('CSRF utility functions not found. Make sure csrf.js is loaded.');
            alert('Error: CSRF utility not available. Please refresh the page.');
            return;
        }
        
        // Prepare data
        const data = {
            name: nameInput.value.trim(),
            description: descInput ? descInput.value.trim() : '',
        };
        
        console.log('Submitting updated blueprint data:', data);
        
        // Make API request using fetchWithCsrf
        fetchWithCsrf(`/api/blueprints/${idInput.value}`, {
            method: 'PUT',
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
                    throw new Error('Failed to update blueprint: ' + text);
                });
            }
            
            return response.json();
        })
        .then(data => {
            // Close the modal
            const modal = document.getElementById('editBlueprintModal');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
            // Reload the page to show the updated blueprint
            window.location.reload();
        })
        .catch(error => {
            console.error('Error updating blueprint:', error);
            alert(error.message);
        });
    }    // Initialize event listeners
    function initialize() {
        if (initialized) {
            console.warn('Blueprint management already initialized');
            return;
        }

        console.log('Blueprint-fixed management initializing...');

        // Add form submit handler
        const createForm = document.getElementById('createBlueprintForm');
        if (createForm) {
            // Remove any existing handlers first to be safe
            const newCreateForm = createForm.cloneNode(true);
            createForm.parentNode.replaceChild(newCreateForm, createForm);
            
            // Add our handler
            newCreateForm.addEventListener('submit', submitCreateBlueprint);
            console.log('Create blueprint form handler attached (with duplication protection)');
        }
        
        // Add edit form submit handler
        const editForm = document.getElementById('editBlueprintForm');
        if (editForm) {
            editForm.addEventListener('submit', function(e) {
                e.preventDefault();
                submitEditBlueprint();
            });
            console.log('Edit blueprint form handler attached');
        }
        
        // Add event handler for update button
        const updateBtn = document.getElementById('updateButton');
        if (updateBtn) {
            updateBtn.addEventListener('click', submitEditBlueprint);
        }
        
        // IMPORTANT: For the create button, we DO NOT add a click handler
        // because we're using the form submit event, which is triggered when the button is clicked
        const createBtn = document.getElementById('createButton');
        if (createBtn) {
            console.log('Create button found - NOT adding click handler (form submit is sufficient)');
            
            // Remove any existing click handlers by cloning the button
            if (createBtn.onclick || createBtn._hasClickListener) {
                console.warn('Found existing click handler on create button - removing it');
                const newBtn = createBtn.cloneNode(true);
                createBtn.parentNode.replaceChild(newBtn, createBtn);
            }
        }

        initialized = true;
        console.log('Blueprint management initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState !== 'loading') {
        initialize();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        window.attachEvent('onload', initialize);
    }

})(window);
