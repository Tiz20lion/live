# UI Troubleshooting Guide

This guide helps you resolve common UI issues with the Tiz Lead Scraper application.

## 🔧 Common Issues & Solutions

### 1. Navigation Dropdown Not Working

**Symptoms:**
- Menu button doesn't respond to clicks
- Dropdown doesn't open when clicked
- Navigation items don't work

**Solutions:**
1. **Hard Refresh the Page:**
   ```
   Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
   ```

2. **Clear Browser Cache:**
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data
   - Safari: Develop → Empty Caches

3. **Check Browser Console:**
   ```
   Press F12 → Console tab
   Look for JavaScript errors (red text)
   ```

4. **Try Different Browser:**
   - Chrome (recommended)
   - Firefox
   - Edge
   - Safari

### 2. Error Messages Not User-Friendly

**Symptoms:**
- Technical error codes instead of clear messages
- No feedback when something goes wrong
- Confusing validation messages

**Solutions:**
1. **Check Internet Connection:**
   - Ensure stable internet connection
   - Try refreshing the page

2. **Verify Application is Running:**
   ```
   Visit: http://localhost:5000/health
   Should show: {"status": "healthy"}
   ```

3. **Check Browser Compatibility:**
   - Use modern browser (Chrome 90+, Firefox 88+, Safari 14+)
   - Enable JavaScript
   - Disable ad blockers temporarily

### 3. Forms Not Submitting

**Symptoms:**
- Submit button doesn't respond
- No feedback after clicking submit
- Form validation errors not showing

**Solutions:**
1. **Check Required Fields:**
   - Fill in all required fields (marked with red badges)
   - Ensure valid email format
   - Check URL formats

2. **Verify API Configuration:**
   - Go to Settings page
   - Enter valid Apify API token
   - Save settings before starting

3. **Check Network Status:**
   ```
   Open browser dev tools (F12)
   Network tab → Try submitting
   Look for failed requests (red entries)
   ```

### 4. Page Not Loading Properly

**Symptoms:**
- Blank page or partial content
- Styling issues or broken layout
- Images not loading

**Solutions:**
1. **Check Static Files:**
   ```
   Visit: http://localhost:5000/static/css/styles.css
   Should load CSS file
   ```

2. **Restart Application:**
   ```bash
   # Stop the application (Ctrl+C)
   # Then restart:
   python run_dev.py
   ```

3. **Check File Permissions:**
   - Ensure read permissions on static files
   - Check if antivirus is blocking files

### 5. Mobile/Responsive Issues

**Symptoms:**
- Layout broken on mobile
- Text too small or large
- Buttons not clickable

**Solutions:**
1. **Test Different Screen Sizes:**
   ```
   Press F12 → Device toolbar icon
   Try different device presets
   ```

2. **Check Viewport Settings:**
   - Zoom level should be 100%
   - Enable responsive design mode

3. **Clear Mobile Browser Cache:**
   - Mobile Chrome: Settings → Privacy → Clear browsing data
   - Mobile Safari: Settings → Safari → Clear History

## 🧪 Testing Tools

### Quick Test Page
Visit the test page to diagnose issues:
```
http://localhost:5000/static/test.html
```

This page will:
- Check application health
- Test navigation functionality
- Validate JavaScript features
- Test responsive design

### Browser Console Commands
Open browser console (F12) and try these commands:

```javascript
// Test if main app object exists
if (typeof scraper !== 'undefined') {
    console.log('✅ Main app loaded');
} else {
    console.log('❌ Main app not loaded');
}

// Test navigation manually
scraper.navigateToPage('configure');

// Check CSRF token
console.log('CSRF Token:', scraper.csrfToken);

// Test API connectivity
fetch('/health').then(r => r.json()).then(console.log);
```

### Network Debug Commands
```javascript
// Check for failed network requests
performance.getEntriesByType('resource').filter(r => r.transferSize === 0);

// Test specific endpoints
fetch('/api/v1/csrf-token').then(r => r.json()).then(console.log);
```

## 🚀 Quick Fixes

### Reset Application State
```javascript
// Clear localStorage
localStorage.clear();

// Reload page
location.reload();
```

### Force Refresh Static Files
```
Add ?v=123 to any static file URL:
http://localhost:5000/static/js/app.js?v=123
```

### Emergency Debug Mode
```javascript
// Enable verbose logging
localStorage.setItem('debug', 'true');

// Show all console messages
console.log = console.warn = console.error = (...args) => {
    document.body.insertAdjacentHTML('beforeend', 
        `<div style="background: #f0f0f0; padding: 5px; margin: 2px; font-family: monospace;">
        ${args.join(' ')}</div>`);
};
```

## 📞 Getting Help

### Before Reporting Issues:
1. ✅ Try the test page: `/static/test.html`
2. ✅ Check browser console for errors
3. ✅ Test in different browser
4. ✅ Restart the application
5. ✅ Clear browser cache

### Include This Information:
- Browser name and version
- Operating system
- Error messages from console
- Steps to reproduce the issue
- Screenshots if relevant

### Useful Debug Information:
```javascript
// Get system info
console.log({
    userAgent: navigator.userAgent,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    localStorage: localStorage.length + ' items',
    cookies: document.cookie.length > 0
});
```

## 🔄 Application Restart

If all else fails, restart the application:

### Windows:
```powershell
# Stop current process (Ctrl+C in terminal)
# Then restart:
python run_dev.py
```

### Linux/Mac:
```bash
# Kill any existing processes
pkill -f "python.*run_dev"

# Restart
python run_dev.py
```

### Docker (if using):
```bash
# Restart container
docker-compose restart

# Or rebuild
docker-compose down
docker-compose up --build
```

---

**Note:** This application runs on `http://localhost:5000` by default. Always check that the correct URL is being used and that no other applications are using port 5000. 