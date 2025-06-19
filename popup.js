document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('trackingToggle');
    const statusText = document.getElementById('statusText');
    const emailInput = document.getElementById('recipientEmail');
    const saveBtn = document.getElementById('saveBtn');

    // Load the saved values from browser storage
    browser.storage.sync.get(['trackingEnabled', 'recipientEmail'])
        .then((result) => {
            toggle.checked = result.trackingEnabled || false;
            statusText.textContent = toggle.checked ? "Tracking is ON" : "Tracking is OFF";
            emailInput.value = result.recipientEmail || '';
        })
        .catch((error) => {
            console.error("Error loading settings:", error);
        });

    // When toggle is changed
    toggle.addEventListener('change', () => {
        const enabled = toggle.checked;
        browser.storage.sync.set({ trackingEnabled: enabled })
            .then(() => {
                console.log("Tracking setting updated:", enabled);
                statusText.textContent = enabled ? "Tracking is ON" : "Tracking is OFF";
            })
            .catch((error) => {
                console.error(error);
            });
    });

    // Save recipient email
    saveBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (email && email.includes('@')) {
            browser.storage.sync.set({ recipientEmail: email })
                .then(() => {
                    alert("Recipient email saved: " + email);
                })
                .catch((error) => {
                    console.error(error);
                });
        } else {
            alert("Please enter a valid email address.");
        }
    });

    // Open dashboard on button click
    document.getElementById("statusBtn").onclick = function () {
        window.open("https://mail-tracker-production-7e26.up.railway.app/dashboard", "_blank");
    };
});
