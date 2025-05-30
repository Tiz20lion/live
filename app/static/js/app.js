class ApolloScraper {
    constructor() {
        this.currentTaskId = null;
        this.pollingInterval = null;
        this.isPolling = false;
        this.csrfToken = null;
        this.errors = []; // Track validation errors
        this.isProcessing = false; // Prevent multiple submissions
        this.pollingErrors = 0; // Track polling errors

        this.init();
    }

    async init() {
        console.log('Apollo Scraper initialized successfully');
        
        try {
        this.setupToastr();
            await this.setupDOMElements();
        this.setupEventListeners();
        this.loadSavedSettings(); // Load saved settings
        await this.getCsrfToken();
        await this.checkServiceStatus();
            
            console.log('Apollo Scraper fully initialized and ready');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showFriendlyError('Application failed to initialize properly. Please refresh the page.', error);
        }
    }

    async setupDOMElements() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Wait a bit more for dynamic content
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check for critical UI elements with retry logic
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
            const statusElements = document.querySelectorAll('.status-text, .status-dot');
            
            if (statusElements.length >= 2) {
                console.log('Critical UI elements found and ready');
                break;
            }
            
            console.log(`Waiting for UI elements to load... (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }
        
        if (retries === maxRetries) {
            console.warn('Some UI elements may not be available. Application will continue with limited functionality.');
        }
    }

    setupToastr() {
        if (typeof toastr === 'undefined') {
            console.warn('Toastr not loaded, using fallback notifications');
            return;
        }
        
        // Clear any existing toasts first
        toastr.clear();
        
        toastr.options = {
            closeButton: true,
            debug: false,
            newestOnTop: true,
            progressBar: true,
            positionClass: "toast-top-right",
            preventDuplicates: true,
            maxOpened: 3, // Limit to 3 toasts at once
            onclick: null,
            showDuration: "300",
            hideDuration: "1000",
            timeOut: "6000", // Standardized timeout
            extendedTimeOut: "2000",
            showEasing: "swing",
            hideEasing: "linear",
            showMethod: "fadeIn",
            hideMethod: "fadeOut",
            escapeHtml: false // Allow HTML for structured messages
        };
        
        console.log('Toastr configured for consistent notifications');
    }

    setupEventListeners() {
        try {
            // Setup global navigation
            this.setupGlobalNavigation();

        // Setup tabs
        this.setupTabs();

        // Setup other button handlers
        this.setupButtonHandlers();
            
            // Setup form validation
            this.setupFormValidation();
            
            // Add debug function for navigation
            this.debugNavigation();
            
            console.log('Event listeners setup complete');
        } catch (error) {
            console.error('Event listeners setup failed:', error);
            this.showFriendlyError('Some interface elements may not work properly. Please refresh the page.', error);
        }
    }

    setupGlobalNavigation() {
        console.log('Setting up global navigation...');
        
        // Global Navigation Dropdown Functionality
        const navDropdown = document.getElementById('globalNavDropdown');
        const navTrigger = navDropdown?.querySelector('.nav-trigger');
        const navItems = document.querySelectorAll('.nav-item');
        
        console.log('Navigation elements found:', {
            dropdown: !!navDropdown,
            trigger: !!navTrigger,
            itemCount: navItems.length
        });

        if (!navDropdown || !navTrigger) {
            console.warn('Navigation elements not found, retrying in 500ms...');
            setTimeout(() => this.setupGlobalNavigation(), 500);
            return;
        }

        // Check if already initialized to prevent duplicate listeners
        if (navDropdown.hasAttribute('data-nav-initialized')) {
            console.log('Navigation already initialized, skipping...');
            return;
        }

        // Mark as initialized
        navDropdown.setAttribute('data-nav-initialized', 'true');

        // Toggle dropdown on trigger click
        navTrigger.addEventListener('click', (e) => {
            console.log('Navigation trigger clicked');
            e.preventDefault();
            e.stopPropagation();
            
            // Close any other dropdowns first (generic ones)
            document.querySelectorAll('.dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
                console.log('Closed generic dropdown');
            });
            
            const isActive = navDropdown.classList.contains('active');
            navDropdown.classList.toggle('active');
            
            console.log('Navigation dropdown', isActive ? 'closed' : 'opened');
            console.log('Navigation dropdown classes:', navDropdown.className);
        });

        // Add keyboard support for trigger
        navTrigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navTrigger.click();
            }
        });

        // Add keyboard support for dropdown
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navDropdown.classList.contains('active')) {
                console.log('Escape key pressed, closing navigation dropdown');
                navDropdown.classList.remove('active');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!navDropdown.contains(e.target)) {
                if (navDropdown.classList.contains('active')) {
                    console.log('Closing navigation dropdown (outside click)');
                    navDropdown.classList.remove('active');
                }
            }
        });

        // Handle navigation item clicks
        navItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                console.log('Navigation item clicked:', item.getAttribute('data-page'));
                e.preventDefault();
                e.stopPropagation();
                
                const page = item.getAttribute('data-page');
                    
                if (!page) {
                    console.warn('No page attribute found on navigation item');
                    return;
                }
                
                // Update active state
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                    
                // Navigate to page
                try {
                    this.navigateToPage(page);
                    console.log('Navigation successful to:', page);
                } catch (error) {
                    console.error('Navigation failed:', error);
                    this.showFriendlyError(`Failed to navigate to ${page}. Please try again.`, error);
                }
                    
                // Close dropdown
                navDropdown.classList.remove('active');
            });
        });
        
        console.log('Global navigation setup complete');
    }

    setupFormValidation() {
        // Add real-time validation for inputs
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    validateField(field) {
        // Basic validation logic
        if (field.hasAttribute('required') && !field.value.trim()) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        if (field.type === 'email' && field.value && !this.isValidEmail(field.value)) {
            this.showFieldError(field, 'Please enter a valid email address');
            return false;
        }
        
        this.clearFieldError(field);
        return true;
    }

    showFieldError(field, message) {
        field.classList.add('error-highlight');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.validation-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-message error';
        errorDiv.innerHTML = `
            <span class="material-symbols-outlined">error</span>
            <span>${message}</span>
        `;
        
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error-highlight');
        const errorMessage = field.parentNode.querySelector('.validation-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFriendlyError(message, technicalError = null) {
        console.error('Error details:', technicalError);
        
        // Show user-friendly message
        if (typeof toastr !== 'undefined') {
            toastr.error(message, 'Error', {
                timeOut: 10000,
                extendedTimeOut: 3000
            });
        } else {
            // Fallback to alert if toastr not available
            alert('Error: ' + message);
        }
        
        // Log technical details for debugging
        if (technicalError) {
            console.group('Technical Error Details');
            console.error('Message:', message);
            console.error('Technical error:', technicalError);
            console.error('Stack:', technicalError.stack);
            console.groupEnd();
        }
    }

    showFriendlySuccess(message) {
        if (typeof toastr !== 'undefined') {
            toastr.success(message, 'Success', {
                timeOut: 5000
            });
        } else {
            console.log('Success:', message);
                    }
    }

    showFriendlyWarning(message) {
        if (typeof toastr !== 'undefined') {
            toastr.warning(message, 'Warning', {
                timeOut: 7000
                });
        } else {
            console.warn('Warning:', message);
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');

                // Update button states
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update content states
                tabContents.forEach(content => content.classList.remove('active'));
                const targetContent = document.getElementById(`${tabId}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    setupButtonHandlers() {
        // Start scraping button
        const startScrapingBtn = document.getElementById('startScraping');
        if (startScrapingBtn) {
            startScrapingBtn.addEventListener('click', () => {
                this.startScraping();
            });
        }

        // Start automation button (from homepage)
        const startAutomationBtn = document.getElementById('startAutomationBtn');
        if (startAutomationBtn) {
            startAutomationBtn.addEventListener('click', () => {
                this.navigateToPage('configure');
            });
        }

        // Export buttons
        const exportCsvBtn = document.getElementById('exportCsv');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                this.exportCsv();
            });
        }

        const exportJsonBtn = document.getElementById('exportJson');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.exportJson();
            });
        }

        const exportSheetsBtn = document.getElementById('exportSheets');
        if (exportSheetsBtn) {
            exportSheetsBtn.addEventListener('click', () => {
                this.exportToSheets();
            });
        }

        const exportNotionBtn = document.getElementById('exportNotion');
        if (exportNotionBtn) {
            exportNotionBtn.addEventListener('click', () => {
                this.exportToNotion();
            });
        }

        // Lead count slider sync
        const leadCountSlider = document.getElementById('leadCount');
        const leadCountInput = document.getElementById('leadCountInput');
        const leadCountDisplay = document.getElementById('leadCountDisplay');
        const quickButtons = document.querySelectorAll('.quick-btn');

        // Sync all lead count controls
        function updateLeadCount(value) {
            const numValue = parseInt(value);
            if (leadCountSlider) leadCountSlider.value = numValue;
            if (leadCountInput) leadCountInput.value = numValue;
            if (leadCountDisplay) leadCountDisplay.textContent = numValue.toLocaleString();
            
            // Update active quick button
            quickButtons.forEach(btn => {
                btn.classList.remove('active');
                if (parseInt(btn.dataset.value) === numValue) {
                    btn.classList.add('active');
                }
            });
        }

        // Slider input handler
        if (leadCountSlider) {
            leadCountSlider.addEventListener('input', () => {
                updateLeadCount(leadCountSlider.value);
            });
        }

        // Number input handler
        if (leadCountInput) {
            leadCountInput.addEventListener('input', () => {
                const value = parseInt(leadCountInput.value);
                if (value >= 1 && value <= 50000) {
                    updateLeadCount(value);
                }
            });
        }

        // Quick button handlers
        quickButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                updateLeadCount(btn.dataset.value);
            });
        });

        // Initialize with default value
        updateLeadCount(100);

        // Field Selection Functionality
        this.setupFieldSelection();
    }

    setupFieldSelection() {
        const fieldCards = document.querySelectorAll('.field-toggle-card');
        const selectedCountEl = document.getElementById('selectedCount');
        const selectAllBtn = document.getElementById('selectAllFields');
        const clearAllBtn = document.getElementById('clearAllFields');

        // Update selected count
        const updateSelectedCount = () => {
            const activeCards = document.querySelectorAll('.field-toggle-card.active');
            if (selectedCountEl) {
                selectedCountEl.textContent = activeCards.length;
            }
        };

        // Toggle field selection
        fieldCards.forEach(card => {
            card.addEventListener('click', () => {
                const checkbox = card.querySelector('input[type="checkbox"]');
                const isActive = card.classList.contains('active');
                
                if (isActive) {
                    card.classList.remove('active');
                    checkbox.checked = false;
                } else {
                    card.classList.add('active');
                    checkbox.checked = true;
                }
                
                updateSelectedCount();
            });
        });

        // Select all fields
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                fieldCards.forEach(card => {
                    card.classList.add('active');
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    checkbox.checked = true;
                });
                updateSelectedCount();
            });
        }

        // Clear all fields
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                fieldCards.forEach(card => {
                    card.classList.remove('active');
                    const checkbox = card.querySelector('input[type="checkbox"]');
                    checkbox.checked = false;
                });
                updateSelectedCount();
            });
        }

        // Initialize count
        updateSelectedCount();
    }

    setupDashboardNavigation() {
        const menuItems = document.querySelectorAll('.menu-item');
        const pages = {
            'home': 'homePage',
            'configure': 'configurationSection',
            'settings': 'settingsPage',
            'results': 'resultsSection'
        };

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.getAttribute('data-page');

                // Update menu states
                menuItems.forEach(menuItem => menuItem.classList.remove('active'));
                item.classList.add('active');

                // Hide all pages
                Object.values(pages).forEach(pageId => {
                    const pageElement = document.getElementById(pageId);
                    if (pageElement) {
                        pageElement.style.display = 'none';
                    }
                });

                // Show selected page
                const targetPageId = pages[page];
                if (targetPageId) {
                    const targetPage = document.getElementById(targetPageId);
                    if (targetPage) {
                        targetPage.style.display = 'block';
                    }
                }
            });
        });
    }

    saveSettings() {
        try {
            this.clearValidationErrors();
            const errors = [];

            // Get form values
            const apifyToken = document.getElementById('apifyToken')?.value?.trim();
            const googleCredentials = document.getElementById('googleCredentials')?.value?.trim();
            const spreadsheetId = document.getElementById('spreadsheetId')?.value?.trim();
            const sheetName = document.getElementById('sheetName')?.value?.trim();
            const notionToken = document.getElementById('notionToken')?.value?.trim();
            const notionDatabaseId = document.getElementById('notionDatabaseId')?.value?.trim();

            // Validate API token (required)
            const tokenValidation = this.validateApiToken(apifyToken);
            if (!tokenValidation.isValid) {
                errors.push(...tokenValidation.errors);
            }

            // Validate Google Sheets settings (if provided)
            if (googleCredentials || spreadsheetId) {
                const sheetsValidation = this.validateExportSettings('sheets', {
                    googleCredentials,
                    spreadsheetId,
                    sheetName
                });
                if (!sheetsValidation.isValid) {
                    errors.push(...sheetsValidation.errors);
                }
            }

            // Validate Notion settings (if provided)
            if (notionToken || notionDatabaseId) {
                const notionValidation = this.validateExportSettings('notion', {
                    notionToken,
                    notionDatabaseId
                });
                if (!notionValidation.isValid) {
                    errors.push(...notionValidation.errors);
                }
            }

            // Show validation errors if any
            if (errors.length > 0) {
                this.showValidationErrors(errors);
            return;
        }

            // Save to localStorage
            if (apifyToken) {
                localStorage.setItem('apifyToken', apifyToken);
            }
            if (googleCredentials) {
                localStorage.setItem('googleCredentials', googleCredentials);
            }
            if (spreadsheetId) {
                localStorage.setItem('spreadsheetId', spreadsheetId);
            }
            if (sheetName) {
                localStorage.setItem('sheetName', sheetName);
            }
            if (notionToken) {
                localStorage.setItem('notionToken', notionToken);
            }
            if (notionDatabaseId) {
                localStorage.setItem('notionDatabaseId', notionDatabaseId);
            }

            toastr.success('Settings have been saved successfully.', 'Settings Saved', {
                timeOut: 3000,
                extendedTimeOut: 1000,
                closeButton: true,
                progressBar: true
            });

        } catch (error) {
            console.error('Save settings error:', error);
            
            // Check if it's a localStorage error
            if (error.name === 'QuotaExceededError') {
                toastr.error('Storage space full. Please free up browser storage space and try again.', 'Storage Error');
            } else if (error.message && error.message.includes('localStorage')) {
                toastr.error('Settings could not be saved due to browser privacy settings. Your settings will only apply for this session.', 'Storage Warning');
            } else {
                toastr.error('Failed to save settings. Please try again.', 'Error');
            }
        }
    }

    startAutomation() {
        const apifyToken = document.getElementById('apifyToken').value.trim();

        if (!apifyToken) {
            toastr.warning('Please configure your Apify API token in the settings before getting started.');
            
            // Auto-navigate to settings if token is missing
            setTimeout(() => {
                this.navigateToPage('settings');
            }, 2000);
            return;
        }
        
        toastr.success('Configuration is ready. Set up your scraping parameters and choose your data sources.');
    }

    navigateToPage(pageName) {
        console.log('Navigating to page:', pageName);
        
        try {
        const navItems = document.querySelectorAll('.nav-item');
        const pages = {
            'home': 'homePage',
            'configure': 'configurationSection',
            'progress': 'progressSection',
            'settings': 'settingsPage',
            'results': 'resultsSection'
        };

            // Validate page name
            if (!pages[pageName]) {
                console.warn('Unknown page:', pageName);
                this.showFriendlyWarning(`Page "${pageName}" not found. Redirecting to homepage.`);
                pageName = 'home';
            }

        // Update navigation states
        navItems.forEach(navItem => {
            navItem.classList.remove('active');
            if (navItem.getAttribute('data-page') === pageName) {
                navItem.classList.add('active');
                    console.log('Updated active navigation item for:', pageName);
            }
        });

        // Legacy menu items (for backward compatibility)
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(menuItem => {
            menuItem.classList.remove('active');
            if (menuItem.getAttribute('data-page') === pageName) {
                menuItem.classList.add('active');
            }
        });

            // Get target page
            const targetPageId = pages[pageName];
            const targetPage = document.getElementById(targetPageId);
            
            if (!targetPage) {
                console.error('Target page element not found:', targetPageId);
                this.showFriendlyError(`Failed to load page "${pageName}". The page content may be missing.`);
                return;
            }

            // Hide all pages with fade out
            const allPages = document.querySelectorAll('.dashboard-page');
            allPages.forEach(page => {
                if (page.style.display !== 'none') {
                    page.style.opacity = '0';
                    setTimeout(() => {
            page.style.display = 'none';
                        page.style.opacity = '1';
                    }, 150);
                }
        });

            // Show selected page with animation
            setTimeout(() => {
                targetPage.style.display = 'block';
                targetPage.style.opacity = '0';
                
                // Trigger fade in animation
                setTimeout(() => {
                    targetPage.style.opacity = '1';
                    targetPage.style.transition = 'opacity 0.3s ease-in-out';
                    
                    // Add bounce animation if available
                    if (typeof gsap !== 'undefined') {
                        gsap.fromTo(targetPage, 
                            { opacity: 0, y: 20 }, 
                            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
                        );
                    }
                }, 50);
            }, 150);

        // Force scroll to top - multiple methods to ensure it works
        setTimeout(() => {
                try {
            // Method 1: Scroll window to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // Method 2: Scroll document to top
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            
            // Method 3: Scroll main container to top
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.scrollTop = 0;
            }
                } catch (scrollError) {
                    console.warn('Scroll to top failed:', scrollError);
                }
            }, 200);

            // Update page title if needed
            this.updatePageTitle(pageName);
            
            console.log('Navigation to', pageName, 'completed successfully');
            
        } catch (error) {
            console.error('Navigation failed:', error);
            this.showFriendlyError(`Failed to navigate to ${pageName}. Please try again.`, error);
        }
    }

    updatePageTitle(pageName) {
        const titles = {
            'home': 'Tiz Lead Scraper - Home',
            'configure': 'Tiz Lead Scraper - Configuration',
            'progress': 'Tiz Lead Scraper - Progress',
            'settings': 'Tiz Lead Scraper - Settings',
            'results': 'Tiz Lead Scraper - Results'
        };
        
        if (titles[pageName]) {
            document.title = titles[pageName];
        }
    }

    async getCsrfToken() {
        try {
            console.log('Fetching CSRF token...');
            const response = await fetch('/api/v1/csrf-token', {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.csrf_token) {
                throw new Error('CSRF token not found in response');
            }
            
            this.csrfToken = data.csrf_token;
            console.log('CSRF token obtained successfully');
            
        } catch (error) {
            console.error('Failed to get CSRF token:', error);
            this.showFriendlyWarning('Security token could not be obtained. Some features may not work properly.');
        }
    }

    async checkServiceStatus() {
        try {
            console.log('Checking service health...');
            const response = await fetch('/health', {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Service status:', data);

            if (data.status === 'healthy') {
                this.updateStatusIndicator('Ready', 'success');
                console.log('All services are healthy');
                
                // Check for service warnings
                if (data.services) {
                    const warnings = [];
                    if (data.services.apify === 'not_configured') {
                        warnings.push('Apify API not configured');
                    }
                    if (data.services.google_sheets === 'not_configured') {
                        warnings.push('Google Sheets not configured');
                    }
                    if (data.services.notion === 'not_configured') {
                        warnings.push('Notion not configured');
                    }
                    
                    if (warnings.length > 0) {
                        console.log('Service warnings:', warnings);
                        this.showFriendlyWarning('Some integrations are not configured. You can set them up in Settings.');
                    }
                }
            } else {
                this.updateStatusIndicator('Service Issues', 'warning');
                this.showFriendlyWarning('Some services are experiencing issues. Functionality may be limited.');
            }
        } catch (error) {
            console.error('Service health check failed:', error);
            this.updateStatusIndicator('Connection Error', 'error');
            
            if (error.name === 'AbortError') {
                this.showFriendlyError('Connection timeout. Please check your internet connection.');
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                this.showFriendlyError('Cannot connect to the server. Please check if the application is running.');
            } else {
                this.showFriendlyError('Service health check failed. Some features may not work properly.');
            }
        }
    }

    updateStatusIndicator(text, status) {
        const statusText = document.querySelector('.status-text');
        const statusDot = document.querySelector('.status-dot');

        // Check if elements exist before trying to update them
        if (!statusText || !statusDot) {
            console.warn('Status indicator elements not found in DOM. This may be normal during initialization.');
            return;
        }

        statusText.textContent = text;

        statusDot.style.background = {
            'success': 'hsl(var(--accent-secondary))',
            'warning': 'hsl(var(--accent-warning))',
            'error': 'hsl(var(--accent-danger))'
        }[status] || 'hsl(var(--accent-secondary))';
    }

    toggleTheme() {
        const body = document.body;
        const themeIcon = document.querySelector('#themeToggle i');

        if (!themeIcon) {
            console.warn('Theme toggle icon not found');
            return;
        }

        if (body.classList.contains('dark-theme')) {
            body.classList.remove('dark-theme');
            themeIcon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-theme');
            themeIcon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        }

        // Animate theme transition
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(body, 
                { opacity: 0.8 }, 
                { opacity: 1, duration: 0.3, ease: "power2.out" }
            );
        }
    }

    validateUrls() {
        const urlInput = document.getElementById('urlInput');
        
        if (!urlInput) {
            console.warn('URL input element not found');
            return [];
        }
        
        const urls = urlInput.value.split('\n').filter(url => url.trim());

        const validUrls = urls.filter(url => 
            url.trim().startsWith('http://') || url.trim().startsWith('https://')
        );

        if (urls.length > validUrls.length) {
            urlInput.style.borderColor = 'hsl(var(--accent-danger))';
        } else {
            urlInput.style.borderColor = 'hsl(var(--border-color))';
        }

        return validUrls;
    }

    getSelectedFields() {
        const activeCards = document.querySelectorAll('.field-toggle-card.active input[type="checkbox"]');
        return Array.from(activeCards).map(cb => cb.value);
    }

    getUrls() {
        const urlInput = document.getElementById('urlInput');
        if (!urlInput || !urlInput.value.trim()) {
            return [];
        }
        
        const urls = urlInput.value.trim().split('\n')
            .map(url => url.trim())
            .filter(url => url.length > 0);
            
        return urls;
    }

    async startScraping() {
        console.log('Starting scraping process');

        // Prevent double submission
        if (this.preventDoubleSubmission()) return;

        try {
            this.setProcessingState(true);
            this.clearValidationErrors();

            // Get all input values
            const apolloUrls = this.getUrls();
            const googleMapsData = this.getGoogleMapsData();
            const leadCount = parseInt(document.getElementById('leadCountInput')?.value || document.getElementById('leadCount')?.value || 100);
            const selectedFields = this.getSelectedFields();
            const apifyToken = localStorage.getItem('apifyToken') || '';

            console.log('Input data:', {
                apolloUrls,
                googleMapsData,
                leadCount,
                selectedFields: selectedFields.length,
                hasToken: !!apifyToken
            });

            // Comprehensive validation
            const allErrors = [];

            // 1. Validate Apollo URLs
            const apolloValidation = this.validateApolloUrls(apolloUrls);
            if (!apolloValidation.isValid) {
                allErrors.push(...apolloValidation.errors);
            }

            // 2. Validate Google Maps input
            const mapsValidation = this.validateGoogleMapsInput(
                googleMapsData.searchTerms,
                googleMapsData.location,
                googleMapsData.mapsUrls
            );
            if (!mapsValidation.isValid) {
                allErrors.push(...mapsValidation.errors);
            }

            // 3. Validate at least one source is provided
            const sourceValidation = this.validateAtLeastOneSource(
                apolloUrls,
                googleMapsData.searchTerms,
                googleMapsData.location,
                googleMapsData.mapsUrls
            );
            if (!sourceValidation.isValid) {
                allErrors.push(...sourceValidation.errors);
            }

            // 4. Validate lead count
            const leadCountValidation = this.validateLeadCount(leadCount);
            if (!leadCountValidation.isValid) {
                allErrors.push(...leadCountValidation.errors);
            }

            // 5. Validate selected fields
            const fieldsValidation = this.validateSelectedFields(selectedFields);
            if (!fieldsValidation.isValid) {
                allErrors.push(...fieldsValidation.errors);
            }

            // 6. Validate API token
            const tokenValidation = this.validateApiToken(apifyToken);
            if (!tokenValidation.isValid) {
                allErrors.push(...tokenValidation.errors);
            }

            // Show validation errors if any
            if (allErrors.length > 0) {
                this.showValidationErrors(allErrors);
                this.setProcessingState(false);
            return;
        }

            // All validation passed, proceed with scraping
            const button = document.getElementById('startScraping');
            this.setButtonLoading(button, true);

            // Prepare request payload
            const requestPayload = {
                apollo_urls: apolloUrls.filter(url => url.trim()),
                search_terms: googleMapsData.searchTerms?.filter(term => term.trim()) || null,
                location: googleMapsData.location?.trim() || null,
                maps_urls: googleMapsData.mapsUrls?.filter(url => url.trim()) || null,
                max_places: googleMapsData.maxPlaces || 50,
                min_stars: googleMapsData.minStars || "",
                enrichment_records: googleMapsData.enrichmentRecords || 0,
                skip_closed: googleMapsData.skipClosed || false,
                lead_count: leadCount,
                fields: selectedFields,
                apify_token: apifyToken
            };

            // Remove null/empty arrays to keep payload clean
            Object.keys(requestPayload).forEach(key => {
                if (requestPayload[key] === null || 
                    (Array.isArray(requestPayload[key]) && requestPayload[key].length === 0)) {
                    delete requestPayload[key];
                }
            });

            console.log('Sending request payload:', requestPayload);

            // Start scraping
            const response = await fetch('/api/v1/scrape/combined', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { detail: `HTTP ${response.status}: ${response.statusText}` };
                }

                console.error('API Error:', errorData);
                
                // Handle specific API errors
                if (response.status === 422) {
                    const validationErrors = errorData.detail?.map(err => 
                        `${err.loc?.join(' → ')}: ${err.msg}` || err.msg || 'Validation error'
                    ) || ['Request validation failed'];
                    this.showValidationErrors(validationErrors);
                } else {
                    this.handleNetworkError({ status: response.status, data: errorData }, 'scraping');
                }

                this.setButtonLoading(button, false);
                this.setProcessingState(false);
                return;
            }

            const data = await response.json();
            console.log('Scraping started:', data);

            // Store task ID and start monitoring
                this.currentTaskId = data.task_id;
            
            // Show success message
            toastr.success('Scraping process has been started successfully. Progress will be monitored automatically.', 'Scraping Started', {
                timeOut: 4000,
                extendedTimeOut: 1500,
                closeButton: true,
                progressBar: true
            });

            // Switch to progress view and start monitoring
            this.navigateToPage('progress');
            this.showProgressSection();
                this.startPolling();

        } catch (error) {
            console.error('Scraping start error:', error);
            this.handleNetworkError(error, 'starting scraping');
            
            const button = document.getElementById('startScraping');
            this.setButtonLoading(button, false);
        } finally {
            this.setProcessingState(false);
        }
    }

    getGoogleMapsData() {
        const searchTermsInput = document.getElementById('mapsSearchTerms');
        const locationInput = document.getElementById('mapsLocation');
        const mapsUrlsInput = document.getElementById('mapsUrls');
        const maxPlacesInput = document.getElementById('mapsMaxPlaces');
        const minStarsSelect = document.getElementById('mapsMinStars');
        const enrichmentInput = document.getElementById('mapsEnrichment');
        const skipClosedCheckbox = document.getElementById('mapsSkipClosed');

        const searchTerms = searchTermsInput?.value.trim();
        const location = locationInput?.value.trim();
        const mapsUrls = mapsUrlsInput?.value.trim();
        
        const searchTermsArray = searchTerms ? searchTerms.split(',').map(term => term.trim()).filter(term => term) : [];
        const mapsUrlsArray = mapsUrls ? mapsUrls.split('\n').map(url => url.trim()).filter(url => url) : [];
        
        const hasSearchData = searchTermsArray.length > 0 && location;
        const hasUrlData = mapsUrlsArray.length > 0;
        const hasData = hasSearchData || hasUrlData;

        return {
            hasData,
            searchTerms: searchTermsArray,
            location,
            mapsUrls: mapsUrlsArray,
            maxPlaces: parseInt(maxPlacesInput?.value || '50'),
            minStars: minStarsSelect?.value || '',
            enrichmentRecords: parseInt(enrichmentInput?.value || '0'),
            skipClosed: skipClosedCheckbox?.checked || false
        };
    }

    setButtonLoading(button, loading) {
        if (!button) {
            console.warn('Button element not provided to setButtonLoading');
            return;
        }

        const buttonText = button.querySelector('.button-text');
        const loadingSpinner = button.querySelector('.loading-spinner');

        if (!buttonText || !loadingSpinner) {
            console.warn('Button loading elements (.button-text or .loading-spinner) not found');
            // Fallback: just disable the button
            button.disabled = loading;
            return;
        }

        if (loading) {
            buttonText.style.display = 'none';
            loadingSpinner.style.display = 'block';
            button.disabled = true;
        } else {
            buttonText.style.display = 'block';
            loadingSpinner.style.display = 'none';
            button.disabled = false;
        }
    }

    showProgressSection() {
        // Navigate to progress page
        this.navigateToPage('results');

        const progressSection = document.getElementById('progressSection');
        if (!progressSection) {
            console.warn('Progress section element not found');
            return;
        }

        progressSection.style.display = 'block';

        if (typeof gsap !== 'undefined') {
            gsap.fromTo(progressSection, 
                { opacity: 0, y: 20 }, 
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
        } else {
            progressSection.style.opacity = '1';
        }
    }

    hideProgressSection() {
        const progressSection = document.getElementById('progressSection');
        if (!progressSection) {
            console.warn('Progress section element not found');
            return;
        }

        if (typeof gsap !== 'undefined') {
            gsap.to(progressSection, {
                opacity: 0,
                y: -20,
                duration: 0.3,
                ease: "power2.out",
                onComplete: () => {
                    progressSection.style.display = 'none';
                }
            });
        } else {
            progressSection.style.display = 'none';
        }
    }

    updateProgress(percentage, message) {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        const progressMessage = document.getElementById('progressMessage');

        if (!progressFill || !progressPercentage || !progressMessage) {
            console.warn('Progress elements not found. Progress update skipped.');
            return;
        }

        if (typeof gsap !== 'undefined') {
            gsap.to(progressFill, {
                width: `${percentage}%`,
                duration: 0.5,
                ease: "power2.out"
            });
        } else {
            progressFill.style.width = `${percentage}%`;
        }

        progressPercentage.textContent = `${percentage}%`;
        progressMessage.textContent = message;
    }

    startPolling() {
        // Reset error counter when starting new polling session
        this.pollingErrors = 0;
        
        this.pollInterval = setInterval(() => {
            this.checkTaskStatus();
        }, 2000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        // Reset error counter when stopping
        this.pollingErrors = 0;
    }

    async checkTaskStatus() {
        if (!this.currentTaskId) return;

        try {
            const response = await fetch(`/api/v1/scrape/${this.currentTaskId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Failed to check task status`);
            }
            
            const data = await response.json();

            this.updateProgress(data.progress, data.message);

            if (data.status === 'completed') {
                this.stopPolling();
                this.showResults(data.data, data.total_count);
                toastr.success(`Scraping completed successfully. Found ${data.total_count} leads ready for export.`, 'Scraping Complete');
            } else if (data.status === 'failed') {
                this.stopPolling();
                this.setButtonLoading(button, false);
                toastr.error(`Scraping process failed: ${data.message}. Please review your settings and try again.`, 'Scraping Failed');
            }

        } catch (error) {
            console.error('Failed to check task status:', error);
            
            // Increment error counter to handle repeated failures
            this.pollingErrors = (this.pollingErrors || 0) + 1;
            
            // Stop polling after 3 consecutive errors to prevent endless retry
            if (this.pollingErrors >= 3) {
                this.stopPolling();
                this.hideProgressSection();
                toastr.error('Lost connection to the server while monitoring progress. Please check your scraping results manually or try starting again.', 'Connection Error', {
                    timeOut: 10000,
                    closeButton: true
                });
            } else {
                // Show warning for intermittent errors
                toastr.warning('Connection issue while checking progress. Retrying...', 'Connection Warning', {
                    timeOut: 3000
                });
            }
        }
    }

    showResults(data, totalCount) {
        if (!data || data.length === 0) {
            toastr.warning('No results found. Please try adjusting your search parameters or data sources.');
            this.hideProgressSection();
            return;
        }

        // Hide progress section
        this.hideProgressSection();

        // Update results count
        const resultsCountElement = document.getElementById('resultsCount');
        if (resultsCountElement) {
            resultsCountElement.textContent = `${totalCount} leads found`;
        } else {
            console.warn('Results count element not found');
        }

        // Show results section
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) {
            console.error('Results section not found');
            toastr.error('Unable to display results. The results section is missing from the page.');
            return;
        }

        resultsSection.style.display = 'block';

        // Populate table
        this.populateResultsTable(data.slice(0, 5)); // Show first 5 results

        // Animate section
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(resultsSection, 
                { opacity: 0, y: 20 }, 
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
        } else {
            resultsSection.style.opacity = '1';
        }
    }

    populateResultsTable(data) {
        const tableHead = document.getElementById('resultsTableHead');
        const tableBody = document.getElementById('resultsTableBody');

        // Clear existing content
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        if (!data || data.length === 0) {
            console.warn('No data provided to populate results table');
            return;
        }

        try {
            // Validate data structure
            if (!Array.isArray(data)) {
                throw new Error('Data must be an array');
            }

            // Get headers from first non-empty object
            let headers = [];
            for (const item of data) {
                if (item && typeof item === 'object' && Object.keys(item).length > 0) {
                    headers = Object.keys(item);
                    break;
                }
            }

            if (headers.length === 0) {
                throw new Error('No valid data structure found');
            }

            // Create headers
            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header.charAt(0).toUpperCase() + header.slice(1);
                headerRow.appendChild(th);
            });
            tableHead.appendChild(headerRow);

            // Create rows
            data.forEach((row, index) => {
                if (!row || typeof row !== 'object') {
                    console.warn(`Skipping invalid row at index ${index}:`, row);
                    return;
                }

                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    const cellValue = row[header];
                    
                    // Handle different data types safely
                    if (cellValue === null || cellValue === undefined) {
                        td.textContent = '';
                    } else if (typeof cellValue === 'object') {
                        td.textContent = JSON.stringify(cellValue);
                    } else {
                        td.textContent = String(cellValue);
                    }
                    
                    td.title = td.textContent; // Tooltip for long text
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });

        } catch (error) {
            console.error('Error populating results table:', error);
            
            // Show error message in table
            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.colSpan = 100; // Span all columns
            errorCell.className = 'error-cell';
            errorCell.textContent = 'Error displaying results. Please check the console for details.';
            errorRow.appendChild(errorCell);
            tableBody.appendChild(errorRow);
            
            this.showFriendlyError('Failed to display results table. The data may be in an unexpected format.');
        }
    }

    async exportCsv() {
        if (!this.currentTaskId) {
            toastr.error('No data available to export. Please run a scraping task first to generate data.');
            return;
        }

        try {
            const response = await fetch(`/api/v1/export/csv/${this.currentTaskId}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `leads_${this.currentTaskId}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                toastr.success('CSV file has been downloaded successfully. Check your downloads folder.', 'CSV Export Complete');
            } else {
                throw new Error('Failed to export CSV');
            }

        } catch (error) {
            toastr.error(`CSV export failed: ${error.message}. Please try again or contact support if the problem persists.`);
        }
    }

    async exportJson() {
        if (!this.currentTaskId) {
            toastr.error('No data available to export. Please run a scraping task first to generate data.');
            return;
        }

        try {
            const response = await fetch(`/api/v1/export/json/${this.currentTaskId}`);

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `leads_${this.currentTaskId}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                toastr.success('JSON file has been downloaded successfully. Check your downloads folder.', 'JSON Export Complete');
            } else {
                throw new Error('Failed to export JSON');
            }

        } catch (error) {
            toastr.error(`JSON export failed: ${error.message}. Please try again or contact support if the problem persists.`);
        }
    }

    async exportToSheets() {
        // Prevent double submission
        if (this.preventDoubleSubmission()) return;

        try {
            this.setProcessingState(true);
            this.showLoadingOverlay('Exporting to Google Sheets...');

            // Get export settings
            const googleCredentials = document.getElementById('googleCredentials')?.value?.trim();
            const spreadsheetId = document.getElementById('spreadsheetId')?.value?.trim();
            const sheetName = document.getElementById('sheetName')?.value?.trim() || 'Leads';

            // Validate export settings
            const exportValidation = this.validateExportSettings('sheets', {
                googleCredentials,
                spreadsheetId,
                sheetName
            });

            if (!exportValidation.isValid) {
                this.showValidationErrors(exportValidation.errors);
                this.hideLoadingOverlay();
                this.setProcessingState(false);
            return;
        }

            // Check if we have data to export
            if (!this.currentTaskId) {
                toastr.error('No data available to export. Please run a scraping task first to generate data.');
                this.hideLoadingOverlay();
                this.setProcessingState(false);
            return;
        }

            // Get task data
            const taskResponse = await fetch(`/api/v1/scrape/${this.currentTaskId}`);
            if (!taskResponse.ok) {
                throw new Error('Failed to get task data');
            }

            const taskData = await taskResponse.json();
            if (!taskData.data || taskData.data.length === 0) {
                toastr.error('No data available to export from this task. Please ensure your scraping task completed successfully.');
                this.hideLoadingOverlay();
                this.setProcessingState(false);
                return;
            }

            // Parse Google credentials
            let credentialsObj;
            try {
                credentialsObj = JSON.parse(googleCredentials);
            } catch (e) {
                this.showValidationErrors(['The Google Service Account credentials are not valid JSON format. Please check the format and try again.']);
                this.hideLoadingOverlay();
                this.setProcessingState(false);
                return;
            }

            // Export to Google Sheets
            const exportResponse = await fetch('/api/v1/export/sheets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    spreadsheet_id: spreadsheetId,
                    sheet_name: sheetName,
                    data: taskData.data,
                    google_credentials: credentialsObj
                })
            });

            if (!exportResponse.ok) {
                const errorData = await exportResponse.json().catch(() => ({}));
                this.handleNetworkError({ status: exportResponse.status, data: errorData }, 'Google Sheets export');
                this.hideLoadingOverlay();
                this.setProcessingState(false);
                return;
            }

            const result = await exportResponse.json();
            
            toastr.success(`Successfully exported ${result.created_count || taskData.data.length} leads to Google Sheets.`, 'Google Sheets Export Complete', {
                timeOut: 5000,
                extendedTimeOut: 2000,
                closeButton: true,
                progressBar: true
            });

        } catch (error) {
            console.error('Export to Sheets error:', error);
            this.handleNetworkError(error, 'Google Sheets export');
        } finally {
            this.hideLoadingOverlay();
            this.setProcessingState(false);
        }
    }

    async exportToNotion() {
        // Prevent double submission
        if (this.preventDoubleSubmission()) return;

        try {
            this.setProcessingState(true);
            this.showLoadingOverlay('Exporting to Notion...');

            // Get export settings
            const notionToken = document.getElementById('notionToken')?.value?.trim();
            const notionDatabaseId = document.getElementById('notionDatabaseId')?.value?.trim();

            // Validate export settings
            const exportValidation = this.validateExportSettings('notion', {
                notionToken,
                notionDatabaseId
            });

            if (!exportValidation.isValid) {
                this.showValidationErrors(exportValidation.errors);
                this.hideLoadingOverlay();
                this.setProcessingState(false);
            return;
        }

            // Check if we have data to export
            if (!this.currentTaskId) {
                toastr.error('No data available to export. Please run a scraping task first to generate data.');
                this.hideLoadingOverlay();
                this.setProcessingState(false);
            return;
        }

            // Get task data
            const taskResponse = await fetch(`/api/v1/scrape/${this.currentTaskId}`);
            if (!taskResponse.ok) {
                throw new Error('Failed to get task data');
            }

            const taskData = await taskResponse.json();
            if (!taskData.data || taskData.data.length === 0) {
                toastr.error('No data available to export from this task. Please ensure your scraping task completed successfully.');
                this.hideLoadingOverlay();
                this.setProcessingState(false);
                return;
            }

            // Export to Notion
            const exportResponse = await fetch('/api/v1/export/notion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.csrfToken
                },
                body: JSON.stringify({
                    database_id: notionDatabaseId,
                    data: taskData.data,
                    notion_token: notionToken
                })
            });

            if (!exportResponse.ok) {
                const errorData = await exportResponse.json().catch(() => ({}));
                this.handleNetworkError({ status: exportResponse.status, data: errorData }, 'Notion export');
                this.hideLoadingOverlay();
                this.setProcessingState(false);
                return;
            }

            const result = await exportResponse.json();
            
            toastr.success(`Successfully exported ${result.created_count || taskData.data.length} leads to Notion.`, 'Notion Export Complete', {
                timeOut: 5000,
                extendedTimeOut: 2000,
                closeButton: true,
                progressBar: true
            });

        } catch (error) {
            console.error('Export to Notion error:', error);
            this.handleNetworkError(error, 'Notion export');
        } finally {
            this.hideLoadingOverlay();
            this.setProcessingState(false);
        }
    }

    showLoadingOverlay(text = 'Processing...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingText = overlay.querySelector('.loading-text');

        loadingText.textContent = text;
        overlay.style.display = 'flex';

        gsap.fromTo(overlay, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.3, ease: "power2.out" }
        );
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');

        gsap.to(overlay, {
            opacity: 0,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
                overlay.style.display = 'none';
            }
        });
    }

    // Error Handling and Validation Methods
    validateApolloUrls(urls) {
        const errors = [];
        
        if (!urls || urls.length === 0) {
            return { isValid: true, errors: [] }; // Apollo URLs are optional
        }

        if (urls.length > 10) {
            errors.push('You can enter a maximum of 10 Apollo.io URLs. Please remove some URLs and try again.');
        }

        urls.forEach((url, index) => {
            if (!url.trim()) {
                return; // Skip empty URLs
            }

            // Basic URL validation
            try {
                new URL(url.trim());
            } catch (e) {
                errors.push(`URL ${index + 1} is not valid. Please enter a properly formatted web address.`);
                return;
            }

            // Apollo.io specific validation
            if (!url.toLowerCase().includes('apollo.io')) {
                errors.push(`URL ${index + 1} must be from Apollo.io. Please enter an Apollo.io web address.`);
            }

            // Check for proper Apollo URL structure
            if (!url.includes('/people/') && !url.includes('/companies/') && !url.includes('/search/')) {
                errors.push(`URL ${index + 1} appears to be an invalid Apollo.io page. Please use a search results or contact list URL.`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateGoogleMapsInput(searchTerms, location, mapsUrls) {
        const errors = [];
        
        const hasSearchTerms = searchTerms && searchTerms.length > 0;
        const hasLocation = location && location.trim().length > 0;
        const hasMapsUrls = mapsUrls && mapsUrls.length > 0;

        // Check if at least one input method is provided (this is optional overall)
        if (!hasSearchTerms && !hasLocation && !hasMapsUrls) {
            return { isValid: true, errors: [] }; // Google Maps is optional
        }

        // If search terms are provided, location is required
        if (hasSearchTerms && !hasLocation) {
            errors.push('When using search terms, you must also specify a location. Please enter a city, state, or address.');
        }

        // If location is provided, search terms are required (unless using URLs)
        if (hasLocation && !hasSearchTerms && !hasMapsUrls) {
            errors.push('When specifying a location, you must also provide search terms. Please enter business types or keywords.');
        }

        // Validate search terms
        if (hasSearchTerms) {
            if (searchTerms.length > 10) {
                errors.push('You can enter a maximum of 10 search terms. Please reduce the number of terms.');
            }

            searchTerms.forEach((term, index) => {
                if (term.trim().length < 2) {
                    errors.push(`Search term ${index + 1} is too short. Please use at least 2 characters.`);
                }
                if (term.length > 100) {
                    errors.push(`Search term ${index + 1} is too long. Please keep it under 100 characters.`);
                }
            });
        }

        // Validate location
        if (hasLocation) {
            if (location.trim().length < 2) {
                errors.push('Location must be at least 2 characters long. Please enter a valid city, state, or address.');
            }
            if (location.length > 200) {
                errors.push('Location is too long. Please keep it under 200 characters.');
            }
        }

        // Validate Maps URLs
        if (hasMapsUrls) {
            if (mapsUrls.length > 10) {
                errors.push('You can enter a maximum of 10 Google Maps URLs. Please remove some URLs.');
            }

            mapsUrls.forEach((url, index) => {
                if (!url.trim()) {
                    return; // Skip empty URLs
                }

                try {
                    new URL(url.trim());
                } catch (e) {
                    errors.push(`Maps URL ${index + 1} is not valid. Please enter a properly formatted Google Maps link.`);
                    return;
                }

                if (!url.toLowerCase().includes('google.com/maps')) {
                    errors.push(`URL ${index + 1} must be a Google Maps link. Please copy the URL from Google Maps.`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateLeadCount(leadCount) {
        const errors = [];
        
        if (!leadCount || isNaN(leadCount)) {
            errors.push('Please enter a valid number for the lead count.');
            return { isValid: false, errors: errors };
        }

        const count = parseInt(leadCount);
        
        if (count < 1) {
            errors.push('Lead count must be at least 1. Please enter a positive number.');
        }
        
        if (count > 50000) {
            errors.push('Lead count cannot exceed 50,000. Please enter a smaller number.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateSelectedFields(fields) {
        const errors = [];
        
        if (!fields || fields.length === 0) {
            errors.push('Please select at least one data field to extract. Choose from the available options below.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateApiToken(token) {
        const errors = [];
        
        if (!token || token.trim().length === 0) {
            errors.push('API token is required to run the scraper. Please enter your Apify API token in the settings.');
            return { isValid: false, errors: errors };
        }

        if (token.length < 10) {
            errors.push('The API token appears to be too short. Please check that you entered the complete token.');
        }

        // Basic token format check (Apify tokens are typically long alphanumeric strings)
        if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
            errors.push('The API token contains invalid characters. Please check for any extra spaces or symbols.');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateAtLeastOneSource(apolloUrls, searchTerms, location, mapsUrls) {
        const hasApollo = apolloUrls && apolloUrls.filter(url => url.trim()).length > 0;
        const hasMapsSearch = searchTerms && searchTerms.length > 0 && location && location.trim();
        const hasMapsUrls = mapsUrls && mapsUrls.filter(url => url.trim()).length > 0;

        if (!hasApollo && !hasMapsSearch && !hasMapsUrls) {
            return {
                isValid: false,
                errors: ['Please provide at least one data source: Apollo.io URLs, Google Maps search terms with location, or Google Maps URLs.']
            };
        }

        return { isValid: true, errors: [] };
    }

    validateExportSettings(exportType, settings) {
        const errors = [];

        if (exportType === 'sheets') {
            if (!settings.googleCredentials || !settings.googleCredentials.trim()) {
                errors.push('Google Service Account credentials are required for Google Sheets export. Please paste your JSON credentials.');
            }
            
            if (!settings.spreadsheetId || !settings.spreadsheetId.trim()) {
                errors.push('Spreadsheet ID is required for Google Sheets export. Please copy the ID from your Google Sheets URL.');
            }

            // Validate Google credentials JSON
            if (settings.googleCredentials) {
                try {
                    JSON.parse(settings.googleCredentials);
                } catch (e) {
                    errors.push('The Google Service Account credentials are not valid JSON format. Please check the format and try again.');
                }
            }
        }

        if (exportType === 'notion') {
            if (!settings.notionToken || !settings.notionToken.trim()) {
                errors.push('Notion Integration Token is required for Notion export. Please enter your Notion API token.');
            }
            
            if (!settings.notionDatabaseId || !settings.notionDatabaseId.trim()) {
                errors.push('Notion Database ID is required for Notion export. Please copy the database ID from your Notion page.');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    showValidationErrors(errors) {
        // Clear previous error displays
        this.clearValidationErrors();

        if (errors.length === 0) return;

        // Show errors in toastr
        const errorMessage = errors.length === 1 
            ? errors[0] 
            : `Multiple errors found:\n• ${errors.join('\n• ')}`;

        toastr.error(errorMessage, 'Validation Error', {
            timeOut: 8000,
            extendedTimeOut: 2000,
            closeButton: true,
            progressBar: true
        });

        // Optionally add visual indicators to form fields
        this.highlightErrorFields(errors);
    }

    highlightErrorFields(errors) {
        // Remove existing error highlights
        document.querySelectorAll('.error-highlight').forEach(el => {
            el.classList.remove('error-highlight');
        });

        // Add error highlights based on error messages
        errors.forEach(error => {
            if (error.includes('Apollo') || error.includes('URL')) {
                const apolloInput = document.getElementById('urlInput');
                if (apolloInput) apolloInput.classList.add('error-highlight');
            }
            
            if (error.includes('search terms') || error.includes('Search term')) {
                const searchInput = document.getElementById('mapsSearchTerms');
                if (searchInput) searchInput.classList.add('error-highlight');
            }
            
            if (error.includes('location') || error.includes('Location')) {
                const locationInput = document.getElementById('mapsLocation');
                if (locationInput) locationInput.classList.add('error-highlight');
            }
            
            if (error.includes('Maps URL')) {
                const mapsUrlInput = document.getElementById('mapsUrls');
                if (mapsUrlInput) mapsUrlInput.classList.add('error-highlight');
            }
            
            if (error.includes('Lead count') || error.includes('lead count')) {
                const leadCountInput = document.getElementById('leadCountInput');
                if (leadCountInput) leadCountInput.classList.add('error-highlight');
            }
            
            if (error.includes('field') || error.includes('data field')) {
                const fieldsSection = document.querySelector('.field-category');
                if (fieldsSection) fieldsSection.classList.add('error-highlight');
            }
            
            if (error.includes('API token') || error.includes('token')) {
                const tokenInput = document.getElementById('apifyToken');
                if (tokenInput) tokenInput.classList.add('error-highlight');
            }
        });
    }

    clearValidationErrors() {
        // Remove error highlights
        document.querySelectorAll('.error-highlight').forEach(el => {
            el.classList.remove('error-highlight');
        });
    }

    handleNetworkError(error, operation = 'operation') {
        console.error(`Network error during ${operation}:`, error);
        
        let errorMessage = `Unable to complete ${operation}. `;
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage += 'Please check your internet connection and try again.';
        } else if (error.status) {
            switch (error.status) {
                case 400:
                    errorMessage += 'There was an issue with your request. Please check your input and try again.';
                    break;
                case 401:
                    errorMessage += 'Authentication failed. Please check your API token in the settings.';
                    break;
                case 403:
                    errorMessage += 'Access denied. Please verify your API permissions and credentials.';
                    break;
                case 404:
                    errorMessage += 'Service not found. Please contact support if this continues.';
                    break;
                case 429:
                    errorMessage += 'Too many requests. Please wait a moment and try again.';
                    break;
                case 500:
                    errorMessage += 'Server error occurred. Please try again in a few minutes.';
                    break;
                default:
                    errorMessage += `Server returned error ${error.status}. Please try again or contact support.`;
            }
        } else {
            errorMessage += 'Please try again or contact support if the problem continues.';
        }

        toastr.error(errorMessage, 'Connection Error', {
            timeOut: 8000,
            extendedTimeOut: 2000,
            closeButton: true,
            progressBar: true
        });
    }

    preventDoubleSubmission() {
        if (this.isProcessing) {
            toastr.warning('Another operation is already in progress. Please wait for it to complete before starting a new one.', 'Please Wait');
            return true;
        }
        return false;
    }

    setProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        
        // Disable/enable all submit buttons
        const buttons = document.querySelectorAll('.start-button, .export-card, .save-button');
        buttons.forEach(button => {
            button.disabled = isProcessing;
            if (isProcessing) {
                button.classList.add('disabled');
            } else {
                button.classList.remove('disabled');
            }
        });
    }

    loadSavedSettings() {
        try {
            // Check if localStorage is available
            if (typeof Storage === "undefined") {
                console.warn('localStorage is not supported in this browser');
                return;
            }

            // Load Apify token
            const apifyToken = localStorage.getItem('apifyToken');
            if (apifyToken) {
                const tokenInput = document.getElementById('apifyToken');
                if (tokenInput) tokenInput.value = apifyToken;
            }

            // Load Google Sheets settings
            const googleCredentials = localStorage.getItem('googleCredentials');
            if (googleCredentials) {
                const credentialsInput = document.getElementById('googleCredentials');
                if (credentialsInput) credentialsInput.value = googleCredentials;
            }

            const spreadsheetId = localStorage.getItem('spreadsheetId');
            if (spreadsheetId) {
                const spreadsheetInput = document.getElementById('spreadsheetId');
                if (spreadsheetInput) spreadsheetInput.value = spreadsheetId;
            }

            const sheetName = localStorage.getItem('sheetName');
            if (sheetName) {
                const sheetInput = document.getElementById('sheetName');
                if (sheetInput) sheetInput.value = sheetName;
            }

            // Load Notion settings
            const notionToken = localStorage.getItem('notionToken');
            if (notionToken) {
                const notionTokenInput = document.getElementById('notionToken');
                if (notionTokenInput) notionTokenInput.value = notionToken;
            }

            const notionDatabaseId = localStorage.getItem('notionDatabaseId');
            if (notionDatabaseId) {
                const notionDbInput = document.getElementById('notionDatabaseId');
                if (notionDbInput) notionDbInput.value = notionDatabaseId;
            }

            console.log('Saved settings loaded successfully');
        } catch (error) {
            console.error('Error loading saved settings:', error);
            this.showFriendlyWarning('Could not load previously saved settings. This may be due to browser privacy settings.');
        }
    }

    debugNavigation() {
        // Add global debug function
        window.debugNav = () => {
            const navDropdown = document.getElementById('globalNavDropdown');
            const navTrigger = navDropdown?.querySelector('.nav-trigger');
            const navItems = document.querySelectorAll('.nav-item');
            
            console.group('Navigation Debug Info');
            console.log('Navigation dropdown element:', navDropdown);
            console.log('Navigation trigger element:', navTrigger);
            console.log('Navigation items count:', navItems.length);
            console.log('Is dropdown active?', navDropdown?.classList.contains('active'));
            console.log('Navigation initialized?', navDropdown?.hasAttribute('data-nav-initialized'));
            console.groupEnd();
            
            if (!navDropdown) {
                console.error('Navigation dropdown not found! Check if ID "globalNavDropdown" exists.');
            }
            if (!navTrigger) {
                console.error('Navigation trigger not found! Check if ".nav-trigger" exists inside the dropdown.');
            }
            if (navItems.length === 0) {
                console.error('No navigation items found! Check if ".nav-item" elements exist.');
            }
        };
        
        console.log('Navigation debug function available: debugNav()');
    }

    // Standardized notification methods
    showSuccess(message, title = 'Success') {
        if (typeof toastr !== 'undefined') {
            toastr.success(message, title, {
                timeOut: 5000,
                extendedTimeOut: 1500,
                closeButton: true,
                progressBar: true
            });
        } else {
            console.log(`SUCCESS: ${title} - ${message}`);
        }
    }

    showError(message, title = 'Error') {
        if (typeof toastr !== 'undefined') {
            toastr.error(message, title, {
                timeOut: 8000,
                extendedTimeOut: 2500,
                closeButton: true,
                progressBar: true
            });
        } else {
            console.error(`ERROR: ${title} - ${message}`);
        }
    }

    showWarning(message, title = 'Warning') {
        if (typeof toastr !== 'undefined') {
            toastr.warning(message, title, {
                timeOut: 6000,
                extendedTimeOut: 2000,
                closeButton: true,
                progressBar: true
            });
        } else {
            console.warn(`WARNING: ${title} - ${message}`);
        }
    }

    showInfo(message, title = 'Information') {
        if (typeof toastr !== 'undefined') {
            toastr.info(message, title, {
                timeOut: 5000,
                extendedTimeOut: 1500,
                closeButton: true,
                progressBar: true
            });
        } else {
            console.info(`INFO: ${title} - ${message}`);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.querySelector('#themeToggle i').className = 'fas fa-moon';
    }

    // Initialize the application and make it globally available
    window.apolloScraper = new ApolloScraper();

    // Setup save settings button
    const saveSettingsBtn = document.getElementById('saveSettings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            window.apolloScraper.saveSettings();
        });
    }
});

// Add some entrance animations
gsap.registerPlugin();

// Animate page load
window.addEventListener('load', () => {
    // Simple fade-in animations without GSAP errors
    const header = document.querySelector('.header');
    const dashboardContent = document.querySelector('.dashboard-content');
    const animatedCards = document.querySelectorAll('.animated-card');

    if (header) {
        header.style.opacity = '0';
        header.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            header.style.transition = 'all 0.6s ease';
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 100);
    }

    if (dashboardContent) {
        dashboardContent.style.opacity = '0';
        dashboardContent.style.transform = 'translateY(20px)';
        setTimeout(() => {
            dashboardContent.style.transition = 'all 0.8s ease';
            dashboardContent.style.opacity = '1';
            dashboardContent.style.transform = 'translateY(0)';
        }, 300);
    }

    animatedCards.forEach((card, index) => {
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 600 + (index * 100));
        }
    });
});

// Start automation button click handler
document.addEventListener('DOMContentLoaded', () => {
    const startAutomationBtn = document.getElementById('startAutomationBtn');
    if (startAutomationBtn) {
        startAutomationBtn.addEventListener('click', function() {
            // Get the ApolloScraper instance and navigate to settings
            const scraper = window.apolloScraper;
            if (scraper) {
                scraper.navigateToPage('settings');
            }
        });
    }
});