document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const toggle = document.getElementById('trackingToggle');
    const statusText = document.getElementById('statusText');
    const emailInput = document.getElementById('recipientEmail');
    const saveBtn = document.getElementById('saveBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');

    // UI State
    let isLoading = false;
    
    // Show loading state
    function showLoading(button) {
        isLoading = true;
        const originalText = button.textContent;
        button.disabled = true;
        button.dataset.originalText = originalText;
        button.textContent = "Loading...";
        return originalText;
    }
    
    // Hide loading state
    function hideLoading(button, originalText) {
        isLoading = false;
        button.disabled = false;
        button.textContent = originalText;
    }

    // Validate email format
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Show toast notification
    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : 'success'}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 10);
    }

    // Load settings from storage
    async function loadSettings() {
        const originalText = showLoading(saveBtn);
        try {
            const result = await browser.storage.sync.get(['trackingEnabled', 'recipientEmail']);
            
            toggle.checked = result.trackingEnabled || false;
            updateStatusText(toggle.checked);
            emailInput.value = result.recipientEmail || '';
            
        } catch (error) {
            console.error("Error loading settings:", error);
            showToast("Failed to load settings", true);
        } finally {
            hideLoading(saveBtn, originalText);
        }
    }

    // Update status text
    function updateStatusText(isEnabled) {
        if (isEnabled) {
            statusText.textContent = "ON";
            statusText.classList.remove('status-off');
            statusText.classList.add('status-on');
        } else {
            statusText.textContent = "OFF";
            statusText.classList.remove('status-on');
            statusText.classList.add('status-off');
        }
    }

    // Initialize
    await loadSettings();

    // Toggle tracking
    toggle.addEventListener('change', async () => {
        if (isLoading) return;
        
        const enabled = toggle.checked;
        const originalText = showLoading(saveBtn);
        try {
            await browser.storage.sync.set({ trackingEnabled: enabled });
            updateStatusText(enabled);
            showToast(`Tracking ${enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error(error);
            showToast("Failed to update tracking setting", true);
            toggle.checked = !enabled; // Revert UI on error
        } finally {
            hideLoading(saveBtn, originalText);
        }
    });

    // Save recipient email
    saveBtn.addEventListener('click', async () => {
        if (isLoading) return;
        
        const email = emailInput.value.trim();
        const originalText = showLoading(saveBtn);
        
        if (!email) {
            showToast("Please enter an email address", true);
            hideLoading(saveBtn, originalText);
            return;
        }
        
        if (!isValidEmail(email)) {
            showToast("Please enter a valid email address", true);
            hideLoading(saveBtn, originalText);
            return;
        }
        
        try {
            await browser.storage.sync.set({ recipientEmail: email });
            showToast(`Settings saved successfully`);
        } catch (error) {
            console.error(error);
            showToast("Failed to save settings", true);
        } finally {
            hideLoading(saveBtn, originalText);
        }
    });

    // Open dashboard
    dashboardBtn.addEventListener('click', async () => {
    const originalText = showLoading(dashboardBtn);
    try {
        // First try the dashboard directly
        await browser.tabs.create({
            url: "http://127.0.0.1:5000/dashboard"
        });
    } catch (error) {
        console.error("Direct open failed:", error);
        try {
            // Fallback: Check if server is running
            const response = await fetch('http://127.0.0.1:5000/', {
                method: 'GET',
                cache: 'no-cache'
            });
            if (!response.ok) throw new Error('Server not responding');
            
            // Retry dashboard if server is up
            await browser.tabs.create({
                url: "http://127.0.0.1:5000/dashboard"
            });
        } catch (err) {
            console.error("Server check failed:", err);
            showToast(`
                Start the server first:
                python server.py
            `, true);
        }
    } finally {
        hideLoading(dashboardBtn, originalText);
    }
});
    // Add keyboard support for save button
    emailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
});

console.log("Popup loaded");
fetch('http://127.0.0.1:5000/')
    .then(r => console.log("Server check:", r.status))
    .catch(e => console.error("Server error:", e));