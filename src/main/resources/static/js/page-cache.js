/**
 * Page Cache System
 * 
 * This module manages caching of page content and form data when navigating between pages.
 * It prevents data loss when switching between pages and provides a smoother user experience.
 */

// Main PageCache object
const PageCache = (function() {
    // Cache storage
    const cache = new Map();
    
    // Session storage key for cache
    const STORAGE_KEY = 'hg_page_cache';
    
    // Default expiration time (30 minutes)
    const DEFAULT_EXPIRATION = 30 * 60 * 1000;
    
    // Pages that should be cached
    const CACHEABLE_PAGES = [
        '/blueprints',
        '/fields',
        '/items',
        '/users'
    ];
    
    // Initialize the cache from session storage
    function initialize() {
        try {
            const storedCache = sessionStorage.getItem(STORAGE_KEY);
            if (storedCache) {
                const parsed = JSON.parse(storedCache);
                
                // Restore data from storage and check for expiration
                Object.entries(parsed).forEach(([key, value]) => {
                    if (value.expiration > Date.now()) {
                        cache.set(key, value);
                    }
                });
            }
            
            console.log('PageCache initialized');
            
            // Set up beforeunload handler to save forms before navigating away
            window.addEventListener('beforeunload', function(e) {
                captureCurrentPageState();
            });
        } catch (error) {
            console.error('Error initializing page cache:', error);
        }
    }
    
    // Save cache to session storage
    function saveToStorage() {
        try {
            const serializedCache = {};
            cache.forEach((value, key) => {
                serializedCache[key] = value;
            });
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializedCache));
        } catch (error) {
            console.error('Error saving page cache:', error);
        }
    }
    
    // Capture current page state (forms, scroll position, etc.)
    function captureCurrentPageState() {
        const currentPath = window.location.pathname;
        
        if (!CACHEABLE_PAGES.some(page => currentPath.startsWith(page))) {
            return;
        }
        
        // Create cache entry
        const pageState = {
            path: currentPath,
            timestamp: Date.now(),
            expiration: Date.now() + DEFAULT_EXPIRATION,
            title: document.title,
            scrollPosition: {
                x: window.scrollX,
                y: window.scrollY
            },
            forms: []
        };
        
        // Capture all form data
        document.querySelectorAll('form').forEach((form, index) => {
            if (form.id === 'logoutForm') return; // Skip logout form
            
            const formData = new FormData(form);
            const formState = {
                id: form.id || `form_${index}`,
                data: {}
            };
            
            for (const [key, value] of formData.entries()) {
                formState.data[key] = value;
            }
            
            pageState.forms.push(formState);
        });
        
        // Capture modal states
        pageState.modals = [];
        document.querySelectorAll('.modal').forEach(modal => {
            const modalState = {
                id: modal.id,
                isOpen: modal.classList.contains('show')
            };
            pageState.modals.push(modalState);
        });
        
        // Save any additional page-specific data
        pageState.pageData = {};
        
        // Blueprint specific data
        if (currentPath.startsWith('/blueprints')) {
            const blueprintData = document.querySelector('#blueprint-data');
            if (blueprintData) {
                pageState.pageData.blueprints = blueprintData.textContent;
            }
        }
          // Field specific data
        if (currentPath.startsWith('/fields')) {
            captureFieldsPageData(pageState);
        }
        
        // Items specific data
        if (currentPath.startsWith('/items')) {
            captureItemsPageData(pageState);
        }
        
        // Store in cache
        cache.set(currentPath, pageState);
        saveToStorage();
        
        console.log('Page state captured for', currentPath);
        return pageState;
    }
    
    // Capture Fields page specific data
    function captureFieldsPageData(pageState) {
        const typeSelects = document.querySelectorAll('select[name="type"]');
        if (typeSelects.length > 0) {
            pageState.pageData.fieldTypes = Array.from(typeSelects).map(select => ({
                id: select.id,
                value: select.value
            }));
        }
        
        // Capture JSON editors content
        const jsonEditors = document.querySelectorAll('textarea[name$="Json"]');
        if (jsonEditors.length > 0) {
            pageState.pageData.jsonEditors = Array.from(jsonEditors).map(editor => ({
                id: editor.id,
                value: editor.value
            }));
        }
    }
    
    // Restore page state
    function restorePageState() {
        const currentPath = window.location.pathname;
        
        if (!cache.has(currentPath)) {
            return false;
        }
        
        const pageState = cache.get(currentPath);
        
        // Check if cache has expired
        if (pageState.expiration < Date.now()) {
            cache.delete(currentPath);
            saveToStorage();
            return false;
        }
        
        // Restore form data
        pageState.forms.forEach(formState => {
            const form = document.getElementById(formState.id) || document.querySelector(`form[name="${formState.id}"]`);
            
            if (!form) return;
            
            Object.entries(formState.data).forEach(([key, value]) => {
                const field = form.elements[key];
                if (!field) return;
                
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = (value === 'on' || value === 'true' || value === true);
                } else {
                    field.value = value;
                }
            });
        });
        
        // Restore scroll position
        if (pageState.scrollPosition) {
            window.scrollTo(pageState.scrollPosition.x, pageState.scrollPosition.y);
        }
        
        // Restore modals
        if (pageState.modals) {
            pageState.modals.forEach(modalState => {
                if (modalState.isOpen) {
                    const modal = document.getElementById(modalState.id);
                    if (modal) {
                        const bsModal = new bootstrap.Modal(modal);
                        bsModal.show();
                    }
                }
            });
        }
          // Restore page-specific data
        if (pageState.pageData) {
            // Field specific data
            if (currentPath.startsWith('/fields') && pageState.pageData.fieldTypes) {
                restoreFieldsPageData(pageState);
            }
            
            // Items specific data
            if (currentPath.startsWith('/items') && (pageState.pageData.blueprintId || pageState.pageData.versionId)) {
                restoreItemsPageData(pageState);
            }
        }
        
        console.log('Page state restored for', currentPath);
        return true;
    }
      // Restore Fields page specific data
    function restoreFieldsPageData(pageState) {
        // Restore field types
        if (pageState.pageData.fieldTypes) {
            pageState.pageData.fieldTypes.forEach(fieldType => {
                const select = document.getElementById(fieldType.id);
                if (select) {
                    select.value = fieldType.value;
                    // Trigger change events
                    const event = new Event('change');
                    select.dispatchEvent(event);
                }
            });
        }
        
        // Restore JSON editors
        if (pageState.pageData.jsonEditors) {
            pageState.pageData.jsonEditors.forEach(editor => {
                const textArea = document.getElementById(editor.id);
                if (textArea) {
                    textArea.value = editor.value;
                }
            });
        }
    }
    
    // Capture Items page specific data
    function captureItemsPageData(pageState) {
        // Capture blueprint and version selection
        const blueprintSelect = document.getElementById('blueprintId');
        const versionSelect = document.getElementById('versionId');
        
        if (blueprintSelect) {
            pageState.pageData.blueprintId = blueprintSelect.value;
        }
        
        if (versionSelect) {
            pageState.pageData.versionId = versionSelect.value;
        }
        
        // Capture JSON data in create/edit forms
        const createDataField = document.getElementById('data');
        const editDataField = document.getElementById('editData');
        
        if (createDataField) {
            pageState.pageData.createItemData = createDataField.value;
        }
        
        if (editDataField) {
            pageState.pageData.editItemData = editDataField.value;
        }
    }
    
    // Restore Items page specific data
    function restoreItemsPageData(pageState) {
        // Restore blueprint selection
        const blueprintSelect = document.getElementById('blueprintId');
        if (blueprintSelect && pageState.pageData.blueprintId) {
            blueprintSelect.value = pageState.pageData.blueprintId;
            
            // Trigger change event to load versions
            const event = new Event('change');
            blueprintSelect.dispatchEvent(event);
            
            // Need to restore version selection after versions are loaded
            if (pageState.pageData.versionId) {
                setTimeout(() => {
                    const versionSelect = document.getElementById('versionId');
                    if (versionSelect) {
                        versionSelect.value = pageState.pageData.versionId;
                    }
                }, 500); // Give time for versions to load
            }
        }
        
        // Restore JSON data in create/edit forms
        const createDataField = document.getElementById('data');
        const editDataField = document.getElementById('editData');
        
        if (createDataField && pageState.pageData.createItemData) {
            createDataField.value = pageState.pageData.createItemData;
        }
        
        if (editDataField && pageState.pageData.editItemData) {
            editDataField.value = pageState.pageData.editItemData;
        }
    }
    
    // Clear cache for the current page
    function clearCurrentPageCache() {
        const currentPath = window.location.pathname;
        if (cache.has(currentPath)) {
            cache.delete(currentPath);
            saveToStorage();
            console.log('Cache cleared for', currentPath);
        }
    }
    
    // Clear all cached data
    function clearAllCache() {
        cache.clear();
        sessionStorage.removeItem(STORAGE_KEY);
        console.log('All cache cleared');
    }
    
    // Public API
    return {
        initialize: initialize,
        captureCurrentPageState: captureCurrentPageState,
        restorePageState: restorePageState,
        clearCurrentPageCache: clearCurrentPageCache,
        clearAllCache: clearAllCache,
        // For debugging purposes
        _getCache: function() {
            const serializedCache = {};
            cache.forEach((value, key) => {
                serializedCache[key] = value;
            });
            return serializedCache;
        }
    };
})();

// Initialize the cache system on page load
document.addEventListener('DOMContentLoaded', function() {
    PageCache.initialize();
    
    // Set up navigation tracking
    setupNavigationTracking();
    
    // Try to restore page state
    setTimeout(() => {
        PageCache.restorePageState();
    }, 100);
});

// Handle form submissions to clear cache after successful submit
function setupNavigationTracking() {
    // Track form submissions
    document.addEventListener('submit', function(event) {
        const form = event.target;
        
        // Skip if it's the logout form
        if (form.id === 'logoutForm') return;
        
        // For AJAX form submissions
        if (form.dataset.ajaxSubmit === 'true') {
            // The cache will be cleared on successful submission by the form's own handler
            return;
        }
        
        // Capture state before traditional form submission
        PageCache.captureCurrentPageState();
    });
    
    // Handle AJAX success cases for various pages
    document.addEventListener('hg:ajax-success', function(event) {
        // Clear cache after successful AJAX submission
        // This assumes a custom event is triggered after successful AJAX operations
        PageCache.clearCurrentPageCache();
    });
    
    // Track link clicks for navigation
    document.addEventListener('click', function(event) {
        // Find closest anchor element
        const link = event.target.closest('a');
        
        if (!link) return;
        
        // Skip links with no href or javascript:void(0)
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('javascript:')) return;
        
        // Skip download links and external links
        if (link.getAttribute('download') || link.getAttribute('target') === '_blank') return;
        
        // Check if it's a navigation link
        if (href.startsWith('/') || href === '.' || href === '..') {
            // Capture current page state before navigation
            PageCache.captureCurrentPageState();
        }
    });
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        // Capture state before navigating away
        PageCache.captureCurrentPageState();
    });
}

// Helper function to dispatch a custom event when AJAX requests succeed
// This should be used in your AJAX success handlers
function triggerAjaxSuccess(detail = {}) {
    const event = new CustomEvent('hg:ajax-success', {
        detail: detail,
        bubbles: true
    });
    document.dispatchEvent(event);
}

// For debugging
window.PageCache = PageCache;

// Add debugging log function to help troubleshoot cache operations
window.debugPageCache = function() {
    console.log('Current PageCache status:');
    
    // Access cache via exposed method for debugging
    if (PageCache && typeof PageCache._getCache === 'function') {
        const cacheContents = PageCache._getCache();
        console.log('In-memory cache contents:', cacheContents);
        
        const currentPath = window.location.pathname;
        const hasCache = Object.keys(cacheContents).includes(currentPath);
        
        console.log('Current path:', currentPath);
        console.log('Has cache for current path:', hasCache);
        
        if (hasCache) {
            console.log('Cache for current path:', cacheContents[currentPath]);
        }
    }
    
    // Also check sessionStorage
    const storedCache = sessionStorage.getItem('hg_page_cache');
    if (storedCache) {
        console.log('SessionStorage cache:', JSON.parse(storedCache));
    } else {
        console.log('No cache in sessionStorage');
    }
};