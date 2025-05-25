// Field debugging utilities

// Debug ajax requests
function debugFieldAjax() {
    const originalFetch = window.fetch;
    
    // Override fetch to add debug info
    window.fetch = function() {
        const url = arguments[0];
        const options = arguments[1] || {};
        
        console.group(`DEBUG FETCH: ${options.method || 'GET'} ${url}`);
        console.log('Request options:', options);
        
        if (options.body) {
            try {
                console.log('Request body:', JSON.parse(options.body));
            } catch (e) {
                console.log('Request body (raw):', options.body);
            }
        }
        
        // Get CSRF info
        const token = document.querySelector('meta[name="_csrf"]')?.content || 
                      document.querySelector('input[name="_csrf"]')?.value || 
                      'Not found';
        const header = document.querySelector('meta[name="_csrf_header"]')?.content || 
                       document.querySelector('input[name="_csrf_header"]')?.value || 
                       'Not found';
        
        console.log('CSRF Token:', token?.substr(0, 6) + '...');
        console.log('CSRF Header:', header);
        
        // Call original fetch
        return originalFetch.apply(this, arguments)
            .then(response => {
                console.log('Response status:', response.status);
                
                // Clone response to avoid consuming it
                const clonedResponse = response.clone();
                
                // Try to log the response body if possible
                if (response.headers.get('content-type')?.includes('application/json')) {
                    clonedResponse.json()
                        .then(data => console.log('Response JSON:', data))
                        .catch(e => console.log('Failed to parse JSON response'));
                } else {
                    clonedResponse.text()
                        .then(text => {
                            if (text && text.length < 500) {
                                console.log('Response text:', text);
                            } else {
                                console.log(`Response text: (${text.length} chars)`);
                            }
                        })
                        .catch(e => console.log('Failed to get response text'));
                }
                
                console.groupEnd();
                return response;
            })
            .catch(error => {
                console.error('Request error:', error);
                console.groupEnd();
                throw error;
            });
    };
    
    console.log('AJAX debugging enabled for field operations');
    
    // Add debug button to UI
    const debugBtn = document.createElement('button');
    debugBtn.className = 'btn btn-info position-fixed';
    debugBtn.style.right = '20px';
    debugBtn.style.bottom = '20px';
    debugBtn.style.zIndex = '9999';
    debugBtn.textContent = 'Debug Field Data';
    debugBtn.onclick = function() {
        const fields = document.querySelectorAll('tr[data-field-id]');
        console.table([...fields].map(tr => {
            const id = tr.getAttribute('data-field-id');
            return {
                id: id,
                key: tr.querySelector('td:nth-child(2)')?.textContent,
                label: tr.querySelector('td:nth-child(3)')?.textContent,
                type: tr.querySelector('td:nth-child(4)')?.textContent
            };
        }));
        
        console.log('CSRF meta tags:', document.querySelector('meta[name="_csrf"]'));
        console.log('CSRF form fields:', document.querySelector('input[name="_csrf"]'));
    };
    
    document.body.appendChild(debugBtn);
}

// Call this function from browser console to enable debugging
// debugFieldAjax();
